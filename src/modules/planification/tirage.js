// Préparation d'une session de « Planification ». Aucun affichage ici.
// Les situations sont générées par programme à partir d'un numéro (graine). Une question a la même forme que celles
// du verbal et du numérique : l'écran de question est partagé.
import { melanger } from '../abstrait/generateur.js'
import { genererPlanification } from './generateurs'
import { NB_QUESTIONS } from './config'

const FORMATS = {
  melange: ['creneau-commun', 'ordre-valide', 'heure-de-fin', 'messages', 'echeance'],
  agenda: ['creneau-commun', 'heure-de-fin'],
  priorites: ['ordre-valide', 'messages', 'echeance'],
}

// type : 'melange', 'agenda' ou 'priorites'. niveau : 'facile' | 'moyen' | 'difficile' | 'expert'.
// Chaque modèle revient à tour de rôle, pour que la session soit variée.
export function tirerSessionType(type = 'melange', niveau = 'moyen', nb = NB_QUESTIONS, hasard = Math.random) {
  const modeles = FORMATS[type] ?? FORMATS.melange
  const ordre = []
  while (ordre.length < nb) ordre.push(...melanger(hasard, modeles))
  ordre.length = nb
  const vues = new Set()
  return ordre.map((modele) => {
    let graine
    do graine = 1 + Math.floor(hasard() * 4_000_000)
    while (vues.has(`${modele}-${graine}`))
    vues.add(`${modele}-${graine}`)
    const ex = genererPlanification(graine, niveau, [modele])
    const texte = { titre: ex.titre, theme: 'planification', etiquette: 'Situation', intro: ex.intro, tableau: ex.tableau, regles: ex.regles }
    return {
      id: `planification-${niveau}-${graine}`,
      affirmation: ex.enonce,
      reponseAttendue: ex.choix[ex.reponse],
      correction: ex.correction,
      texte,
      type: 'planification',
      choix: ex.choix,
      graine,
      niveau,
      modele: ex.modele,
    }
  })
}

export const nombreQuestions = () => NB_QUESTIONS
