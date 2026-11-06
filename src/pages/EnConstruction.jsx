import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import EnTete from '../components/EnTete'
import { modules } from '../data/modules'

export default function EnConstruction({ moduleId }) {
  const module = modules.find((m) => m.id === moduleId)
  if (!module) return null
  return (
    <>
      <EnTete titre={module.nom} sousTitre={module.texte} Icone={module.Icone} couleur={module.couleur} />
      <section className="panneau">
        <h2 className="panneau__titre">En construction</h2>
        <p>Ce module arrive bientôt.</p>
        <Link to="/" className="bouton bouton--plein">
          <ArrowLeft aria-hidden="true" />
          Retour à l'accueil
        </Link>
      </section>
    </>
  )
}
