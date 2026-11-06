// Générateur d'exercices de raisonnement abstrait (séries et matrices 3×3).
// Chaque figure a 4 attributs à 3 valeurs. Une règle = une formule (a·ligne + b·colonne + o) mod 3.
// Tout est calculé : la bonne réponse est juste par construction, et verif.mjs prouve qu'elle est unique.

export const ATTRIBUTS = {
  forme: { nom: "la forme", valeurs: ["cercle", "carré", "triangle"] },
  remplissage: { nom: "le remplissage", valeurs: ["vide", "gris", "plein"] }, // « plein » plutôt que « noir » : la forme est blanche en thème sombre
  nombre: { nom: "le nombre de formes", valeurs: ["1", "2", "3"] },
  taille: { nom: "la taille", valeurs: ["petite", "moyenne", "grande"] },
  rotation: { nom: "la position du point", valeurs: ["en haut", "en bas à droite", "en bas à gauche"] },
};
const NOMS = Object.keys(ATTRIBUTS);

// Niveau → nombre d'attributs qui varient, formes de règles permises (a, b),
// part de matrices « motifs » (superposition) et opérations permises pour elles, part d'alternances dans les séries.
const TOUTES_OPS = ["xor", "ou", "et", "ab", "ba"];
const NIVEAUX = {
  facile: { variables: 2, regles: [[0, 1], [0, 2], [1, 0], [2, 0]], motifs: 0, ops: [], alternance: 0, taillesMotif: [3, 4] },
  moyen: { variables: 3, regles: [[0, 1], [0, 2], [1, 0], [2, 0], [1, 1], [2, 2]], motifs: 0.3, ops: ["xor", "ou"], alternance: 0.3, taillesMotif: [3, 4, 5] },
  difficile: { variables: 4, regles: [[0, 1], [0, 2], [1, 0], [2, 0], [1, 1], [2, 2]], motifs: 0.4, ops: ["xor", "ou", "et"], alternance: 0.4, taillesMotif: [3, 4, 5] },
  expert: { variables: 5, regles: [[0, 1], [0, 2], [1, 0], [2, 0], [1, 1], [2, 2], [1, 2], [2, 1]], motifs: 0.5, ops: TOUTES_OPS, alternance: 0.5, taillesMotif: [4, 5, 6] },
};
export const LISTE_NIVEAUX = Object.keys(NIVEAUX);

// Générateur pseudo-aléatoire à graine : même graine = même exercice.
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
const tirer = (r, tab) => tab[Math.floor(r() * tab.length)];
const melanger = (r, tab) => {
  const t = [...tab];
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
};
const mod3 = (n) => ((n % 3) + 3) % 3;

// ---------- règles ----------
const valeur = (regle, i, j) => mod3(regle.a * i + regle.b * j + regle.o);

function reglesAlea(r, niveau) {
  const { variables, regles } = NIVEAUX[niveau];
  const variables_ = new Set(melanger(r, NOMS).slice(0, variables));
  const res = {};
  for (const nom of NOMS) {
    const [a, b] = variables_.has(nom) ? tirer(r, regles) : [0, 0];
    res[nom] = { a, b, o: Math.floor(r() * 3) };
  }
  return res;
}

const figure = (regles, i, j) =>
  Object.fromEntries(NOMS.map((n) => [n, valeur(regles[n], i, j)]));

// Toutes les règles compatibles avec les figures visibles → valeurs possibles pour la case manquante.
// Si une seule valeur reste par attribut, l'exercice a une réponse unique.
function valeursPossibles(visibles, cible, coefficients) {
  const res = {};
  for (const nom of NOMS) {
    const s = new Set();
    for (const [a, b] of coefficients)
      for (let o = 0; o < 3; o++)
        if (visibles.every((v) => valeur({ a, b, o }, v.i, v.j) === v.fig[nom]))
          s.add(valeur({ a, b, o }, cible.i, cible.j));
    res[nom] = [...s];
  }
  return res;
}
const TOUS_COEFFS = [0, 1, 2].flatMap((a) => [0, 1, 2].map((b) => [a, b]));

// 4 mauvaises réponses : on fausse 1 attribut (le plus souvent) ou 2 de la bonne réponse.
function options(r, bonne) {
  const vus = new Set([JSON.stringify(bonne)]);
  const res = [bonne];
  while (res.length < 5) {
    const f = { ...bonne };
    for (const nom of melanger(r, NOMS).slice(0, r() < 0.65 ? 1 : 2))
      f[nom] = mod3(f[nom] + 1 + Math.floor(r() * 2));
    const cle = JSON.stringify(f);
    if (!vus.has(cle)) { vus.add(cle); res.push(f); }
  }
  const ordre = melanger(r, res);
  return { options: ordre, indexBonne: ordre.indexOf(bonne) };
}

// ---------- explications ----------
const lib = (nom, v) => ATTRIBUTS[nom].valeurs[v];
function texteRegleMatrice(nom, { a, b, o }) {
  const A = ATTRIBUTS[nom].nom;
  const cap = A[0].toUpperCase() + A.slice(1);
  if (!a && !b) return `${cap} ne change pas : toujours « ${lib(nom, o)} ».`;
  if (!a) return `${cap} change de gauche à droite (${[0, 1, 2].map((j) => lib(nom, valeur({ a, b, o }, 0, j))).join(" → ")}), de la même façon sur chaque ligne.`;
  if (!b) return `${cap} change de haut en bas (${[0, 1, 2].map((i) => lib(nom, valeur({ a, b, o }, i, 0))).join(" → ")}), de la même façon dans chaque colonne.`;
  return `${cap} prend les trois valeurs dans chaque ligne et dans chaque colonne, en se décalant d'une ligne à l'autre.`;
}
function texteRegleSerie(nom, { a, o, alt, x, y }) {
  const A = ATTRIBUTS[nom].nom;
  const cap = A[0].toUpperCase() + A.slice(1);
  if (alt) return `${cap} alterne entre « ${lib(nom, x)} » et « ${lib(nom, y)} ».`;
  if (!a) return `${cap} ne change pas : toujours « ${lib(nom, o)} ».`;
  const suite = [0, 1, 2].map((i) => lib(nom, valeur({ a, b: 0, o }, i, 0))).join(" → ");
  return `${cap} suit le cycle ${suite}, qui se répète.`;
}

// ---------- exercices ----------
function essayer(creer, graine) {
  for (let k = 0; k < 200; k++) {
    const ex = creer(alea(graine * 1000 + k));
    if (ex) return ex;
  }
  throw new Error(`Aucun exercice valide pour la graine ${graine}`);
}

// Matrice : soit des règles sur les caractéristiques (3 valeurs), soit des motifs à superposer (selon le niveau).
export function genererMatrice(graine, niveau = "moyen") {
  const part = NIVEAUX[niveau].motifs;
  return alea(graine * 7 + 3)() < part ? genererMotifs(graine, niveau) : genererMatriceCaracteristiques(graine, niveau);
}

function genererMatriceCaracteristiques(graine, niveau) {
  return essayer((r) => {
    const regles = reglesAlea(r, niveau);
    const grille = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) grille.push({ i, j, fig: figure(regles, i, j) });
    const bonne = grille[8].fig;
    const visibles = grille.slice(0, 8);
    const poss = valeursPossibles(visibles, { i: 2, j: 2 }, TOUS_COEFFS);
    if (!NOMS.every((n) => poss[n].length === 1 && poss[n][0] === bonne[n])) return null;
    // éviter les matrices où rien ne change d'une case à l'autre
    if (new Set(visibles.map((v) => JSON.stringify(v.fig))).size < 4) return null;
    return {
      type: "matrice", niveau, graine,
      cellules: visibles.map((v) => v.fig), // 8 cases visibles, la 9e est « ? »
      reponse: bonne,
      ...options(r, bonne),
      explication: NOMS.map((n) => texteRegleMatrice(n, regles[n])).join(" "),
      regles,
    };
  }, graine);
}

// ---------- matrices « motifs » : la 3e case de chaque ligne combine les deux premières ----------
// Une case = 9 emplacements, allumés (1) ou éteints (0).
const OPS = {
  xor: { f: (a, b) => a !== b, texte: "La 3e case garde les carrés présents dans une seule des deux premières cases (ceux présents dans les deux disparaissent)." },
  ou: { f: (a, b) => a || b, texte: "La 3e case réunit tous les carrés des deux premières cases." },
  et: { f: (a, b) => a && b, texte: "La 3e case ne garde que les carrés présents dans les deux premières cases." },
  ab: { f: (a, b) => a && !b, texte: "La 3e case garde les carrés de la 1re case qui ne sont pas dans la 2e." },
  ba: { f: (a, b) => b && !a, texte: "La 3e case garde les carrés de la 2e case qui ne sont pas dans la 1re." },
};
const appliquer = (op, A, B) => A.map((a, k) => (OPS[op].f(!!a, !!B[k]) ? 1 : 0));
const cle = (m) => m.join("");

// Réponses possibles de la 9e case, selon les opérations qui expliquent les lignes 1 et 2.
export function reponsesPossiblesMotifs(cellules) {
  const [a1, b1, c1, a2, b2, c2, a3, b3] = cellules;
  const res = new Set();
  for (const op of TOUTES_OPS)
    if (cle(appliquer(op, a1, b1)) === cle(c1) && cle(appliquer(op, a2, b2)) === cle(c2)) res.add(cle(appliquer(op, a3, b3)));
  return [...res];
}

function genererMotifs(graine, niveau) {
  const { ops, taillesMotif } = NIVEAUX[niveau];
  return essayer((r) => {
    const op = tirer(r, ops);
    const motif = () => {
      const m = Array(9).fill(0);
      melanger(r, [...Array(9).keys()]).slice(0, tirer(r, taillesMotif)).forEach((k) => (m[k] = 1));
      return m;
    };
    const cellules = [];
    for (let i = 0; i < 3; i++) {
      const a = motif(), b = motif();
      cellules.push(a, b, appliquer(op, a, b));
    }
    const bonne = cellules[8];
    const visibles = cellules.slice(0, 8);
    if (bonne.every((v) => !v)) return null;
    if (reponsesPossiblesMotifs(visibles).length !== 1 || reponsesPossiblesMotifs(visibles)[0] !== cle(bonne)) return null;
    // bons pièges : la réponse que donneraient les autres opérations, puis des variantes avec 1 ou 2 carrés changés
    const vus = new Set([cle(bonne)]);
    const opts = [bonne];
    const ajouter = (m) => { if (m.some(Boolean) && !vus.has(cle(m))) { vus.add(cle(m)); opts.push(m); } };
    for (const o of melanger(r, TOUTES_OPS.filter((x) => x !== op)).slice(0, 2)) ajouter(appliquer(o, cellules[6], cellules[7]));
    while (opts.length < 5) {
      const m = [...bonne];
      for (const k of melanger(r, [...Array(9).keys()]).slice(0, r() < 0.6 ? 1 : 2)) m[k] = 1 - m[k];
      ajouter(m);
    }
    const ordre = melanger(r, opts);
    return {
      type: "motifs", niveau, graine, op,
      cellules: visibles, // 8 cases visibles, la 9e est « ? »
      reponse: bonne, options: ordre, indexBonne: ordre.indexOf(bonne),
      explication: OPS[op].texte + " Cette règle est la même sur chaque ligne.",
    };
  }, graine);
}

// ---------- séries : cycle (1 → 2 → 3 → …) ou alternance (x, y, x, y, …) ----------
const valeurSerie = (h, i) => (h.alt ? (i % 2 ? h.y : h.x) : mod3(h.a * i + h.o));
const HYPOTHESES_SERIE = [
  ...[0, 1, 2].flatMap((a) => [0, 1, 2].map((o) => ({ a, o }))),
  ...[0, 1, 2].flatMap((x) => [0, 1, 2].map((y) => ({ alt: true, x, y }))),
];
// Valeurs possibles de la 6e figure pour chaque attribut, selon toutes les règles qui expliquent les 5 premières.
export function valeursPossiblesSerie(visibles) {
  const res = {};
  for (const nom of NOMS)
    res[nom] = [...new Set(HYPOTHESES_SERIE.filter((h) => visibles.every((f, i) => valeurSerie(h, i) === f[nom])).map((h) => valeurSerie(h, 5)))];
  return res;
}

export function genererSerie(graine, niveau = "moyen") {
  return essayer((r) => {
    const { variables, alternance } = NIVEAUX[niveau];
    const var_ = new Set(melanger(r, NOMS).slice(0, variables));
    const regles = {};
    for (const n of NOMS) {
      if (!var_.has(n)) regles[n] = { a: 0, o: Math.floor(r() * 3) };
      else if (r() < alternance) {
        const x = Math.floor(r() * 3);
        regles[n] = { alt: true, x, y: mod3(x + 1 + Math.floor(r() * 2)) };
      } else regles[n] = { a: 1 + Math.floor(r() * 2), o: Math.floor(r() * 3) };
    }
    const suite = [0, 1, 2, 3, 4, 5].map((i) => Object.fromEntries(NOMS.map((n) => [n, valeurSerie(regles[n], i)])));
    const bonne = suite[5];
    const poss = valeursPossiblesSerie(suite.slice(0, 5));
    if (!NOMS.every((n) => poss[n].length === 1 && poss[n][0] === bonne[n])) return null;
    return {
      type: "serie", niveau, graine,
      cellules: suite.slice(0, 5), // 5 figures visibles, la 6e est « ? »
      reponse: bonne,
      ...options(r, bonne),
      explication: NOMS.map((n) => texteRegleSerie(n, regles[n])).join(" "),
      regles,
    };
  }, graine);
}

export { valeursPossibles, TOUS_COEFFS, NOMS, alea, melanger, tirer, essayer };
