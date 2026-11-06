import { GraduationCap } from 'lucide-react'
import EnTete from '../components/EnTete'
import Carte from '../components/Carte'
import { modules } from '../data/modules'

export default function Accueil() {
  return (
    <>
      <EnTete
        titre="Révisions EAG Luxembourg"
        sousTitre="Entraîne-toi pour l'examen d'aptitude générale (groupe A1)"
        Icone={GraduationCap}
        couleur="var(--accent)"
      />
      <ul className="grille" aria-label="Modules d'entraînement">
        {modules.map((m) => (
          <li key={m.id}>
            <Carte module={m} />
          </li>
        ))}
      </ul>
      <p className="et-maintenant">
        <strong>Et maintenant ?</strong> Choisis un module pour t'entraîner.
      </p>
    </>
  )
}
