// Réglages du module « Raisonnement abstrait ».
// Pour changer la durée ou le nombre d'exercices, modifie UNIQUEMENT ces valeurs.

// Durée du chrono, en secondes. ESTIMATION : l'épreuve dure 2 h pour 6 tests, soit environ 20 min par test.
// Les durées et nombres de questions réels par test ne sont pas publiés (voir cadrage-examen.md).
export const DUREE_SESSION_SECONDES = 20 * 60

// Nombre d'exercices dans une session (estimation).
export const NB_QUESTIONS = 15

// Clé de sauvegarde (le stockage ajoute lui-même le préfixe « eag: »).
// Chaque session garde le type, le niveau et le numéro (graine) de chaque exercice : le futur suivi peut les rejouer.
export const CLE_SESSIONS = 'abstrait:sessions'

export const NIVEAUX = [
  { id: 'facile', nom: 'Facile' },
  { id: 'moyen', nom: 'Moyen' },
  { id: 'difficile', nom: 'Difficile' },
  { id: 'expert', nom: 'Expert' },
]

export const LETTRES = ['A', 'B', 'C', 'D', 'E']
