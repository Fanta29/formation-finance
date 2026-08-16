/* parametres.js — registre public des paramètres fiscaux du site.
   C'est la page qui rend la méthode vérifiable : valeur, base légale, source, date. */
import { chrome, $, dateFr, pct, eur, millesime } from "./ui.js";
import { P, MILLESIME, STATUTS } from "./params.js";

chrome();

const cles = Object.keys(P);
const compte = s => cles.filter(k => P[k].statut === s).length;

/* Une valeur peut être un nombre, un barème par tranches, ou un objet dont les
   entrées sont elles-mêmes des nombres ou des barèmes — c'est le cas de l'IFI,
   qui porte son seuil et son barème dans le même objet. Le formateur descend
   donc dans la structure au lieu de la convertir en chaîne à l'aveugle. */
const estBareme = v => Array.isArray(v)
  && v.length > 0
  && v.every(t => t && typeof t === "object" && "jusqua" in t && "taux" in t);

/* Intitulé de la colonne des tranches : ce que le barème découpe, qui n'est pas
   la même chose d'un impôt à l'autre. */
const ENTETE_TRANCHES = {
  ir_bareme: "Fraction par part",
  succession_bareme_ligne_directe: "Part nette taxable après abattement",
  ifi_seuil_bareme: "Fraction de patrimoine net taxable"
};
const entete = cle => ENTETE_TRANCHES[cle] || "Tranche";

function tableauTranches(v, intitule) {
  return `<div class="tbl"><table><thead><tr><th>${intitule}</th><th>Taux</th></tr></thead>
    <tbody>${v.map((t, i) => {
      const bas = i === 0 ? 0 : v[i - 1].jusqua;
      const haut = t.jusqua === Infinity ? null : t.jusqua;
      return `<tr><td>${haut === null
        ? `Au-delà de ${eur(bas)}`
        : (i === 0 ? `Jusqu'à ${eur(haut)}` : `De ${eur(bas + 1)} à ${eur(haut)}`)}</td>
        <td>${pct(t.taux)}</td></tr>`;
    }).join("")}</tbody></table></div>`;
}

const tableauPaires = (paires, brut) =>
  `<div class="tbl"><table><tbody>${paires.map(([k, x]) =>
    `<tr><td>${libelleCle(k)}</td><td>${formatSimple(x, brut)}</td></tr>`).join("")}</tbody></table></div>`;

function afficherValeur(p, cle) {
  const v = p.valeur;
  if (v === null || v === undefined) return `<div class="val none">Non publié — à vérifier</div>`;
  if (estBareme(v)) return tableauTranches(v, entete(cle));
  if (typeof v === "object") {
    /* Les barèmes imbriqués sortent du tableau de paires et sont rendus à la
       suite, sous leur propre en-tête : un barème n'a pas sa place dans une
       cellule. */
    const entrees = Object.entries(v);
    const paires = entrees.filter(([, x]) => !estBareme(x));
    const baremes = entrees.filter(([, x]) => estBareme(x));
    return (paires.length ? tableauPaires(paires, p.format === "parts") : "")
      + baremes.map(([, x]) => tableauTranches(x, entete(cle))).join("");
  }
  return `<div class="val">${formatSimple(v)}</div>`;
}

function formatSimple(x, brut = false) {
  if (x === null || x === undefined) return "—";
  if (typeof x === "boolean") return x ? "oui" : "non";
  /* Garde-fou : sans cette branche, un objet imbriqué s'affichait
     « [object Object] ». */
  if (typeof x === "object") {
    return Object.entries(x).map(([k, y]) => `${libelleCle(k)} ${formatSimple(y)}`).join(" · ");
  }
  if (typeof x !== "number") return String(x);
  if (brut) return x.toLocaleString("fr-FR") + (x > 1 ? " parts" : " part");
  if (x > 0 && x < 1) return pct(x);
  return x >= 100 ? eur(x) : x.toLocaleString("fr-FR");
}

const LIB = {
  seuilCelibataire: "Seuil d'application — personne seule",
  seuilCouple: "Seuil d'application — couple",
  forfaitCelibataire: "Forfait de la formule — personne seule",
  forfaitCouple: "Forfait de la formule — couple",
  taux: "Taux", csg: "CSG", crds: "CRDS", solidarite: "Prélèvement de solidarité",
  standard: "Taux standard", categoriesMaintenues: "Catégories restées à 17,2 % de PS",
  celibataire: "Personne seule", couple: "Couple marié ou pacsé",
  deuxPremiersEnfants: "Chacun des deux premiers enfants",
  aPartirDuTroisieme: "Chaque enfant à partir du troisième",
  plafondBenefice: "Plafond de bénéfice au taux réduit", caMax: "Chiffre d'affaires maximal",
  detentionPersonnesPhysiques: "Détention minimale par des personnes physiques",
  debutAnnee: "Première année d'abattement", tauxCourant: "Taux annuel courant",
  anneeFinale: "Année du taux final", tauxFinal: "Taux de la dernière période",
  anneeIntermediaire: "Année du taux intermédiaire", tauxIntermediaire: "Taux intermédiaire",
  exonerationA: "Exonération totale à",
  /* transmission, épargne, patrimoine */
  abattementParBeneficiaire: "Abattement par bénéficiaire",
  taux1: "Taux jusqu'au seuil", seuilTaux2: "Seuil du taux majoré", taux2: "Taux au-delà du seuil",
  abattementGlobal: "Abattement global, tous bénéficiaires confondus",
  peaClassique: "PEA classique", cumulAvecPeaPme: "Cumul PEA + PEA-PME", peaJeune: "PEA jeunes",
  plafondRecettes: "Plafond de recettes brutes", abattement: "Abattement forfaitaire",
  seuilAssujettissement: "Seuil d'assujettissement", bareme: "Barème",
  forfait: "Forfait de la formule", seuilBas: "Seuil d'entrée", seuilHaut: "Seuil d'extinction"
};
const libelleCle = k => LIB[k] || k;

let filtre = "tous";

function rendre() {
  const liste = cles.filter(k => filtre === "tous" || P[k].statut === filtre);
  $("#app").innerHTML = `
    <div class="lede">
      <p class="eyebrow">Registre des paramètres · millésime ${MILLESIME.annee}</p>
      <p class="h">Chaque chiffre du site, avec sa source et sa date</p>
      <p>Les simulateurs et les cours ne lisent que ce registre. Un paramètre marqué
         « à vérifier » n'a pas de valeur publiée et n'entre dans aucun calcul : il vaut mieux
         un trou signalé qu'un chiffre plausible.</p>
      ${millesime()}
    </div>
    <div class="filtres">
      ${[["tous", `Tous (${cles.length})`],
         ["confirme", `Vérifiés (${compte("confirme")})`],
         ["divergence", `Sources divergentes (${compte("divergence")})`],
         ["a_verifier", `À vérifier (${compte("a_verifier")})`]]
        .map(([k, l]) => `<button data-f="${k}" aria-pressed="${filtre === k}">${l}</button>`).join("")}
    </div>
    ${liste.map(k => {
      const p = P[k], s = STATUTS[p.statut];
      return `<div class="param">
        <span class="chip ${s.classe}">${s.label}</span>
        <h3>${p.libelle}</h3>
        ${afficherValeur(p, k)}
        ${p.categories ? `<p class="note">Catégories concernées : ${p.categories.join(" · ")}.</p>` : ""}
        ${p.note ? `<p class="note">${p.note}</p>` : ""}
        <div class="source-tag">
          <div><b>Base légale</b> ${p.base || "—"}</div>
          <div><b>Doctrine</b> ${p.doctrine || "aucune publiée à ce jour"}</div>
          <div><b>Vérifié le</b> ${dateFr(p.verifieLe)}
            ${p.source ? ` · <a href="${p.source}" target="_blank" rel="noopener">consulter la source</a>` : ""}</div>
          <div><b>Clé technique</b> ${k}</div>
        </div>
      </div>`;
    }).join("")}`;

  document.querySelectorAll(".filtres button").forEach(b => {
    b.onclick = () => { filtre = b.dataset.f; rendre(); };
  });
}

rendre();
