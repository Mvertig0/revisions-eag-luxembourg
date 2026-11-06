// Préparation d'une session de « Raisonnement verbal ».
// Ce fichier ne contient aucun affichage : il prend la banque d'exercices et renvoie la liste des questions.

import banque from '../../data/exercices/verbal.json'
import { NB_QUESTIONS, REPONSES } from './config'

// Mélange une liste (Fisher-Yates) sans modifier l'originale.
// `hasard` renvoie un nombre entre 0 et 1 ; on peut le remplacer pour les tests.
export function melanger(liste, hasard = Math.random) {
  const copie = [...liste]
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1))
    ;[copie[i], copie[j]] = [copie[j], copie[i]]
  }
  return copie
}

// Renvoie les questions d'une session, dans l'ordre où elles seront posées.
// Chaque question : { id, affirmation, reponseAttendue, correction, texte }
// où `texte` est le texte complet (id, titre, theme, niveau, texte).
export function tirerSession(textes = banque.textes, hasard = Math.random) {
  // Toutes les affirmations, avec une référence à leur texte et leur rang d'origine.
  const toutes = []
  textes.forEach((texte, rangTexte) => {
    texte.affirmations.forEach((a, rang) => {
      toutes.push({
        id: a.id,
        affirmation: a.affirmation,
        reponseAttendue: a.reponse,
        correction: a.correction,
        texte,
        rangTexte,
        rang,
      })
    })
  })

  // 1. Mélange par catégorie de réponse (Vrai, Faux, Indéterminé).
  const parCategorie = REPONSES.map((reponse) =>
    melanger(
      toutes.filter((q) => q.reponseAttendue === reponse),
      hasard,
    ),
  )
  const melangees = parCategorie.flat()

  // 2. On retire au hasard ce qui dépasse le nombre de questions voulu.
  //    Avec la banque actuelle (21 affirmations, 7 de chaque), on en retire une seule :
  //    la session compte donc 7, 7 et 6 réponses attendues.
  let gardees = melangees
  const aRetirer = Math.max(0, melangees.length - NB_QUESTIONS)
  if (aRetirer > 0) {
    const retirees = new Set(melanger(melangees, hasard).slice(0, aRetirer))
    gardees = melangees.filter((q) => !retirees.has(q))
  }

  // 3. Les affirmations d'un même texte restent côte à côte, dans leur ordre d'origine ;
  //    l'ordre des textes est aléatoire.
  const parTexte = new Map()
  for (const q of gardees) {
    if (!parTexte.has(q.rangTexte)) parTexte.set(q.rangTexte, [])
    parTexte.get(q.rangTexte).push(q)
  }
  const groupes = melanger([...parTexte.values()], hasard).map((groupe) =>
    [...groupe].sort((a, b) => a.rang - b.rang),
  )

  // 4. On enlève les champs de travail ; chaque question garde son texte complet.
  return groupes.flat().map(({ id, affirmation, reponseAttendue, correction, texte }) => ({
    id,
    affirmation,
    reponseAttendue,
    correction,
    texte,
  }))
}
