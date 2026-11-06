// Outil de TEST (développement seulement) : fabrique de fausses sessions pour le module verbal.
// Aucun affichage ici. Le format est EXACTEMENT celui de la sauvegarde d'origine (voir pages/Verbal.jsx) :
// { id, date, dureeSecondes, score, total, details: [{ idAffirmation, reponseDonnee, reponseAttendue, correct }] }
// Seul signe de reconnaissance d'une session simulée : son `id` commence par « test- ».

import { lire, ecrire } from '../../storage/stockage'
import { CLE_SESSIONS, NB_QUESTIONS, REPONSES } from './config'
import { melanger, tirerSession } from './tirage'

export const PREFIXE_TEST = 'test-'

export function estSimulee(session) {
  return typeof session?.id === 'string' && session.id.startsWith(PREFIXE_TEST)
}

// Entier au hasard entre min et max (inclus).
function entierEntre(min, max, hasard) {
  return min + Math.floor(hasard() * (max - min + 1))
}

// Construit une session simulée. `hasard` et `maintenant` sont remplaçables pour les tests automatiques.
export function creerSessionSimulee(hasard = Math.random, maintenant = new Date()) {
  const questions = tirerSession(undefined, hasard) // de vraies affirmations de la banque
  const total = questions.length
  const score = Math.min(entierEntre(8, 18, hasard), total)
  // On choisit au hasard quelles lignes sont justes, pour que `details` colle au score.
  const justes = new Set(melanger([...questions.keys()], hasard).slice(0, score))
  const details = questions.map((q, i) => {
    const correct = justes.has(i)
    const autres = REPONSES.filter((r) => r !== q.reponseAttendue)
    return {
      idAffirmation: q.id,
      reponseDonnee: correct ? q.reponseAttendue : autres[entierEntre(0, autres.length - 1, hasard)],
      reponseAttendue: q.reponseAttendue,
      correct,
    }
  })
  return {
    id: `${PREFIXE_TEST}${maintenant.getTime()}-${Math.floor(hasard() * 1e9).toString(36)}`,
    date: maintenant.toISOString(),
    dureeSecondes: entierEntre(300, 900, hasard),
    score,
    total: total || NB_QUESTIONS,
    details,
  }
}

function listeActuelle() {
  const liste = lire(CLE_SESSIONS, [])
  return Array.isArray(liste) ? liste : []
}

// Ajoute une session simulée à la fin de la liste. Renvoie true si l'écriture a réussi.
export function ajouterSessionSimulee() {
  return ecrire(CLE_SESSIONS, [...listeActuelle(), creerSessionSimulee()])
}

// Retire uniquement les sessions simulées. Renvoie { ok, retirees }.
export function effacerSessionsSimulees() {
  const liste = listeActuelle()
  const gardees = liste.filter((s) => !estSimulee(s))
  const retirees = liste.length - gardees.length
  if (retirees === 0) return { ok: true, retirees: 0 }
  return { ok: ecrire(CLE_SESSIONS, gardees), retirees }
}
