/* audit.mjs — contrôle structurel du dépôt.
   Usage (depuis la racine) :  node tools/audit.mjs
   Vérifie : complétude des entrées de params.js, cohérence statut/valeur,
   existence des clés citées par sourceTag, et intégrité des index de données. */
import fs from "fs";
import { P } from "../assets/js/params.js";

let pb = 0;
const ko = (...a) => { console.log("  ✗", ...a); pb++; };

for (const [k, p] of Object.entries(P)) {
  for (const champ of ["libelle", "base", "statut", "verifieLe", "source", "doctrine"]) {
    if (!(champ in p)) ko(`champ « ${champ} » manquant dans ${k}`);
  }
  if (p.statut === "a_verifier" && p.valeur !== null) ko(`${k} : statut « à vérifier » mais valeur renseignée`);
  if (p.statut !== "a_verifier" && (p.valeur === null || !p.verifieLe || !p.source))
    ko(`${k} : présenté comme vérifié sans valeur, date ou source`);
}

const src = fs.readFileSync("assets/js/outils.js", "utf8");
[...src.matchAll(/sourceTag\(([^)]*)\)/g)]
  .flatMap(m => m[1].split(",").map(s => s.trim().replace(/["']/g, "")))
  .forEach(c => { if (c && !P[c]) ko(`clé inconnue citée par sourceTag : ${c}`); });

const cours = JSON.parse(fs.readFileSync("data/cours/index.json"));
[...cours.chapitres, ...cours.sections].forEach(c => {
  if (!fs.existsSync("data/cours/" + c.fichier)) ko(`fragment manquant : ${c.fichier}`);
});

const qcm = JSON.parse(fs.readFileSync("data/qcm/index.json"));
let somme = 0, ids = new Set();
qcm.themes.forEach(t => {
  const f = `data/qcm/${t.id}.json`;
  if (!fs.existsSync(f)) return ko(`thème manquant : ${f}`);
  const qs = JSON.parse(fs.readFileSync(f));
  somme += qs.length;
  if (qs.length !== t.count) ko(`${t.id} : ${qs.length} questions pour un compte annoncé de ${t.count}`);
  qs.forEach(q => {
    if (ids.has(q.id)) ko(`identifiant en double : ${q.id}`);
    ids.add(q.id);
    const cs = Array.isArray(q.c) ? q.c : [q.c];
    if (!q.q || !q.e) ko(`${q.id} : énoncé ou explication vide`);
    if (!Array.isArray(q.o) || q.o.length < 2) ko(`${q.id} : options invalides`);
    if (cs.some(i => !Number.isInteger(i) || i < 0 || i >= q.o.length)) ko(`${q.id} : index de réponse hors bornes`);
  });
});
if (somme !== qcm.total) ko(`total annoncé ${qcm.total} pour ${somme} questions`);

/* --- contrôles ajoutés : cohérence entre le code, les styles et les fichiers --- */
const html = fs.readdirSync(".").filter(f => f.endsWith(".html"));
const js = fs.readdirSync("assets/js").filter(f => f.endsWith(".js")).map(f => "assets/js/" + f);
const css = fs.readFileSync("assets/css/app.css", "utf8");

/* 1. tout fichier local référencé par une page doit exister */
for (const page of html) {
  const src = fs.readFileSync(page, "utf8");
  for (const m of src.matchAll(/(?:href|src)="(?!https?:|#|mailto:)([^"]+)"/g)) {
    const cible = m[1].split("?")[0];
    if (cible && !fs.existsSync(cible)) ko(`${page} référence un fichier absent : ${cible}`);
  }
}

/* 2. tout module importé doit exister */
for (const f of js) {
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(/from\s+"\.\/([^"]+)"/g)) {
    if (!fs.existsSync("assets/js/" + m[1])) ko(`${f} importe un module absent : ${m[1]}`);
  }
  /* 3. tout export importé doit être réellement exporté */
  for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s+"\.\/([^"]+)"/g)) {
    const cible = "assets/js/" + m[2];
    if (!fs.existsSync(cible)) continue;
    const source = fs.readFileSync(cible, "utf8");
    for (const nom of m[1].split(",").map(x => x.trim()).filter(Boolean)) {
      const echap = nom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`export\\s+(const|function|let|class)\\s+${echap}(?![\\w])|export\\s*\\{[^}]*${echap}`);
      if (!re.test(source)) ko(`${f} importe « ${nom} » qui n'est pas exporté par ${m[2]}`);
    }
  }
}

/* 4. toute classe CSS employée par le code doit exister dans la feuille de style */
const classesCss = new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(m => m[1]));
const employees = new Set();
for (const f of [...html, ...js]) {
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(/class="([^"$]*)"/g)) {
    m[1].split(/\s+/).filter(Boolean).forEach(c => employees.add(c));
  }
  for (const m of src.matchAll(/classList\.(?:add|toggle)\("([^"]+)"/g)) employees.add(m[1]);
}
for (const c of employees) {
  if (!classesCss.has(c)) ko(`classe « ${c} » utilisée par le code mais absente de app.css`);
}

const st = s => Object.values(P).filter(p => p.statut === s).length;
console.log(`Paramètres : ${Object.keys(P).length} — ${st("confirme")} vérifiés, ${st("divergence")} divergence, ${st("a_verifier")} à vérifier`);
console.log(`Questions : ${somme} · Fragments de cours : ${cours.chapitres.length + cours.sections.length}`);
console.log(`Pages : ${html.length} · Modules JS : ${js.length} · Classes CSS employées : ${employees.size}`);
console.log(pb === 0 ? "AUDIT STRUCTUREL : aucune anomalie" : `AUDIT : ${pb} anomalie(s)`);
process.exit(pb === 0 ? 0 : 1);
