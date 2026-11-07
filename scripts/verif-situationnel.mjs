// Vérifie le jugement situationnel : node scripts/verif-situationnel.mjs (depuis le dossier app)
//  1. le classement de chaque scénario, recalculé ici à partir des critères (une seule meilleure et une seule pire réaction) ;
//  2. le tirage d'une session : réactions mélangées, bonne réponse cohérente, lettres citées dans la correction exactes.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'vite'

const banque = JSON.parse(readFileSync(new URL('../src/data/exercices/situationnel.json', import.meta.url), 'utf8'))
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { CRITERES } = await vite.ssrLoadModule('/src/modules/situationnel/criteres.js')
const { tirerSessionType, nombreQuestions } = await vite.ssrLoadModule('/src/modules/situationnel/tirage.js')
const { NB_QUESTIONS } = await vite.ssrLoadModule('/src/modules/situationnel/config.js')

// ---------- 1. classement ----------
for (const s of banque.scenarios) {
  const ou = s.id
  assert.equal(s.reactions.length, 4, `${ou} : 4 réactions`)
  const scores = s.reactions.map((r) => {
    let total = 0
    for (const t of r.tags) {
      assert.ok(t in CRITERES, `${ou} : critère inconnu ${t}`)
      assert.ok(CRITERES[t].competence === 'les deux' || CRITERES[t].competence === s.competence, `${ou} : critère ${t} hors compétence`)
      total += CRITERES[t].poids
    }
    assert.equal(total, r.score, `${ou} : score enregistré faux`)
    return total
  })
  const ordre = scores.map((x, i) => [x, i]).sort((a, b) => b[0] - a[0])
  assert.ok(ordre[0][0] > ordre[1][0], `${ou} : meilleure réaction non unique`)
  assert.ok(ordre[3][0] < ordre[2][0], `${ou} : pire réaction non unique`)
  assert.equal(ordre[0][1], s.meilleure)
  assert.equal(ordre[3][1], s.pire)
  assert.notEqual(s.meilleure, s.pire)
  assert.ok(s.reactions[s.meilleure].tags.some((t) => CRITERES[t].poids > 0), `${ou} : la meilleure réaction n'a aucune qualité`)
  assert.ok(s.reactions[s.pire].tags.some((t) => CRITERES[t].poids < 0), `${ou} : la pire réaction n'a aucun défaut`)
  assert.equal(new Set(s.reactions.map((r) => r.texte)).size, 4)
}
console.log(`OK : ${banque.scenarios.length} scénarios, classement recalculé (une meilleure et une pire réaction, sans égalité)`)

// ---------- 2. tirage ----------
const positionMeilleure = [0, 0, 0, 0]
const positionPire = [0, 0, 0, 0]
const parId = Object.fromEntries(banque.scenarios.map((s) => [s.id, s]))
for (const type of ['melange', 'service', 'conseil']) {
  for (let i = 0; i < 200; i++) {
    const session = tirerSessionType(type)
    assert.equal(session.length, nombreQuestions(type))
    assert.equal(session.length, Math.min(NB_QUESTIONS, banque.scenarios.filter((s) => type === 'melange' || s.competence === type).length))
    assert.equal(new Set(session.map((q) => q.scenario)).size, session.length, 'un scénario revient deux fois')
    const nbMeilleure = session.filter((q) => q.variante === 'meilleure').length
    assert.ok(Math.abs(nbMeilleure - (session.length - nbMeilleure)) <= 1, 'variantes déséquilibrées')
    for (const q of session) {
      const s = parId[q.scenario]
      if (type !== 'melange') assert.equal(s.competence, type)
      assert.equal(q.choix.length, 4)
      assert.equal(new Set(q.choix).size, 4)
      assert.deepEqual([...q.choix].sort(), s.reactions.map((r) => r.texte).sort(), 'les réactions ont changé')
      const attendue = s.reactions[q.variante === 'meilleure' ? s.meilleure : s.pire].texte
      assert.equal(q.reponseAttendue, attendue, `${q.id} : mauvaise réponse attendue`)
      assert.equal(q.choix.filter((c) => c === attendue).length, 1)
      // la correction nomme les bonnes lettres
      const lettre = 'ABCD'[q.choix.indexOf(attendue)]
      const lettreMeilleure = 'ABCD'[q.choix.indexOf(s.reactions[s.meilleure].texte)]
      assert.ok(q.correction.startsWith(`La réaction ${lettre} est la ${q.variante === 'meilleure' ? 'plus' : 'moins'} appropriée`), `${q.id} : la correction cite une mauvaise lettre`)
      if (q.variante === 'pire') assert.ok(q.correction.includes(`la plus appropriée est la réaction ${lettreMeilleure}`))
      assert.ok(q.correction.length > 120 && q.texte.texte.length > 100)
      if (q.variante === 'meilleure') positionMeilleure[q.choix.indexOf(attendue)]++
      else positionPire[q.choix.indexOf(attendue)]++
    }
  }
}
for (const [nom, pos] of [['meilleure', positionMeilleure], ['pire', positionPire]]) {
  const total = pos.reduce((a, b) => a + b, 0)
  assert.ok(pos.every((n) => n / total > 0.2 && n / total < 0.3), `place de la ${nom} réaction mal répartie : ${pos}`)
}
console.log('OK : sessions tirées pour les 3 formats ; réactions mélangées, lettres de la correction exactes, place de la bonne réponse uniforme')
await vite.close()
