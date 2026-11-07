// Suites de nombres générées par programme : « Quel nombre complète la suite … ? »
// Chaque suite suit une règle (famille + paramètres). On vérifie qu'AUCUNE autre règle plausible expliquant les
// termes visibles ne donne un autre résultat : la réponse est donc unique (voir `prochainsPossibles`).
import { alea } from '../abstrait/generateur.js'
import { entier, fmt, proposer, essayer } from './outils.js'

// ---------- familles de règles ----------
// terme(p, i) : le i-ème terme (i commence à 0). visibles : nombre de termes montrés (le suivant est la réponse).
const boucle = (n, premier, suite) => {
  const t = [premier]
  while (t.length < n) t.push(suite(t, t.length - 1))
  return t
}
const FAMILLES = {
  arith: {
    params: (r) => ({ a: entier(r, 2, 30), s: entier(r, 2, 12) }),
    terme: (p, i) => p.a + p.s * i,
    texte: (p, v, x) => `Chaque terme est le précédent plus ${p.s} : ${v.at(-1)} + ${p.s} = ${x}.`,
  },
  geom: {
    params: (r) => ({ a: entier(r, 1, 5), q: entier(r, 2, 3) }),
    terme: (p, i) => p.a * p.q ** i,
    texte: (p, v, x) => `Chaque terme est le précédent multiplié par ${p.q} : ${v.at(-1)} × ${p.q} = ${x}.`,
  },
  altadd: {
    params: (r) => { const s = entier(r, 4, 12); return { a: entier(r, 10, 30), s, t: entier(r, 1, s - 2) } },
    terme: (p, i) => p.a + Math.ceil(i / 2) * p.s - Math.floor(i / 2) * p.t,
    texte: (p, v, x) => `On ajoute ${p.s}, puis on retire ${p.t}, et ainsi de suite en alternance. Ici le terme suivant s'obtient en ${v.length % 2 === 1 ? `ajoutant ${p.s}` : `retirant ${p.t}`} : ${v.at(-1)} ${v.length % 2 === 1 ? '+' : '−'} ${v.length % 2 === 1 ? p.s : p.t} = ${x}.`,
  },
  quad: {
    params: (r) => ({ a: entier(r, 1, 20), d: entier(r, 1, 5), k: entier(r, 1, 4) }),
    terme: (p, i) => p.a + p.d * i + (p.k * i * (i - 1)) / 2,
    texte: (p, v, x) => `Les écarts entre termes consécutifs sont ${v.slice(1).map((t, i) => t - v[i]).join(', ')} : ils augmentent de ${p.k} à chaque fois. Le prochain écart est ${x - v.at(-1)}, donc ${v.at(-1)} + ${x - v.at(-1)} = ${x}.`,
  },
  fibo: {
    params: (r) => { const a = entier(r, 1, 6); return { a, b: a + entier(r, 1, 5) } },
    terme: (p, i) => boucle(i + 1, p.a, (t, k) => (k === 0 ? p.b : t[k] + t[k - 1])).at(-1),
    texte: (p, v, x) => `Chaque terme est la somme des deux précédents : ${v.at(-2)} + ${v.at(-1)} = ${x}.`,
  },
  diffgeo: {
    params: (r) => ({ a: entier(r, 1, 6), d: entier(r, 1, 3) }),
    terme: (p, i) => p.a + p.d * (2 ** i - 1),
    texte: (p, v, x) => `Les écarts entre termes consécutifs sont ${v.slice(1).map((t, i) => t - v[i]).join(', ')} : ils doublent à chaque fois. Le prochain écart est ${x - v.at(-1)}, donc ${v.at(-1)} + ${x - v.at(-1)} = ${x}.`,
  },
  carres: {
    params: (r) => ({ c: entier(r, 1, 9) }),
    terme: (p, i) => (i + 1) ** 2 + p.c,
    texte: (p, v, x) => `Chaque terme est un carré plus ${p.c} : ${v.map((_, i) => `${(i + 1) ** 2} + ${p.c}`).slice(0, 3).join(', ')}, … Le suivant est ${v.length + 1}² + ${p.c} = ${x}.`,
  },
  cubes: {
    params: (r) => ({ c: entier(r, 0, 5) }),
    terme: (p, i) => (i + 1) ** 3 + p.c,
    texte: (p, v, x) => `Chaque terme est un cube${p.c ? ` plus ${p.c}` : ''} : 1, 8, 27, 64, … Le suivant est ${v.length + 1}³${p.c ? ` + ${p.c}` : ''} = ${x}.`,
  },
  puissance: {
    params: (r) => ({ c: entier(r, 1, 9) }),
    terme: (p, i) => 2 ** (i + 1) + p.c,
    texte: (p, v, x) => `Chaque terme est une puissance de 2 plus ${p.c} : 2 + ${p.c}, 4 + ${p.c}, 8 + ${p.c}, … Le suivant est ${2 ** v.length * 2} + ${p.c} = ${x}.`,
  },
  entrelacee: {
    visibles: 7,
    params: (r) => ({ a: entier(r, 1, 12), s: entier(r, 2, 6), b: entier(r, 40, 80), t: -entier(r, 3, 8) }),
    terme: (p, i) => (i % 2 === 0 ? p.a + p.s * (i / 2) : p.b + p.t * ((i - 1) / 2)),
    texte: (p, v, x) => `Deux suites sont entrelacées : les termes de rang impair augmentent de ${p.s} (${v.filter((_, i) => i % 2 === 0).join(', ')}) et ceux de rang pair diminuent de ${-p.t} (${v.filter((_, i) => i % 2 === 1).join(', ')}). Le terme suivant est de rang pair : ${v.at(-2)} − ${-p.t} = ${x}.`,
  },
  altmult: {
    params: (r) => ({ a: entier(r, 3, 9), c: entier(r, 2, 6) }),
    terme: (p, i) => boucle(i + 1, p.a, (t, k) => (k % 2 === 0 ? t[k] * 2 : t[k] - p.c)).at(-1),
    texte: (p, v, x) => `On multiplie par 2, puis on retire ${p.c}, et ainsi de suite en alternance. Ici ${v.length % 2 === 1 ? `on multiplie par 2 : ${v.at(-1)} × 2` : `on retire ${p.c} : ${v.at(-1)} − ${p.c}`} = ${x}.`,
  },
  factorielle: {
    visibles: 5,
    params: () => ({}),
    terme: (p, i) => boucle(i + 1, 1, (t, k) => t[k] * (k + 2)).at(-1),
    texte: (p, v, x) => `On multiplie par 2, puis par 3, puis par 4, puis par 5… Le suivant est ${v.at(-1)} × ${v.length + 1} = ${x}.`,
  },
}
const FAMILLES_PAR_NIVEAU = {
  facile: ['arith', 'geom', 'altadd'],
  moyen: ['quad', 'fibo', 'diffgeo', 'carres'],
  difficile: ['entrelacee', 'altmult', 'factorielle', 'puissance', 'cubes'],
  expert: ['entrelacee', 'altmult', 'quad', 'fibo', 'diffgeo', 'puissance', 'cubes'],
}

// ---------- toutes les lectures plausibles d'une suite ----------
// Chaque règle renvoie le terme suivant si elle explique TOUS les termes visibles, sinon null.
const diffs = (v) => v.slice(1).map((x, i) => x - v[i])
const constante = (t) => t.every((x) => x === t[0])
const REGLES = [
  (v) => (constante(diffs(v)) ? v.at(-1) + diffs(v)[0] : null), // arithmétique
  (v) => (v[0] !== 0 && v.slice(1).every((x, i) => x * v[0] === v[i] * v[1]) && v.at(-1) * v[1] % v[0] === 0 ? (v.at(-1) * v[1]) / v[0] : null), // géométrique
  (v) => { const d = diffs(v), s = diffs(d); return v.length >= 4 && constante(s) ? v.at(-1) + d.at(-1) + s[0] : null }, // écarts en progression arithmétique
  (v) => { const d = diffs(v); return v.length >= 4 && d[0] !== 0 && d.slice(1).every((x, i) => x * d[0] === d[i] * d[1]) && (d.at(-1) * d[1]) % d[0] === 0 ? v.at(-1) + (d.at(-1) * d[1]) / d[0] : null }, // écarts en progression géométrique
  (v) => { const d = diffs(v); return v.length >= 5 && d.every((x, i) => x === d[i % 2]) && d[0] !== d[1] ? v.at(-1) + d[d.length % 2] : null }, // écarts alternés
  (v) => { // multiplier par m puis ajouter c, en alternance
    if (v.length < 5 || v[0] === 0 || v[1] % v[0] !== 0) return null
    const m = v[1] / v[0], c = v[2] - v[1]
    const op = (x, k) => (k % 2 === 0 ? x * m : x + c)
    return v.slice(1).every((x, k) => x === op(v[k], k)) ? op(v.at(-1), v.length - 1) : null
  },
  (v) => (v.length >= 4 && v.slice(2).every((x, i) => x === v[i] + v[i + 1]) ? v.at(-1) + v.at(-2) : null), // somme des deux précédents
  (v) => { // deux suites arithmétiques entrelacées
    if (v.length < 6) return null
    const [p, q] = [v.filter((_, i) => i % 2 === 0), v.filter((_, i) => i % 2 === 1)]
    if (!constante(diffs(p)) || !constante(diffs(q))) return null
    const cible = v.length % 2 === 0 ? p : q
    return cible.at(-1) + diffs(cible)[0]
  },
  (v) => { const c = v[0] - 1; return v.every((x, i) => x - (i + 1) ** 2 === c) ? (v.length + 1) ** 2 + c : null }, // carré + c
  (v) => { const c = v[0] - 1; return v.every((x, i) => x - (i + 1) ** 3 === c) ? (v.length + 1) ** 3 + c : null }, // cube + c
  (v) => { const c = v[0] - 2; return v.every((x, i) => x - 2 ** (i + 1) === c) ? 2 ** (v.length + 1) + c : null }, // puissance de 2 + c
  (v) => (v.slice(1).every((x, i) => x === v[i] * (i + 2)) ? v.at(-1) * (v.length + 1) : null), // ×2, ×3, ×4…
]
export function prochainsPossibles(visibles) {
  return [...new Set(REGLES.map((f) => f(visibles)).filter((x) => x !== null && Number.isFinite(x)))]
}

// ---------- exercice ----------
export function genererSuite(graine, niveau = 'moyen') {
  return essayer((r) => {
    const noms = FAMILLES_PAR_NIVEAU[niveau]
    const nom = noms[entier(r, 0, noms.length - 1)]
    const F = FAMILLES[nom]
    const p = F.params(r)
    const nbVis = (F.visibles ?? 6) + (niveau === 'facile' ? 1 : 0)
    const termes = Array.from({ length: nbVis + 1 }, (_, i) => F.terme(p, i))
    if (termes.some((x) => !Number.isInteger(x) || x < 1 || x > 9999)) return null
    if (new Set(termes).size < termes.length - 1) return null // pas de suite qui se répète
    const visibles = termes.slice(0, nbVis), bonne = termes[nbVis]
    const possibles = prochainsPossibles(visibles)
    if (possibles.length !== 1 || possibles[0] !== bonne) return null
    const d = visibles.at(-1) - visibles.at(-2)
    const { choix, indexBonne } = proposer(r, bonne, [visibles.at(-1) + d, bonne + 1, bonne - 1, visibles.at(-1) * 2, bonne + d], '')
    return {
      type: 'suite', niveau, graine, famille: nom, visibles,
      enonce: `Quel nombre complète la suite : ${visibles.map((x) => fmt(x)).join(' ; ')} ; … ?`,
      choix, reponse: indexBonne, valeur: bonne,
      correction: `${F.texte(p, visibles, bonne)}`,
    }
  }, graine, alea)
}
