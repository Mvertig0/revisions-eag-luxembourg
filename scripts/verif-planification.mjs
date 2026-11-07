// Vérifie la planification : node scripts/verif-planification.mjs (depuis le dossier app)
// Chaque réponse est recalculée par un solveur indépendant (simulation minute par minute, force brute),
// sans réutiliser les fonctions du générateur.
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { genererPlanification, NOMS_MODELES } from '../src/modules/planification/generateurs.js'

const NIVEAUX = ['facile', 'moyen', 'difficile', 'expert']
const json = (x) => JSON.stringify(x)
const heure = (m) => `${Math.floor(m / 60)} h${m % 60 ? ` ${String(m % 60).padStart(2, '0')}` : ''}`
const plage = (a, b) => `de ${heure(a)} à ${heure(b)}`
const vus = {}

for (const niveau of NIVEAUX) {
  for (let graine = 1; graine <= 400; graine++) {
    const ex = genererPlanification(graine, niveau)
    const ou = `${ex.modele} ${niveau} graine ${graine}`
    vus[ex.modele] = (vus[ex.modele] ?? 0) + 1
    assert.equal(ex.choix.length, 4, `${ou} : propositions`)
    assert.equal(new Set(ex.choix).size, 4, `${ou} : propositions identiques`)
    assert.ok(ex.reponse >= 0 && ex.reponse <= 3)
    assert.equal(ex.choix[ex.reponse], ex.valeur, `${ou} : valeur ≠ proposition`)
    assert.ok(ex.correction.length > 40 && ex.intro.length > 20 && ex.tableau.lignes.length >= 2)
    const d = ex.donnees

    if (ex.modele === 'creneau-commun') {
      // on balaie chaque minute de chaque proposition : qui est occupé ?
      const occupeA = (p, minute) => d.occupe[p].some(([x, y]) => minute >= x && minute < y)
      const libreTous = (a) => {
        for (let minute = a; minute < a + d.duree; minute++) {
          if (d.noms.some((_, p) => occupeA(p, minute))) return false
          if (d.pause && minute >= d.pause[0] && minute < d.pause[1]) return false
        }
        return true
      }
      const valides = d.options.filter(libreTous)
      assert.deepEqual(valides, [d.bonne], `${ou} : une seule proposition doit convenir`)
      assert.equal(ex.choix[ex.reponse], plage(d.bonne, d.bonne + d.duree))
      assert.ok(d.bonne >= 480 && d.bonne + d.duree <= 1080)
    }

    if (ex.modele === 'ordre-valide') {
      const validerOrdre = (ordre) => {
        // heure de fin de chaque tâche, en additionnant minute après minute
        const fin = {}
        let t = d.debut
        for (const i of ordre) { for (let k = 0; k < d.taches[i].duree; k++) t++; fin[i] = t }
        return d.contraintes.every((c) => {
          if (c.type === 'avant') return ordre.findIndex((x) => x === c.a) < ordre.findIndex((x) => x === c.b)
          if (c.type === 'premier') return ordre[0] === c.a
          if (c.type === 'dernier') return ordre[ordre.length - 1] === c.a
          return fin[c.a] <= c.h
        })
      }
      const valides = d.options.filter(validerOrdre)
      assert.deepEqual(valides, [d.bonne], `${ou} : un seul ordre doit être valide`)
      assert.equal(ex.choix[ex.reponse], d.bonne.map((i) => d.taches[i].nom).join(' → '))
      assert.ok(d.options.every((o) => [...o].sort().join() === d.taches.map((_, i) => i).join()), `${ou} : une proposition n'est pas une permutation`)
    }

    if (ex.modele === 'heure-de-fin') {
      const total = d.durees.reduce((a, b) => a + b, 0)
      const bloque = (minute) => d.blocs.some(([a, b]) => minute >= a && minute < b)
      let travaille = 0, minute = d.debut
      while (travaille < total) { if (!bloque(minute)) travaille++; minute++ }
      assert.equal(minute, d.fin, `${ou} : fin ${d.fin}, simulation ${minute}`)
      assert.equal(ex.choix[ex.reponse], heure(minute))
      assert.ok(d.fin > d.debut + total, `${ou} : la réunion n'a aucun effet`)
    }

    if (ex.modele === 'messages') {
      const E = { Direction: 3, Usager: 2, Collègue: 1, Fournisseur: 0 }
      const C = { "Aujourd'hui": 3, Demain: 2, Vendredi: 1, 'Sans échéance': 0 }
      // tri en passes successives : d'abord la clé la moins importante, puis les plus importantes (tri stable)
      let liste = [...d.lignes].sort((a, b) => a.duree - b.duree)
      if (d.regle === 'R1') liste = liste.sort((a, b) => C[b.echeance] - C[a.echeance])
      if (d.regle === 'R2') {
        liste = liste.sort((a, b) => (a.echeance === "Aujourd'hui" && b.echeance === "Aujourd'hui" ? E[b.emetteur] - E[a.emetteur] : 0))
        liste = [...liste.filter((m) => m.echeance === "Aujourd'hui").sort((a, b) => E[b.emetteur] - E[a.emetteur] || a.duree - b.duree), ...liste.filter((m) => m.echeance !== "Aujourd'hui").sort((a, b) => a.duree - b.duree)]
      }
      if (d.regle === 'R3') liste = liste.sort((a, b) => E[b.emetteur] + C[b.echeance] - (E[a.emetteur] + C[a.echeance]))
      const attendu = d.rang === 1 ? liste[0].id : liste.at(-1).id
      assert.equal(attendu, d.bonne, `${ou} : le solveur trouve ${attendu}, la banque ${d.bonne}`)
      assert.equal(ex.choix[ex.reponse], attendu)
      assert.equal(new Set(d.lignes.map((m) => m.id)).size, 5)
    }

    if (ex.modele === 'echeance') {
      let t = d.debut
      const enRetard = []
      d.noms.forEach((nom, i) => {
        for (let k = 0; k < d.durees[i]; k++) t++
        if (t > d.echeances[i]) enRetard.push(nom)
      })
      assert.deepEqual(enRetard, [d.bonne], `${ou} : exactement une tâche doit être en retard`)
      assert.equal(ex.choix[ex.reponse], d.bonne)
    }

    assert.equal(json(genererPlanification(graine, niveau)), json(ex), `${ou} : même numéro, exercice différent`)
  }
}
assert.equal(Object.keys(vus).length, NOMS_MODELES.length, `modèles jamais tirés : ${NOMS_MODELES.filter((m) => !vus[m])}`)
console.log(`OK : ${4 * 400} exercices de planification recalculés par un solveur indépendant`, vus)

// ---------- tirage d'une session ----------
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { tirerSessionType } = await vite.ssrLoadModule('/src/modules/planification/tirage.js')
const { NB_QUESTIONS } = await vite.ssrLoadModule('/src/modules/planification/config.js')
const FORMATS = { melange: 5, agenda: 2, priorites: 3 } // nombre de modèles de chaque format
const positions = [0, 0, 0, 0]
for (const [type, nbModeles] of Object.entries(FORMATS)) {
  for (const niveau of NIVEAUX) {
    for (let i = 0; i < 40; i++) {
      const s = tirerSessionType(type, niveau)
      assert.equal(s.length, NB_QUESTIONS)
      assert.equal(new Set(s.map((q) => q.id)).size, NB_QUESTIONS, 'questions en double')
      assert.equal(new Set(s.map((q) => q.modele)).size, Math.min(nbModeles, NB_QUESTIONS), `${type} : tous les modèles doivent apparaître`)
      for (const q of s) {
        assert.equal(q.choix.length, 4)
        assert.equal(q.choix.filter((c) => c === q.reponseAttendue).length, 1)
        assert.ok(q.texte.tableau.lignes.length >= 2 && q.texte.intro.length > 20)
        // l'exercice se retrouve à partir de son numéro, avec la même bonne réponse
        const ex = genererPlanification(q.graine, q.niveau, [q.modele])
        assert.equal(ex.choix[ex.reponse], q.reponseAttendue)
        positions[q.choix.indexOf(q.reponseAttendue)]++
      }
    }
  }
}
const total = positions.reduce((a, b) => a + b, 0)
assert.ok(positions.every((n) => n / total > 0.18 && n / total < 0.32), `bonne réponse mal répartie : ${positions}`)
console.log(`OK : sessions tirées pour 3 formats et 4 niveaux ; place de la bonne réponse : ${positions.map((n) => Math.round((100 * n) / total) + ' %').join(' / ')}`)
await vite.close()
