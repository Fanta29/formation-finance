#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Génère les PDF téléchargeables à partir des fragments HTML du cours.

Usage (depuis la racine du dépôt) :  python3 tools/build-pdf.py
Produit  pdf/chapitre-NN.pdf (33), pdf/partie-N.pdf (5) et le livre complet.
"""
import json, os, re, html
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph,
                                Spacer, Table, TableStyle, PageBreak, KeepTogether)

SRC, OUT = "data/cours", "pdf"
os.makedirs(OUT, exist_ok=True)
idx = json.load(open(f"{SRC}/index.json", encoding="utf-8"))

ENCRE = colors.HexColor("#14171D")
ACCENT = colors.HexColor("#4453C8")
GRIS = colors.HexColor("#6B7280")
FILET = colors.HexColor("#DDE0E6")
FOND = colors.HexColor("#F2F3F7")

S = {
    "titre": ParagraphStyle("titre", fontName="Helvetica-Bold", fontSize=25, leading=29,
                            textColor=ENCRE, spaceAfter=4),
    "sur": ParagraphStyle("sur", fontName="Helvetica", fontSize=8.5, leading=12,
                          textColor=ACCENT, spaceAfter=10),
    "h3": ParagraphStyle("h3", fontName="Helvetica-Bold", fontSize=13.5, leading=17,
                         textColor=ENCRE, spaceBefore=16, spaceAfter=5),
    "h4": ParagraphStyle("h4", fontName="Helvetica-Bold", fontSize=11, leading=14,
                         textColor=ENCRE, spaceBefore=11, spaceAfter=3),
    "p": ParagraphStyle("p", fontName="Helvetica", fontSize=10, leading=15.5,
                        textColor=ENCRE, alignment=TA_JUSTIFY, spaceAfter=8),
    "li": ParagraphStyle("li", fontName="Helvetica", fontSize=10, leading=15,
                         textColor=ENCRE, alignment=TA_JUSTIFY, leftIndent=12,
                         bulletIndent=2, spaceAfter=4),
    "enc": ParagraphStyle("enc", fontName="Helvetica", fontSize=9.5, leading=14,
                          textColor=ENCRE, alignment=TA_JUSTIFY),
    "td": ParagraphStyle("td", fontName="Helvetica", fontSize=9, leading=12.5, textColor=ENCRE),
    "th": ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=8.5, leading=11.5, textColor=GRIS),
    "couv": ParagraphStyle("couv", fontName="Helvetica-Bold", fontSize=32, leading=37,
                           textColor=ENCRE, spaceAfter=12),
    "couv2": ParagraphStyle("couv2", fontName="Helvetica", fontSize=12, leading=18,
                            textColor=GRIS, spaceAfter=6),
}


def inline(t):
    """Convertit le HTML en ligne vers le balisage de ReportLab."""
    t = re.sub(r"<strong>(.*?)</strong>", r"<b>\1</b>", t, flags=re.S)
    t = re.sub(r"<em>(.*?)</em>", r"<i>\1</i>", t, flags=re.S)
    t = re.sub(r'<span class="num">(.*?)</span>', r"\1 ", t, flags=re.S)
    t = re.sub(r"<a [^>]*>(.*?)</a>", r"\1", t, flags=re.S)
    t = re.sub(r"<(?!/?[bi]>)[^>]+>", "", t)
    return t.strip()


def fragment(chemin):
    """Transforme un fragment HTML de chapitre en éléments ReportLab."""
    src = open(chemin, encoding="utf-8").read()
    flux, i = [], 0
    for m in re.finditer(
            r"<(h3|h4|p|ul|aside|div)([^>]*)>(.*?)</\1>", src, flags=re.S):
        bal, attrs, corps = m.group(1), m.group(2), m.group(3)
        if bal == "h3":
            flux.append(Paragraph(inline(corps), S["h3"]))
        elif bal == "h4":
            flux.append(Paragraph(inline(corps), S["h4"]))
        elif bal == "p":
            flux.append(Paragraph(inline(corps), S["p"]))
        elif bal == "ul":
            for li in re.findall(r"<li>(.*?)</li>", corps, flags=re.S):
                flux.append(Paragraph(inline(li), S["li"], bulletText="•"))
            flux.append(Spacer(1, 4))
        elif bal == "aside":
            t = Table([[Paragraph(inline(corps), S["enc"])]], colWidths=[152 * mm])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), FOND),
                ("LINEBEFORE", (0, 0), (0, -1), 2, ACCENT),
                ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8)]))
            flux += [Spacer(1, 3), t, Spacer(1, 9)]
        elif "tbl" in attrs:
            lignes = []
            for tr in re.findall(r"<tr>(.*?)</tr>", corps, flags=re.S):
                cells = re.findall(r"<t[hd]>(.*?)</t[hd]>", tr, flags=re.S)
                entete = "<th>" in tr
                lignes.append([Paragraph(inline(c), S["th"] if entete else S["td"]) for c in cells])
            if not lignes:
                continue
            n = max(len(l) for l in lignes)
            lignes = [l + [Paragraph("", S["td"])] * (n - len(l)) for l in lignes]
            t = Table(lignes, colWidths=[152 * mm / n] * n, repeatRows=1)
            t.setStyle(TableStyle([
                ("LINEBELOW", (0, 0), (-1, -1), 0.5, FILET),
                ("LINEBELOW", (0, 0), (-1, 0), 0.9, colors.HexColor("#C9CEDA")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
            flux += [Spacer(1, 3), t, Spacer(1, 10)]
    return flux


class Doc(BaseDocTemplate):
    def __init__(self, chemin, pied):
        super().__init__(chemin, pagesize=A4, title=pied, author="Formation Finance & Fiscalité",
                         leftMargin=29 * mm, rightMargin=29 * mm,
                         topMargin=24 * mm, bottomMargin=22 * mm)
        self.pied = pied
        cadre = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="c")
        self.addPageTemplates([PageTemplate(id="std", frames=[cadre], onPage=self.decor)])

    def decor(self, canv, doc):
        canv.saveState()
        canv.setFont("Helvetica", 7.5)
        canv.setFillColor(GRIS)
        canv.drawString(29 * mm, 13 * mm, self.pied)
        canv.drawRightString(A4[0] - 29 * mm, 13 * mm, str(doc.page))
        canv.setStrokeColor(FILET)
        canv.setLineWidth(0.5)
        canv.line(29 * mm, 16.5 * mm, A4[0] - 29 * mm, 16.5 * mm)
        canv.restoreState()


def chapitre_flux(c, avec_saut=False):
    f = [Paragraph(f"PARTIE {c['partie']} — {c['partieTitre'].upper()}"
                   + (f" · VOLUME {c['volume']}" if c.get("volume") else ""), S["sur"]),
         Paragraph(f"{c['num']}. {c['titre']}", S["titre"]), Spacer(1, 12)]
    f += fragment(f"{SRC}/{c['fichier']}")
    if avec_saut:
        f.append(PageBreak())
    return f


def section_flux(s, avec_saut=False):
    f = [Paragraph(s["titre"].upper(), S["sur"]), Spacer(1, 6)]
    f += fragment(f"{SRC}/{s['fichier']}")
    if avec_saut:
        f.append(PageBreak())
    return f


MENTION = ("Contenu pédagogique — ne constitue pas un conseil personnalisé. "
           "Paramètres fiscaux à jour au 5 août 2026 (LF 2026, LFSS 2026) ; "
           "chaque valeur est sourcée sur la page Paramètres du site.")


def couverture(titre, sous_titre):
    return [Spacer(1, 60 * mm),
            Paragraph("FORMATION FINANCE &amp; FISCALITÉ", S["sur"]),
            Paragraph(titre, S["couv"]),
            Paragraph(sous_titre, S["couv2"]),
            Spacer(1, 14),
            Paragraph(MENTION, ParagraphStyle("m", parent=S["couv2"], fontSize=8.5, leading=13)),
            PageBreak()]


# --- un PDF par chapitre
for c in idx["chapitres"]:
    nom = f"{OUT}/chapitre-{c['num']:02d}.pdf"
    Doc(nom, f"Chapitre {c['num']} — {c['titre']}").build(chapitre_flux(c))

# --- un PDF par partie
for p in idx["parties"]:
    chs = [c for c in idx["chapitres"] if c["partie"] == p["num"]]
    flux = couverture(f"Partie {p['num']} — {p['titre']}",
                      f"{len(chs)} chapitres · {sum(c['mots'] for c in chs):,} mots".replace(",", " "))
    for s in idx["sections"]:
        if s["cle"] == f"p{p['num']}" and s["type"] == "intro":
            flux += section_flux(s, True)
    for c in chs:
        flux += chapitre_flux(c, True)
    for s in idx["sections"]:
        if s["cle"] == f"p{p['num']}" and s["type"] == "synthese":
            flux += section_flux(s)
    Doc(f"{OUT}/partie-{p['num']}.pdf", f"Partie {p['num']} — {p['titre']}").build(flux)

# --- le livre complet
mots = sum(c["mots"] for c in idx["chapitres"])
flux = couverture("Le livre complet",
                  f"5 parties · {len(idx['chapitres'])} chapitres · {mots:,} mots".replace(",", " "))
avant = next((s for s in idx["sections"] if s["type"] == "front"), None)
if avant:
    flux += section_flux(avant, True)
for p in idx["parties"]:
    for s in idx["sections"]:
        if s["cle"] == f"p{p['num']}" and s["type"] == "intro":
            flux += section_flux(s, True)
    for c in [c for c in idx["chapitres"] if c["partie"] == p["num"]]:
        vol = c.get("volume")
        if vol:
            for s in idx["sections"]:
                if s["cle"] == f"v{vol}" and s["type"] == "intro" and s.get("_fait") is None:
                    flux += section_flux(s, True)
                    s["_fait"] = True
        flux += chapitre_flux(c, True)
    for s in idx["sections"]:
        if s["cle"] == f"p{p['num']}" and s["type"] == "synthese":
            flux += section_flux(s, True)
Doc(f"{OUT}/formation-finance-livre-complet.pdf", "Formation Finance & Fiscalité").build(flux)

fichiers = sorted(os.listdir(OUT))
poids = sum(os.path.getsize(f"{OUT}/{f}") for f in fichiers) / 1e6
print(f"{len(fichiers)} PDF générés · {poids:.1f} Mo")
