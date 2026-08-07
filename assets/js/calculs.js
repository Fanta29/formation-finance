/* calculs.js — moteur de calcul pur (aucun DOM, testable en Node).
   Tous les paramètres proviennent de params.js : aucun chiffre en dur ici. */
import { P, exiger } from "./params.js";

/* ------------------------------------------------------------------ IR --- */

/** Impôt résultant du barème pour un quotient donné, multiplié par les parts. */
export function baremeIR(quotient, parts) {
  const tranches = exiger("ir_bareme");
  let impot = 0, bas = 0;
  for (const t of tranches) {
    if (quotient <= bas) break;
    const haut = Math.min(quotient, t.jusqua);
    impot += (haut - bas) * t.taux;
    bas = t.jusqua;
  }
  return impot * parts;
}

/** Taux marginal atteint par le quotient. */
export function tmi(quotient) {
  const tranches = exiger("ir_bareme");
  let bas = 0;
  for (const t of tranches) {
    if (quotient <= t.jusqua) return t.taux;
    bas = t.jusqua;
  }
  return tranches[tranches.length - 1].taux;
}

/** Nombre de parts — cas généraux uniquement (CGI art. 194 I). */
export function parts({ couple, enfants }) {
  const base = couple ? 2 : 1;
  const maj = enfants <= 2 ? enfants * 0.5 : 1 + (enfants - 2);
  return { base, total: base + maj, demiPartsSupp: maj * 2 };
}

/**
 * Impôt sur le revenu : barème, plafonnement du quotient familial, décote.
 * @param {number} rni    revenu net imposable du foyer
 * @param {boolean} couple
 * @param {number} enfants nombre d'enfants à charge exclusive
 */
export function impotRevenu(rni, couple, enfants) {
  const pl = exiger("ir_plafond_qf_demi_part");
  const d = exiger("ir_decote");
  const pa = parts({ couple, enfants });

  const impotAvecParts = baremeIR(rni / pa.total, pa.total);
  const impotSansEnfants = baremeIR(rni / pa.base, pa.base);
  const avantage = impotSansEnfants - impotAvecParts;
  const plafond = pl * pa.demiPartsSupp;
  const plafonne = pa.demiPartsSupp > 0 && avantage > plafond;
  const impotBrut = plafonne ? impotSansEnfants - plafond : impotAvecParts;

  const seuil = couple ? d.seuilCouple : d.seuilCelibataire;
  const forfait = couple ? d.forfaitCouple : d.forfaitCelibataire;
  const decote = impotBrut < seuil ? Math.max(0, forfait - d.taux * impotBrut) : 0;
  const net = Math.max(0, impotBrut - decote);

  return {
    parts: pa.total, quotient: rni / pa.total,
    impotAvecParts, impotSansEnfants, avantage, plafond, plafonne,
    impotBrut, decote, net,
    tmi: tmi(rni / pa.total),
    tauxMoyen: rni > 0 ? net / rni : 0
  };
}

/* -------------------------------------------------------- Dividendes --- */

/**
 * Compare PFU et option pour le barème sur un dividende brut.
 * @param {number} brut     dividende brut perçu
 * @param {number} tauxMarginal TMI du foyer (0,11 / 0,30 / 0,41 / 0,45…)
 */
export function dividendes(brut, tauxMarginal) {
  const ir = exiger("pfu_part_ir");
  const ps = exiger("ps_taux_standard");
  const ab = exiger("dividendes_abattement");
  const csgD = exiger("csg_deductible");

  const psDus = brut * ps;                       // identiques dans les deux cas
  const pfuIR = brut * ir;
  const pfuTotal = pfuIR + psDus;

  const baseBareme = brut * (1 - ab);
  const baremeIRDu = baseBareme * tauxMarginal;
  const economieCsg = brut * csgD * tauxMarginal; // gain d'IR de l'année suivante
  const baremeTotal = baremeIRDu + psDus - economieCsg;

  return {
    ps: psDus,
    pfu: { ir: pfuIR, total: pfuTotal, taux: pfuTotal / brut, net: brut - pfuTotal },
    bareme: {
      base: baseBareme, ir: baremeIRDu, economieCsg,
      total: baremeTotal, taux: baremeTotal / brut, net: brut - baremeTotal
    },
    gagnant: baremeTotal < pfuTotal ? "bareme" : "pfu",
    ecart: Math.abs(pfuTotal - baremeTotal)
  };
}

/* ------------------------------------------ Plus-value immobilière --- */

export function abattementIR(annees) {
  const a = exiger("pvimmo_abattement_ir");
  if (annees < a.debutAnnee) return 0;
  if (annees >= a.exonerationA) return 1;
  return (Math.min(annees, 21) - 5) * a.tauxCourant;
}

export function abattementPS(annees) {
  const a = exiger("pvimmo_abattement_ps");
  if (annees < a.debutAnnee) return 0;
  if (annees >= a.exonerationA) return 1;
  let t = (Math.min(annees, 21) - 5) * a.tauxCourant;
  if (annees >= a.anneeIntermediaire) t += a.tauxIntermediaire;
  if (annees > a.anneeIntermediaire) t += (annees - a.anneeIntermediaire) * a.tauxFinal;
  return Math.min(t, 1);
}

/**
 * Plus-value immobilière des particuliers.
 * @param {object} o prixCession, fraisVente, prixAcquisition, fraisAcquisition
 *                   (null => forfait 7,5 %), travaux (null => forfait 15 % si éligible),
 *                   annees, bati
 */
export function plusValueImmo(o) {
  const tauxIR = exiger("pvimmo_taux_ir");
  const tauxPS = exiger("ps_taux_maintenu");
  const fFrais = exiger("pvimmo_forfait_frais_acquisition");
  const fTrav = exiger("pvimmo_forfait_travaux");

  const cession = o.prixCession - (o.fraisVente || 0);
  const frais = o.fraisAcquisition == null ? o.prixAcquisition * fFrais : o.fraisAcquisition;
  const eligibleForfaitTravaux = o.bati && o.annees > 5;
  const travaux = o.travaux == null
    ? (eligibleForfaitTravaux ? o.prixAcquisition * fTrav : 0)
    : o.travaux;
  const acquisition = o.prixAcquisition + frais + travaux;

  const brute = cession - acquisition;
  if (brute <= 0) {
    return { brute, nulle: true, frais, travaux, acquisition, cession };
  }
  const abIR = abattementIR(o.annees), abPS = abattementPS(o.annees);
  const netteIR = brute * (1 - abIR);
  const nettePS = brute * (1 - abPS);
  const impotIR = netteIR * tauxIR;
  const impotPS = nettePS * tauxPS;

  return {
    cession, frais, travaux, acquisition, brute,
    abIR, abPS, netteIR, nettePS, impotIR, impotPS,
    total: impotIR + impotPS,
    tauxEffectif: brute > 0 ? (impotIR + impotPS) / brute : 0,
    surtaxeApplicable: netteIR > 50000,
    forfaitTravauxApplique: o.travaux == null && eligibleForfaitTravaux,
    forfaitFraisApplique: o.fraisAcquisition == null
  };
}

/* Exposé pour la page Paramètres */
export { P };
