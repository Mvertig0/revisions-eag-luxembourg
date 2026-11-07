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

console.log(`OK : 1000 sessions tirées (${minTextes} à ${maxTextes} textes par session, ${vusTextes.size}/${banque.textes.length} textes vus)`)
await vite.close()
