// Réglages du module « Raisonnement numérique ».
// Pour changer la durée ou le nombre de questions, modifie UNIQUEMENT ces valeurs.

// Durée du chrono, en secondes. ESTIMATION : l'épreuve dure 2 h pour 6 tests, soit environ 20 min par test.
// Le temps et le nombre de questions réels du test numérique ne sont pas publiés (voir cadrage-examen.md).
export const DUREE_SESSION_SECONDES = 20 * 60

// Nombre de questions dans une session (estimation).
export const NB_QUESTIONS = 20

// Clé de sauvegarde (le stockage ajoute lui-même le préfixe « eag: »).
export const CLE_SESSIONS = 'numerique:sessions'

// Formats de session proposés sur l'écran d'accueil.
export const TYPES_SESSION = [
  { id: 'melange', nom: 'Mélange', description: 'Tableaux de données et QCM ensemble.' },
  { id: 'tableaux', nom: 'Tableaux de données', description: "Vrai, Faux ou Indéterminé d'après un tableau." },
  { id: 'qcm', nom: 'Calcul, suites et problèmes', description: 'QCM : pourcentages, suites de nombres, problèmes appliqués.' },
]
