/* biais-longueur.mjs — mesure un biais de conception des questions : la bonne
   réponse est-elle repérable à sa seule longueur ?

   Usage (depuis la racine) :  node tools/biais-longueur.mjs [--max N] [--seuil P]
     --max N    limite à N le nombre de questions listées (défaut : toutes)
     --seuil P  écart, en pourcentage, au-delà duquel la plus longue proposition
                est dite « nettement » plus longue que la deuxième (défaut : 40)

   Une bonne réponse systématiquement plus longue que ses distracteurs se
   devine sans aucune connaissance fiscale : il suffit de compter les lignes.
   L'outil ne modifie rien et ne juge aucune question fausse ; il rapporte.
   Il sort toujours en code 0 — le corpus existant dépasse largement le seuil,
   sa reprise est un chantier distinct (voir CLAUDE.md, § « Ajouter du contenu »).

   La mesure ne porte que sur les questions à réponse unique : sur une question
   à réponses multiples, « la bonne réponse » n'est pas une proposition unique
   et la comparaison n'aurait pas de sens. */
import fs from "fs";

const arg = (nom, defaut) => {
  const i = process.argv.indexOf(nom);
  return i > -1 && process.argv[i + 1] ? Number(process.argv[i + 1]) : defaut;
};
const MAX = arg("--max", Infinity);
const SEUIL = arg("--seuil", 40) / 100;

/* Longueur retenue : le nombre de caractères de la proposition, espaces
   consécutifs réduits à un seul. C'est la mesure que perçoit le lecteur. */
const longueur = s => String(s).replace(/\s+/g, " ").trim().length;

const pct = (a, b) => (b ? (a / b * 100).toFixed(1).replace(".", ",") : "0,0") + " %";
const cale = (s, n) => String(s).padEnd(n);
const caleD = (s, n) => String(s).padStart(n);

const idx = JSON.parse(fs.readFileSync("data/qcm/index.json"));
const libelle = id => (idx.themes.find(t => t.id === id) || {}).label || id;

let total = 0, multiples = 0, unique = 0, exAequo = 0;
let departageables = 0, plusLongueGagne = 0;
let nettes = 0, nettesGagne = 0;
const signalees = [];
const parTheme = {};

for (const t of idx.themes) {
  const questions = JSON.parse(fs.readFileSync(`data/qcm/${t.id}.json`));
  const st = parTheme[t.id] = { n: 0, gagne: 0, nettes: 0 };

  for (const q of questions) {
    total++;
    if (Array.isArray(q.c)) { multiples++; continue; }
    unique++;

    const L = q.o.map(longueur);
    const max = Math.max(...L);

    /* Plusieurs propositions à égalité au sommet : la longueur ne désigne
       personne, la question n'est pas « gagnable » par ce biais. */
    if (L.filter(x => x === max).length > 1) { exAequo++; continue; }

    departageables++;
    st.n++;
    const gagnante = L.indexOf(max) === q.c;
    if (gagnante) { plusLongueGagne++; st.gagne++; }

    const seconde = [...L].sort((a, b) => b - a)[1];
    const ecart = seconde ? max / seconde - 1 : 0;
    if (ecart > SEUIL) {
      nettes++;
      if (gagnante) {
        nettesGagne++;
        st.nettes++;
        signalees.push({
          id: q.id, theme: t.id, bonne: max, seconde, ecart,
          enonce: String(q.q).replace(/\s+/g, " ").trim()
        });
      }
    }
  }
}

const s = Math.round(SEUIL * 100);
console.log(`Biais de longueur des propositions — ${total} questions, ${idx.themes.length} thèmes`);
console.log(`Seuil « nettement plus longue » : +${s} % sur la deuxième proposition la plus longue\n`);

const ligne = (lbl, val, suite = "") => console.log(`  ${cale(lbl, 50)}${caleD(val, 10)}${suite ? "   " + suite : ""}`);

console.log("Assiette de la mesure");
ligne("Questions à réponses multiples, hors mesure", multiples);
ligne("Questions à réponse unique", unique);
ligne("  dont plusieurs propositions ex aequo au plus long", exAequo);
ligne("  dont une seule proposition la plus longue", departageables);

console.log("\nLa plus longue proposition est-elle la bonne réponse ?");
ligne("Sur les questions départageables", plusLongueGagne, pct(plusLongueGagne, departageables));
ligne("Sur toutes les questions à réponse unique", plusLongueGagne, pct(plusLongueGagne, unique));
console.log("    (ex aequo comptés comme non identifiables à la longueur)");
ligne(`Quand elle dépasse la 2e de plus de ${s} %`, `${nettesGagne} / ${nettes}`, pct(nettesGagne, nettes));

console.log("\nPar thème — part des questions départageables gagnées à la longueur");
for (const t of idx.themes) {
  const st = parTheme[t.id];
  if (!st.n) continue;
  console.log(`  ${cale(t.label, 34)} ${caleD(st.gagne + " / " + st.n, 11)}   ${caleD(pct(st.gagne, st.n), 7)}   dont ${st.nettes} au-delà du seuil`);
}

console.log(`\nQuestions où la bonne réponse dépasse de plus de ${s} % la deuxième plus longue : ${signalees.length}`);
signalees.sort((a, b) => b.ecart - a.ecart);
for (const q of signalees.slice(0, MAX)) {
  console.log(`  ${cale(q.id, 10)} ${caleD("+" + Math.round(q.ecart * 100) + " %", 7)}   ${caleD(q.bonne + " c.", 8)} contre ${caleD(q.seconde + " c.", 8)}   ${libelle(q.theme)}`);
  console.log(`             ${q.enonce.slice(0, 96)}${q.enonce.length > 96 ? "…" : ""}`);
}
if (signalees.length > MAX) console.log(`  … et ${signalees.length - MAX} autres (relancer sans --max pour tout voir)`);

console.log("\nRappel : ne pas corriger les questions existantes pour faire baisser ce taux.");
console.log("La reprise du corpus est un chantier à décider séparément ; cet outil sert");
console.log("d'abord à contrôler les questions nouvellement écrites.");
