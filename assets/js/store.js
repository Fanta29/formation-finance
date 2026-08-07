/* store.js — progression locale (localStorage). Aucune donnée ne quitte
   l'appareil : pas de compte, pas de serveur, pas de cookie de suivi. */

const CLE = "ff.progression.v1";

const vide = () => ({ chapitresLus: [], qcm: {}, erreurs: [], dernier: null });

function lire() {
  try {
    const brut = localStorage.getItem(CLE);
    return brut ? Object.assign(vide(), JSON.parse(brut)) : vide();
  } catch (e) {
    return vide();
  }
}

function ecrire(d) {
  try { localStorage.setItem(CLE, JSON.stringify(d)); } catch (e) { /* mode privé */ }
  return d;
}

export const etat = () => lire();

export function marquerLu(num, lu = true) {
  const d = lire();
  const s = new Set(d.chapitresLus);
  lu ? s.add(num) : s.delete(num);
  d.chapitresLus = [...s].sort((a, b) => a - b);
  d.dernier = { type: "chapitre", num, le: new Date().toISOString() };
  return ecrire(d);
}

export const estLu = num => lire().chapitresLus.includes(num);

/** Enregistre une réponse. juste = booléen. */
export function repondre(theme, idQuestion, juste) {
  const d = lire();
  const t = d.qcm[theme] || (d.qcm[theme] = { vues: 0, justes: 0 });
  t.vues++;
  if (juste) {
    t.justes++;
    d.erreurs = d.erreurs.filter(e => e !== idQuestion);
  } else if (!d.erreurs.includes(idQuestion)) {
    d.erreurs.push(idQuestion);
  }
  d.dernier = { type: "qcm", theme, le: new Date().toISOString() };
  return ecrire(d);
}

export const erreurs = () => lire().erreurs;

export function reinitialiser() {
  try { localStorage.removeItem(CLE); } catch (e) { /* ignore */ }
  return vide();
}
