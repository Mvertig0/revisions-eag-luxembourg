// Autres types d'exercices d'abstrait : intrus, analogies, dés vus sous plusieurs angles,
// rotation mentale, pliage-perçage. Comme pour les matrices, tout est calculé et vérifié par verif.mjs.
import { ATTRIBUTS, NOMS, melanger, tirer, essayer } from "./generateur.js";
import { vuesPossibles, SYMBOLES } from "./de.js";

const entier = (r, n) => Math.floor(r() * n);
const lib = (n, v) => ATTRIBUTS[n].valeurs[v];
const cle = (x) => JSON.stringify(x);
const LETTRES = "ABCDE";

// =============================== 1. INTRUS ===============================
// 5 figures : quatre suivent la même règle, une y échappe. Une seule figure peut être « l'intrus ».
export function genererIntrus(graine, niveau = "moyen") {
  const expert = niveau === "expert";
  const k = { facile: 1, moyen: 2, difficile: 3, expert: 2 }[niveau];
  return essayer((r) => {
    const communs = melanger(r, expert ? ["forme", "remplissage", "rotation"] : NOMS).slice(0, k);
    const val = Object.fromEntries(communs.map((n) => [n, entier(r, 3)]));
    const brisee = tirer(r, [...communs, ...(expert ? ["relation"] : [])]);
    const intrus = entier(r, 5);
    const figs = [];
    for (let i = 0; i < 5; i++) {
      const f = Object.fromEntries(NOMS.map((n) => [n, entier(r, 3)]));
      Object.assign(f, val);
      if (expert) f.taille = f.nombre; // règle de lien : autant de formes que la taille (1 = petite … 3 = grande)
      if (i === intrus) {
        if (brisee === "relation") f.taille = (f.nombre + 1 + entier(r, 2)) % 3;
        else f[brisee] = (val[brisee] + 1 + entier(r, 2)) % 3;
      }
      figs.push(f);
    }
    if (new Set(figs.map(cle)).size < 5) return null;
    if (!intrusUnique(figs).every((i) => i === intrus) || intrusUnique(figs).length !== 1) return null;
    const regles = communs.map((n) => `${ATTRIBUTS[n].nom} est « ${lib(n, val[n])} »`);
    if (expert) regles.push("le nombre de formes correspond à la taille (1 = petite, 2 = moyenne, 3 = grande)");
    const exception = brisee === "relation"
      ? "le nombre de formes ne correspond pas à la taille"
      : `${ATTRIBUTS[brisee].nom} y est « ${lib(brisee, figs[intrus][brisee])} » au lieu de « ${lib(brisee, val[brisee])} »`;
    return {
      type: "intrus", niveau, graine, cellules: figs, indexBonne: intrus,
      explication: `Point commun des quatre autres figures : ${regles.join(" ; ")}. La figure ${LETTRES[intrus]} fait exception : ${exception}.`,
    };
  }, graine);
}

// Toutes les « règles de quatre contre un » qu'on peut lire dans ces 5 figures → indices des intrus possibles.
export function intrusUnique(figs) {
  const sorties = new Set();
  for (const n of NOMS)
    for (let v = 0; v < 3; v++) {
      const t = figs.map((f) => f[n] === v);
      if (t.filter(Boolean).length === 4) sorties.add(t.indexOf(false));
    }
  for (let a = 0; a < NOMS.length; a++)
    for (let b = a + 1; b < NOMS.length; b++) {
      const t = figs.map((f) => f[NOMS[a]] === f[NOMS[b]]);
      if (t.filter(Boolean).length === 4) sorties.add(t.indexOf(false));
    }
  return [...sorties];
}

// =============================== 2. ANALOGIES ===============================
// A est à B ce que C est à ? — transformations d'un motif de 9 emplacements (comme les matrices de motifs).
const POS = {
  flipH: (r, c) => [r, 2 - c],
  flipV: (r, c) => [2 - r, c],
  rot90: (r, c) => [c, 2 - r],
  rot180: (r, c) => [2 - r, 2 - c],
  rot270: (r, c) => [2 - c, r],
  transpose: (r, c) => [c, r],
  shiftR: (r, c) => [r, (c + 1) % 3],
  shiftD: (r, c) => [(r + 1) % 3, c],
};
const TEXTE_T = {
  flipH: "symétrie gauche-droite", flipV: "symétrie haut-bas", rot90: "quart de tour dans le sens des aiguilles",
  rot180: "demi-tour", rot270: "quart de tour dans le sens inverse des aiguilles", transpose: "symétrie selon la diagonale",
  shiftR: "décalage d'une colonne vers la droite (la dernière revient à gauche)",
  shiftD: "décalage d'une ligne vers le bas (la dernière revient en haut)",
  inversion: "inversion (les carrés pleins deviennent vides et inversement)",
};
const TOUTES_T = [...Object.keys(POS), "inversion"];
function appliquerT(nom, m) {
  if (nom === "inversion") return m.map((x) => 1 - x);
  const o = Array(9).fill(0);
  m.forEach((v, k) => { if (v) { const [r, c] = POS[nom](Math.floor(k / 3), k % 3); o[r * 3 + c] = 1; } });
  return o;
}
export const chaineT = (noms, m) => noms.reduce((acc, n) => appliquerT(n, acc), m);
export const HYPOTHESES_T = [...TOUTES_T.map((n) => [n]), ...TOUTES_T.flatMap((a) => TOUTES_T.map((b) => [a, b]))];
const BASE_MOYEN = ["flipH", "flipV", "rot180", "inversion", "rot90", "rot270", "transpose"];
const NIV_T = {
  facile: { base: ["flipH", "flipV", "rot180", "inversion"], deux: false },
  moyen: { base: BASE_MOYEN, deux: false },
  difficile: { base: BASE_MOYEN, deux: true },
  expert: { base: TOUTES_T, deux: true },
};
const motifAlea = (r) => {
  const m = Array(9).fill(0);
  melanger(r, [...Array(9).keys()]).slice(0, 3 + entier(r, 3)).forEach((k) => (m[k] = 1));
  return m;
};

// Réponses possibles pour la 4e case, selon toutes les transformations (1 ou 2 étapes) qui expliquent A → B.
export function reponsesAnalogie(A, B, C) {
  return [...new Set(HYPOTHESES_T.filter((h) => cle(chaineT(h, A)) === cle(B)).map((h) => cle(chaineT(h, C))))];
}

export function genererAnalogie(graine, niveau = "moyen") {
  return essayer((r) => {
    const { base, deux } = NIV_T[niveau];
    const noms = deux ? [tirer(r, base), tirer(r, base)] : [tirer(r, base)];
    if (deux && noms[0] === noms[1]) return null;
    const A = motifAlea(r), C = motifAlea(r);
    const B = chaineT(noms, A), D = chaineT(noms, C);
    if (cle(A) === cle(B) || cle(C) === cle(D) || D.every((v) => !v)) return null;
    const poss = reponsesAnalogie(A, B, C);
    if (poss.length !== 1 || poss[0] !== cle(D)) return null;
    const vus = new Set([cle(D)]), opts = [D];
    for (const h of melanger(r, HYPOTHESES_T)) {
      const m = chaineT(h, C);
      if (m.some(Boolean) && !vus.has(cle(m))) { vus.add(cle(m)); opts.push(m); if (opts.length === 5) break; }
    }
    const ordre = melanger(r, opts);
    return {
      type: "analogie", niveau, graine, cellules: [A, B, C], reponse: D, options: ordre, indexBonne: ordre.indexOf(D),
      explication: `De la 1re à la 2e figure : ${noms.map((n) => TEXTE_T[n]).join(", puis ")}. On applique la même transformation à la 3e figure.`,
    };
  }, graine);
}

// =============================== 3. DÉS VUS SOUS PLUSIEURS ANGLES ===============================
const NORMALES = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const permutations = (t) => (t.length <= 1 ? [t] : t.flatMap((x, i) => permutations([...t.slice(0, i), ...t.slice(i + 1)]).map((p) => [x, ...p])));
// Les 720 façons de répartir les 6 symboles sur les faces, avec les vues que chacune permet.
const CUBES = permutations([0, 1, 2, 3, 4, 5]).map((p) => {
  const map = new Map(NORMALES.map((n, i) => [n.join(","), SYMBOLES[p[i]]]));
  return { map, vues: vuesPossibles(map) };
});
const opposeDe = (cube, s) => {
  const [n] = [...cube.map].find(([, x]) => x === s);
  return cube.map.get(n.split(",").map((v) => -v).join(","));
};
// Symboles opposés possibles à `cible`, compte tenu des vues montrées (un seul si l'exercice est valide).
export function opposesPossibles(vues, cible) {
  const chaines = vues.map((v) => v.join("|"));
  return [...new Set(CUBES.filter((c) => chaines.every((v) => c.vues.has(v))).map((c) => opposeDe(c, cible)))];
}

export function genererDes3(graine, niveau = "moyen") {
  const nbVues = niveau === "facile" ? 3 : 2;
  return essayer((r) => {
    const vrai = CUBES[entier(r, CUBES.length)];
    const vues = melanger(r, [...vrai.vues]).slice(0, nbVues).map((v) => v.split("|"));
    const communs = vues[0].filter((s) => vues[1].includes(s)).length;
    if (niveau !== "facile" && communs !== 1) return null; // deux vues qui n'ont qu'une face en commun : il faut raisonner
    const visibles = [...new Set(vues.flat())];
    const candidats = visibles.filter((s) => opposesPossibles(vues, s).length === 1);
    if (!candidats.length) return null;
    const cible = tirer(r, candidats);
    const reponse = opposeDe(vrai, cible);
    const options = melanger(r, SYMBOLES.filter((s) => s !== cible));
    return {
      type: "des3", niveau, graine, vues, cible, reponse, options, indexBonne: options.indexOf(reponse),
      explication: `Sur ce cube, « ${cible} » est opposé à « ${reponse} ». Deux faces vues ensemble sont toujours voisines, jamais opposées : en croisant les vues, il ne reste qu'une possibilité.`,
    };
  }, graine);
}

// =============================== 4. ROTATION MENTALE ===============================
// Quelle forme est la même que le modèle, simplement tournée (et non retournée comme dans un miroir) ?
const cleP = (cells) => cells.map(([r, c]) => r * 10 + c).sort((a, b) => a - b).join(",");
const normP = (cells) => {
  const r0 = Math.min(...cells.map((x) => x[0])), c0 = Math.min(...cells.map((x) => x[1]));
  return cells.map(([r, c]) => [r - r0, c - c0]);
};
const tournerP = (cells) => normP(cells.map(([r, c]) => [c, -r]));
const miroirP = (cells) => normP(cells.map(([r, c]) => [r, -c]));
export function classeRotation(cells) {
  let cur = normP(cells), best = null;
  for (let i = 0; i < 4; i++) { const k = cleP(cur); if (best === null || k < best) best = k; cur = tournerP(cur); }
  return best;
}
const connexe = (cells) => {
  const reste = new Map(cells.map((c) => [c.join(","), c])), pile = [cells[0]];
  reste.delete(cells[0].join(","));
  let n = 1;
  while (pile.length) {
    const [r, c] = pile.pop();
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = [r + dr, c + dc].join(",");
      if (reste.has(k)) { pile.push(reste.get(k)); reste.delete(k); n++; }
    }
  }
  return n === cells.length;
};

export function genererRotation(graine, niveau = "moyen") {
  const { k, g } = { facile: { k: 5, g: 4 }, moyen: { k: 6, g: 4 }, difficile: { k: 7, g: 4 }, expert: { k: 8, g: 5 } }[niveau];
  return essayer((r) => {
    let forme = [[0, 0]];
    while (forme.length < k) {
      const [a, b] = tirer(r, forme), [dr, dc] = tirer(r, [[1, 0], [-1, 0], [0, 1], [0, -1]]);
      const [nr, nc] = [a + dr, b + dc];
      if (nr >= 0 && nc >= 0 && nr < g && nc < g && !forme.some(([x, y]) => x === nr && y === nc)) forme.push([nr, nc]);
    }
    forme = normP(forme);
    const ref = classeRotation(forme);
    if (ref === classeRotation(miroirP(forme))) return null; // forme symétrique : le miroir ne ferait pas un piège
    const tourne = (cells, n) => { let c = cells; for (let i = 0; i < n; i++) c = tournerP(c); return c; };
    const bonne = tourne(forme, 1 + entier(r, 3));
    const opts = [bonne], vus = new Set([cleP(bonne)]);
    const ajouter = (c) => { if (!vus.has(cleP(c))) { vus.add(cleP(c)); opts.push(c); } };
    for (const n of melanger(r, [0, 1, 2, 3]).slice(0, 2)) ajouter(tourne(miroirP(forme), n)); // images en miroir
    for (let t = 0; t < 80 && opts.length < 5; t++) { // formes légèrement modifiées : un carré déplacé
      const c = forme.map((x) => [...x]);
      c.splice(entier(r, c.length), 1);
      const [nr, nc] = [entier(r, g), entier(r, g)];
      if (c.some(([x, y]) => x === nr && y === nc)) continue;
      c.push([nr, nc]);
      if (!connexe(c)) continue;
      const m = normP(c);
      if (Math.max(...m.map((x) => x[0])) >= g || Math.max(...m.map((x) => x[1])) >= g) continue;
      if (classeRotation(m) === ref) continue;
      ajouter(tourne(m, entier(r, 4)));
    }
    if (opts.length < 5) return null;
    const ordre = melanger(r, opts);
    return {
      type: "rotation", niveau, graine, g, ref: forme, options: ordre, indexBonne: ordre.indexOf(bonne),
      explication: "La bonne figure est le modèle simplement tourné. Les images en miroir ne se superposent jamais au modèle, même en le tournant, et les autres ont un carré déplacé.",
    };
  }, graine);
}

// =============================== 5. PLIAGE ET PERÇAGE ===============================
// Une feuille de N×N emplacements est pliée (chaque pli rabat une partie sur l'autre), puis percée.
// Question : à quoi ressemble la feuille dépliée ?
const sk = ([x, y]) => `${x},${y}`;
const trier = (sites) => [...sites].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
const union = (A, B) => trier([...new Map([...A, ...B].map((s) => [sk(s), s])).values()]);

function fabriquerPlis(r, niveau, N) {
  const h = N / 2;
  let region = [];
  for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) region.push([x, y]);
  const plis = [];
  const bornes = (rg) => ({ x0: Math.min(...rg.map((s) => s[0])), x1: Math.max(...rg.map((s) => s[0])), y0: Math.min(...rg.map((s) => s[1])), y1: Math.max(...rg.map((s) => s[1])) });
  const centre = (rg) => [rg.reduce((a, s) => a + s[0] + 0.5, 0) / rg.length, rg.reduce((a, s) => a + s[1] + 0.5, 0) / rg.length];
  const ajouter = (nom, reflect, keep, ligne) => {
    const gardes = region.filter(keep), deplaces = region.filter((s) => !keep(s));
    const [ax, ay] = centre(deplaces), [bx, by] = centre(gardes);
    plis.push({ nom, reflect, keep, ligne, avant: region, fleche: [ax, ay, bx, by] });
    region = gardes;
  };
  const verticalPli = () => { const d = r() < 0.5, b = bornes(region); ajouter("vertical", ([x, y]) => [N - 1 - x, y], ([x]) => (d ? x >= h : x < h), [h, b.y0, h, b.y1 + 1]); };
  const horizontalPli = () => { const d = r() < 0.5, b = bornes(region); ajouter("horizontal", ([x, y]) => [x, N - 1 - y], ([, y]) => (d ? y >= h : y < h), [b.x0, h, b.x1 + 1, h]); };
  const diagonalPli = () => {
    const b = bornes(region), s = b.x1 - b.x0 + 1, sens = r() < 0.5, principale = r() < 0.5;
    if (principale)
      ajouter("diagonal", ([x, y]) => [b.x0 + (y - b.y0), b.y0 + (x - b.x0)], ([x, y]) => (sens ? x - b.x0 <= y - b.y0 : x - b.x0 >= y - b.y0), [b.x0, b.y0, b.x1 + 1, b.y1 + 1]);
    else
      ajouter("diagonal", ([x, y]) => [b.x0 + (s - 1 - (y - b.y0)), b.y0 + (s - 1 - (x - b.x0))], ([x, y]) => (sens ? (x - b.x0) + (y - b.y0) <= s - 1 : (x - b.x0) + (y - b.y0) >= s - 1), [b.x1 + 1, b.y0, b.x0, b.y1 + 1]);
  };
  if (niveau === "facile") tirer(r, [verticalPli, horizontalPli, diagonalPli])();
  else {
    (r() < 0.5 ? [verticalPli, horizontalPli] : [horizontalPli, verticalPli]).forEach((f) => f());
    if (niveau !== "moyen") diagonalPli();
  }
  return { plis, regionFinale: region };
}

// Dépliage : chaque trou se retrouve de l'autre côté de chaque pli (en partant du dernier pli).
export function deplier(trous, plis, saut = -1, rotation = -1) {
  let H = trous;
  for (let i = plis.length - 1; i >= 0; i--) {
    if (i === saut) continue;
    // piège : au lieu de la symétrie du pli, un demi-tour autour du centre de la zone dépliée
    const xs = plis[i].avant.map((s) => s[0]), ys = plis[i].avant.map((s) => s[1]);
    const demiTour = ([x, y]) => [Math.max(...xs) + Math.min(...xs) - x, Math.max(...ys) + Math.min(...ys) - y];
    H = union(H, H.map(i === rotation ? demiTour : plis[i].reflect));
  }
  return H;
}

export function genererPliage(graine, niveau = "moyen") {
  const N = niveau === "expert" ? 6 : 4;
  return essayer((r) => {
    const { plis, regionFinale } = fabriquerPlis(r, niveau, N);
    const nb = { facile: 1 + entier(r, 2), moyen: 1 + entier(r, 2), difficile: 1 + entier(r, 3), expert: 2 + entier(r, 3) }[niveau];
    const trous = trier(melanger(r, regionFinale).slice(0, Math.min(nb, regionFinale.length)));
    const vrai = deplier(trous, plis);
    const tous = [];
    for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) tous.push([x, y]);
    const vus = new Set([cle(vrai)]), opts = [vrai];
    const ajouter = (c) => { if (c.length && !vus.has(cle(c))) { vus.add(cle(c)); opts.push(c); } };
    plis.forEach((_, i) => { ajouter(deplier(trous, plis, i)); ajouter(deplier(trous, plis, -1, i)); });
    for (let t = 0; t < 80 && opts.length < 5; t++) {
      const c = vrai.map((s) => [...s]);
      const mode = entier(r, 3);
      if (mode === 0) c.splice(entier(r, c.length), 1);
      if (mode === 1) c.push(tirer(r, tous));
      if (mode === 2) { c.splice(entier(r, c.length), 1); c.push(tirer(r, tous)); }
      ajouter(trier([...new Map(c.map((s) => [sk(s), s])).values()]));
    }
    if (opts.length < 5) return null;
    const mel = melanger(r, opts.slice(1)).slice(0, 4);
    const ordre = melanger(r, [vrai, ...mel]);
    const etapes = plis.map((p) => ({ region: p.avant, pli: { ligne: p.ligne, fleche: p.fleche } }));
    etapes.push({ region: regionFinale, pli: null, trous });
    const noms = { vertical: "vertical", horizontal: "horizontal", diagonal: "en diagonale" };
    return {
      type: "pliage", niveau, graine, N, etapes, plis, trous, options: ordre, indexBonne: ordre.indexOf(vrai),
      explication: `Chaque trou est répété de l'autre côté de chaque pli (pli${plis.length > 1 ? "s" : ""} ${plis.map((p) => noms[p.nom]).join(", puis ")}). On déplie en commençant par le dernier pli.`,
    };
  }, graine);
}
