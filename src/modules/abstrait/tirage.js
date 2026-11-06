// Préparation d'une session d'abstrait : tire des exercices générés par programme (aucun affichage ici).
import { genererMatrice, genererSerie, melanger } from './generateur.js'
import { genererDe } from './de.js'
import { genererIntrus, genererAnalogie, genererDes3, genererRotation, genererPliage } from './variete.js'
import { NB_QUESTIONS } from './config.js'

// Les 8 familles d'exercices. Le dé déplié n'a pas de niveaux (le niveau est ignoré).
export const FAMILLES = [
  { id: 'matrice', nom: 'Matrices 3×3', gen: genererMatrice },
  { id: 'serie', nom: 'Séries de figures', gen: genererSerie },
  { id: 'intrus', nom: "Intrus", gen: genererIntrus },
  { id: 'analogie', nom: 'Analogies', gen: genererAnalogie },
  { id: 'rotation', nom: 'Rotation mentale', gen: genererRotation },
  { id: 'pliage', nom: 'Pliage et perçage', gen: genererPliage },
  { id: 'de', nom: 'Dé déplié (patron)', gen: (graine) => genererDe(graine) },
  { id: 'des3', nom: 'Dés vus sous plusieurs angles', gen: genererDes3 },
]

// Renvoie les exercices d'une session. `famille` : 'tous' (mélange) ou l'identifiant d'une famille.
// Avec « tous », chaque famille apparaît avant qu'une seule revienne.
// `hasard` renvoie un nombre entre 0 et 1 ; on peut le remplacer pour les tests.
export function tirerSession(niveau = 'moyen', famille = 'tous', nb = NB_QUESTIONS, hasard = Math.random) {
  const liste = famille === 'tous' ? FAMILLES : FAMILLES.filter((f) => f.id === famille)
  if (liste.length === 0) throw new Error(`Famille inconnue : ${famille}`)
  const ordre = []
  while (ordre.length < nb) ordre.push(...melanger(hasard, liste))
  ordre.length = nb
  const vus = new Set()
  return ordre.map((f) => {
    let graine
    do graine = 1 + Math.floor(hasard() * 4_000_000)
    while (vus.has(`${f.id}-${graine}`))
    vus.add(`${f.id}-${graine}`)
    const exercice = f.gen(graine, niveau)
    return { id: `${f.id}-${niveau}-${graine}`, famille: f.id, titre: f.nom, exercice }
  })
}
