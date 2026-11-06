import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '../theme/ThemeProvider'
import { useSortie } from './session/GardeSortie'

const CHOIX = [
  { valeur: 'auto', nom: 'Automatique', Icone: Monitor },
  { valeur: 'clair', nom: 'Clair', Icone: Sun },
  { valeur: 'sombre', nom: 'Sombre', Icone: Moon },
]

function SelecteurTheme() {
  const { choix, changer } = useTheme()
  return (
    <div className="selecteur" role="group" aria-label="Thème d'affichage">
      {CHOIX.map(({ valeur, nom, Icone }) => (
        <button
          key={valeur}
          type="button"
          className="selecteur__bouton"
          aria-pressed={choix === valeur}
          aria-label={nom}
          title={nom}
          onClick={() => changer(valeur)}
        >
          <Icone aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}

// Barre du haut, présente sur toutes les pages :
// bouton « Retour à l'accueil » (sauf sur l'accueil) + choix du thème.
// Pendant une session d'exercices, le retour demande d'abord confirmation.
export default function BarreHaut() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { demanderSortie } = useSortie()
  const surAccueil = pathname === '/'

  function retourAccueil(e) {
    // Clic normal uniquement ; ctrl/clic milieu gardent le comportement du navigateur.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    demanderSortie(() => navigate('/'))
  }

  return (
    <div className="barre-haut">
      {surAccueil ? (
        <span />
      ) : (
        <Link to="/" className="bouton bouton--verre" onClick={retourAccueil}>
          <ArrowLeft aria-hidden="true" />
          Retour à l'accueil
        </Link>
      )}
      <SelecteurTheme />
    </div>
  )
}
