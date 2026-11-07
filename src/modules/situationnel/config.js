// Réglages du module « Jugement situationnel ».
// Pour changer la durée ou le nombre de questions, modifie UNIQUEMENT ces valeurs.

// Durée du chrono, en secondes. ESTIMATION : l'épreuve dure 2 h pour 6 tests, dont 2 de jugement situationnel
// (servir le client-usager, conseiller). Le temps et le nombre de questions réels ne sont pas publiés (voir cadrage-examen.md).
export const DUREE_SESSION_SECONDES = 20 * 60

// Nombre de questions dans une session (estimation).
export const NB_QUESTIONS = 12

// Clé de sauvegarde (le stockage ajoute lui-même le préfixe « eag: »).
export const CLE_SESSIONS = 'situationnel:sessions'

// Formats de session proposés sur l'écran d'accueil (les deux compétences testées en A1).
export const TYPES_SESSION = [
  { id: 'melange', nom: 'Mélange', description: 'Servir le client-usager et conseiller ensemble.' },
  { id: 'service', nom: 'Servir le client-usager', description: "Guichet, téléphone, courriels : bien accueillir et traiter une demande." },
  { id: 'conseil', nom: 'Conseiller', description: 'Éclairer un collègue, un responsable ou un usager avec des informations fiables.' },
]
