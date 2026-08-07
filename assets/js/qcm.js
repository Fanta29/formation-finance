/* qcm.js — moteur de questions : sélection des thèmes, série, correction,
   reprise des erreurs. Gère les questions à réponse unique et multiple. */
import { chrome, $ } from "./ui.js";
import { repondre, erreurs, etat } from "./store.js";

chrome();
const app = $("#app");
const idx = await (await fetch("data/qcm/index.json")).json();
const cache = new Map();

async function charger(theme) {
  if (!cache.has(theme)) {
    cache.set(theme, await (await fetch(`data/qcm/${theme}.json`)).json());
  }
  return cache.get(theme).map(q => ({ ...q, theme }));
}

const melanger = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);
const LETTRES = "ABCDEF";
let selection = new Set();
let mode = "themes";                    // "themes" | "revision" | "partiel"
let serie = [], pos = 0, justes = 0, choix = new Set(), corrige = false;
let partiel = null;                     // { debut, duree, minuteur }
let copie = [];                         // réponses données, pour la correction finale

const PARTIEL = { questions: 30, minutes: 30 };

/* --------------------------------------------------------------- accueil --- */
function accueil() {
  arreterChrono();
  const e = etat();
  const nbErreurs = erreurs().length;
  const dispo = idx.themes.filter(t => selection.has(t.id)).reduce((s, t) => s + t.count, 0);

  app.innerHTML = `
    <div class="lede">
      <p class="eyebrow">QCM · ${idx.total} questions · ${idx.themes.length} thèmes</p>
      <p class="h">Trois façons de travailler</p>
      <p>Toutes les questions sont corrigées et expliquées. Les questions ratées sont
         mémorisées sur votre appareil et peuvent être rejouées seules.</p>
    </div>

    <div class="modes">
      <button class="mode" data-m="partiel" aria-pressed="${mode === "partiel"}">
        <span class="mt">Partiel <span class="score">${PARTIEL.minutes} min</span></span>
        <span class="md">${PARTIEL.questions} questions tirées au hasard dans les ${idx.total}, chronométrées. Aucune correction en cours d'épreuve : note, résultat par thème et corrigé complet à la fin.</span>
      </button>
      <button class="mode" data-m="themes" aria-pressed="${mode === "themes"}">
        <span class="mt">Entraînement <span class="score">au choix</span></span>
        <span class="md">Vous choisissez les thèmes et la longueur. Correction immédiate après chaque question.</span>
      </button>
      <button class="mode" data-m="revision" aria-pressed="${mode === "revision"}">
        <span class="mt">Mes erreurs <span class="score">${nbErreurs}</span></span>
        <span class="md">${nbErreurs ? "Rejouer uniquement les questions ratées jusqu'ici." : "Rien à revoir pour l'instant : vos erreurs viendront s'accumuler ici."}</span>
      </button>
    </div>

    <div id="reglages"></div>`;

  document.querySelectorAll(".mode").forEach(b => {
    b.onclick = () => { mode = b.dataset.m; accueil(); };
  });

  const r = $("#reglages");
  if (mode === "partiel") {
    r.innerHTML = `<div class="card">
      <p>Le tirage couvre l'ensemble du corpus, tous thèmes confondus. Le chronomètre démarre
         dès la première question ; à la fin, vous obtenez une note et le détail par thème.</p>
      <button class="btn" id="go">Lancer le partiel</button>
    </div>`;
    $("#go").onclick = () => lancerPartiel();
  } else if (mode === "revision") {
    r.innerHTML = `<div class="card">
      ${nbErreurs
        ? `<p>${nbErreurs} question${nbErreurs > 1 ? "s" : ""} en attente. Une question disparaît de la liste dès que vous y répondez correctement.</p>
           <button class="btn" id="go">Rejouer mes erreurs</button>`
        : `<p class="muted">Répondez à quelques questions : celles que vous ratez apparaîtront ici.</p>`}
    </div>`;
    if (nbErreurs) $("#go").onclick = () => lancerErreurs();
  } else {
    r.innerHTML = `
      <div class="filtres">
        <button id="tout">Tout sélectionner</button>
        <button id="rien">Tout désélectionner</button>
      </div>
      <div class="theme-grid">${idx.themes.map(t => {
        const st = e.qcm[t.id];
        return `<button class="theme-card" data-t="${t.id}" aria-pressed="${selection.has(t.id)}">
          <span class="t">${t.label}</span>
          <span class="c">${t.count} questions${st ? ` · ${Math.round(st.justes / st.vues * 100)} %` : ""}</span>
        </button>`;
      }).join("")}</div>
      <div class="card" style="display:flex;gap:16px;align-items:flex-end;flex-wrap:wrap">
        <label style="margin:0">Longueur de la série
          <select id="taille" style="margin-top:6px;min-width:190px">
            <option value="10">10 questions</option>
            <option value="20" selected>20 questions</option>
            <option value="40">40 questions</option>
            <option value="0">Tout le corpus sélectionné</option>
          </select>
        </label>
        <button class="btn" id="go">Commencer</button>
        <span class="score" id="cpt">${dispo ? dispo + " questions disponibles" : "Sélectionnez au moins un thème"}</span>
      </div>`;

    const cpt = () => {
      const n = idx.themes.filter(t => selection.has(t.id)).reduce((s, t) => s + t.count, 0);
      $("#cpt").textContent = n ? `${n} questions disponibles` : "Sélectionnez au moins un thème";
    };
    document.querySelectorAll(".theme-card").forEach(b => {
      b.onclick = () => {
        const t = b.dataset.t;
        selection.has(t) ? selection.delete(t) : selection.add(t);
        b.setAttribute("aria-pressed", selection.has(t));
        cpt();
      };
    });
    $("#tout").onclick = () => { selection = new Set(idx.themes.map(t => t.id)); accueil(); };
    $("#rien").onclick = () => { selection.clear(); accueil(); };
    $("#go").onclick = () => lancer(Number($("#taille").value));
  }
}

/* --------------------------------------------------------------- série --- */
async function lancer(taille) {
  if (!selection.size) return;
  const paquets = await Promise.all([...selection].map(charger));
  serie = melanger(paquets.flat());
  if (taille > 0) serie = serie.slice(0, taille);
  demarrer();
}

async function lancerErreurs() {
  const cibles = new Set(erreurs());
  const themes = [...new Set([...cibles].map(id => id.split("-")[0]))];
  const paquets = await Promise.all(themes.map(charger));
  serie = melanger(paquets.flat().filter(q => cibles.has(q.id)));
  demarrer();
}

async function lancerPartiel() {
  const paquets = await Promise.all(idx.themes.map(t => charger(t.id)));
  serie = melanger(paquets.flat()).slice(0, PARTIEL.questions);
  partiel = { debut: Date.now(), duree: PARTIEL.minutes * 60000, minuteur: null };
  demarrer();
  partiel.minuteur = setInterval(peindreChrono, 1000);
}

function arreterChrono() {
  if (partiel && partiel.minuteur) clearInterval(partiel.minuteur);
  partiel = null;
}

function peindreChrono() {
  const el = document.getElementById("chrono");
  if (!partiel || !el) return;
  const reste = partiel.debut + partiel.duree - Date.now();
  if (reste <= 0) { el.textContent = "temps écoulé"; return bilan(); }
  const m = Math.floor(reste / 60000), sec = Math.floor(reste % 60000 / 1000);
  el.textContent = `${m}:${String(sec).padStart(2, "0")}`;
  el.classList.toggle("rouge", reste < 5 * 60000);
}

function demarrer() {
  if (!serie.length) return accueil();
  pos = 0; justes = 0; copie = [];
  question();
}

function question() {
  if (pos >= serie.length) return bilan();
  const q = serie[pos];
  choix = new Set(); corrige = false;
  const multiple = Array.isArray(q.c);
  const theme = idx.themes.find(t => t.id === q.theme);

  app.innerHTML = `
    <div class="bar"><i style="width:${pos / serie.length * 100}%"></i></div>
    <div class="qbox">
      <div class="qmeta">
        <span>${theme ? theme.label : q.theme}${multiple ? " · plusieurs réponses" : ""}</span>
        <span>${partiel ? `<span class="chrono" id="chrono">${PARTIEL.minutes}:00</span> · ` : ""}${pos + 1} / ${serie.length}${partiel ? "" : ` · ${justes} juste${justes > 1 ? "s" : ""}`}</span>
      </div>
      <p class="qtext">${q.q}</p>
      <div class="opts">${q.o.map((o, i) =>
        `<button class="opt" data-i="${i}" aria-pressed="false">
           <span class="k">${LETTRES[i]}</span><span>${o}</span></button>`).join("")}</div>
      <div id="apres"></div>
      <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn" id="valider">${multiple ? "Valider mes réponses" : "Valider"}</button>
        <button class="btn ghost" id="quitter">Arrêter la série</button>
      </div>
    </div>`;

  document.querySelectorAll(".opt").forEach(b => {
    b.onclick = () => {
      if (corrige) return;
      const i = Number(b.dataset.i);
      if (multiple) {
        choix.has(i) ? choix.delete(i) : choix.add(i);
      } else {
        choix = new Set([i]);
        document.querySelectorAll(".opt").forEach(x => x.setAttribute("aria-pressed", "false"));
      }
      b.setAttribute("aria-pressed", choix.has(i));
    };
  });
  $("#valider").onclick = () => corrige ? (pos++, question()) : valider(q, multiple);
  if (partiel) $("#valider").textContent = pos + 1 < serie.length ? "Question suivante" : "Terminer l'épreuve";
  $("#quitter").onclick = () => bilan();
}

function valider(q, multiple) {
  if (!choix.size) return;
  const bonnes = new Set(multiple ? q.c : [q.c]);
  const juste = bonnes.size === choix.size && [...bonnes].every(i => choix.has(i));
  if (juste) justes++;
  repondre(q.theme, q.id, juste);
  copie.push({ q, donnees: [...choix], bonnes: [...bonnes], juste });

  /* En épreuve, aucune correction n'est montrée avant la fin : on enchaîne. */
  if (partiel) { pos++; return question(); }

  corrige = true;
  document.querySelectorAll(".opt").forEach(b => {
    const i = Number(b.dataset.i);
    if (bonnes.has(i)) b.classList.add("correct");
    else if (choix.has(i)) b.classList.add("wrong");
  });
  $("#apres").innerHTML = `<div class="expl">
      <strong>${juste ? "Juste." : "Réponse attendue : " + [...bonnes].map(i => LETTRES[i]).join(", ") + "."}</strong>
      ${q.e}</div>`;
  $("#valider").textContent = pos + 1 < serie.length ? "Question suivante" : "Voir le bilan";
}

function bilan() {
  const etaitPartiel = !!partiel;
  const ecoule = partiel ? Math.round((Date.now() - partiel.debut) / 1000) : 0;
  arreterChrono();
  const total = pos + (corrige ? 1 : 0);
  const restants = erreurs().length;
  app.innerHTML = `
    <div class="card">
      <p class="eyebrow">Bilan de la série</p>
      <h2 style="margin-top:0">${etaitPartiel
        ? (total ? (justes / total * 20).toFixed(1).replace(".", ",") : "0") + " / 20"
        : `${justes} bonne${justes > 1 ? "s" : ""} réponse${justes > 1 ? "s" : ""} sur ${total}`}</h2>
      <ul class="steps" style="border:1px solid var(--line);border-radius:10px">
        <li><span class="lbl">Bonnes réponses</span><span class="val">${justes} / ${total}</span></li>
        <li><span class="lbl">Taux de réussite</span><span class="val">${total ? Math.round(justes / total * 100) : 0} %</span></li>
        ${etaitPartiel ? `<li><span class="lbl">Temps utilisé</span><span class="val">${Math.floor(ecoule / 60)} min ${ecoule % 60} s</span></li>` : ""}
        <li><span class="lbl">Questions à retravailler (toutes séries)</span><span class="val">${restants}</span></li>
      </ul>
      <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">
        ${restants ? '<button class="btn" id="rej">Rejouer mes erreurs</button>' : ""}
        <button class="btn ghost" id="retour">Revenir aux modes</button>
      </div>
    </div>
    <div id="bilan-detail"></div>`;
  if (etaitPartiel) $("#bilan-detail").innerHTML = detailPartiel();
  if (restants) $("#rej").onclick = () => lancerErreurs();
  $("#retour").onclick = () => accueil();
  scrollTo(0, 0);
}

/** Résultat par thème puis correction question par question (mode partiel). */
function detailPartiel() {
  const parTheme = {};
  copie.forEach(r => {
    const t = parTheme[r.q.theme] || (parTheme[r.q.theme] = { n: 0, ok: 0 });
    t.n++; if (r.juste) t.ok++;
  });
  const lignes = Object.entries(parTheme)
    .sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n)
    .map(([id, t]) => {
      const lbl = (idx.themes.find(x => x.id === id) || {}).label || id;
      return `<li><span class="lbl">${lbl}</span><span class="val">${t.ok} / ${t.n}</span></li>`;
    }).join("");

  const ratees = copie.filter(r => !r.juste);
  const correction = ratees.map(r => `
    <div class="qbox" style="margin-bottom:12px">
      <div class="qmeta"><span>${(idx.themes.find(x => x.id === r.q.theme) || {}).label || r.q.theme}</span></div>
      <p class="qtext" style="font-size:17px">${r.q.q}</p>
      <div class="opts">${r.q.o.map((o, i) => {
        const cls = r.bonnes.includes(i) ? "opt correct" : (r.donnees.includes(i) ? "opt wrong" : "opt");
        return `<div class="${cls}"><span class="k">${LETTRES[i]}</span><span>${o}</span></div>`;
      }).join("")}</div>
      <div class="expl">${r.q.e}</div>
    </div>`).join("");

  return `
    <h3>Résultat par thème</h3>
    <ul class="steps" style="border:1px solid var(--line);border-radius:var(--r-s)">${lignes}</ul>
    <h3>Correction des ${ratees.length} question${ratees.length > 1 ? "s" : ""} manquée${ratees.length > 1 ? "s" : ""}</h3>
    ${ratees.length ? correction : '<p class="muted">Aucune erreur : rien à corriger.</p>'}`;
}

accueil();
