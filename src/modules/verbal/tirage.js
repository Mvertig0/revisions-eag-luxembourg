// Préparation d'une session de « Raisonnement verbal ».
// Ce fichier ne contient aucun affichage : il prend la banque d'exercices et renvoie la liste des questions.

import banque from '../../data/exercices/verbal.json'
import { NB_QUESTIONS } from './config'

// Mélange une liste (Fisher-Yates) sans modifier l'originale.
// `hasard` renvoie un nombre entre 0 et 1 ; on peut le remplacer pour les tests.
export function melanger(liste, hasard = Math.random) {
  const copie = [...liste]
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1))
    ;[copie[i], copie[j]] = [copie[j], copie[i]]
  }
  return copie
}

// Renvoie les questions d'une session, dans l'ordre où elles seront posées.
// Chaque question : { id, affirmation, reponseAttendue, correction, texte }
// où `texte` est le texte complet (id, titre, theme, niveau, texte).
//
// On tire des TEXTES entiers (comme à l'examen : quelques textes, plusieurs affirmations chacun),
// jusqu'à avoir au moins NB_QUESTIONS affirmations. Si on dépasse, on retire au hasard l'excédent
// sans jamais vider un texte. Les textes récents ont une affirmation vraie, une fausse et une
// indéterminée ; on vérifie en plus l'équilibre de la session (voir plus bas).
export function tirerSession(textes = banque.textes, hasard = Math.random) {
  // Les textes à 2 affirmations (anciens lots) ne sont pas équilibrés : on retire au sort jusqu'à obtenir
  // une session où chaque réponse (Vrai, Faux, Indéterminé) pèse entre 25 % et 45 % des questions.
  const min = Math.ceil(NB_QUESTIONS * 0.25)
  const max = Math.ceil(NB_QUESTIONS * 0.45)
  let session = tirerUneSession(textes, hasard)
  for (let essai = 0; essai < 200; essai++) {
    const nombres = ['Vrai', 'Faux', 'Indéterminé'].map((r) => session.filter((q) => q.reponseAttendue === r).length)
    if (nombres.every((n) => n >= min && n <= max) || session.length < NB_QUESTIONS) break
    session = tirerUneSession(textes, hasard)
  }
  return session
}

function tirerUneSession(textes, hasard) {
  // 1. Textes au hasard, jusqu'à avoir assez d'affirmations.
  const choisis = []
  let total = 0
  for (const texte of melanger(textes, hasard)) {
    if (total >= NB_QUESTIONS) break
    choisis.push({ texte, affirmations: [...texte.affirmations] })
    total += texte.affirmations.length
  }

  // 2. On retire l'excédent : au hasard, parmi les textes qui gardent au moins 1 affirmation.
  for (let aRetirer = total - NB_QUESTIONS; aRetirer > 0; aRetirer--) {
    const candidats = choisis.filter((c) => c.affirmations.length > 1)
    if (candidats.length === 0) break
    const c = candidats[Math.floor(hasard() * candidats.length)]
    c.affirmations.splice(Math.floor(hasard() * c.affirmations.length), 1)
  }

  // 3. Les affirmations d'un même texte restent côte à côte, dans leur ordre d'origine.
  return choisis.flatMap(({ texte, affirmations }) =>
    affirmations.map((a) => ({
      id: a.id,
      affirmation: a.affirmation,
      reponseAttendue: a.reponse,
      correction: a.correction,
      texte,
    })),
  )
}
