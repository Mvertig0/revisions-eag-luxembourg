import { useEffect } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import BarreHaut from './components/BarreHaut'
import { GardeSortieProvider, retourOuAccueil, useSortie } from './components/session/GardeSortie'
import Accueil from './pages/Accueil'
import EnConstruction from './pages/EnConstruction'
import NonTrouvee from './pages/NonTrouvee'
import Abstrait from './pages/Abstrait'
import Numerique from './pages/Numerique'
import Verbal from './pages/Verbal'
import { modulesDisponibles } from './data/modules'

// Types de <input> où l'on ne tape PAS de texte (la touche Retour arrière n'y efface rien).
const TYPES_SANS_SAISIE = ['radio', 'checkbox', 'button', 'submit', 'reset', 'range', 'color', 'file', 'image']

// Vrai si le curseur est dans un endroit où l'on tape du texte.
function estChampDeSaisie(cible) {
  if (!(cible instanceof HTMLElement)) return false
  if (cible.isContentEditable) return true
  const balise = cible.tagName
  if (balise === 'INPUT') return !TYPES_SANS_SAISIE.includes(cible.type)
  return balise === 'TEXTAREA' || balise === 'SELECT'
}

// Touche « Retour arrière » = page précédente (sauf dans un champ de saisie).
// Pendant une session d'exercices, elle ouvre d'abord la fenêtre « Quitter la session ? ».
function useRetourArriere() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { demanderSortie, dialogueOuvert } = useSortie()

  useEffect(() => {
    function surTouche(e) {
      if (e.key !== 'Backspace' || e.repeat || e.defaultPrevented) return
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
      if (estChampDeSaisie(e.target)) return
      if (pathname === '/') return // rien avant l'accueil : on ne quitte pas l'app
      e.preventDefault()
      if (dialogueOuvert) return // la fenêtre de confirmation est déjà là
      // Si la page a été ouverte directement (pas d'historique), on va à l'accueil.
      demanderSortie(() => retourOuAccueil(navigate))
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [navigate, pathname, demanderSortie, dialogueOuvert])
}

function Contenu() {
  useRetourArriere()
  return (
    <div className="page">
      <BarreHaut />
      <main className="contenu">
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/verbal" element={<Verbal />} />
          <Route path="/abstrait" element={<Abstrait />} />
          <Route path="/numerique" element={<Numerique />} />
          {modulesDisponibles
            .filter((m) => m.id !== 'verbal' && m.id !== 'abstrait' && m.id !== 'numerique')
            .map((m) => (
              <Route key={m.id} path={m.chemin} element={<EnConstruction moduleId={m.id} />} />
            ))}
          <Route path="*" element={<NonTrouvee />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <GardeSortieProvider>
      <Contenu />
    </GardeSortieProvider>
  )
}
