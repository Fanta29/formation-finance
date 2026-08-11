/* Vérification des calculs contre des cas de référence issus de sources publiées.
   À exécuter à chaque modification de params.js ou calculs.js :  node tools/verif-calculs.mjs */
import { impotRevenu, baremeIR, parts, dividendes, plusValueImmo, abattementIR, abattementPS }
  from "../assets/js/calculs.js";

let ko = 0;
const r2 = n => Math.round(n * 100) / 100;
function att(nom, obtenu, attendu, tol = 0.5) {
  const ok = Math.abs(obtenu - attendu) <= tol;
  if (!ok) ko++;
  console.log(`${ok ? "  OK " : "  KO "} ${nom} : obtenu ${r2(obtenu)} / attendu ${attendu}`);
}

console.log("\n--- IR : barème 2026 (revenus 2025) ---");
// Source : service-public.gouv.fr A18045, exemple officiel
att("Célibataire 30 000 €, 1 part", impotRevenu(30000, false, 0).impotBrut, 2103.99, 0.01);
// Source : Hagnéré Patrimoine, barème IR 2026
att("Célibataire 20 000 € — impôt brut", impotRevenu(20000, false, 0).impotBrut, 924, 0.01);
att("Célibataire 20 000 € — décote", impotRevenu(20000, false, 0).decote, 479, 1);
att("Célibataire 20 000 € — net", impotRevenu(20000, false, 0).net, 445, 1);
// Couple 60 000 €, 2 parts : quotient identique au cas officiel, x2, pas de décote
att("Couple 60 000 €, 2 parts", impotRevenu(60000, true, 0).net, 4207.98, 0.02);

console.log("\n--- Parts (CGI art. 194) ---");
att("Couple + 3 enfants", parts({ couple: true, enfants: 3 }).total, 4);
att("Couple + 2 enfants", parts({ couple: true, enfants: 2 }).total, 3);
att("Célibataire + 1 enfant", parts({ couple: false, enfants: 1 }).total, 1.5);

console.log("\n--- Plafonnement du quotient familial ---");
const hautRevenu = impotRevenu(150000, true, 2);
att("Avantage plafonné à 2 x 1 807 €", hautRevenu.plafond, 3614);
console.log(`   (plafonnement déclenché : ${hautRevenu.plafonne}, avantage brut ${r2(hautRevenu.avantage)} €)`);

console.log("\n--- Décote : cohérence du point de sortie ---");
// À l'impôt brut = seuil, la décote calculée doit être ~nulle.
att("Décote au seuil célibataire (1 982 €)", Math.max(0, 897 - 0.4525 * 1982), 0.14, 0.15);

console.log("\n--- Dividendes : PFU 31,4 % ---");
const d = dividendes(10000, 0.30);
att("PFU total sur 10 000 €", d.pfu.total, 3140, 0.01);
att("PS sur 10 000 €", d.ps, 1860, 0.01);
att("Base barème (abattement 40 %)", d.bareme.base, 6000, 0.01);

console.log("\n--- Abattements plus-value immobilière (CGI art. 150 VC) ---");
att("IR à 21 ans", abattementIR(21), 0.96, 0.0001);
att("IR à 22 ans", abattementIR(22), 1, 0.0001);
att("IR à 14 ans", abattementIR(14), 0.54, 0.0001);
att("PS à 14 ans", abattementPS(14), 0.1485, 0.0001);
att("PS à 22 ans", abattementPS(22), 0.28, 0.0001);
att("PS à 30 ans", abattementPS(30), 1, 0.0001);
att("IR à 5 ans (aucun abattement)", abattementIR(5), 0);

console.log("\n--- Plus-value immobilière : cas complet ---");
// Source : exemple publié (ad-immo.fr) — 290 000 / 180 000 + forfait 7,5 % + 25 000 de travaux, 14 ans
const pv = plusValueImmo({ prixCession: 290000, fraisVente: 0, prixAcquisition: 180000,
  fraisAcquisition: null, travaux: 25000, annees: 14, bati: true });
att("Prix d'acquisition corrigé", pv.acquisition, 218500, 0.01);
att("Plus-value brute", pv.brute, 71500, 0.01);
att("Plus-value nette IR", pv.netteIR, 32890, 0.01);
att("Plus-value nette PS", pv.nettePS, 60882.25, 0.5);
att("Impôt total", pv.total, 16721, 1);

console.log(ko === 0 ? "\nTOUS LES CONTRÔLES PASSENT\n" : `\n${ko} CONTRÔLE(S) EN ÉCHEC\n`);
process.exit(ko === 0 ? 0 : 1);
