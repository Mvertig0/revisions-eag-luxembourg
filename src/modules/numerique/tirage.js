// Préparation d'une session de « Raisonnement numérique ». Aucun affichage ici.
// Deux formats : tableaux de données (Vrai / Faux / Indéterminé) et QCM à 4 propositions.
// Une question a la même forme que celles du verbal (voir verbal/tirage.js) : l'écran de question est partagé.

import banque from '../../data/exercices/numerique.json'
import { melanger, piocher } from '../verbal/tirage'
import { NB_QUESTIONS } from './config'

function groupesTableaux(tableaux) {
  return tableaux.map(({ questions, entetes, alignements, lignes, ...meta }) => {
    const texte = { ...meta, tableau: { entetes, alignements, lignes } }
    return {
      texte,
      questions: questions.map((q) => ({
        id: q.id,
        affirmation: q.affirmation,
        reponseAttendue: q.reponse,
        correction: q.correction,
        texte,
        type: 'tableau',
      })),
    }
  })
}

function groupesQcm(series, hasard) {
  return series.map(({ questions, theme }) => ({
    texte: null, // un QCM numérique porte tout son énoncé dans la question
    questions: questions.map((q) => ({
      id: q.id,
      affirmation: q.enonce,
      reponseAttendue: q.choix[q.reponse],
      correction: q.correction,
      texte: null,
      type: 'qcm',
      theme,
      choix: melanger(q.choix, hasard), // l'ordre des propositions change à chaque session
    })),
  }))
}

const compter = (groupes) => groupes.reduce((n, g) => n + g.questions.length, 0)
const NB_TABLEAUX_MELANGE = 8

// type : 'melange', 'tableaux' ou 'qcm'. Le mélange prend 8 questions de tableaux, le reste en QCM.
export function tirerSessionType(type = 'melange', donnees = banque, hasard = Math.random) {
  const tableaux = groupesTableaux(donnees.tableaux)
  const qcm = groupesQcm(donnees.series, hasard)
  if (type === 'tableaux') return piocher(tableaux, NB_QUESTIONS, hasard)
  if (type === 'qcm') return piocher(qcm, NB_QUESTIONS, hasard)
  const nbTableaux = Math.min(NB_TABLEAUX_MELANGE, compter(tableaux))
  const parties = [piocher(tableaux, nbTableaux, hasard), piocher(qcm, NB_QUESTIONS - nbTableaux, hasard)]
  return melanger(parties, hasard).flat() // les deux formats se suivent par blocs, dans un ordre aléatoire
}

// Nombre de questions d'une session de ce type (peut être inférieur à NB_QUESTIONS si la banque est petite).
export function nombreQuestions(type = 'melange', donnees = banque) {
  const tableaux = donnees.tableaux.reduce((n, t) => n + t.questions.length, 0)
  const qcm = donnees.series.reduce((n, s) => n + s.questions.length, 0)
  if (type === 'tableaux') return Math.min(NB_QUESTIONS, tableaux)
  if (type === 'qcm') return Math.min(NB_QUESTIONS, qcm)
  const nbTableaux = Math.min(NB_TABLEAUX_MELANGE, tableaux)
  return Math.min(NB_QUESTIONS, nbTableaux + qcm)
}
