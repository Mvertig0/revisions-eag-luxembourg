// Dé déplié : un patron de cube dont chaque face porte un symbole.
// Question : « Quel cube obtient-on en pliant ce patron ? » (3 faces visibles : dessus, gauche, droite).
// Le pliage est calculé en 3D (jamais écrit à la main), donc la bonne réponse est juste par construction.

// Symboles choisis pour rester lisibles quand la face est vue en perspective (pas de losange ni de croix en X).
export const SYMBOLES = ["cercle", "anneau", "carré", "cadre", "croix", "cible"];

// ----- petits outils de géométrie (vecteurs entiers) -----
const neg = (v) => v.map((x) => -x);
const cle = (v) => v.join(",");
const produit = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// Plie le patron (liste de cases [colonne, ligne], ligne vers le bas) vers l'arrière, la 1re case restant face à nous.
// Renvoie, pour chaque case, la normale (direction vers l'extérieur) de la face du cube qu'elle devient.
export function plier(cases) {
  const rep = new Map([[cle(cases[0]), { ex: [1, 0, 0], ey: [0, 1, 0], n: [0, 0, 1] }]]);
  const file = [cases[0]];
  const present = new Set(cases.map(cle));
  while (file.length) {
    const [c, l] = file.shift();
    const { ex, ey, n } = rep.get(cle([c, l]));
    for (const [dc, dl] of [[1, 0], [-1, 0], [0, -1], [0, 1]]) {
      const k = cle([c + dc, l + dl]);
      if (!present.has(k) || rep.has(k)) continue;
      // dc=+1 : arête de droite ; dl=-1 : arête du haut ; etc. La case voisine se rabat vers l'arrière.
      const f = dc === 1 ? { ex: neg(n), ey, n: ex }
        : dc === -1 ? { ex: n, ey, n: neg(ex) }
        : dl === -1 ? { ex, ey: neg(n), n: ey }
        : { ex, ey: n, n: neg(ey) };
      rep.set(k, f);
      file.push([c + dc, l + dl]);
    }
  }
  return rep;
}

// Les 24 rotations du cube (matrices 3×3 entières) : on cherche toutes les façons de poser le cube.
function rotations() {
  const rx = [[1, 0, 0], [0, 0, -1], [0, 1, 0]], ry = [[0, 0, 1], [0, 1, 0], [-1, 0, 0]];
  const mul = (A, B) => A.map((_, i) => B[0].map((_, j) => A[i].reduce((s, _, k) => s + A[i][k] * B[k][j], 0)));
  const vus = new Map([["I", [[1, 0, 0], [0, 1, 0], [0, 0, 1]]]]);
  let frontiere = [...vus.values()];
  while (frontiere.length) {
    const suite = [];
    for (const M of frontiere) for (const G of [rx, ry]) {
      const P = mul(G, M), k = JSON.stringify(P);
      if (!vus.has(k)) { vus.set(k, P); suite.push(P); }
    }
    frontiere = suite;
  }
  return [...vus.values()];
}
const ROTATIONS = rotations();
const applique = (M, v) => M.map((ligne) => ligne[0] * v[0] + ligne[1] * v[1] + ligne[2] * v[2]);
const transposee = (M) => M[0].map((_, j) => M.map((r) => r[j]));

// Toutes les vues « dessus / gauche / droite » possibles du cube (24).
export function vuesPossibles(symboleDeNormale) {
  const vues = new Set();
  for (const R of ROTATIONS) {
    const T = transposee(R);
    const f = (v) => symboleDeNormale.get(cle(applique(T, v)));
    vues.add([f([0, 1, 0]), f([0, 0, 1]), f([1, 0, 0])].join("|")); // dessus | gauche (+z) | droite (+x)
  }
  return vues;
}

// ----- alea (même générateur que generateur.js, recopié pour garder les fichiers indépendants) -----
function alea(graine) {
  let s = graine >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const melanger = (r, tab) => {
  const t = [...tab];
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
};

// Patron au hasard : 6 cases collées, gardé seulement s'il se plie bien en cube (6 faces différentes).
function patronAlea(r) {
  for (;;) {
    const cases = [[0, 0]];
    while (cases.length < 6) {
      const [c, l] = cases[Math.floor(r() * cases.length)];
      const [dc, dl] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(r() * 4)];
      if (!cases.some(([a, b]) => a === c + dc && b === l + dl)) cases.push([c + dc, l + dl]);
    }
    const rep = plier(cases);
    if (new Set([...rep.values()].map((f) => cle(f.n))).size === 6) {
      const c0 = Math.min(...cases.map((x) => x[0])), l0 = Math.min(...cases.map((x) => x[1]));
      return cases.map(([c, l]) => [c - c0, l - l0]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    }
  }
}

export function genererDe(graine) {
  for (let k = 0; k < 100; k++) {
    const r = alea(graine * 1000 + k);
    const patron = patronAlea(r);
    const rep = plier(patron);
    const symboles = melanger(r, SYMBOLES);
    const parCase = patron.map((c, i) => ({ c, symbole: symboles[i] }));
    const symboleDeNormale = new Map(patron.map((c, i) => [cle(rep.get(cle(c)).n), symboles[i]]));
    const valides = vuesPossibles(symboleDeNormale);
    const bonnes = [...valides];
    const bonne = bonnes[Math.floor(r() * bonnes.length)].split("|");

    // mauvaises réponses : 2 faces échangées (cube « en miroir ») ou 2 faces opposées montrées ensemble
    const opposees = [...symboleDeNormale].map(([n, s]) => [s, symboleDeNormale.get(cle(neg(n.split(",").map(Number))))]);
    const options = [bonne];
    const vus = new Set([bonne.join("|")]);
    let essais = 0;
    while (options.length < 5 && essais++ < 500) {
      let t;
      if (r() < 0.6) {
        t = [...bonne];
        const [i, j] = melanger(r, [0, 1, 2]).slice(0, 2);
        [t[i], t[j]] = [t[j], t[i]];
      } else {
        const [p, q] = opposees[Math.floor(r() * 6)];
        const autre = melanger(r, SYMBOLES.filter((s) => s !== p && s !== q))[0];
        t = melanger(r, [p, q, autre]);
      }
      if (valides.has(t.join("|")) || vus.has(t.join("|"))) continue;
      vus.add(t.join("|"));
      options.push(t);
    }
    if (options.length < 5) continue;
    const ordre = melanger(r, options);
    const paires = [...new Set(opposees.map(([a, b]) => [a, b].sort().join(" ↔ ")))];
    return {
      type: "de", graine, patron: parCase, reponse: bonne, options: ordre, indexBonne: ordre.indexOf(bonne),
      valides,
      explication: `Faces opposées sur le cube : ${paires.join(" ; ")}. Un cube ne peut jamais montrer deux faces opposées en même temps, et l'ordre des trois faces autour d'un coin doit respecter le patron (échanger deux faces donne le cube « en miroir », impossible).`,
    };
  }
  throw new Error(`Aucun dé valide pour la graine ${graine}`);
}
