// Vérifie les calculs du suivi sur des sessions fabriquées, dont on connaît les résultats à la main :
// node scripts/verif-suivi.mjs (depuis le dossier app)
import assert from 'node:assert/strict'
import { MODULES_SUIVI, analyser, exporter, historique, modulesSansSession, normaliserSessions, pointsFaibles, repartir, resumer } from '../src/modules/suivi/calculs.js'

const jour = (n) => new Date(Date.UTC(2026, 10, n, 10)).toISOString()
const detail = (correct, extra = {}) => ({ correct, ...extra })

// ----- normalisation -----
const brut = [
  { id: 'b', date: jour(3), score: 6, total: 10, dureeSecondes: 300, details: [] },
  { id: 'a', date: jour(1), score: 5, total: 10, dureeSecondes: 200, details: [] },
  { id: 'test-x', date: jour(2), score: 9, total: 10, details: [] }, // session simulée : ignorée
  { id: 'c', date: 'pas une date', score: 5, total: 10 }, // date invalide : ignorée
  { id: 'd', date: jour(4), score: 12, total: 10 }, // score impossible : ignoré
  { id: 'e', date: jour(5), score: 0, total: 0 }, // total nul : ignoré
  null,
]
const propres = normaliserSessions(brut)
assert.deepEqual(propres.map((s) => s.id), ['a', 'b'], 'tri par date et filtrage')
assert.deepEqual(normaliserSessions(null), [])
assert.deepEqual(normaliserSessions('abc'), [])
assert.equal(propres[0].pct, 50)

// ----- résumé -----
assert.deepEqual(resumer([]), { n: 0 })
const r2 = resumer(propres)
assert.equal(r2.n, 2)
assert.equal(r2.moyenne, 55) // (5 + 6) / (10 + 10)
assert.equal(r2.derniere, 60)
assert.equal(r2.meilleure, 60)
assert.equal(r2.tendance, null, 'moins de 4 sessions : pas de tendance')
assert.equal(r2.secondesParQuestion, 25) // 500 s pour 20 questions

const serie = (pcts) => normaliserSessions(pcts.map((p, i) => ({ id: String(i), date: jour(i + 1), score: p, total: 100, dureeSecondes: 600, details: [] })))
assert.equal(resumer(serie([40, 50, 60, 70])).tendance, 20) // k = 2 : (60+70)/2 − (40+50)/2 = 65 − 45
assert.equal(resumer(serie([10, 20, 30, 50, 60, 70])).tendance, 40) // k = 3 : 60 − 20
assert.equal(resumer(serie([70, 60, 50, 40])).tendance, -20, 'baisse')
assert.equal(resumer(serie([50, 50, 50, 50, 50])).tendance, 0)

// ----- répartition par groupe -----
const sessions = normaliserSessions([
  { id: '1', date: jour(1), score: 3, total: 4, details: [detail(true, { famille: 'serie', niveau: 'facile' }), detail(true, { famille: 'serie', niveau: 'facile' }), detail(false, { famille: 'intrus', niveau: 'moyen' }), detail(true, { famille: 'intrus', niveau: 'moyen' })] },
  { id: '2', date: jour(2), score: 1, total: 2, details: [detail(false, { famille: 'intrus', niveau: 'moyen' }), detail(true, { famille: 'serie', niveau: 'facile' })] },
])
const rep = repartir(sessions, (d) => d.famille)
assert.deepEqual(rep, [
  { cle: 'intrus', bonnes: 1, total: 3, pct: 33 },
  { cle: 'serie', bonnes: 3, total: 3, pct: 100 },
], 'du plus faible au plus fort')
assert.deepEqual(repartir(sessions, (d) => d.famille, 4), [], 'minimum de réponses')
assert.deepEqual(repartir(sessions, (d) => d.niveau).map((e) => [e.cle, e.pct]), [['moyen', 33], ['facile', 100]])
assert.deepEqual(repartir(sessions, () => null), [], 'groupe absent ignoré')

// ----- analyse complète sur un faux stockage -----
const faux = {
  'verbal:sessions': [
    { id: 'v1', date: jour(1), score: 10, total: 20, dureeSecondes: 800, details: Array.from({ length: 20 }, (_, i) => detail(i < 10, { type: i < 10 ? 'vfi' : 'qcm' })) }, // 10 vfi justes, 10 qcm faux
  ],
  'abstrait:sessions': [
    { id: 'a1', date: jour(2), score: 9, total: 12, niveau: 'moyen', details: Array.from({ length: 12 }, (_, i) => detail(i < 9, { famille: 'matrice', niveau: 'moyen' })) },
  ],
}
const analyse = analyser((cle) => faux[cle] ?? null)
assert.equal(analyse.verbal.resume.n, 1)
assert.equal(analyse.verbal.resume.moyenne, 50)
assert.deepEqual(analyse.verbal.groupes.map((g) => [g.cle, g.pct, g.total]), [['qcm', 0, 10], ['vfi', 100, 10]])
assert.equal(analyse.numerique.resume.n, 0)
assert.deepEqual(modulesSansSession(analyse), ['numerique', 'planification', 'situationnel'])
assert.deepEqual(pointsFaibles(analyse), [
  { module: 'verbal', cle: 'qcm', nom: 'QCM de compréhension', pct: 0, total: 10 },
  { module: 'abstrait', cle: 'matrice', nom: 'Matrices 3×3', pct: 75, total: 12 },
], 'points faibles : au moins 8 réponses, moins de 100 %')
const h = historique(analyse)
assert.deepEqual(h.map((s) => [s.module, s.id]), [['abstrait', 'a1'], ['verbal', 'v1']], 'plus récent d\'abord')
const exp = exporter((cle) => faux[cle] ?? null, new Date(Date.UTC(2026, 10, 9)))
assert.equal(exp.sessions['verbal:sessions'].length, 1)
assert.deepEqual(exp.sessions['numerique:sessions'], [])
assert.deepEqual(Object.keys(exp.sessions), MODULES_SUIVI.map((m) => m.cle))
assert.doesNotThrow(() => JSON.stringify(exp))

// ----- le format réel de chaque module est bien lu -----
const formats = {
  abstrait: { details: [{ famille: 'pliage', correct: true }] },
  verbal: { details: [{ correct: true }] }, // ancien format sans type
  numerique: { details: [{ type: 'graphique', correct: false }] },
  planification: { details: [{ modele: 'echeance', correct: true }] },
  situationnel: { details: [{ competence: 'conseil', correct: true }] },
}
for (const m of MODULES_SUIVI) {
  const f = formats[m.id]
  const g = repartir(normaliserSessions([{ id: 'x', date: jour(1), score: 1, total: 1, ...f }]), m.groupe)
  assert.equal(g.length, 1, `${m.id} : groupe non reconnu`)
}
console.log('OK : calculs du suivi vérifiés (filtrage, tendance, répartition, points faibles, historique, export, 5 formats de modules)')
