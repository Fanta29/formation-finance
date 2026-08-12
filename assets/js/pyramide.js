/* pyramide.js — élément signature de la page d'accueil.
   Une pyramide à base triangulaire : trois faces, une par branche du site
   (le cours, les QCM, les simulateurs). Chaque face est constituée de points
   sur une trame barycentrique. Rotation continue, entraînable à la souris ou
   au doigt ; une face s'allume quand on survole l'entrée correspondante.
   Se fige si l'utilisateur demande moins d'animations. */

export const BRANCHES = [
  { cle: "cours",       nom: "Le cours",         couleur: [124, 140, 255] },
  { cle: "qcm",         nom: "Les QCM",          couleur: [74, 222, 155] },
  { cle: "simulateurs", nom: "Les simulateurs",  couleur: [245, 184, 74] }
];

const H = 1.15;                       // hauteur de la pyramide
const R = 0.95;                       // rayon de la base
const LIGNES = 26;                    // densité de la trame

/** `opts.cadre` : fonction rendant le côté de référence, en pixels, dont
    dépendent la taille de la pyramide au repos. Par défaut le plus petit côté
    du canvas. La page d'accueil donne au canvas une largeur supérieure à sa
    colonne — pour que la traversée déborde sur toute la fenêtre — et impose
    donc son propre cadre, sinon la pose de repos grossirait d'autant. */
export function pyramide(canvas, opts = {}) {
  const ctx = canvas.getContext("2d");
  const sobre = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cadre = typeof opts.cadre === "function" ? opts.cadre : () => Math.min(l, h);

  const sommet = { x: 0, y: -H * 0.62, z: 0 };
  const base = [0, 1, 2].map(i => {
    const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
    return { x: Math.cos(a) * R, y: H * 0.38, z: Math.sin(a) * R };
  });

  /* trame barycentrique sur chacune des trois faces latérales */
  const points = [];
  const aretes = [];
  BRANCHES.forEach((_, f) => {
    const A = sommet, B = base[f], C = base[(f + 1) % 3];
    for (let i = 0; i <= LIGNES; i++) {
      for (let j = 0; j <= LIGNES - i; j++) {
        const u = i / LIGNES, v = j / LIGNES, w = 1 - u - v;
        const bord = i === 0 || j === 0 || i + j === LIGNES;
        points.push({
          x: A.x * w + B.x * u + C.x * v,
          y: A.y * w + B.y * u + C.y * v,
          z: A.z * w + B.z * u + C.z * v,
          f, bord
        });
      }
    }
    aretes.push([A, B], [B, C]);
  });

  let vy = 0.0026, glisse = false, dernier = null;
  let actif = -1, eclat = [0, 0, 0];
  let t = Math.random() * 100;          // départ aléatoire du balancement
  let l = 0, h = 0, dpr = 1;

  /* La pose se décompose en deux termes indépendants :
       — le mouvement automatique, fonction de l'horloge t (tangage et roulis)
         et de l'angle de lacet baseY qui avance seul ;
       — les décalages offX / offY / offZ, imposés au glissement et conservés
         ensuite.
     Rien ne réécrit jamais l'un à partir de l'autre : au relâchement le
     balancement reprend depuis la pose courante, sans retour brusque. */
  let baseY = 0.5;                      // lacet automatique
  let offX = 0, offY = 0, offZ = 0;     // décalages persistants du glissement
  const LIMITE_X = 1.2;                 // amplitude maximale du tangage manuel
  let rx = 0, ry = 0, rz = 0;           // pose composée, recalculée à l'image

  /* Traversée au défilement : 0 = pose de repos, 1 = caméra passée au travers. */
  let trav = 0;
  const FUITE = 26;                     // ampleur du rapprochement de la caméra
  const SEUIL_FONDU = 0.62;             // à partir d'où l'objet s'efface

  function poser() {
    // deux oscillations lentes, de périodes différentes, pour un mouvement
    // qui ne repasse pas deux fois par la même pose : la pyramide culbute.
    rx = -0.16 + Math.sin(t * 0.34) * 0.5 + offX;
    ry = baseY + offY;
    rz = Math.sin(t * 0.21) * 0.28 + offZ;
  }

  function dimensionner() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    l = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = l * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function projeter(p, cx, cy, E) {
    // rotation continue autour de la verticale (ry) + basculement lent
    // autour de l'axe horizontal (rx) + léger roulis (rz), pour que la
    // pyramide culbute au lieu de tourner à plat.
    const cY = Math.cos(ry), sY = Math.sin(ry);
    const cX = Math.cos(rx), sX = Math.sin(rx);
    const cZ = Math.cos(rz), sZ = Math.sin(rz);
    // lacet
    let x = p.x * cY - p.z * sY;
    let z = p.x * sY + p.z * cY;
    let y = p.y;
    // tangage
    let y1 = y * cX - z * sX;
    z = y * sX + z * cX;
    // roulis
    const x2 = x * cZ - y1 * sZ;
    const y2 = x * sZ + y1 * cZ;
    return { x: cx + x2 * E, y: cy + y2 * E, z };
  }

  function peindre() {
    ctx.clearRect(0, 0, l, h);
    /* La colonne de texte est centrée sur la hauteur de la fenêtre : la scène
       l'est donc aussi, sans décalage vers le bas. */
    const cx = l / 2, cy = h / 2;
    const E0 = cadre() * 0.40;                // échelle au repos

    /* Traversée : la caméra se rapproche, donc le facteur d'échelle enfle.
       La croissance est quadratique — lente d'abord, puis très rapide — pour
       donner la sensation d'entrer dans l'objet plutôt que de le grossir. */
    const E = E0 * (1 + trav * trav * FUITE);
    const voile = 1 - Math.max(0, (trav - SEUIL_FONDU) / (1 - SEUIL_FONDU));
    if (voile <= 0) return;                   // caméra passée au travers

    BRANCHES.forEach((_, i) => {
      const cible = actif === i ? 1 : (actif === -1 ? 0.35 : 0);
      eclat[i] += (cible - eclat[i]) * 0.12;
    });

    ctx.globalAlpha = voile;

    /* arêtes, en arrière-plan */
    ctx.lineWidth = 1 + trav * 2;
    for (const [a, b] of aretes) {
      const pa = projeter(a, cx, cy, E), pb = projeter(b, cx, cy, E);
      ctx.strokeStyle = "rgba(195,202,214,0.22)";
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
    }

    const proj = points.map(p => {
      const q = projeter(p, cx, cy, E);
      q.f = p.f; q.bord = p.bord;
      return q;
    }).sort((a, b) => a.z - b.z);

    const gros = 1 + trav * 2.4;              // les points enflent avec l'approche
    for (const p of proj) {
      const prof = (p.z + 1.2) / 2.4;
      const [r, v, b] = BRANCHES[p.f].couleur;
      const a = (0.10 + prof * 0.62) * (0.55 + eclat[p.f] * 0.45);
      ctx.fillStyle = `rgba(${r},${v},${b},${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, ((p.bord ? 1.5 : 0.85) + prof * (p.bord ? 1.1 : 1.4)) * gros, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  function boucle() {
    if (!glisse) { t += 0.016; baseY += vy; }
    poser();
    peindre();
    if (!sobre) requestAnimationFrame(boucle);
  }

  const pos = e => (e.touches ? e.touches[0] : e);
  /* sens du geste tactile : 0 indéterminé, 1 entraînement, -1 défilement */
  let sens = 1;
  const debut = e => { glisse = true; dernier = pos(e); sens = e.touches ? 0 : 1; };
  const fin = () => { glisse = false; dernier = null; sens = 1; };
  const bouge = e => {
    if (!glisse || !dernier) return;
    const p = pos(e);
    const dx = p.clientX - dernier.clientX, dy = p.clientY - dernier.clientY;

    /* La page défile : au doigt, un geste franchement vertical doit traverser
       le canvas pour faire défiler, au lieu d'entraîner la pyramide. On tranche
       au premier déplacement net, puis on s'y tient jusqu'au relâchement. */
    if (sens === 0) {
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      sens = Math.abs(dy) > Math.abs(dx) ? -1 : 1;
      if (sens === -1) return fin();
    }

    // le glissement ne touche qu'aux décalages : l'oscillation reste intacte.
    offY += dx * 0.007;
    offX += dy * 0.004;
    offX = Math.max(-LIMITE_X, Math.min(LIMITE_X, offX));
    dernier = p;
    poser();
    if (sobre) peindre();
    if (e.cancelable) e.preventDefault();
  };

  canvas.addEventListener("mousedown", debut);
  addEventListener("mouseup", fin);
  addEventListener("mousemove", bouge);
  canvas.addEventListener("touchstart", debut, { passive: true });
  addEventListener("touchend", fin);
  canvas.addEventListener("touchmove", bouge, { passive: false });
  addEventListener("resize", () => { dimensionner(); peindre(); });

  dimensionner();
  boucle();
  if (sobre) peindre();

  return {
    /** Met en avant une face : 0 le cours, 1 les QCM, 2 les simulateurs, -1 aucune. */
    eclairer(i) { actif = i; if (sobre) peindre(); },

    /** Avancée de la caméra dans l'objet, de 0 (repos) à 1 (traversé, invisible).
        Branché sur le défilement de la page d'accueil. Sans effet si
        l'utilisateur demande moins d'animations : l'objet reste au repos. */
    traverser(p) {
      if (sobre) return;
      trav = Math.max(0, Math.min(1, Number(p) || 0));
    }
  };
}
