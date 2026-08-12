/* cours.js — sommaire et lecteur de chapitre */
import { chrome, $ } from "./ui.js";
import { marquerLu, estLu, etat } from "./store.js";

chrome();
const app = $("#app");
const idx = await (await fetch("data/cours/index.json")).json();

const param = new URLSearchParams(location.search);
const numDemande = param.get("ch");
const secDemandee = param.get("sec");

const sectionsPar = cle => idx.sections.filter(s => s.cle === cle);

/* ------------------------------------------------------------ sommaire --- */
function sommaire() {
  const e = etat();
  const avant = idx.sections.find(s => s.type === "front");
  let html = `
    <div class="lede">
      <p class="eyebrow">Cours · ${idx.chapitres.length} chapitres</p>
      <p class="h">Le manuel, du système financier à la transmission du patrimoine</p>
      <p>Les cinq parties se lisent dans l'ordre, mais chaque chapitre se tient seul.
         Marquez un chapitre comme lu pour suivre votre avancement — l'information reste
         sur votre appareil.</p>
      ${avant ? `<p><a class="souligne" href="?sec=${avant.cle}">Lire l'avant-propos →</a></p>` : ""}
    </div>
    <div class="doc-barre">
      <span><b>Le livre complet</b> <span class="score">· 33 chapitres · ${idx.chapitres.reduce((s, c) => s + c.mots, 0).toLocaleString("fr-FR")} mots</span></span>
      <a class="btn" href="pdf/formation-finance-livre-complet.pdf" download>Télécharger le PDF</a>
    </div>`;

  for (const p of idx.parties) {
    const chs = idx.chapitres.filter(c => c.partie === p.num);
    const intro = sectionsPar("p" + p.num).find(s => s.type === "intro");
    const synth = sectionsPar("p" + p.num).find(s => s.type === "synthese");
    html += `<div class="toc-part"><span class="n">Partie ${p.num}</span><h2>${p.titre}</h2>
      <a class="score souligne" style="margin-left:auto" href="pdf/partie-${p.num}.pdf" download>PDF de la partie</a></div>`;
    if (intro) html += `<p style="margin:6px 0"><a href="?sec=${intro.cle}&t=intro">${intro.titre}</a></p>`;
    html += `<ul class="toc-list">`;
    let volCourant = null;
    for (const c of chs) {
      if (c.volume && c.volume !== volCourant) {
        volCourant = c.volume;
        const vi = idx.sections.find(s => s.type === "intro" && s.cle === "v" + c.volume);
        const vs = idx.sections.find(s => s.type === "synthese" && s.cle === "v" + c.volume);
        /* Intertitre de volume : mise en forme portée par « .toc-vol », et non
           par un style en ligne, pour que ses liens échappent au display:flex
           des entrées de chapitre. Les liens sont assemblés sur une seule ligne,
           sans séparateur orphelin si l'une des deux sections manque. */
        const liens = [
          vi ? `<a href="?sec=${vi.cle}&t=intro">introduction</a>` : "",
          vs ? `<a href="?sec=${vs.cle}&t=synthese">synthèse</a>` : ""
        ].filter(Boolean).join(" · ");
        html += `<li class="toc-vol"><span class="meta">Volume ${c.volume}</span>${liens ? " · " + liens : ""}</li>`;
      }
      html += `<li><a href="?ch=${c.num}">
        <span class="num">${c.num}</span>
        <span class="ti">${c.titre}</span>
        ${e.chapitresLus.includes(c.num) ? '<span class="lu">lu</span>' : ""}
        <span class="meta">${c.mots} mots</span></a></li>`;
    }
    html += `</ul>`;
    if (synth) html += `<p style="margin:8px 0"><a href="?sec=${synth.cle}&t=synthese">${synth.titre}</a></p>`;
  }
  app.innerHTML = html;
}

/* ------------------------------------------------------------ chapitre --- */
async function chapitre(num) {
  const c = idx.chapitres.find(x => x.num === Number(num));
  if (!c) return sommaire();
  const corps = await (await fetch("data/cours/" + c.fichier)).text();
  const prec = idx.chapitres.find(x => x.num === c.num - 1);
  const suiv = idx.chapitres.find(x => x.num === c.num + 1);

  app.innerHTML = `
    <p style="margin:18px 0 6px"><a href="cours.html">← Sommaire</a></p>
    <p class="eyebrow">Partie ${c.partie} · ${c.partieTitre}${c.volume ? " · Volume " + c.volume : ""}</p>
    <h2 style="margin-top:2px">Chapitre ${c.num} — ${c.titre}</h2>
    <div class="doc-barre">
      <span class="score">${c.mots.toLocaleString("fr-FR")} mots · environ ${Math.max(1, Math.round(c.mots / 200))} min de lecture</span>
      <span style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn ghost" id="lu"></button>
        <a class="btn" href="pdf/chapitre-${String(c.num).padStart(2, "0")}.pdf" download>Télécharger le PDF</a>
      </span>
    </div>
    <article class="chapitre">${corps}</article>
    <div class="chap-nav">
      <span>${prec ? `<a href="?ch=${prec.num}">← ${prec.num}. ${prec.titre}</a>` : ""}</span>
      <span>${suiv ? `<a href="?ch=${suiv.num}">${suiv.num}. ${suiv.titre} →</a>` : ""}</span>
    </div>`;

  const btn = $("#lu");
  const peindre = () => {
    btn.textContent = estLu(c.num) ? "✓ Chapitre lu — retirer" : "Marquer comme lu";
  };
  btn.onclick = () => { marquerLu(c.num, !estLu(c.num)); peindre(); };
  peindre();
  scrollTo(0, 0);
}

/* ------------------------------------------------------------- section --- */
async function section(cle) {
  const t = param.get("t");
  const s = idx.sections.find(x => x.cle === cle && (!t || x.type === t));
  if (!s) return sommaire();
  const corps = await (await fetch("data/cours/" + s.fichier)).text();
  app.innerHTML = `
    <p style="margin:18px 0 6px"><a href="cours.html">← Sommaire</a></p>
    <h2 style="margin-top:2px">${s.titre}</h2>
    <article class="chapitre">${corps}</article>`;
  scrollTo(0, 0);
}

if (numDemande) chapitre(numDemande);
else if (secDemandee) section(secDemandee);
else sommaire();
