// Vérifie le numérique : node scripts/verif-numerique.mjs (depuis le dossier app)
//  1. les réponses du contenu rédigé, recalculées ici d'une autre façon (calcul direct, recherche exhaustive) ;
//  2. les exercices générés (graphiques, suites, calculs) : réponse recalculée, propositions distinctes, même numéro = même exercice ;
//  3. le tirage d'une session (formats, composition, propositions mélangées).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'vite'

const banque = JSON.parse(readFileSync(new URL('../src/data/exercices/numerique.json', import.meta.url), 'utf8'))
const nombre = (texte) => Number(texte.match(/[−+-]?\d[\d\s]*(?:,\d+)?/)[0].replace(/\s/g, '').replace(',', '.').replace('−', '-'))
const pgcd = (a, b) => (b === 0 ? a : pgcd(b, a % b))
const ppcm = (...n) => n.reduce((a, b) => (a * b) / pgcd(a, b))
const cherche = (de, a, test) => {
  for (let n = de; n <= a; n++) if (test(n)) return n
  throw new Error('aucune solution')
}
const proche = (a, b) => Math.abs(a - b) < 0.005

// ---------- 1a. QCM rédigés : valeur attendue, recalculée ----------
const attendu = {
  'N-005-1': 3200 * (1 - 0.12),
  'N-005-2': 4 * 12 - (10 + 14 + 11),
  'N-005-3': 60 / 0.8,
  'N-005-4': 80 * 1.25 * 0.8,
  'N-006-1': (45 / 3) * (5 + 20 / 60),
  'N-006-2': ((150 * 0.4 * 0.2 + 150 * 0.6 * 0.5) / 150) * 100,
  'N-006-3': ((300000 * 1.1) / 250000 - 1) * 100,
  'N-006-4': 1 / (1 / 6 + 1 / 3),
  'N-007-1': 28 + (9 + 2), // écarts 3, 5, 7, 9 : le suivant est 11
  'N-007-2': 28 - 2, // ×2 puis −2, en alternance
  'N-007-3': 40 - 5, // deux suites entrelacées : +3 et −5
  'N-007-4': 34 + 32, // écarts 1, 2, 4, 8, 16 : le suivant est 32
  'N-008-1': 13 + 21, // chaque terme est la somme des deux précédents
  'N-008-2': 65 - 4, // écarts −9, −8, −7, −6, −5 : le suivant est −4
  'N-008-3': 120 * 6, // ×2, ×3, ×4, ×5, puis ×6
  'N-008-4': 53 * 2 + 1, // ×2 puis +1 ou −1 en alternance : …, ×2−1, ×2+1
  'N-009-1': (21000 * 18) / (12 + 18 + 30),
  'N-009-2': 120 / (60 / 60 + 60 / 40),
  'N-009-3': 3 * 45 + 4 * 30,
  'N-009-4': cherche(1, 49, (f) => 50 - f + 5 === 3 * (f + 5)),
  'N-010-1': (4.8 * 25000) / 100000, // cm → km
  'N-010-2': 240 - 240 / 4 - (240 - 240 / 4) / 3,
  'N-010-3': ppcm(4, 6, 10),
  'N-010-4': cherche(1, 200, (n) => Math.abs(240 / n - 240 / (n + 4) - 2) < 1e-9),
}
let nbQcm = 0
for (const serie of banque.series) {
  for (const q of serie.questions) {
    assert.ok(q.id in attendu, `${q.id} : aucun calcul de contrôle écrit dans verif-numerique.mjs`)
    const bonne = nombre(q.choix[q.reponse])
    assert.ok(Math.abs(bonne - attendu[q.id]) < 1e-9, `${q.id} : la banque dit ${q.choix[q.reponse]}, le calcul donne ${attendu[q.id]}`)
    assert.equal(q.choix.filter((c) => Math.abs(nombre(c) - attendu[q.id]) < 1e-9).length, 1, `${q.id} : plusieurs propositions égales à la bonne valeur`)
    nbQcm++
  }
}
assert.equal(nbQcm, Object.keys(attendu).length, 'un calcul de contrôle ne correspond à aucune question')

// ---------- 1b. Tableaux rédigés : totaux justes, et chaque affirmation recalculée ----------
const tab = Object.fromEntries(banque.tableaux.map((t) => [t.id, t]))
const val = (id, ligne, colonne) => nombre(tab[id].lignes.find((l) => l[0] === ligne)[colonne])
for (const t of banque.tableaux) {
  const dernier = t.lignes.at(-1)
  if (dernier[0] === 'Total' && dernier.every((c) => /\d/.test(c) || c === 'Total')) {
    for (let j = 1; j < t.entetes.length; j++) {
      const somme = t.lignes.slice(0, -1).reduce((s, l) => s + nombre(l[j]), 0)
      assert.equal(nombre(dernier[j]), somme, `${t.id} : total de la colonne « ${t.entetes[j]} » faux`)
    }
  }
  if (t.entetes.at(-1) === 'Total') {
    for (const l of t.lignes) {
      const somme = l.slice(1, -1).reduce((s, c) => s + nombre(c), 0)
      assert.equal(nombre(l.at(-1)), somme, `${t.id} : total de la ligne « ${l[0]} » faux`)
    }
  }
}
const approx = (a, b) => Math.abs(a - b) < 1e-9
const verdicts = {
  // true = Vrai, false = Faux, null = Indéterminé (le tableau ne contient pas l'information)
  'N-001-1': approx((val('N-001', '2023', 1) - val('N-001', '2022', 1)) / val('N-001', '2022', 1), 0.25),
  'N-001-2': val('N-001', '2024', 3) / val('N-001', '2024', 4) > 0.6,
  'N-001-3': null,
  'N-001-4': approx((val('N-001', '2024', 4) - val('N-001', '2022', 4)) / val('N-001', '2022', 4), 0.25),
  'N-002-1': val('N-002', 'B', 2) / val('N-002', 'B', 1) < Math.min(val('N-002', 'A', 2) / val('N-002', 'A', 1), val('N-002', 'C', 2) / val('N-002', 'C', 1)),
  'N-002-2': null,
  'N-002-3': (val('N-002', 'A', 1) + val('N-002', 'B', 1)) / val('N-002', 'Total', 1) > 0.8,
  'N-002-4': approx(val('N-002', 'A', 3) / val('N-002', 'A', 2), 4),
  'N-003-1': approx((val('N-003', 'Personnel', 2) - val('N-003', 'Personnel', 1)) / val('N-003', 'Personnel', 1), 0.1),
  'N-003-2': val('N-003', 'Personnel', 2) / val('N-003', 'Total', 2) > val('N-003', 'Personnel', 1) / val('N-003', 'Total', 1),
  'N-003-3': null,
  'N-003-4': approx((val('N-003', 'Fonctionnement', 2) - val('N-003', 'Fonctionnement', 1)) / val('N-003', 'Fonctionnement', 1), -0.15),
  'N-004-1': approx(
    (val('N-004', 'Luxembourg-Ville', 1) * val('N-004', 'Luxembourg-Ville', 2) +
      val('N-004', 'Esch-sur-Alzette', 1) * val('N-004', 'Esch-sur-Alzette', 2) +
      val('N-004', 'Diekirch', 1) * val('N-004', 'Diekirch', 2)) /
      val('N-004', 'Total', 1),
    70,
  ),
  'N-004-2': approx((val('N-004', 'Esch-sur-Alzette', 1) * val('N-004', 'Esch-sur-Alzette', 2)) / 100, 200),
  'N-004-3':
    ['Luxembourg-Ville', 'Esch-sur-Alzette', 'Diekirch'].reduce((m, s) => (val('N-004', s, 3) > val('N-004', m, 3) ? s : m)) ===
    ['Luxembourg-Ville', 'Esch-sur-Alzette', 'Diekirch'].reduce((m, s) => (val('N-004', s, 2) < val('N-004', m, 2) ? s : m)),
  'N-004-4': null,
}
const nommer = { true: 'Vrai', false: 'Faux', null: 'Indéterminé' }
let nbVfi = 0
for (const t of banque.tableaux) {
  for (const q of t.questions) {
    assert.ok(q.id in verdicts, `${q.id} : aucun calcul de contrôle écrit`)
    assert.equal(nommer[verdicts[q.id]], q.reponse, `${q.id} : la banque dit ${q.reponse}, le calcul dit ${nommer[verdicts[q.id]]}`)
    nbVfi++
  }
}
assert.equal(nbVfi, Object.keys(verdicts).length)
console.log(`OK : ${nbQcm} QCM et ${nbVfi} affirmations de tableaux rédigés recalculés, totaux des tableaux justes`)

// ---------- 2. exercices générés ----------
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { genererGraphique } = await vite.ssrLoadModule('/src/modules/numerique/graphiques.js')
const { genererSuite, prochainsPossibles } = await vite.ssrLoadModule('/src/modules/numerique/suites.js')
const { genererCalcul, NOMS_MODELES } = await vite.ssrLoadModule('/src/modules/numerique/calculs.js')
const NIVEAUX = ['facile', 'moyen', 'difficile', 'expert']
const json = (x) => JSON.stringify(x)

// Chaque question à 4 propositions : distinctes, une seule bonne, et la bonne vaut `valeur`.
function controlerPropositions(q, ou) {
  assert.equal(q.choix.length, 4, `${ou} : ${q.choix.length} propositions`)
  assert.equal(new Set(q.choix).size, 4, `${ou} : propositions identiques`)
  assert.ok(q.reponse >= 0 && q.reponse <= 3, `${ou} : numéro de bonne réponse`)
  assert.ok(q.correction.length > 30, `${ou} : correction trop courte`)
  if (typeof q.valeur === 'number') {
    assert.ok(proche(nombre(q.choix[q.reponse]), q.valeur), `${ou} : la bonne proposition ${q.choix[q.reponse]} ne vaut pas ${q.valeur}`)
    assert.equal(q.choix.filter((c) => proche(nombre(c), q.valeur)).length, 1, `${ou} : deux propositions égales à la bonne valeur`)
  } else assert.equal(q.choix[q.reponse], q.valeur, `${ou} : mauvaise réponse texte`)
}

// --- graphiques : on recalcule la réponse depuis les données du graphique, par un autre chemin ---
function recalculerGraphique(ex, q) {
  const d = ex.donnees
  const a = q.args
  if (ex.forme === 'camembert') {
    const p = d.pourcents, T = d.total
    return {
      effectif: () => (T * p[a.i]) / 100,
      'part-cumulee': () => p[a.i] + p[a.j],
      'ecart-effectif': () => Math.abs(T * p[a.i] - T * p[a.j]) / 100,
      hors: () => T - (T * p[a.i]) / 100,
      'effectif-cumule': () => (T * p[a.i] + T * p[a.j]) / 100,
      rapport: () => p[a.i] / p[a.j],
    }[q.modele]()
  }
  const v = d.valeurs, L = d.labels
  const S = v.reduce((x, y) => x + y, 0)
  const diffs = v.slice(1).map((x, k) => x - v[k])
  const nom = (k) => `${L[k]} → ${L[k + 1]}`
  return {
    ecart: () => Math.max(v[a.i], v[a.j]) - Math.min(v[a.i], v[a.j]),
    total: () => S,
    cumul: () => { let s = 0; for (let k = a.a; k < a.a + a.longueur; k++) s += v[k]; return s },
    moyenne: () => { assert.ok(S % v.length === 0); return S / v.length },
    part: () => { assert.ok((100 * v[a.i]) % S === 0); return (100 * v[a.i]) / S },
    rapport: () => v[a.i] / v[a.j],
    variation: () => { assert.ok(((v[a.j] - v[a.i]) * 100) % v[a.i] === 0); return ((v[a.j] - v[a.i]) * 100) / v[a.i] },
    'ecart-relatif': () => { assert.ok(((v[a.i] - v[a.j]) * 100) % v[a.j] === 0); return ((v[a.i] - v[a.j]) * 100) / v[a.j] },
    'plus-forte-hausse': () => {
      const max = Math.max(...diffs)
      assert.equal(diffs.filter((x) => x === max).length, 1, 'plus forte hausse ex æquo')
      return nom(diffs.indexOf(max))
    },
    'hausse-relative': () => {
      // on compare les fractions diffs[k] / v[k] par produits en croix (sans division)
      let best = 0
      for (let k = 1; k < diffs.length; k++) if (diffs[k] * v[best] > diffs[best] * v[k]) best = k
      for (let k = 0; k < diffs.length; k++) if (k !== best) assert.ok(diffs[k] * v[best] !== diffs[best] * v[k], 'hausse relative ex æquo')
      assert.notEqual(best, diffs.indexOf(Math.max(...diffs)), 'le piège (hausse en valeur ≠ hausse en %) a disparu')
      return nom(best)
    },
  }[q.modele]()
}
const parForme = { barres: 0, courbe: 0, camembert: 0 }
const modelesVus = new Set()
for (const niveau of NIVEAUX) {
  for (let graine = 1; graine <= 150; graine++) {
    const ex = genererGraphique(graine, niveau)
    parForme[ex.forme]++
    assert.ok(ex.svg.startsWith('<svg') && ex.svg.endsWith('</svg>') && ex.svg.includes('role="img"'))
    assert.equal(ex.questions.length, 3)
    assert.equal(new Set(ex.questions.map((q) => q.modele)).size, 3, 'trois questions de même type')
    ex.questions.forEach((q, k) => {
      const ou = `graphique ${ex.forme} ${niveau} graine ${graine} question ${k + 1} (${q.modele})`
      controlerPropositions(q, ou)
      const attenduG = recalculerGraphique(ex, q)
      if (typeof attenduG === 'number') assert.ok(proche(q.valeur, attenduG), `${ou} : la banque dit ${q.valeur}, le recalcul donne ${attenduG}`)
      else assert.equal(q.valeur, attenduG, `${ou} : le recalcul donne ${attenduG}`)
      modelesVus.add(`${ex.forme === 'camembert' ? 'camembert' : 'serie'}:${q.modele}`)
    })
    assert.equal(json(genererGraphique(graine, niveau)), json(ex), 'même numéro, exercice différent')
  }
}
assert.ok(Object.values(parForme).every((n) => n > 50), `formes de graphique mal réparties : ${json(parForme)}`)

// --- suites : réponse unique parmi toutes les lectures plausibles ---
const famillesVues = new Set()
for (const niveau of NIVEAUX) {
  for (let graine = 1; graine <= 400; graine++) {
    const ex = genererSuite(graine, niveau)
    const ou = `suite ${niveau} graine ${graine} (${ex.famille})`
    controlerPropositions(ex, ou)
    assert.deepEqual(prochainsPossibles(ex.visibles), [ex.valeur], `${ou} : réponse non unique`)
    assert.ok(ex.visibles.every((x) => Number.isInteger(x) && x > 0))
    famillesVues.add(ex.famille)
    assert.equal(json(genererSuite(graine, niveau)), json(ex))
  }
}

// --- calculs : chaque réponse recalculée d'une autre façon, à partir des nombres tirés ---
function recalculerCalcul(ex) {
  const a = ex.args
  const premierNombre = () => nombre(ex.enonce.replace(/^[^\d]*/, ''))
  const calculs = {
    net: () => (a.B * (100 - a.p)) / 100,
    tva: () => (a.HT * 117) / 100,
    'tva-inverse': () => { assert.ok(proche(premierNombre() * 100 / 117, a.HT)); return a.HT },
    proportion: () => (a.n * a.H) / a.h,
    echelle: () => (a.cm * a.S) / 100000,
    'moyenne-manquante': () => 4 * a.cible - a.notes.reduce((x, y) => x + y, 0),
    'moyenne-ponderee': () => (a.e1 * a.m1 + a.e2 * a.m2) / (a.e1 + a.e2),
    'remise-inverse': () => { assert.ok(proche((a.I * (100 - a.rem)) / 100, nombre(ex.enonce.match(/coûte ([\d\s  ]+)/)[1]))); return a.I },
    'hausse-baisse': () => (a.I * (100 + a.a) * (100 - a.b)) / 10000,
    partage: () => (a.S * a.k) / (a.x + a.y + a.z),
    'vitesse-aller-retour': () => (2 * a.v1 * a.v2) / (a.v1 + a.v2), // moyenne harmonique
    'travail-commun': () => (a.a * a.b) / (a.a + a.b),
    'pourcentage-de-pourcentage': () => (a.N * a.p1 * a.p2) / 10000,
    'interets-simples': () => (a.C * a.t * a.n) / 100,
  }
  return calculs[ex.modele]()
}
const modelesCalcul = new Set()
for (const niveau of NIVEAUX) {
  for (let graine = 1; graine <= 400; graine++) {
    const ex = genererCalcul(graine, niveau)
    const ou = `calcul ${niveau} graine ${graine} (${ex.modele})`
    controlerPropositions(ex, ou)
    assert.ok(proche(ex.valeur, recalculerCalcul(ex)), `${ou} : valeur ${ex.valeur}, recalcul ${recalculerCalcul(ex)}`)
    modelesCalcul.add(ex.modele)
    assert.equal(json(genererCalcul(graine, niveau)), json(ex))
  }
}
assert.equal(modelesCalcul.size, NOMS_MODELES.length, `modèles de calcul jamais tirés : ${NOMS_MODELES.filter((m) => !modelesCalcul.has(m))}`)
console.log(
  `OK : ${4 * 150} graphiques (${json(parForme)}), ${4 * 400} suites (${famillesVues.size} familles), ${4 * 400} calculs (${modelesCalcul.size} modèles) recalculés ; ` +
    `${modelesVus.size} types de questions de graphique rencontrés`,
)

// ---------- 3. tirage ----------
const { tirerSessionType, nombreQuestions } = await vite.ssrLoadModule('/src/modules/numerique/tirage.js')
const { NB_QUESTIONS } = await vite.ssrLoadModule('/src/modules/numerique/config.js')
const reponseDeBanque = {}
for (const s of banque.series) for (const q of s.questions) reponseDeBanque[q.id] = q.choix[q.reponse]
const positions = [0, 0, 0, 0]
const FORMATS = { tableaux: 'tableau', qcm: 'qcm', graphiques: 'graphique', suites: 'suite', calcul: 'calcul' }
for (const type of ['melange', ...Object.keys(FORMATS)]) {
  for (const niveau of type === 'melange' || ['graphiques', 'suites', 'calcul'].includes(type) ? NIVEAUX : ['moyen']) {
    for (let i = 0; i < 60; i++) {
      const s = tirerSessionType(type, niveau)
      assert.equal(s.length, nombreQuestions(type), `${type} : nombre de questions`)
      assert.equal(new Set(s.map((q) => q.id)).size, s.length, `${type} ${niveau} : questions en double`)
      const parType = (t) => s.filter((q) => q.type === t).length
      if (type === 'melange') {
        assert.equal(parType('tableau'), 4)
        assert.equal(parType('graphique'), 6)
        assert.equal(parType('suite'), 5)
        assert.equal(parType('calcul'), 5)
      } else assert.ok(s.every((q) => q.type === FORMATS[type]), `${type} : format mélangé par erreur`)
      for (const q of s) {
        assert.ok(q.affirmation.length > 5 && q.correction.length > 10)
        if (q.type === 'tableau') {
          assert.ok(q.texte?.tableau?.lignes.length >= 3, 'tableau absent')
          assert.equal(q.choix, undefined)
        } else {
          assert.equal(q.choix.length, 4)
          assert.equal(new Set(q.choix).size, 4)
          assert.equal(q.choix.filter((c) => c === q.reponseAttendue).length, 1)
          if (q.type === 'qcm') {
            assert.equal(q.reponseAttendue, reponseDeBanque[q.id], 'la bonne réponse a changé de sens après mélange')
            assert.equal(q.texte, null)
          }
          if (q.type === 'graphique') assert.ok(q.texte.graphique.startsWith('<svg'))
          else assert.equal(q.texte, null)
          positions[q.choix.indexOf(q.reponseAttendue)]++
        }
      }
    }
  }
}
const total = positions.reduce((a, b) => a + b, 0)
assert.ok(positions.every((n) => n / total > 0.2 && n / total < 0.3), `bonne réponse mal répartie : ${positions}`)
console.log(`OK : sessions tirées pour les 6 formats et les 4 niveaux ; place de la bonne réponse : ${positions.map((n) => Math.round((100 * n) / total) + ' %').join(' / ')}`)
await vite.close()
