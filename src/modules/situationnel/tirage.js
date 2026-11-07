// Préparation d'une session de « Jugement situationnel ». Aucun affichage ici.
// Un scénario a 4 réactions étiquetées par des critères (voir criteres.js). Chaque question demande la réaction la
// plus appropriée ou la moins appropriée : c'est le score calculé qui décide. L'ordre des réactions est mélangé à
// chaque session ; la correction cite les critères qui justifient le classement.
import banque from '../../data/exercices/situationnel.json'
import { melanger } from '../abstrait/generateur.js'
import { COMPETENCES, CRITERES } from './criteres.js'
import { NB_QUESTIONS } from './config.js'

const LETTRES = ['A', 'B', 'C', 'D']
const et = (liste) => (liste.length > 1 ? `${liste.slice(0, -1).join(', ')} et ${liste.at(-1)}` : liste[0])
const majuscule = (t) => t.charAt(0).toUpperCase() + t.slice(1)
const phrases = (tags, signe) => tags.filter((t) => Math.sign(CRITERES[t].poids) === signe).map((t) => CRITERES[t].phrase)

// Construit la question d'un scénario. `ordre` = indices des réactions dans l'ordre d'affichage ; `variante` = 'meilleure' ou 'pire'.
export function construireQuestion(scenario, variante, ordre) {
  const reactions = ordre.map((i, position) => ({ ...scenario.reactions[i], lettre: LETTRES[position], origine: i }))
  const meilleure = reactions.find((r) => r.origine === scenario.meilleure)
  const pire = reactions.find((r) => r.origine === scenario.pire)
  const cible = variante === 'meilleure' ? meilleure : pire
  let correction
  if (variante === 'meilleure') {
    const autres = reactions
      .filter((r) => r !== meilleure)
      .map((r) => {
        const defauts = phrases(r.tags, -1)
        return `${r.lettre} (elle ${defauts.length ? et(defauts) : "est moins complète : elle n'apporte pas tout ce qu'apporte " + meilleure.lettre}) `
      })
    correction = `La réaction ${meilleure.lettre} est la plus appropriée : elle ${et(phrases(meilleure.tags, 1))}. ${majuscule(scenario.principe)} Les autres réactions sont moins adaptées : ${autres.map((a) => a.trim()).join(' ; ')}.`
  } else {
    correction = `La réaction ${pire.lettre} est la moins appropriée : elle ${et(phrases(pire.tags, -1))}. ${majuscule(scenario.principe)} À l'inverse, la plus appropriée est la réaction ${meilleure.lettre} : elle ${et(phrases(meilleure.tags, 1))}.`
  }
  const texte = {
    titre: scenario.titre,
    theme: 'situationnel',
    etiquette: `Situation · ${COMPETENCES[scenario.competence]}`,
    texte: scenario.contexte,
  }
  return {
    id: `${scenario.id}-${variante}`,
    affirmation: variante === 'meilleure' ? 'Quelle est la réaction la plus appropriée ?' : 'Quelle est la réaction la moins appropriée ?',
    reponseAttendue: cible.texte,
    correction,
    texte,
    type: 'situationnel',
    lettres: true, // l'écran de question affiche A, B, C, D devant les réactions
    choix: reactions.map((r) => r.texte),
    scenario: scenario.id,
    competence: scenario.competence,
    variante,
  }
}

// type : 'melange', 'service' (servir le client-usager) ou 'conseil' (conseiller).
// Chaque scénario n'apparaît qu'une fois par session ; la moitié des questions demande la meilleure réaction,
// l'autre moitié la pire.
export function tirerSessionType(type = 'melange', donnees = banque, hasard = Math.random, nb = NB_QUESTIONS) {
  const pool = donnees.scenarios.filter((s) => type === 'melange' || s.competence === type)
  const choisis = melanger(hasard, pool).slice(0, Math.min(nb, pool.length))
  const variantes = melanger(hasard, choisis.map((_, k) => (k % 2 === 0 ? 'meilleure' : 'pire')))
  return choisis.map((s, k) => construireQuestion(s, variantes[k], melanger(hasard, [0, 1, 2, 3])))
}

export const nombreQuestions = (type = 'melange', donnees = banque) =>
  Math.min(NB_QUESTIONS, donnees.scenarios.filter((s) => type === 'melange' || s.competence === type).length)
