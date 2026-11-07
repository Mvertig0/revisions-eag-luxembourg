// Préparation d'une session de « Raisonnement numérique ». Aucun affichage ici.
// Formats : tableaux de données (Vrai / Faux / Indéterminé, rédigés), graphiques, suites de nombres et calculs
// (générés par programme à partir d'un numéro), et QCM rédigés. Une question a la même forme que celles du verbal
// (voir verbal/tirage.js) : l'écran de question est partagé.

import banque from '../../data/exercices/numerique.json'
import { melanger, piocher } from '../verbal/tirage'
import { genererGraphique } from './graphiques'
import { genererSuite } from './suites'
import { genererCalcul } from './calculs'
import { NB_QUESTIONS } from './config'

// ---------- contenu rédigé (numerique.json) ----------
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

function groupesQcmRediges(series, hasard) {
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

// ---------- contenu généré ----------
const graineAlea = (hasard, vues) => {
  let g
  do g = 1 + Math.floor(hasard() * 4_000_000)
  while (vues.has(g))
  vues.add(g)
  return g
}

function groupeGraphique(ex) {
  const texte = { titre: ex.titre, theme: 'graphique', graphique: ex.svg }
  return {
    texte,
    questions: ex.questions.map((q, k) => ({
      id: `graphique-${ex.niveau}-${ex.graine}-${k + 1}`,
      affirmation: q.enonce,
      reponseAttendue: q.choix[q.reponse],
      correction: q.correction,
      texte,
      type: 'graphique',
      choix: q.choix, // déjà mélangées par le générateur (même numéro = même ordre)
      graine: ex.graine,
      niveau: ex.niveau,
      modele: q.modele,
    })),
  }
}

function groupeSimple(ex, type) {
  return {
    texte: null,
    questions: [
      {
        id: `${type}-${ex.niveau}-${ex.graine}`,
        affirmation: ex.enonce,
        reponseAttendue: ex.choix[ex.reponse],
        correction: ex.correction,
        texte: null,
        type,
        choix: ex.choix,
        graine: ex.graine,
        niveau: ex.niveau,
        modele: ex.modele ?? ex.famille,
      },
    ],
  }
}

// Tire `nb` questions d'une famille générée. Les graphiques arrivent par blocs de 3 questions.
function tirerGenere(famille, niveau, nb, hasard, vues) {
  if (nb <= 0) return []
  if (famille === 'graphique') {
    const groupes = Array.from({ length: Math.ceil(nb / 3) }, () => groupeGraphique(genererGraphique(graineAlea(hasard, vues), niveau)))
    return piocher(groupes, nb, hasard)
  }
  const gen = famille === 'suite' ? genererSuite : genererCalcul
  return Array.from({ length: nb }, () => groupeSimple(gen(graineAlea(hasard, vues), niveau), famille).questions[0])
}

const groupesTableauxBanque = (donnees) => groupesTableaux(donnees.tableaux)
const compter = (groupes) => groupes.reduce((n, g) => n + g.questions.length, 0)

// Composition du mélange : { famille: nombre de questions }.
const MELANGE = { tableau: 4, graphique: 6, suite: 5, calcul: 5 }

// type : 'melange', 'tableaux', 'graphiques', 'suites', 'calcul' ou 'qcm' (QCM rédigés).
// niveau : 'facile' | 'moyen' | 'difficile' | 'expert' (pour les exercices générés).
export function tirerSessionType(type = 'melange', niveau = 'moyen', donnees = banque, hasard = Math.random) {
  const vues = new Set()
  const tableaux = groupesTableauxBanque(donnees)
  if (type === 'tableaux') return piocher(tableaux, NB_QUESTIONS, hasard)
  if (type === 'qcm') return piocher(groupesQcmRediges(donnees.series, hasard), NB_QUESTIONS, hasard)
  if (type === 'graphiques') return tirerGenere('graphique', niveau, NB_QUESTIONS, hasard, vues)
  if (type === 'suites') return tirerGenere('suite', niveau, NB_QUESTIONS, hasard, vues)
  if (type === 'calcul') return tirerGenere('calcul', niveau, NB_QUESTIONS, hasard, vues)
  const parties = [
    piocher(tableaux, Math.min(MELANGE.tableau, compter(tableaux)), hasard),
    tirerGenere('graphique', niveau, MELANGE.graphique, hasard, vues),
    tirerGenere('suite', niveau, MELANGE.suite, hasard, vues),
    tirerGenere('calcul', niveau, MELANGE.calcul, hasard, vues),
  ]
  return melanger(parties, hasard).flat() // les formats se suivent par blocs, dans un ordre aléatoire
}

// Nombre de questions d'une session de ce type (peut être inférieur à NB_QUESTIONS si la banque rédigée est petite).
export function nombreQuestions(type = 'melange', donnees = banque) {
  const tableaux = donnees.tableaux.reduce((n, t) => n + t.questions.length, 0)
  const qcm = donnees.series.reduce((n, s) => n + s.questions.length, 0)
  if (type === 'tableaux') return Math.min(NB_QUESTIONS, tableaux)
  if (type === 'qcm') return Math.min(NB_QUESTIONS, qcm)
  if (type === 'melange') return Math.min(MELANGE.tableau, tableaux) + MELANGE.graphique + MELANGE.suite + MELANGE.calcul
  return NB_QUESTIONS
}
