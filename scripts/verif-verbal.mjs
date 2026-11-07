// Vérifie le tirage d'une session de verbal : node scripts/verif-verbal.mjs (depuis le dossier app)
import assert from 'node:assert/strict'
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { tirerSession } = await vite.ssrLoadModule('/src/modules/verbal/tirage.js')
const { default: banque } = await vite.ssrLoadModule('/src/data/exercices/verbal.json')
const { NB_QUESTIONS } = await vite.ssrLoadModule('/src/modules/verbal/config.js')

const toutes = banque.textes.flatMap((t) => t.affirmations)
const compte = (qs, r) => qs.filter((q) => q.reponseAttendue === r).length
let vusTextes = new Set()
let minTextes = 99
let maxTextes = 0

for (let i = 0; i < 1000; i++) {
  const s = tirerSession()
  assert.equal(s.length, NB_QUESTIONS, 'nombre de questions')
  assert.equal(new Set(s.map((q) => q.id)).size, s.length, 'questions en double')
  // chaque question appartient bien à son texte, et les affirmations d'un texte sont côte à côte
  const ordreTextes = []
  for (const q of s) {
    assert.ok(q.id.startsWith(q.texte.id + '-'))
    assert.ok(q.texte.texte.length > 50)
    if (ordreTextes.at(-1) !== q.texte.id) ordreTextes.push(q.texte.id)
  }
  assert.equal(new Set(ordreTextes).size, ordreTextes.length, 'un texte revient plus loin dans la session')
  minTextes = Math.min(minTextes, ordreTextes.length)
  maxTextes = Math.max(maxTextes, ordreTextes.length)
  ordreTextes.forEach((id) => vusTextes.add(id))
  // équilibre des réponses attendues
  for (const r of ['Vrai', 'Faux', 'Indéterminé']) {
    const n = compte(s, r)
    assert.ok(n >= 5 && n <= 9, `réponse ${r} : ${n} sur ${NB_QUESTIONS}`)
  }
  // la réponse attendue correspond à la banque
  for (const q of s) assert.equal(q.reponseAttendue, toutes.find((a) => a.id === q.id).reponse)
}
assert.equal(vusTextes.size, banque.textes.length, 'tous les textes finissent par être tirés')

// banque trop petite : on rend tout ce qu'il y a, sans erreur
const petite = banque.textes.slice(0, 2)
assert.equal(tirerSession(petite).length, petite.flatMap((t) => t.affirmations).length)
// banque d'origine (9 textes, 21 affirmations) : toujours 20 questions
assert.equal(tirerSession(banque.textes.slice(0, 9)).length, NB_QUESTIONS)

// ---------- QCM, consignes et mélange ----------
const { tirerSessionType, nombreQuestions } = await vite.ssrLoadModule('/src/modules/verbal/tirage.js')
const reponseDeBanque = {}
for (const b of [...banque.qcm, ...banque.consignes]) for (const q of b.questions) reponseDeBanque[q.id] = q.choix[q.reponse]
const positions = [0, 0, 0, 0]
for (const type of ['vfi', 'qcm', 'consignes', 'melange']) {
  for (let i = 0; i < 300; i++) {
    const s = tirerSessionType(type)
    assert.equal(s.length, nombreQuestions(type), `${type} : nombre de questions`)
    assert.equal(new Set(s.map((q) => q.id)).size, s.length, `${type} : questions en double`)
    const parType = (t) => s.filter((q) => q.type === t).length
    if (type === 'melange') {
      assert.equal(parType('qcm'), 5)
      assert.equal(parType('consignes'), 5)
      assert.equal(parType('vfi'), NB_QUESTIONS - 10)
    } else assert.ok(s.every((q) => q.type === type), `${type} : format mélangé par erreur`)
    for (const q of s) {
      assert.ok(q.affirmation.length > 5 && q.correction.length > 10 && q.texte)
      if (q.type === 'vfi') assert.equal(q.choix, undefined)
      else {
        assert.equal(q.choix.length, 4)
        assert.equal(new Set(q.choix).size, 4)
        assert.equal(q.choix.filter((c) => c === q.reponseAttendue).length, 1, 'bonne réponse absente ou en double')
        assert.equal(q.reponseAttendue, reponseDeBanque[q.id], 'la bonne réponse a changé de sens après mélange')
        if (type === 'qcm') positions[q.choix.indexOf(q.reponseAttendue)]++
        assert.ok(q.type === 'qcm' ? typeof q.texte.texte === 'string' : Array.isArray(q.texte.regles))
      }
    }
  }
}
const totalPos = positions.reduce((a, b) => a + b, 0)
assert.ok(positions.every((n) => n / totalPos > 0.18 && n / totalPos < 0.32), `bonne réponse mal répartie : ${positions}`)
console.log(`OK : QCM, consignes et mélange vérifiés (place de la bonne réponse en QCM : ${positions.map((n) => Math.round((100 * n) / totalPos) + ' %').join(' / ')})`)

console.log(`OK : 1000 sessions tirées (${minTextes} à ${maxTextes} textes par session, ${vusTextes.size}/${banque.textes.length} textes vus)`)
await vite.close()
