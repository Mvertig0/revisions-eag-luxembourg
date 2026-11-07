// Vérifie le numérique : node scripts/verif-numerique.mjs (depuis le dossier app)
//  1. les réponses de la banque, recalculées ici d'une autre façon (calcul direct, recherche exhaustive) ;
//  2. le tirage d'une session (formats, composition, propositions mélangées).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'vite'

const banque = JSON.parse(readFileSync(new URL('../src/data/exercices/numerique.json', import.meta.url), 'utf8'))
const nombre = (texte) => Number(texte.match(/\d[\d\s]*(?:,\d+)?/)[0].replace(/\s/g, '').replace(',', '.'))
const pgcd = (a, b) => (b === 0 ? a : pgcd(b, a % b))
const ppcm = (...n) => n.reduce((a, b) => (a * b) / pgcd(a, b))
const cherche = (de, a, test) => {
  for (let n = de; n <= a; n++) if (test(n)) return n
  throw new Error('aucune solution')
}

// ---------- 1a. QCM : valeur attendue, recalculée ----------
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
    // N-006-4 : le texte de la réponse est « 2 h » (le calcul donne 2 heures)
    assert.ok(Math.abs(bonne - attendu[q.id]) < 1e-9, `${q.id} : la banque dit ${q.choix[q.reponse]}, le calcul donne ${attendu[q.id]}`)
    // une seule proposition a cette valeur
    assert.equal(q.choix.filter((c) => Math.abs(nombre(c) - attendu[q.id]) < 1e-9).length, 1, `${q.id} : plusieurs propositions égales à la bonne valeur`)
    nbQcm++
  }
}
assert.equal(nbQcm, Object.keys(attendu).length, 'un calcul de contrôle ne correspond à aucune question')

// ---------- 1b. Tableaux : totaux justes, et chaque affirmation recalculée ----------
const tab = Object.fromEntries(banque.tableaux.map((t) => [t.id, t]))
const val = (id, ligne, colonne) => nombre(tab[id].lignes.find((l) => l[0] === ligne)[colonne])
for (const t of banque.tableaux) {
  const dernier = t.lignes.at(-1)
  if (dernier[0] === 'Total' && dernier.every((c) => /\d/.test(c) || c === 'Total')) {
    // la ligne Total est la somme des lignes au-dessus (colonnes numériques)
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
  'N-004-3': ['Luxembourg-Ville', 'Esch-sur-Alzette', 'Diekirch'].reduce((m, s) => (val('N-004', s, 3) > val('N-004', m, 3) ? s : m)) ===
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
console.log(`OK : ${nbQcm} QCM et ${nbVfi} affirmations de tableaux recalculés, totaux des tableaux justes`)

// ---------- 2. tirage ----------
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { tirerSessionType, nombreQuestions } = await vite.ssrLoadModule('/src/modules/numerique/tirage.js')
const { NB_QUESTIONS } = await vite.ssrLoadModule('/src/modules/numerique/config.js')
const reponseDeBanque = {}
for (const s of banque.series) for (const q of s.questions) reponseDeBanque[q.id] = q.choix[q.reponse]
const positions = [0, 0, 0, 0]
for (const type of ['tableaux', 'qcm', 'melange']) {
  for (let i = 0; i < 300; i++) {
    const s = tirerSessionType(type)
    assert.equal(s.length, nombreQuestions(type), `${type} : nombre de questions`)
    assert.equal(new Set(s.map((q) => q.id)).size, s.length, `${type} : questions en double`)
    const parType = (t) => s.filter((q) => q.type === t).length
    if (type === 'melange') {
      assert.equal(parType('tableau'), 8)
      assert.equal(parType('qcm'), NB_QUESTIONS - 8)
    } else assert.ok(s.every((q) => q.type === (type === 'qcm' ? 'qcm' : 'tableau')), `${type} : format mélangé par erreur`)
    for (const q of s) {
      assert.ok(q.affirmation.length > 5 && q.correction.length > 10)
      if (q.type === 'tableau') {
        assert.ok(q.texte?.tableau?.lignes.length >= 3, 'tableau absent')
        assert.equal(q.choix, undefined)
      } else {
        assert.equal(q.texte, null)
        assert.equal(q.choix.length, 4)
        assert.equal(new Set(q.choix).size, 4)
        assert.equal(q.choix.filter((c) => c === q.reponseAttendue).length, 1)
        assert.equal(q.reponseAttendue, reponseDeBanque[q.id], 'la bonne réponse a changé de sens après mélange')
        positions[q.choix.indexOf(q.reponseAttendue)]++
      }
    }
  }
}
const total = positions.reduce((a, b) => a + b, 0)
assert.ok(positions.every((n) => n / total > 0.2 && n / total < 0.3), `bonne réponse mal répartie : ${positions}`)
console.log(`OK : 900 sessions tirées (tableaux, QCM, mélange) ; place de la bonne réponse : ${positions.map((n) => Math.round((100 * n) / total) + ' %').join(' / ')}`)
await vite.close()
