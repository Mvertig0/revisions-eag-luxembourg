// Réglages du module « Raisonnement verbal ».
// Pour changer la durée ou le nombre de questions, modifie UNIQUEMENT ces valeurs.

// Durée du chrono, en secondes (15 minutes). Le chrono ne bloque jamais la session.
export const DUREE_SESSION_SECONDES = 15 * 60

// Nombre de questions dans une session.
export const NB_QUESTIONS = 20

// Clé de sauvegarde (le stockage ajoute lui-même le préfixe « eag: »).
// Le lot « suivi » lira cette liste : ne pas changer son format sans demander.
export const CLE_SESSIONS = 'verbal:sessions'

// Les trois réponses possibles, dans l'ordre d'affichage.
export const REPONSES = ['Vrai', 'Faux', 'Indéterminé']

// Formats de session proposés sur l'écran d'accueil du verbal.
export const TYPES_SESSION = [
  { id: 'melange', nom: 'Mélange', description: 'Les trois formats ensemble.' },
  { id: 'vfi', nom: 'Vrai / Faux / Indéterminé', description: "Juger des affirmations d'après un texte." },
  { id: 'qcm', nom: 'QCM de compréhension', description: "Choisir la bonne proposition d'après un texte." },
  { id: 'consignes', nom: 'Consignes à suivre', description: 'Appliquer des règles à un cas précis.' },
]
