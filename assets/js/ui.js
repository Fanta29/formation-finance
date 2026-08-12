/* ui.js — chrome commun à toutes les pages + helpers d'affichage */
import { MILLESIME, P, STATUTS } from "./params.js";

const PAGES = [
  { href: "cours.html", label: "Cours" },
  { href: "qcm.html", label: "QCM" },
  { href: "outils.html", label: "Simulateurs" },
  { href: "parametres.html", label: "Paramètres" }
];

/* Médaillon : une pyramide pleine, l'écho en petit de l'objet de la page
   d'accueil. Le dégradé enchaîne les trois couleurs de branche du site —
   indigo pour les cours, menthe pour les QCM, ambre pour les simulateurs. */
const LOGO = `<svg class="mast-mark" viewBox="0 0 32 32" aria-hidden="true">
  <defs>
    <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7C8CFF"/>
      <stop offset=".55" stop-color="#4ADE9B"/>
      <stop offset="1" stop-color="#F5B84A"/>
    </linearGradient>
  </defs>
  <circle cx="16" cy="16" r="15" fill="#161A21" stroke="#232935"/>
  <path d="M16 6 L25.5 24 L6.5 24 Z" fill="url(#logoGrad)"/>
</svg>`;

export function chrome() {
  const ici = location.pathname.split("/").pop() || "index.html";
  const nav = PAGES.map(p =>
    `<a href="${p.href}"${p.href === ici ? ' aria-current="page"' : ""}>${p.label}</a>`).join("");

  document.body.insertAdjacentHTML("afterbegin", `
    <header class="masthead">
      <div class="mast-inner">
        <a class="mast-marque" href="index.html" aria-label="Retour à l'accueil">
          ${LOGO}
          <span class="mast-txt">
            <span class="mast-titre">Formation Finance &amp; Fiscalité</span>
            <span class="sub">Cours · QCM · Simulateurs</span>
          </span>
        </a>
        <span class="pastille" title="Millésime des paramètres fiscaux">Millésime ${MILLESIME.annee}</span>
        <nav class="mast-nav" aria-label="Navigation principale">${nav}</nav>
      </div>
    </header>
    <div class="avert"><div class="avert-in">
      <b>Contenu pédagogique.</b> Ce site n'est pas un conseil personnalisé.
      Chiffres à jour au ${dateFr(MILLESIME.majLe)} — <a href="parametres.html">voir les sources</a>.
    </div></div>`);

  document.body.insertAdjacentHTML("beforeend", `
    <footer class="pied"><div class="pied-in">
      <div>
        <a href="mentions-legales.html">Mentions légales</a> ·
        <a href="parametres.html">Paramètres &amp; sources</a>
      </div>
      <div class="maj">Dernière mise à jour des paramètres : ${dateFr(MILLESIME.majLe)}</div>
    </div></footer>`);
}

/* ------------------------------------------------------------ format --- */
export const eur = n => (Math.round(n * 100) / 100).toLocaleString("fr-FR",
  { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
export const eur2 = n => (Math.round(n * 100) / 100).toLocaleString("fr-FR",
  { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const pct = n => (n * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " %";
export const dateFr = iso => iso
  ? new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
  : "—";

/* Cartouche de source : la signature du site.
   Tout chiffre affiché doit pouvoir montrer d'où il vient. */
export function sourceTag(...cles) {
  const items = cles.filter(k => P[k]).map(k => {
    const p = P[k], s = STATUTS[p.statut];
    return `<div><span class="chip ${s.classe}">${s.label}</span>
      <b>${p.libelle}</b> — ${p.base}${p.doctrine ? " · " + p.doctrine : ""}
      ${p.source ? `· <a href="${p.source}" target="_blank" rel="noopener">source</a>` : ""}
      · vérifié le ${dateFr(p.verifieLe)}</div>`;
  });
  return `<div class="source-tag">${items.join("")}</div>`;
}

/** Mention de millésime à placer sous un résultat chiffré ou un registre. */
export function millesime() {
  return `<p class="millesime">Paramètres vérifiés le ${dateFr(MILLESIME.majLe)} · `
    + `${MILLESIME.textes.join(" · ")}</p>`;
}

export function alerte(html) {
  return `<div class="alerte">${html}</div>`;
}

export const $ = s => document.querySelector(s);
export const num = s => {
  const v = parseFloat(String($(s).value).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(v) ? v : 0;
};
