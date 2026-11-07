// Réglages du module « Planification ».
// Pour changer la durée ou le nombre de questions, modifie UNIQUEMENT ces valeurs.

// Durée du chrono, en secondes. ESTIMATION : l'épreuve dure 2 h pour 6 tests, soit environ 20 min par test.
// Le temps et le nombre de questions réels du test de planification ne sont pas publiés (voir cadrage-examen.md).
export const DUREE_SESSION_SECONDES = 20 * 60

// Nombre de questions dans une session (estimation : chaque situation demande de la lecture).
export const NB_QUESTIONS = 12

// Clé de sauvegarde (le stockage ajoute lui-même le préfixe « eag: »).
export const CLE_SESSIONS = 'planification:sessions'

// Formats de session proposés sur l'écran d'accueil.
export const TYPES_SESSION = [
  { id: 'melange', nom: 'Mélange', description: 'Agenda, tâches et messages ensemble.' },
  { id: 'agenda', nom: 'Agenda et horaires', description: 'Trouver un créneau commun, calculer une heure de fin.' },
  { id: 'priorites', nom: 'Ordre et priorités', description: 'Ordonner des tâches, classer des messages, repérer une échéance manquée.' },
]

export const NIVEAUX = [
  { id: 'facile', nom: 'Facile' },
  { id: 'moyen', nom: 'Moyen' },
  { id: 'difficile', nom: 'Difficile' },
  { id: 'expert', nom: 'Expert' },
]
