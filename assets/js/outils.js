/* outils.js — trois simulateurs. Chaque résultat est décomposé étape par étape
   et porte le cartouche des paramètres utilisés. */
import { chrome, $, eur, eur2, pct, sourceTag, alerte, millesime } from "./ui.js";
import { impotRevenu, dividendes, plusValueImmo } from "./calculs.js";
import { P } from "./params.js";

chrome();

$("#app").innerHTML = `
  <div class="lede">
    <p class="eyebrow">Simulateurs</p>
    <p class="h">Trois calculs, montrés étape par étape</p>
    <p>Ces outils servent à comprendre la mécanique, pas à produire une déclaration.
       Ils ne traitent que les cas généraux : les situations particulières sont signalées
       sous chaque résultat. Pour un chiffre officiel, utilisez le simulateur de la DGFiP.</p>
  </div>

  <!-- ------------------------------------------------------------- IR -->
  <section class="card" id="sec-ir">
    <p class="eyebrow">Simulateur 1</p>
    <h2 style="margin-top:0">Impôt sur le revenu</h2>
    <p>Barème progressif appliqué au quotient familial, plafonnement de l'avantage lié aux
       enfants, puis décote.</p>
    <div class="form-grid">
      <div>
        <label for="ir-rni">Revenu net imposable du foyer
          <span class="hint">Après abattement de 10 % et charges déductibles</span></label>
        <input type="number" id="ir-rni" value="45000" min="0" step="100">
      </div>
      <div>
        <label for="ir-sit">Situation</label>
        <select id="ir-sit">
          <option value="0">Célibataire, divorcé ou veuf</option>
          <option value="1">Marié ou pacsé (imposition commune)</option>
        </select>
      </div>
      <div>
        <label for="ir-enf">Enfants à charge exclusive</label>
        <input type="number" id="ir-enf" value="0" min="0" max="10" step="1">
      </div>
    </div>
    <button class="btn" id="ir-go" style="margin-top:12px">Calculer l'impôt</button>
    <div id="ir-out"></div>
  </section>

  <!-- ----------------------------------------------------- Dividendes -->
  <section class="card" id="sec-div">
    <p class="eyebrow">Simulateur 2</p>
    <h2 style="margin-top:0">Dividendes : flat tax ou barème ?</h2>
    <p>L'option pour le barème est globale et annuelle : elle vaut pour l'ensemble des revenus
       de capitaux mobiliers du foyer. Ce comparateur ne traite qu'un dividende isolé.</p>
    <div class="form-grid">
      <div>
        <label for="dv-brut">Dividende brut perçu</label>
        <input type="number" id="dv-brut" value="20000" min="0" step="100">
      </div>
      <div>
        <label for="dv-tmi">Taux marginal d'imposition du foyer
          <span class="hint">Celui qui s'appliquerait au dividende</span></label>
        <select id="dv-tmi">
          <option value="0">0 %</option>
          <option value="0.11">11 %</option>
          <option value="0.30" selected>30 %</option>
          <option value="0.41">41 %</option>
          <option value="0.45">45 %</option>
        </select>
      </div>
    </div>
    <button class="btn" id="dv-go" style="margin-top:12px">Comparer</button>
    <div id="dv-out"></div>
  </section>

  <!-- ------------------------------------------------ Plus-value immo -->
  <section class="card" id="sec-pv">
    <p class="eyebrow">Simulateur 3</p>
    <h2 style="margin-top:0">Plus-value immobilière</h2>
    <p>Résidence secondaire ou bien locatif. La résidence principale est exonérée et n'a pas
       à être simulée.</p>
    <div class="form-grid">
      <div><label for="pv-vente">Prix de vente</label>
        <input type="number" id="pv-vente" value="290000" min="0" step="1000"></div>
      <div><label for="pv-fv">Frais supportés par le vendeur
          <span class="hint">Diagnostics, mainlevée…</span></label>
        <input type="number" id="pv-fv" value="0" min="0" step="100"></div>
      <div><label for="pv-achat">Prix d'achat</label>
        <input type="number" id="pv-achat" value="180000" min="0" step="1000"></div>
      <div><label for="pv-annees">Années de détention
          <span class="hint">Révolues, de date à date</span></label>
        <input type="number" id="pv-annees" value="14" min="0" max="60" step="1"></div>
      <div><label for="pv-travaux">Travaux justifiés
          <span class="hint">Laisser vide pour le forfait légal</span></label>
        <input type="number" id="pv-travaux" placeholder="forfait" min="0" step="1000"></div>
      <div><label for="pv-frais">Frais d'acquisition réels
          <span class="hint">Laisser vide pour le forfait légal</span></label>
        <input type="number" id="pv-frais" placeholder="forfait" min="0" step="1000"></div>
    </div>
    <label class="check"><input type="checkbox" id="pv-bati" checked>
      <span>Immeuble bâti (condition du forfait travaux)</span></label>
    <button class="btn" id="pv-go" style="margin-top:12px">Calculer la plus-value</button>
    <div id="pv-out"></div>
  </section>`;

const lignes = arr => `<ul class="steps">${arr.map(([l, v, cls]) =>
  `<li class="${cls || ""}"><span class="lbl">${l}</span><span class="val">${v}</span></li>`).join("")}</ul>`;

const bloc = (titre, valeur, corps, sources, notes = "") => `
  <div class="result">
    <div class="head"><span class="k">${titre}</span><span class="v">${valeur}</span></div>
    ${corps}
  </div>${notes}${sources}${sources ? millesime() : ""}`;

/* ------------------------------------------------------------------ IR --- */
$("#ir-go").onclick = () => {
  const rni = Number($("#ir-rni").value) || 0;
  const couple = $("#ir-sit").value === "1";
  const enfants = Math.max(0, Number($("#ir-enf").value) || 0);
  const r = impotRevenu(rni, couple, enfants);

  const l = [
    ["Nombre de parts", r.parts.toLocaleString("fr-FR")],
    ["Quotient familial (revenu ÷ parts)", eur(r.quotient)],
    ["Impôt calculé avec les parts", eur2(r.impotAvecParts)]
  ];
  if (enfants > 0) {
    l.push(["Impôt sans les enfants à charge", eur2(r.impotSansEnfants)]);
    l.push(["Avantage procuré par les enfants", eur2(r.avantage)]);
    l.push([`Plafond de l'avantage (${(r.plafond / P.ir_plafond_qf_demi_part.valeur)} demi-parts)`, eur2(r.plafond)]);
    l.push([r.plafonne ? "Avantage plafonné : impôt retenu" : "Avantage non plafonné", eur2(r.impotBrut)]);
  }
  l.push(["Impôt brut", eur2(r.impotBrut)]);
  l.push(["Décote", r.decote > 0 ? "− " + eur2(r.decote) : "aucune"]);
  l.push(["Impôt net", eur2(r.net), "total"]);
  l.push(["Taux marginal", pct(r.tmi)]);
  l.push(["Taux moyen", pct(r.tauxMoyen)]);

  $("#ir-out").innerHTML = bloc("Impôt net dû", eur(r.net), lignes(l),
    sourceTag("ir_bareme", "ir_parts", "ir_plafond_qf_demi_part", "ir_decote"),
    alerte(`<b>Ce que ce calcul ne fait pas.</b> Il ignore les réductions et crédits d'impôt,
      la contribution exceptionnelle sur les hauts revenus, les revenus soumis au PFU, et les
      situations particulières (parent isolé, garde alternée, invalidité, ancien combattant),
      qui relèvent de l'article 195 du CGI et de plafonds spécifiques.`));
};

/* ---------------------------------------------------------- Dividendes --- */
$("#dv-go").onclick = () => {
  const brut = Number($("#dv-brut").value) || 0;
  const t = Number($("#dv-tmi").value);
  const r = dividendes(brut, t);
  const mieux = r.gagnant === "bareme" ? "Le barème" : "Le PFU";

  $("#dv-out").innerHTML = bloc(
    "Option la moins coûteuse", `${mieux} · ${eur(r.ecart)} d'écart`,
    lignes([
      ["Prélèvements sociaux (identiques dans les deux cas)", eur2(r.ps)],
      ["PFU — impôt sur le revenu (12,8 %)", eur2(r.pfu.ir)],
      ["PFU — coût total", eur2(r.pfu.total)],
      ["PFU — taux effectif", pct(r.pfu.taux)],
      ["Barème — base après abattement de 40 %", eur2(r.bareme.base)],
      [`Barème — impôt au taux marginal de ${pct(t)}`, eur2(r.bareme.ir)],
      ["Barème — économie liée à la CSG déductible (année suivante)", "− " + eur2(r.bareme.economieCsg)],
      ["Barème — coût total", eur2(r.bareme.total)],
      ["Barème — taux effectif", pct(r.bareme.taux)],
      [`Avantage de l'option « ${r.gagnant === "bareme" ? "barème" : "PFU"} »`, eur2(r.ecart), "total"]
    ]),
    sourceTag("pfu_part_ir", "ps_taux_standard", "dividendes_abattement", "csg_deductible"),
    alerte(`<b>Deux approximations à connaître.</b> L'économie liée à la CSG déductible est
      obtenue l'année suivante et au taux marginal de cette année-là, qui peut différer.
      Par ailleurs l'option pour le barème (case 2OP) est <em>globale</em> : elle emporte tous
      les revenus de capitaux mobiliers et plus-values du foyer, alors que ce comparateur
      raisonne sur un dividende isolé.`));
};

/* ---------------------------------------------------- Plus-value immo --- */
$("#pv-go").onclick = () => {
  const vide = s => $(s).value === "" ? null : Number($(s).value);
  const r = plusValueImmo({
    prixCession: Number($("#pv-vente").value) || 0,
    fraisVente: Number($("#pv-fv").value) || 0,
    prixAcquisition: Number($("#pv-achat").value) || 0,
    fraisAcquisition: vide("#pv-frais"),
    travaux: vide("#pv-travaux"),
    annees: Math.max(0, Number($("#pv-annees").value) || 0),
    bati: $("#pv-bati").checked
  });

  if (r.nulle) {
    $("#pv-out").innerHTML = bloc("Résultat", "Aucune plus-value",
      lignes([
        ["Prix de cession net", eur2(r.cession)],
        ["Prix d'acquisition corrigé", eur2(r.acquisition)],
        ["Résultat", eur2(r.brute), "total"]
      ]), "",
      alerte(`<b>Moins-value.</b> Une moins-value immobilière n'est en principe ni imputable
        ni reportable (CGI art. 150 VD).`));
    return;
  }

  const notes = [];
  if (r.forfaitFraisApplique) notes.push("forfait de frais d'acquisition de 7,5 % appliqué");
  if (r.forfaitTravauxApplique) notes.push("forfait travaux de 15 % appliqué");

  $("#pv-out").innerHTML = bloc("Impôt total", eur(r.total),
    lignes([
      ["Prix de cession net des frais", eur2(r.cession)],
      ["Frais d'acquisition retenus", eur2(r.frais)],
      ["Travaux retenus", eur2(r.travaux)],
      ["Prix d'acquisition corrigé", eur2(r.acquisition)],
      ["Plus-value brute", eur2(r.brute)],
      ["Abattement pour durée de détention — IR", pct(r.abIR)],
      ["Plus-value nette imposable à l'IR", eur2(r.netteIR)],
      ["Impôt sur le revenu (19 %)", eur2(r.impotIR)],
      ["Abattement pour durée de détention — prélèvements sociaux", pct(r.abPS)],
      ["Plus-value nette soumise aux prélèvements sociaux", eur2(r.nettePS)],
      ["Prélèvements sociaux (17,2 %)", eur2(r.impotPS)],
      ["Impôt total", eur2(r.total), "total"],
      ["Taux effectif sur la plus-value brute", pct(r.tauxEffectif)]
    ]),
    sourceTag("pvimmo_taux_ir", "ps_taux_maintenu", "pvimmo_abattement_ir",
      "pvimmo_abattement_ps", "pvimmo_forfait_frais_acquisition", "pvimmo_forfait_travaux"),
    (notes.length ? alerte(`<b>Forfaits appliqués :</b> ${notes.join(", ")}.`) : "") +
    (r.surtaxeApplicable
      ? alerte(`<b>Résultat incomplet.</b> La plus-value nette imposable dépasse 50 000 € :
          la taxe sur les plus-values élevées (CGI art. 1609 nonies G) est due en plus. Son
          barème n'a pas encore été vérifié tranche par tranche, il n'est donc pas intégré —
          le montant affiché sous-estime l'impôt réellement dû.`)
      : "") +
    alerte(`<b>Hors champ de ce calcul.</b> Exonérations (résidence principale, cession
      inférieure à 15 000 €, retraités sous conditions), abattements exceptionnels en zone
      tendue, régime des non-résidents, biens détenus en LMNP avec réintégration des
      amortissements, et cessions de terrains à bâtir.`));
};
