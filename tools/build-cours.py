#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Convertit le livre (texte extrait du .docx) en fragments HTML : avant-propos,
introductions et synthèses de partie, et 33 chapitres.

Usage (depuis la racine du dépôt) :  python3 tools/build-cours.py chemin/vers/livre.txt"""
import re, json, os, sys, html as H

SRC = sys.argv[1] if len(sys.argv) > 1 else "livre.txt"   # texte extrait du .docx
OUT = "data/cours"
os.makedirs(OUT + "/chapitres", exist_ok=True)

lines = open(SRC, encoding="utf-8").read().split("\n")

PARTS = [
    (1, "Les fondations", range(1, 5)),
    (2, "Les finances personnelles", range(5, 11)),
    (3, "Les marchés et l'investissement", range(11, 23)),
    (4, "La finance d'entreprise", range(23, 29)),
    (5, "Sujets avancés", range(29, 34)),
]
GROUP = {"A": (3, range(11, 17)), "B": (3, range(17, 20)), "C": (3, range(20, 23))}


def clean(s):
    """Nettoie les artefacts de conversion docx -> texte."""
    s = re.sub(r"\*{2,}(['\u2019])\*{2,}", r"\1", s)   # L**'**impot / Ce qu****'****il
    s = re.sub(r"\*{4,}", "**", s)
    return s


marks = []
for i, l in enumerate(lines):
    s = clean(l.strip())
    if re.match(r"^\*\*Avant-propos\*\*$", s):
        marks.append((i, "front", "avant-propos", "Avant-propos"))
        continue
    m = re.match(r"^\*\*Chapitre (\d+)\*\*$", s)
    if m:
        marks.append((i, "chapitre", int(m.group(1)), None))
        continue
    m = re.match(r"^\*\*Introduction a la Partie (\d+)\*\*$", s) or \
        re.match(r"^\*\*Introduction \u00e0 la Partie (\d+)\*\*$", s)
    if m:
        marks.append((i, "intro", "p" + m.group(1), "Introduction \u00e0 la Partie " + m.group(1)))
        continue
    m = re.match(r"^\*\*Introduction au Volume ([ABC])\*\*$", s)
    if m:
        marks.append((i, "intro", "v" + m.group(1), "Introduction au Volume " + m.group(1)))
        continue
    m = re.match(r"^\*\*Ce qu['\u2019]il faut retenir de la Partie (\d+)\*\*$", s)
    if m:
        marks.append((i, "synthese", "p" + m.group(1),
                      "Ce qu'il faut retenir de la Partie " + m.group(1)))
        continue
    m = re.match(r"^\*\*Ce qu['\u2019]il faut retenir du Volume ([ABC])\*\*$", s)
    if m:
        marks.append((i, "synthese", "v" + m.group(1),
                      "Ce qu'il faut retenir du Volume " + m.group(1)))

marks.sort()
blocks = []
for k, (i, typ, key, titre) in enumerate(marks):
    j = marks[k + 1][0] if k + 1 < len(marks) else len(lines)
    blocks.append((typ, key, titre, [clean(x) for x in lines[i:j]]))

TOC = [re.compile(r"^\*{0,2}Chapitre \d+ \u2014"), re.compile(r"^\*{0,2}Partie \d+ \u2014"),
       re.compile(r"^\*{0,2}Sommaire"), re.compile(r"^\*{0,2}FORMATION"),
       re.compile(r"^\*{0,2}Volume [ABC] \u2014"), re.compile(r"\t\d+\s*$")]


def truncate(body):
    for n, l in enumerate(body):
        s = l.strip()
        if any(rx.search(s) for rx in TOC):
            return body[:n]
    return body


INLINE = [(re.compile(r"\*\*(.+?)\*\*"), r"<strong>\1</strong>"),
          (re.compile(r"(?<!\*)\*([^*\n]+?)\*(?!\*)"), r"<em>\1</em>")]


def inline(t):
    t = H.escape(t, quote=False)
    for rx, rep in INLINE:
        t = rx.sub(rep, t)
    return re.sub(r"\*+", "", t).strip()


def convert(body):
    out, lst = [], []

    def flush():
        if lst:
            out.append("<ul>" + "".join("<li>" + x + "</li>" for x in lst) + "</ul>")
            lst.clear()

    i = 1
    while i < len(body):
        s = body[i].strip()
        if not s:
            flush(); i += 1; continue
        if s.startswith("|") and s.endswith("|"):
            cells = [c.strip() for c in s.strip("|").split("|")]
            nxt = body[i + 1].strip() if i + 1 < len(body) else ""
            if nxt.startswith("|") and set(nxt.strip("|").strip()) <= set("- :|"):
                rows, j = [cells], i + 2
                while j < len(body) and body[j].strip().startswith("|"):
                    rows.append([c.strip() for c in body[j].strip().strip("|").split("|")])
                    j += 1
                flush()
                if len(rows) == 1 and len(rows[0]) == 1:
                    out.append('<aside class="encadre">' + inline(rows[0][0]) + "</aside>")
                else:
                    th = "".join("<th>" + inline(c) + "</th>" for c in rows[0])
                    tb = "".join("<tr>" + "".join("<td>" + inline(c) + "</td>" for c in r) + "</tr>"
                                 for r in rows[1:])
                    out.append('<div class="tbl"><table><thead><tr>' + th +
                               "</tr></thead><tbody>" + tb + "</tbody></table></div>")
                i = j; continue
            flush()
            out.append('<aside class="encadre">' + inline(" \u2014 ".join(cells)) + "</aside>")
            i += 1; continue
        if s.startswith("- "):
            lst.append(inline(s[2:])); i += 1; continue
        m = re.match(r"^\*\*(\d+\.\d+(?:\.\d+)?)\s+(.+?)\*\*$", s)
        if m:
            flush()
            lvl = 3 if m.group(1).count(".") == 1 else 4
            out.append('<h%d id="s%s"><span class="num">%s</span> %s</h%d>'
                       % (lvl, m.group(1).replace(".", "-"), m.group(1), inline(m.group(2)), lvl))
            i += 1; continue
        m = re.match(r"^\*\*(.+?)\*\*$", s)
        if m and len(s) < 130:
            flush(); out.append("<h4>" + inline(m.group(1)) + "</h4>"); i += 1; continue
        flush(); out.append("<p>" + inline(s) + "</p>"); i += 1
    flush()
    return "\n".join(out)


def words(htm):
    return len(re.findall(r"\w+", re.sub(r"<[^>]+>", " ", htm)))


index_ch, index_sec = [], []
for typ, key, titre, body in blocks:
    body = truncate(body)
    if typ == "chapitre":
        num = key
        titre_ch, k = "", 1
        while k < len(body):
            if body[k].strip():
                titre_ch = re.sub(r"\*+", "", body[k]).strip()
                k += 1
                break
            k += 1
        htm = convert(body[k - 1:])
        fname = "ch%02d.html" % num
        open(OUT + "/chapitres/" + fname, "w", encoding="utf-8").write(htm)
        part = next(p for p in PARTS if num in p[2])
        vol = next((v for v, g in GROUP.items() if num in g[1]), None)
        index_ch.append({"num": num, "titre": titre_ch, "partie": part[0],
                         "partieTitre": part[1], "volume": vol,
                         "fichier": "chapitres/" + fname, "mots": words(htm)})
    else:
        htm = convert(body)
        fname = "%s-%s.html" % (typ, key)
        open(OUT + "/chapitres/" + fname, "w", encoding="utf-8").write(htm)
        index_sec.append({"type": typ, "cle": key, "titre": titre,
                          "fichier": "chapitres/" + fname, "mots": words(htm)})

json.dump({"parties": [{"num": p[0], "titre": p[1]} for p in PARTS],
           "volumes": [{"cle": v, "partie": g[0]} for v, g in GROUP.items()],
           "sections": index_sec, "chapitres": index_ch},
          open(OUT + "/index.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

total = sum(c["mots"] for c in index_ch) + sum(s["mots"] for s in index_sec)
print("%d chapitres + %d sections | %d mots" % (len(index_ch), len(index_sec), total))
for s in index_sec:
    print("  [%-9s] %5d mots | %s" % (s["type"], s["mots"], s["titre"]))
susp = [c["num"] for c in index_ch if c["mots"] < 300] + [s["cle"] for s in index_sec if s["mots"] < 50]
print("BLOCS SUSPECTS :", susp if susp else "aucun")
