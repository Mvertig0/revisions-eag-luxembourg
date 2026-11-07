import { Link } from 'react-router-dom'
import { ChartLine, GraduationCap } from 'lucide-react'
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
      <p>
        <Link to="/suivi" className="bouton bouton--verre">
          <ChartLine aria-hidden="true" />
          Voir mon suivi
        </Link>
      </p>
      <section className="panneau a-propos" aria-labelledby="a-propos-titre">
        <h2 id="a-propos-titre" className="panneau__titre">À propos</h2>
        <p>
          Application d'entraînement <strong>indépendante</strong>, non affiliée à l'État luxembourgeois ni à GovJobs. Les exercices sont
          originaux. GovJobs ne publie plus d'exemples de tests : le format exact, le nombre de questions et la durée de chaque test de
          l'EAG ne sont pas connus et sont ici <strong>estimés</strong> d'après la description officielle des tests.
        </p>
        <p>Tes résultats restent sur cet appareil et ne sont envoyés nulle part.</p>
      </section>
      <p className="et-maintenant">
        <strong>Et maintenant ?</strong> Choisis un module pour t'entraîner.
      </p>
    </>
  )
}
