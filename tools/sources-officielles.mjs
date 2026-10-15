/* sources-officielles.mjs — contrôle la qualité des sources du registre.

   Usage (depuis la racine) :  node tools/sources-officielles.mjs [--liste]
     --liste   détaille chaque paramètre, et non le seul regroupement par article

   Le § 1.1 de CLAUDE.md impose que chaque paramètre soit vérifié sur une source
   faisant autorité — Légifrance, BOFiP, impots.gouv.fr, service-public.fr,
   economie.gouv.fr — et le § 1.2 d'en recouper deux, dont une officielle. Le
   champ `source` est publié tel quel par parametres.html : c'est lui qui rend
   la méthode vérifiable pour un lecteur. Une URL de cabinet ou de blog y tient
   la place d'une preuve sans en être une.

   L'outil ne corrige rien et ne juge aucune valeur fausse : il dit quelles
   entrées reposent encore sur une source secondaire, et regroupe le travail
   restant par article de loi — plusieurs paramètres partageant le même texte,
   une seule consultation en couvre souvent trois ou quatre.

   Il sort toujours en code 0 et n'est pas branché sur verifier-tout.sh : un
   contrôle bloquant serait rouge en permanence tant que la reprise n'est pas
   faite, et pousserait à bâcler les URL plutôt qu'à les vérifier. */
import { P } from "../assets/js/params.js";

const DETAIL = process.argv.includes("--liste");

/* Les cinq domaines cités par le § 1.1, sous-domaines compris.
   service-public figure sous ses deux formes : le site a migré vers
   service-public.gouv.fr, et le § 1.1 nomme encore l'ancien domaine. */
const OFFICIELS = [
  "legifrance.gouv.fr",
  "impots.gouv.fr",            // couvre bofip.impots.gouv.fr
  "service-public.fr",
  "service-public.gouv.fr",    // couvre entreprendre.service-public.gouv.fr
  "economie.gouv.fr"
];

const hote = u => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return null; } };
const officielle = u => {
  const h = hote(u);
  return !!h && OFFICIELS.some(d => h === d || h.endsWith("." + d));
};

/* L'article seul, sans sa subdivision : « CGI art. 197, I-2 » et
   « CGI art. 197, I-4 » renvoient au même texte, donc à une seule lecture. */
const article = base => String(base || "—").split(" · ")[0].split(/[,(]|\s\+\s/)[0].trim();

const cale = (s, n) => String(s).padEnd(n);

const cles = Object.keys(P);
const avecSource = cles.filter(k => P[k].source);
const sansSource = cles.filter(k => !P[k].source);
const secondaires = avecSource.filter(k => !officielle(P[k].source));
const confirmees = secondaires.filter(k => P[k].statut === "confirme");

const pct = (a, b) => (b ? (a / b * 100).toFixed(0) : "0") + " %";

console.log("Qualité des sources du registre — " + cles.length + " paramètres\n");
console.log("  " + cale("Source officielle (§ 1.1)", 46) + String(avecSource.length - secondaires.length).padStart(4)
  + "   " + pct(avecSource.length - secondaires.length, avecSource.length));
console.log("  " + cale("Source secondaire", 46) + String(secondaires.length).padStart(4)
  + "   " + pct(secondaires.length, avecSource.length));
console.log("  " + cale("  dont publiées comme « vérifié »", 46) + String(confirmees.length).padStart(4));
console.log("  " + cale("Sans source (statut « à vérifier »)", 46) + String(sansSource.length).padStart(4));

if (!secondaires.length) {
  console.log("\nToutes les sources publiées sont officielles.");
  process.exit(0);
}

/* Regroupement par article : c'est l'unité de travail réelle. */
const parArticle = new Map();
for (const k of secondaires) {
  const a = article(P[k].base);
  if (!parArticle.has(a)) parArticle.set(a, []);
  parArticle.get(a).push(k);
}
const groupes = [...parArticle.entries()].sort((x, y) => y[1].length - x[1].length);

console.log(`\nÀ resourcer : ${secondaires.length} paramètres, pour ${groupes.length} articles distincts.`);
console.log("Une consultation par article suffit ; les clés en regard partagent le même texte.\n");

for (const [art, ks] of groupes) {
  console.log("  " + cale(art, 34) + ks.length + (ks.length > 1 ? " paramètres" : " paramètre"));
  for (const k of ks) {
    console.log("      " + cale(k, 30) + cale(hote(P[k].source), 30) + " "
      + (P[k].doctrine ? "doctrine : " + P[k].doctrine : "doctrine : aucune"));
  }
}

if (DETAIL) {
  console.log("\nDétail des URL actuelles");
  for (const k of secondaires) console.log("  " + cale(k, 30) + P[k].source);
}

console.log("\nRappel : ne pas écrire une URL sans l'avoir ouverte (§ 1.1). Un lien qui");
console.log("pointe vers le mauvais article est publié tel quel par parametres.html et");
console.log("vaut moins que la source secondaire qu'il remplace.");
