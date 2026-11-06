import { Link } from 'react-router-dom'
import { ArrowLeft, SearchX } from 'lucide-react'
import EnTete from '../components/EnTete'

export default function NonTrouvee() {
  return (
    <>
      <EnTete titre="Page introuvable" sousTitre="Cette adresse n'existe pas." Icone={SearchX} couleur="var(--accent)" />
      <section className="panneau">
        <p>Retourne à l'accueil pour choisir un module.</p>
        <Link to="/" className="bouton bouton--plein">
          <ArrowLeft aria-hidden="true" />
          Retour à l'accueil
        </Link>
      </section>
    </>
  )
}
