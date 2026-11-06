// Vérifie le générateur : node src/modules/abstrait/verif.mjs
import assert from "node:assert/strict";
import {
  genererMatrice, genererSerie, LISTE_NIVEAUX, NOMS,
  valeursPossibles, valeursPossiblesSerie, reponsesPossiblesMotifs, TOUS_COEFFS,
} from "./generateur.js";

const cle = (x) => JSON.stringify(x);
let n = 0;
const types = {};
for (const niveau of LISTE_NIVEAUX) {
  for (let graine = 1; graine <= 500; graine++) {
    for (const gen of [genererMatrice, genererSerie]) {
      const ex = gen(graine, niveau);
      types[ex.type] = (types[ex.type] || 0) + 1;
      assert.equal(ex.cellules.length, ex.type === "serie" ? 5 : 8);
      assert.equal(ex.options.length, 5);
      // 5 options toutes différentes, la bonne est à l'index annoncé
      assert.equal(new Set(ex.options.map(cle)).size, 5);
      assert.deepEqual(ex.options[ex.indexBonne], ex.reponse);
      // une seule option est compatible avec les règles déduites des figures visibles
      let compatibles;
      if (ex.type === "motifs") {
        const poss = reponsesPossiblesMotifs(ex.cellules);
        compatibles = ex.options.filter((o) => poss.includes(o.join("")));
      } else {
        const poss = ex.type === "serie"
          ? valeursPossiblesSerie(ex.cellules)
          : valeursPossibles(ex.cellules.map((fig, k) => ({ i: Math.floor(k / 3), j: k % 3, fig })), { i: 2, j: 2 }, TOUS_COEFFS);
        compatibles = ex.options.filter((o) => NOMS.every((nom) => poss[nom].includes(o[nom])));
      }
      assert.equal(compatibles.length, 1, `${ex.type} ${niveau} graine ${graine} : réponse non unique`);
      // même graine = même exercice
      assert.deepEqual(gen(graine, niveau), ex);
      n++;
    }
  }
}
// le niveau facile n'a jamais de motifs ; les autres en ont
assert.equal(genererMatrice(1, "facile").type, "matrice");
assert.ok(types.motifs > 0, "aucune matrice de motifs générée");
console.log(`OK : ${n} exercices vérifiés`, types);

// ----- dé déplié -----
import { genererDe, vuesPossibles } from "./de.js";
for (let graine = 1; graine <= 500; graine++) {
  const ex = genererDe(graine);
  assert.equal(ex.patron.length, 6);
  assert.equal(new Set(ex.patron.map((p) => p.symbole)).size, 6);
  assert.equal(ex.options.length, 5);
  assert.equal(new Set(ex.options.map((o) => o.join("|"))).size, 5);
  assert.equal(ex.options.filter((o) => ex.valides.has(o.join("|"))).length, 1, `dé graine ${graine} : réponse non unique`);
  assert.ok(ex.valides.has(ex.options[ex.indexBonne].join("|")));
  assert.equal(ex.valides.size, 24); // 24 façons de poser le cube
  assert.deepEqual(genererDe(graine), ex);
}
console.log("OK : 500 dés dépliés vérifiés");

// ----- pliage vérifié sur un patron en croix dont on connaît la réponse à la main -----
import { plier } from "./de.js";
{
  const croix = [[1, 1], [1, 0], [0, 1], [2, 1], [1, 2], [1, 3]]; // centre, haut, gauche, droite, bas, bas du bas
  const noms = ["A", "B", "C", "D", "E", "F"];
  const rep = plier(croix);
  const sym = new Map(croix.map((c, i) => [rep.get(c.join(",")).n.join(","), noms[i]]));
  const vues = vuesPossibles(sym);
  assert.ok(vues.has("B|A|D"), "vu depuis le coin : dessus=B, gauche=A (centre), droite=D");
  assert.ok(!vues.has("B|D|A"), "échanger deux faces donne un cube en miroir : impossible");
  const oppose = (i) => sym.get(rep.get(croix[i].join(",")).n.map((v) => -v).join(","));
  assert.deepEqual([0, 1, 2].map(oppose), ["F", "E", "D"]); // faces opposées : A↔F, B↔E, C↔D
  console.log("OK : pliage vérifié sur un patron en croix");
}

// ----- autres types : intrus, analogie, dés vus sous plusieurs angles, rotation mentale, pliage -----
import {
  genererIntrus, intrusUnique, genererAnalogie, reponsesAnalogie, genererDes3, opposesPossibles,
  genererRotation, classeRotation, genererPliage,
} from "./variete.js";
const json = (x) => JSON.stringify(x);
const compte = {};
for (const niveau of LISTE_NIVEAUX) {
  for (let graine = 1; graine <= 300; graine++) {
    // intrus : une seule figure peut être l'intrus
    let ex = genererIntrus(graine, niveau);
    assert.equal(ex.cellules.length, 5);
    assert.deepEqual(intrusUnique(ex.cellules), [ex.indexBonne], `intrus ${niveau} ${graine}`);
    assert.equal(json(genererIntrus(graine, niveau)), json(ex));
    // analogie : une seule réponse possible parmi les 5
    ex = genererAnalogie(graine, niveau);
    assert.equal(new Set(ex.options.map(json)).size, 5);
    const [A, B, C] = ex.cellules;
    assert.deepEqual(reponsesAnalogie(A, B, C), [json(ex.reponse)], `analogie ${niveau} ${graine}`);
    assert.deepEqual(ex.options[ex.indexBonne], ex.reponse);
    assert.equal(json(genererAnalogie(graine, niveau)), json(ex));
    // dés vus sous plusieurs angles : un seul symbole opposé possible
    ex = genererDes3(graine, niveau);
    assert.equal(ex.options.length, 5);
    assert.ok(!ex.options.includes(ex.cible));
    assert.deepEqual(opposesPossibles(ex.vues, ex.cible), [ex.reponse], `des3 ${niveau} ${graine}`);
    assert.equal(ex.options[ex.indexBonne], ex.reponse);
    assert.equal(json(genererDes3(graine, niveau)), json(ex));
    // rotation : une seule option est le modèle tourné ; les autres non
    ex = genererRotation(graine, niveau);
    const ref = classeRotation(ex.ref);
    assert.equal(ex.options.length, 5);
    assert.equal(new Set(ex.options.map((o) => json(o.map((c) => c.join(",")).sort()))).size, 5);
    assert.deepEqual(ex.options.map((o, i) => i).filter((i) => classeRotation(ex.options[i]) === ref), [ex.indexBonne], `rotation ${niveau} ${graine}`);
    assert.equal(json(genererRotation(graine, niveau)), json(ex));
    // pliage : on recalcule la feuille dépliée autrement (chaque emplacement est suivi à travers les plis)
    ex = genererPliage(graine, niveau);
    const N = ex.N, trous = new Set(ex.trous.map((s) => s.join(",")));
    const attendu = [];
    for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) {
      let p = [x, y];
      for (const pli of ex.plis) if (!pli.keep(p)) p = pli.reflect(p);
      if (trous.has(p.join(","))) attendu.push([x, y]);
    }
    assert.deepEqual(ex.options[ex.indexBonne], attendu, `pliage ${niveau} ${graine}`);
    assert.equal(new Set(ex.options.map(json)).size, 5);
    assert.equal(json(genererPliage(graine, niveau)), json(ex));
    compte[niveau] = (compte[niveau] || 0) + 1;
  }
}
console.log("OK : intrus, analogies, dés (angles), rotations et pliages vérifiés", compte);

// ----- branchement dans l'app : tirage d'une session et images des réponses -----
import { tirerSession, FAMILLES } from "./tirage.js";
import { imagesOptions, enonceVisible } from "./rendu.js";
import { NB_QUESTIONS } from "./config.js";
for (const niveau of LISTE_NIVEAUX) {
  for (const famille of ["tous", ...FAMILLES.map((f) => f.id)]) {
    const session = tirerSession(niveau, famille);
    assert.equal(session.length, NB_QUESTIONS);
    assert.equal(new Set(session.map((q) => q.id)).size, NB_QUESTIONS, "ids en double");
    for (const q of session) {
      const ex = q.exercice;
      assert.ok(ex.indexBonne >= 0 && ex.indexBonne <= 4);
      const images = imagesOptions(ex);
      assert.equal(images.length, 5);
      assert.ok(images.every((s) => s.startsWith("<svg")), `${q.famille} : image de réponse invalide`);
      assert.ok(typeof enonceVisible(ex) === "string");
      assert.ok(ex.explication.length > 10);
    }
    if (famille === "tous") assert.equal(new Set(session.map((q) => q.famille)).size, FAMILLES.length, "toutes les familles doivent apparaître");
    else assert.ok(session.every((q) => q.famille === famille));
  }
}
console.log("OK : tirage de session vérifié (4 niveaux × 9 choix de type)");
