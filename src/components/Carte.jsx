import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import PastilleIcone from './PastilleIcone'

// Une carte de module. Toute la surface est UN seul élément cliquable.
// - disponible : lien vers la page du module
// - bientôt    : bouton grisé, qui ne fait rien (aria-disabled="true")
export default function Carte({ module }) {
  const { nom, texte, Icone, couleur, statut, chemin } = module
  const disponible = statut === 'disponible'

  const contenu = (
    <>
      <PastilleIcone Icone={Icone} couleur={couleur} grisee={!disponible} />
      <span className="carte__corps">
        <span className="carte__nom">{nom}</span>
        <span className="carte__texte">{texte}</span>
      </span>
      {disponible ? (
        <ChevronRight className="carte__fleche" aria-hidden="true" />
      ) : (
        <span className="etiquette">Bientôt</span>
      )}
    </>
  )

  if (disponible) {
    return (
      <Link to={chemin} className="carte carte--active">
        {contenu}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className="carte carte--grisee"
      aria-disabled="true"
      onClick={(e) => e.preventDefault()}
    >
      {contenu}
    </button>
  )
}
