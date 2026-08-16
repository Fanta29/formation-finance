/* =============================================================================
   params.js — FICHIER CENTRAL DES PARAMÈTRES FISCAUX
   -----------------------------------------------------------------------------
   RÈGLE ABSOLUE : aucun chiffre fiscal ne doit apparaître ailleurs que dans ce
   fichier. Les simulateurs, la page « Paramètres » et les fiches des cours le
   consomment. Mettre à jour la fiscalité = éditer ce seul fichier.

   Chaque entrée porte obligatoirement :
     valeur      la donnée (nombre, tableau de tranches, objet)
     libelle     intitulé lisible
     base        base légale (article + loi)
     doctrine    référence BOFiP quand elle existe (sinon null)
     source      URL vérifiée
     verifieLe   date de la vérification (AAAA-MM-JJ)
     statut      'confirme' | 'divergence' | 'a_verifier'
     note        réserve, divergence de sources, limite d'application

   statut = 'a_verifier'  ->  valeur DOIT rester null. Le site affiche
   « à vérifier » et refuse de calculer avec. Ne jamais combler un trou par une
   valeur plausible.
   ========================================================================== */

export const MILLESIME = {
  annee: 2026,
  anneeRevenus: 2025,
  majLe: "2026-08-05",
  textes: [
    "LOI n° 2026-103 du 19 février 2026 de finances pour 2026",
    "LOI n° 2025-1403 du 30 décembre 2025 de financement de la sécurité sociale pour 2026"
  ]
};

export const P = {

  /* ---------------------------------------------------------------- IR --- */
  ir_bareme: {
    libelle: "Barème progressif de l'impôt sur le revenu (par part)",
    valeur: [
      { jusqua: 11600, taux: 0.00 },
      { jusqua: 29579, taux: 0.11 },
      { jusqua: 84577, taux: 0.30 },
      { jusqua: 181917, taux: 0.41 },
      { jusqua: Infinity, taux: 0.45 }
    ],
    base: "CGI art. 197, I-1 · art. 4 de la LOI n° 2026-103 du 19 février 2026 (indexation + 0,9 %)",
    doctrine: "BOI-IR-LIQ-20-10 § 40 (actualité BOFiP du 7 avril 2026)",
    source: "https://www.service-public.gouv.fr/particuliers/actualites/A18045",
    verifieLe: "2026-08-05",
    statut: "confirme",
    note: "Barème applicable en 2026 aux revenus perçus en 2025. Ne pas confondre année de perception et année d'imposition."
  },

  ir_plafond_qf_demi_part: {
    libelle: "Plafond de l'avantage par demi-part supplémentaire (quotient familial)",
    valeur: 1807,
    unite: "€",
    base: "CGI art. 197, I-2",
    doctrine: "BOI-IR-LIQ-20-20-20 (actualité BOFiP du 7 avril 2026)",
    source: "https://www.legifiscal.fr/actualites-fiscales/4474-ir-bareme-2026-quotient-familial-decote.html",
    verifieLe: "2026-08-05",
    statut: "confirme",
    note: "Revenus 2025 (1 791 € pour les revenus 2024). Soit 3 614 € par part entière."
  },

  ir_plafond_qf_parent_isole: {
    libelle: "Plafond de l'avantage de la part entière du 1er enfant (parent isolé)",
    valeur: 4262,
    unite: "€",
    base: "CGI art. 197, I-2",
    doctrine: "BOI-IR-LIQ-20-20-20 (actualité BOFiP du 7 avril 2026)",
    source: "https://www.legifiscal.fr/actualites-fiscales/4474-ir-bareme-2026-quotient-familial-decote.html",
    verifieLe: "2026-08-05",
    statut: "confirme",
    note: "Revenus 2025 (4 224 € pour 2024). Non intégré au simulateur IR (cas « parent isolé » non traité)."
  },

  ir_plafond_qf_veuf_seul: {
    libelle: "Plafond de la demi-part « personne seule ayant élevé un enfant ≥ 5 ans »",
    valeur: 1079,
    unite: "€",
    base: "CGI art. 197, I-2",
    doctrine: "BOI-IR-LIQ-20-20-20 (actualité BOFiP du 7 avril 2026)",
    source: "https://www.legifiscal.fr/actualites-fiscales/4474-ir-bareme-2026-quotient-familial-decote.html",
    verifieLe: "2026-08-05",
    statut: "confirme",
    note: "Revenus 2025 (1 069 € pour 2024). Non intégré au simulateur IR."
  },

  ir_parts: {
    libelle: "Nombre de parts de quotient familial (cas généraux)",
    valeur: { celibataire: 1, couple: 2, deuxPremiersEnfants: 0.5, aPartirDuTroisieme: 1 },
    format: "parts",
    base: "CGI art. 194, I",
    doctrine: "BOI-IR-LIQ-10-20-20-10",
    source: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033817781",
    verifieLe: "2026-08-05",
    statut: "confirme",
    note: "Chacun des deux premiers enfants ouvre droit à 0,5 part, chaque enfant à partir du troisième à 1 part entière. Cas particuliers non couverts : garde alternée (0,25 part), parent isolé, invalidité, ancien combattant (CGI art. 195)."
  },

  ir_decote: {
    libelle: "Décote sur l'impôt brut",
    valeur: {
      seuilCelibataire: 1982,
      seuilCouple: 3277,
      forfaitCelibataire: 897,
      forfaitCouple: 1483,
      taux: 0.4525
    },
    base: "CGI art. 197, I-4",
    doctrine: "Actualité BOFiP du 7 avril 2026",
    source: "https://www.legifiscal.fr/actualites-fiscales/4474-ir-bareme-2026-quotient-familial-decote.html",
    verifieLe: "2026-08-05",
    statut: "confirme",
    note: "Décote = forfait − (45,25 % × impôt brut), applicable si l'impôt brut est inférieur au seuil. Attention : le seuil de déclenchement (1 982 / 3 277 €) n'est PAS le forfait de la formule (897 / 1 483 €)."
  },

  /* ------------------------------------------- Prélèvements sociaux / PFU --- */
  ps_taux_standard: {
    libelle: "Prélèvements sociaux sur les revenus du capital — taux standard",
    valeur: 0.186,
    detail: { csg: 0.106, crds: 0.005, solidarite: 0.075 },
    base: "CSS art. L. 136-8, I-2° (CSG 10,6 %, portée par l'art. 12 de la LOI n° 2025-1403 du 30 décembre 2025) · ordonnance n° 96-50 du 24 janvier 1996, art. 19 (CRDS) · CGI art. 235 ter, III (prélèvement de solidarité)",
    doctrine: null,
    source: "https://www.banquetransatlantique.com/fr/actualites/loi-de-financement-de-la-securite-sociale-pour-2026-hausse-de-la-CSG.html",
    verifieLe: "2026-08-05",
    statut: "confirme",
    note: "En vigueur depuis le 1er janvier 2026 (17,2 % de 2018 à 2025). ATTENTION : au 30 mai 2026, la doctrine BOFiP n'avait pas encore intégré ce taux — c'est le texte légal qui s'applique. À reconfirmer lors de la mise à jour du BOFiP."
  },

  ps_taux_maintenu: {
    libelle: "Prélèvements sociaux — taux maintenu à 17,2 % (catégories dérogatoires)",
    valeur: 0.172,
    categories: [
      "Assurance-vie et contrat de capitalisation",
      "PEL et CEL (régime post-2018)",
      "PEP",
      "Plus-value professionnelle à long terme",
      "Revenus fonciers de location nue",
      "Plus-values immobilières des particuliers"
    ],
    base: "CSS art. L. 136-8, IV (rétabli par l'art. 12 de la LOI n° 2025-1403) · CSS art. L. 136-6 non modifié pour le foncier nu et les plus-values immobilières",
    doctrine: null,
    source: "https://www.hagnere-patrimoine.fr/guides-patrimoine/comment-payer-moins-impots/lfss-2026-article-12-prelevements-sociaux",
    verifieLe: "2026-08-05",
    statut: "divergence",
    note: "Les quatre premières catégories relèvent du IV de L. 136-8 ; le foncier nu et les plus-values immobilières restent à 17,2 % parce que L. 136-6 n'a pas été modifié sur ces points. DIVERGENCE : certaines sources secondaires classent à tort le foncier nu et les plus-values immobilières à 18,6 %. Doctrine BOFiP non encore publiée — à revérifier."
  },

  pfu_part_ir: {
    libelle: "Part « impôt sur le revenu » du prélèvement forfaitaire unique",
    valeur: 0.128,
    base: "CGI art. 200 A, 1-A",
    doctrine: null,
    source: "https://www.victorisavocat.com/blog/flat-tax-le-guide-complet-pour-les-dirigeants-et-investisseurs-en-2026",
    verifieLe: "2026-08-05",
    statut: "confirme",
    note: "Inchangée depuis 2018."
  },

  pfu_global: {
    libelle: "PFU (flat tax) global",
    valeur: { standard: 0.314, categoriesMaintenues: 0.30 },
    base: "CGI art. 200 A + CSS art. L. 136-8",
    doctrine: null,
    source: "https://www.banquetransatlantique.com/fr/actualites/loi-de-financement-de-la-securite-sociale-pour-2026-hausse-de-la-CSG.html",
    verifieLe: "2026-08-05",
    statut: "confirme",
    note: "31,4 % = 12,8 + 18,6 (dividendes, intérêts, plus-values mobilières, crypto…). 30 % = 12,8 + 17,2 pour les catégories restées à 17,2 % de prélèvements sociaux."
  },

  csg_deductible: {
    libelle: "Fraction de CSG déductible du revenu global",
    valeur: 0.068,
    base: "CGI art. 154 quinquies",
    doctrine: null,
    source: "https://www.hagnere-patrimoine.fr/guides-patrimoine/comment-payer-moins-impots/lfss-2026-article-12-prelevements-sociaux",
    verifieLe: "2026-08-05",
    statut: "confirme",
    note: "Inchangée malgré la hausse de la CSG : les 1,4 point supplémentaires ne sont pas déductibles. Déductible du revenu imposable de l'année suivante, et uniquement lorsque le revenu est soumis au barème progressif (jamais avec le PFU)."
  },

  dividendes_abattement: {
    libelle: "Abattement sur les dividendes (option pour le barème progressif)",
    valeur: 0.40,
    base: "CGI art. 158, 3-2°",
    doctrine: null,
    source: "https://www.victorisavocat.com/blog/flat-tax-le-guide-complet-pour-les-dirigeants-et-investisseurs-en-2026",
    verifieLe: "2026-08-05",
    statut: "confirme",
    note: "N'existe QUE sur option globale pour le barème (case 2OP). Aucun abattement avec le PFU."
  },

  /* ----------------------------------------------- Plus-values immobilières --- */
  pvimmo_taux_ir: {
    libelle: "Taux d'imposition de la plus-value immobilière (impôt sur le revenu)",
    valeur: 0.19,
    base: "CGI art. 200 B",
    doctrine: "BOI-RFPI-PVI",
    source: "https://www.hagnere-patrimoine.fr/guides-patrimoine/comment-payer-moins-impots/plus-value-immobiliere-2026",
    verifieLe: "2026-08-05",
    statut: "confirme",
    note: "Prélèvement libératoire, non soumis au barème. Total avec PS : 36,2 %."
  },

  pvimmo_abattement_ir: {
    libelle: "Abattement pour durée de détention — impôt sur le revenu",
    valeur: { debutAnnee: 6, tauxCourant: 0.06, anneeFinale: 22, tauxFinal: 0.04, exonerationA: 22 },
    base: "CGI art. 150 VC, I",
    doctrine: "BOI-RFPI-PVI-20-20",
    source: "https://www.hagnere-patrimoine.fr/guides-patrimoine/comment-payer-moins-impots/plus-value-immobiliere-2026",
    verifieLe: "2026-08-05",
    statut: "confirme",
    note: "6 % par an de la 6e à la 21e année, 4 % la 22e année, exonération totale au-delà de 22 ans. La réforme dite « des 17 ans » n'a pas été adoptée dans la LF 2026."
  },

  pvimmo_abattement_ps: {
    libelle: "Abattement pour durée de détention — prélèvements sociaux",
    valeur: {
      debutAnnee: 6, tauxCourant: 0.0165, anneeIntermediaire: 22, tauxIntermediaire: 0.016,
      tauxFinal: 0.09, exonerationA: 30
    },
    base: "CGI art. 150 VC, I",
    doctrine: "BOI-RFPI-PVI-20-20",
    source: "https://www.hagnere-patrimoine.fr/guides-patrimoine/comment-payer-moins-impots/plus-value-immobiliere-2026",
    verifieLe: "2026-08-05",
    statut: "confirme",
    note: "1,65 % par an de la 6e à la 21e année, 1,60 % la 22e année, 9 % par an de la 23e à la 30e année, exonération totale au-delà de 30 ans."
  },

  pvimmo_forfait_frais_acquisition: {
    libelle: "Forfait de frais d'acquisition majorant le prix d'achat",
    valeur: 0.075,
    base: "CGI art. 150 VB, II-3°",
    doctrine: "BOI-RFPI-PVI-20-10-20-20",
    source: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000051202577",
    verifieLe: "2026-08-05",
    statut: "confirme",
    note: "Option ouverte pour les acquisitions à titre onéreux d'immeubles. Alternative : frais réels justifiés."
  },

  pvimmo_forfait_travaux: {
    libelle: "Forfait travaux majorant le prix d'achat",
    valeur: 0.15,
    base: "CGI art. 150 VB, II-4°",
    doctrine: "BOI-RFPI-PVI-20-10-20-20",
    source: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000051202577",
    verifieLe: "2026-08-05",
    statut: "confirme",
    note: "Réservé aux immeubles BÂTIS cédés plus de 5 ans après l'acquisition. Simple faculté ; exclu pour les terrains nus. Non cumulable avec les travaux réels."
  },

  pvimmo_surtaxe: {
    libelle: "Taxe sur les plus-values immobilières élevées (> 50 000 €)",
    valeur: null,
    base: "CGI art. 1609 nonies G",
    doctrine: "BOI-RFPI-TPVIE",
    source: "https://www.legifrance.gouv.fr/codes/id/LEGISCTA000026896904/",
    verifieLe: "2026-08-05",
    statut: "a_verifier",
    note: "Barème progressif de 2 % à 6 % avec mécanismes de lissage aux paliers. Le barème complet n'a PAS été relu tranche par tranche : il n'est donc pas intégré au simulateur, qui sous-estime l'impôt dû au-delà de 50 000 € de plus-value nette. Ne s'applique pas aux terrains à bâtir."
  },

  /* ---------------------------------------------------------------- IS --- */
  is_taux_normal: {
    libelle: "Impôt sur les sociétés — taux normal",
    valeur: 0.25,
    base: "CGI art. 219, I",
    doctrine: "BOI-IS-LIQ-10",
    source: "https://entreprendre.service-public.gouv.fr/vosdroits/F23575",
    verifieLe: "2026-08-05",
    statut: "confirme",
    note: "Taux stabilisé à 25 % depuis 2022."
  },

  is_taux_reduit: {
    libelle: "Impôt sur les sociétés — taux réduit PME",
    valeur: { taux: 0.15, plafondBenefice: 42500, caMax: 10000000, detentionPersonnesPhysiques: 0.75 },
    base: "CGI art. 219, I-b",
    doctrine: "BOI-IS-LIQ-20-20",
    source: "https://entreprendre.service-public.gouv.fr/vosdroits/F23575",
    verifieLe: "2026-08-05",
    statut: "confirme",
    note: "Conditions cumulatives : CA HT ≤ 10 M€, capital entièrement libéré, détenu à 75 % au moins par des personnes physiques. Au-delà de 42 500 € de bénéfice : 25 %."
  },

  /* ----------------------------- transmission, épargne, patrimoine --- */
  succession_abattement_enfant: {
    libelle: "Abattement en ligne directe (par parent et par enfant)",
    valeur: 100000, unite: "€",
    base: "CGI art. 779, I", doctrine: null,
    source: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000026292566",
    verifieLe: "2026-08-16", statut: "confirme",
    note: "Abattement individuel : par enfant ET par parent. Rappel fiscal 15 ans (CGI art. 784). Non revalorisé depuis 2011, gelé jusqu'au 31/12/2028."
  },
  succession_abattement_handicap: {
    libelle: "Abattement supplémentaire pour héritier handicapé",
    valeur: 159325, unite: "€",
    base: "CGI art. 779, II", doctrine: null,
    source: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000026292566",
    verifieLe: "2026-08-16", statut: "confirme",
    note: "Cumulable avec l'abattement de lien de parenté (enfant handicapé : 100 000 + 159 325 = 259 325 €)."
  },
  succession_bareme_ligne_directe: {
    libelle: "Barème des droits de succession en ligne directe",
    valeur: [
      { jusqua: 8072, taux: 0.05 },
      { jusqua: 12109, taux: 0.10 },
      { jusqua: 15932, taux: 0.15 },
      { jusqua: 552324, taux: 0.20 },
      { jusqua: 902838, taux: 0.30 },
      { jusqua: 1805677, taux: 0.40 },
      { jusqua: Infinity, taux: 0.45 }
    ],
    base: "CGI art. 777, Tableau I", doctrine: "BOI-ENR-DMTG-10-50-30",
    source: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000030061736",
    verifieLe: "2026-08-16", statut: "confirme",
    note: "Barème marginal appliqué à la part nette taxable APRÈS abattement. 7 tranches, gelées jusqu'au 31/12/2028. Tableaux II (époux/PACS) et III (collatéraux/non-parents) non inclus."
  },
  av_abattement_rachat: {
    libelle: "Abattement annuel sur les rachats d'assurance-vie après 8 ans",
    valeur: { celibataire: 4600, couple: 9200 }, unite: "€",
    base: "CGI art. 125-0 A, I-1° quater", doctrine: "BOI-RPPM-RCM-20-10-20-50",
    source: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044989424",
    verifieLe: "2026-08-16", statut: "confirme",
    note: "S'applique sur la seule part de gains du rachat (jamais le capital), contrats > 8 ans. PS 17,2 % maintenus sur l'AV. Réf. service-public F22414."
  },
  av_990i: {
    libelle: "Transmission AV — capitaux décès, primes versées avant 70 ans",
    valeur: { abattementParBeneficiaire: 152500, taux1: 0.20, seuilTaux2: 700000, taux2: 0.3125 },
    unite: "€",
    base: "CGI art. 990 I", doctrine: "BOI-TCAS-AUT-60",
    source: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047288653",
    verifieLe: "2026-08-16", statut: "confirme",
    note: "152 500 € par bénéficiaire (tous contrats du même assuré). Au-delà : 20 % ≤ 700 000 €, 31,25 % au-delà. Vérifié sur le texte Légifrance de l'art. 990 I."
  },
  av_757b: {
    libelle: "Transmission AV — primes versées après 70 ans",
    valeur: { abattementGlobal: 30500 }, unite: "€",
    base: "CGI art. 757 B", doctrine: null,
    source: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047288569",
    verifieLe: "2026-08-16", statut: "confirme",
    note: "Abattement global 30 500 € réparti entre TOUS les bénéficiaires. Porte sur les seules primes après 70 ans ; intérêts exonérés. Au-delà : barème succession."
  },
  pea_plafond: {
    libelle: "Plafond de versement du PEA",
    valeur: { peaClassique: 150000, cumulAvecPeaPme: 225000, peaJeune: 20000 }, unite: "€",
    base: "CoMoFi art. L. 221-30 (PEA) et L. 221-32-1 (PEA-PME, cumul)", doctrine: null,
    source: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038591630",
    verifieLe: "2026-08-16", statut: "confirme",
    note: "Versements nets. Cumul PEA + PEA-PME ≤ 225 000 €. PS sur gains de PEA à 18,6 % depuis le 01/01/2026 (LFSS 2026). Plafond du PEA-PME seul fixé à 225 000 € (CoMoFi art. L. 221-32-1) ; le cumul PEA classique + PEA-PME ne peut excéder 225 000 €."
  },
  microfoncier: {
    libelle: "Micro-foncier : plafond de recettes et abattement",
    valeur: { plafondRecettes: 15000, abattement: 0.30 }, unite: "€",
    base: "CGI art. 32", doctrine: "BOI-RFPI-DECLA-10",
    source: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000048847610",
    verifieLe: "2026-08-16", statut: "confirme",
    note: "Location NUE. 15 000 € de revenu BRUT foncier, abattement 30 % (relèvement à 50 % non abouti). Distinct du micro-BIC."
  },
  ifi_seuil_bareme: {
    libelle: "Seuil d'assujettissement et barème de l'IFI",
    valeur: {
      seuilAssujettissement: 1300000,
      bareme: [
        { jusqua: 800000, taux: 0.00 },
        { jusqua: 1300000, taux: 0.005 },
        { jusqua: 2570000, taux: 0.007 },
        { jusqua: 5000000, taux: 0.01 },
        { jusqua: 10000000, taux: 0.0125 },
        { jusqua: Infinity, taux: 0.015 }
      ]
    },
    base: "CGI art. 964 (seuil) et art. 977, 1 (barème)", doctrine: "BOI-PAT-IFI-40-10",
    source: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036385041",
    verifieLe: "2026-08-16", statut: "confirme",
    note: "Redevable si patrimoine immo net > 1 300 000 € au 1er janvier, mais barème dès 800 000 €. Inchangé LF 2026. Abattement 30 % RP (art. 973), plafonnement 75 % (art. 979)."
  },
  ifi_decote: {
    libelle: "Décote IFI (lissage de l'entrée dans le barème)",
    valeur: { forfait: 17500, taux: 0.0125, seuilBas: 1300000, seuilHaut: 1400000 },
    base: "CGI art. 977, 2", doctrine: "BOI-PAT-IFI-40-10",
    source: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036385041",
    verifieLe: "2026-08-16", statut: "confirme",
    note: "Décote = 17 500 € − (1,25 % × P) pour 1 300 000 ≤ P < 1 400 000 €. S'annule à 1 400 000 €."
  },

  /* ------------------------------------------------------- À VÉRIFIER --- */
  /* Ces paramètres sont attendus par le site mais n'ont PAS encore été vérifiés
     dans les conditions du protocole (deux sources concordantes dont une
     officielle, barèmes relus ligne par ligne). Ils restent à null : la page
     Paramètres les affiche comme « à vérifier » et aucun calcul ne les utilise. */
  microbic_meuble: {
    libelle: "Micro-BIC location meublée : plafonds et abattements",
    valeur: null, base: "CGI art. 50-0", doctrine: null, source: null,
    verifieLe: null, statut: "a_verifier",
    note: "Régime modifié à plusieurs reprises depuis 2024 (meublés de tourisme) : distinguer meublé classique, meublé de tourisme classé et non classé."
  },
  apport_cession: {
    libelle: "Apport-cession : quota et délai de réinvestissement",
    valeur: null, base: "CGI art. 150-0 B ter", doctrine: null, source: null,
    verifieLe: null, statut: "a_verifier",
    note: "La LF 2026 a durci le dispositif (quota et délai relevés, engagement de conservation, exclusion de certains remplois) pour les cessions à compter d'une date à confirmer. À vérifier directement dans le texte de loi avant toute publication."
  }
};

/* Helpers -------------------------------------------------------------- */
export const estUtilisable = (k) => P[k] && P[k].statut !== "a_verifier" && P[k].valeur !== null;

export function exiger(k) {
  if (!estUtilisable(k)) {
    throw new Error(`Paramètre « ${k} » non vérifié : calcul refusé.`);
  }
  return P[k].valeur;
}

export const STATUTS = {
  confirme: { label: "Vérifié", classe: "ok" },
  divergence: { label: "Sources divergentes", classe: "warn" },
  a_verifier: { label: "À vérifier", classe: "todo" }
};
