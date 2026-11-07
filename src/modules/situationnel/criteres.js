// Critères d'évaluation des réactions du jugement situationnel. C'est la grille qui fixe le classement :
// chaque réaction est étiquetée par des critères (dans unites/situationnel/exercices/*.md), son score est la somme
// des poids, et la meilleure (resp. la pire) réaction est celle qui a le score le plus haut (resp. le plus bas).
// `phrase` complète « La réaction … » dans les corrections (donc au féminin : « reste courtoise »).
//
// Compétences A1/A2 de l'EAG (GovJobs) : « servir le client-usager » et « conseiller ».

export const CRITERES = {
  // ----- servir le client-usager -----
  ecoute: { poids: 2, competence: 'service', phrase: "écoute l'usager et vérifie son besoin" },
  respect: { poids: 1, competence: 'service', phrase: "reste courtoise, même si l'usager est mécontent" },
  solution: { poids: 2, competence: 'service', phrase: "apporte une réponse précise ou oriente clairement l'usager" },
  suivi: { poids: 1, competence: 'service', phrase: "s'assure que l'usager ne reste pas sans réponse" },
  regles: { poids: 2, competence: 'service', phrase: "respecte la règle et l'égalité de traitement" },
  promesse: { poids: -3, competence: 'service', phrase: 'promet ce qu\'elle ne peut pas garantir' },
  renvoi: { poids: -2, competence: 'service', phrase: "renvoie l'usager sans l'aider vraiment" },
  'passe-droit': { poids: -4, competence: 'service', phrase: "traite un usager autrement que les autres, en contournant la règle" },
  agressivite: { poids: -3, competence: 'service', phrase: "est sèche ou blessante envers l'usager" },
  ignore: { poids: -3, competence: 'service', phrase: 'laisse la demande ou le problème sans réponse' },
  approximation: { poids: -3, competence: 'service', phrase: 'donne une information non vérifiée' },
  impatience: { poids: -2, competence: 'service', phrase: 'montre de la précipitation ou de l\'impatience' },
  // ----- conseiller -----
  verifie: { poids: 2, competence: 'conseil', phrase: 'vérifie les faits ou la règle avant de conseiller' },
  options: { poids: 1, competence: 'conseil', phrase: 'présente les options et leurs conséquences' },
  adapte: { poids: 1, competence: 'conseil', phrase: 'adapte le conseil à la situation de la personne' },
  limites: { poids: 2, competence: 'conseil', phrase: 'reconnaît ses limites et oriente vers la bonne personne ou le bon expert' },
  trace: { poids: 1, competence: 'conseil', phrase: 'garde une référence ou une trace précise' },
  neutre: { poids: 1, competence: 'conseil', phrase: 'reste objective, sans intérêt personnel' },
  discretion: { poids: 2, competence: 'conseil', phrase: 'protège la confidentialité' },
  improvise: { poids: -3, competence: 'conseil', phrase: 'conseille sans avoir vérifié' },
  impose: { poids: -2, competence: 'conseil', phrase: 'impose une solution sans expliquer' },
  minimise: { poids: -3, competence: 'conseil', phrase: 'minimise un risque réel' },
  'hors-role': { poids: -3, competence: 'conseil', phrase: 'dépasse le rôle de la personne qui conseille' },
  opinion: { poids: -2, competence: 'conseil', phrase: 'donne un avis personnel que rien ne fonde' },
  refus: { poids: -2, competence: 'conseil', phrase: "refuse d'aider ou de répondre" },
  // ----- les deux -----
  indiscretion: { poids: -4, competence: 'les deux', phrase: 'divulgue des informations confidentielles' },
}

export const COMPETENCES = {
  service: 'Servir le client-usager',
  conseil: 'Conseiller',
}

export const scoreReaction = (tags) => tags.reduce((s, t) => s + CRITERES[t].poids, 0)
