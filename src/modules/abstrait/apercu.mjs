// Fabrique une page à ouvrir dans le navigateur pour juger le rendu : node src/modules/abstrait/apercu.mjs
import { writeFileSync } from "node:fs";
import { genererMatrice, genererSerie, LISTE_NIVEAUX } from "./generateur.js";
import { genererDe } from "./de.js";
import { enonceSvg, optionsSvg, questionTexte } from "./rendu.js";
import { genererIntrus, genererAnalogie, genererDes3, genererRotation, genererPliage } from "./variete.js";

const sortie = new URL("../../../../unites/abstrait/apercu.html", import.meta.url);
const blocs = [];
const blocsVar = [];
let num = 1;
for (const niveau of LISTE_NIVEAUX)
  for (const gen of [genererMatrice, genererSerie])
    for (const graine of [11, 12, 13, 14]) {
      const ex = gen(graine, niveau);
      const titre = { matrice: "Matrice 3×3 (caractéristiques)", motifs: "Matrice 3×3 (motifs)", serie: "Série de figures" }[ex.type];
      blocs.push(`<section><h2>${num++}. ${titre} — niveau ${niveau}</h2>
<p>${questionTexte(ex)}</p>${enonceSvg(ex)}<div class="options">${optionsSvg(ex)}</div>
<details><summary>Réponse et explication</summary><p><b>Réponse : ${"ABCDE"[ex.indexBonne]}.</b> ${ex.explication}</p></details></section>`);
    }

const TITRES = { intrus: "Intrus", analogie: "Analogie", des3: "Dé vu sous plusieurs angles", rotation: "Rotation mentale", pliage: "Pliage et perçage" };
let numVar = 1;
for (const gen of [genererIntrus, genererAnalogie, genererDes3, genererRotation, genererPliage])
  for (const niveau of LISTE_NIVEAUX) {
    const ex = gen(31, niveau);
    blocsVar.push(`<section><h2>${numVar++}. ${TITRES[ex.type]} — niveau ${niveau}</h2><p>${questionTexte(ex)}</p>${enonceSvg(ex)}<div class="options">${optionsSvg(ex)}</div>
<details><summary>Réponse et explication</summary><p><b>Réponse : ${"ABCDE"[ex.indexBonne]}.</b> ${ex.explication}</p></details></section>`);
  }

for (const graine of [21, 22, 23, 24]) {
  const ex = genererDe(graine);
  blocs.push(`<section><h2>${num++}. Dé déplié</h2><p>Quel cube obtient-on en pliant ce patron ?</p>${enonceSvg(ex)}<div class="options">${optionsSvg(ex)}</div>
<details><summary>Réponse et explication</summary><p><b>Réponse : ${"ABCDE"[ex.indexBonne]}.</b> ${ex.explication}</p></details></section>`);
}

const page = (titre, intro, corps) => `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titre}</title>
<style>
:root{color:#1c2430;background:#f6f7f9;--abs-fond:#f6f7f9}
@media (prefers-color-scheme:dark){:root{color:#e6e9ee;background:#14181f;--abs-fond:#14181f}}
body{font-family:system-ui,sans-serif;max-width:760px;margin:0 auto;padding:16px}
section{border:1px solid currentColor;border-color:#8884;border-radius:14px;padding:12px 16px;margin:16px 0}
h2{font-size:1rem;margin:.2em 0}
.grille{display:grid;gap:6px;margin:8px 0}
.patron{margin:8px 0}
.options{display:flex;flex-wrap:wrap;gap:10px;margin:10px 0}
.option{display:flex;flex-direction:column;align-items:center;gap:2px}
</style><h1>${titre}</h1><p>${intro}</p>
${corps.join("\n")}</html>`;

writeFileSync(sortie, page("Aperçu raisonnement abstrait (prototype)", "Exercices générés par programme : 4 matrices et 4 séries par niveau, plus 4 dés dépliés. Clique sur « Réponse » pour voir la correction. Les autres types sont dans apercu-varietes.html.", blocs));
writeFileSync(new URL("../../../../unites/abstrait/apercu-varietes.html", import.meta.url), page("Aperçu des autres types d'abstrait", "Intrus, analogies, dés vus sous plusieurs angles, rotation mentale, pliage et perçage : un exemple par niveau.", blocsVar));
console.log("Aperçus écrits dans unites/abstrait/");
