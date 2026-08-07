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

export function pyramide(canvas) {
  const ctx = canvas.getContext("2d");
  const sobre = matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  let ry = 0.5, rx = -0.16, vy = 0.0026, glisse = false, dernier = null;
  let actif = -1, eclat = [0, 0, 0];
  let t = Math.random() * 100;          // départ aléatoire du balancement
  let rz = 0;                           // roulis
  let l = 0, h = 0, dpr = 1;

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
    const cx = l / 2, cy = h / 2 + h * 0.03, E = Math.min(l, h) * 0.40;

    BRANCHES.forEach((_, i) => {
      const cible = actif === i ? 1 : (actif === -1 ? 0.35 : 0);
      eclat[i] += (cible - eclat[i]) * 0.12;
    });

    /* halo */
    const g = ctx.createRadialGradient(cx, cy, E * 0.15, cx, cy, E * 1.5);
    g.addColorStop(0, "rgba(124,140,255,0.13)");
    g.addColorStop(1, "rgba(124,140,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, l, h);

    /* arêtes, en arrière-plan */
    ctx.lineWidth = 1;
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

    for (const p of proj) {
      const prof = (p.z + 1.2) / 2.4;
      const [r, v, b] = BRANCHES[p.f].couleur;
      const a = (0.10 + prof * 0.62) * (0.55 + eclat[p.f] * 0.45);
      ctx.fillStyle = `rgba(${r},${v},${b},${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (p.bord ? 1.5 : 0.85) + prof * (p.bord ? 1.1 : 1.4), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function boucle() {
    if (!glisse) {
      t += 0.016;
      ry += vy;
      // deux oscillations lentes, de périodes différentes, pour un mouvement
      // qui ne repasse pas deux fois par la même pose : la pyramide culbute.
      rx = -0.16 + Math.sin(t * 0.34) * 0.5;
      rz = Math.sin(t * 0.21) * 0.28;
    }
    peindre();
    if (!sobre) requestAnimationFrame(boucle);
  }

  const pos = e => (e.touches ? e.touches[0] : e);
  const debut = e => { glisse = true; dernier = pos(e); };
  const fin = () => { glisse = false; dernier = null; };
  const bouge = e => {
    if (!glisse || !dernier) return;
    const p = pos(e);
    ry += (p.clientX - dernier.clientX) * 0.007;
    rx += (p.clientY - dernier.clientY) * 0.004;
    rx = Math.max(-1.2, Math.min(1.2, rx));
    dernier = p;
    if (sobre) peindre();
    if (e.cancelable) e.preventDefault();
  };
  // au relâcher, on réaligne l'horloge sur le tangage courant pour éviter
  // un saut brusque quand le balancement automatique reprend.
  const finGlisse = () => {
    if (glisse) t = Math.asin(Math.max(-1, Math.min(1, (rx + 0.16) / 0.5))) / 0.34;
    fin();
  };

  canvas.addEventListener("mousedown", debut);
  addEventListener("mouseup", finGlisse);
  addEventListener("mousemove", bouge);
  canvas.addEventListener("touchstart", debut, { passive: true });
  addEventListener("touchend", finGlisse);
  canvas.addEventListener("touchmove", bouge, { passive: false });
  addEventListener("resize", () => { dimensionner(); peindre(); });

  dimensionner();
  boucle();
  if (sobre) peindre();

  /** Met en avant une face : 0 le cours, 1 les QCM, 2 les simulateurs, -1 aucune. */
  return { eclairer(i) { actif = i; if (sobre) peindre(); } };
}
