import { useEffect, useState } from 'react'
import { Timer } from 'lucide-react'
import './session.css'

// Secondes écoulées depuis `debut` (heure réelle, en millisecondes).
// Le temps vient de l'horloge de l'appareil, pas d'un compteur de « tics » :
// il reste juste même si l'onglet est en arrière-plan. Le minuteur ne sert qu'à rafraîchir l'affichage.
export function useSecondesEcoulees(debut) {
  const [maintenant, setMaintenant] = useState(() => Date.now())

  useEffect(() => {
    const rafraichir = () => setMaintenant(Date.now())
    rafraichir()
    const minuteur = window.setInterval(rafraichir, 250)
    document.addEventListener('visibilitychange', rafraichir)
    return () => {
      window.clearInterval(minuteur)
      document.removeEventListener('visibilitychange', rafraichir)
    }
  }, [debut])

  return Math.max(0, Math.floor((maintenant - debut) / 1000))
}

// 754 -> « 12:34 »
export function formaterMinutesSecondes(secondes) {
  const s = Math.max(0, Math.floor(secondes))
  const minutes = String(Math.floor(s / 60)).padStart(2, '0')
  const reste = String(s % 60).padStart(2, '0')
  return `${minutes}:${reste}`
}

// Chrono en compte à rebours, non bloquant.
// - debut : heure de départ (Date.now() au moment du clic sur « Commencer »)
// - dureeSecondes : durée du compte à rebours
// À 00:00 il passe en couleur d'alerte, affiche « Temps écoulé » et compte le dépassement.
export default function Chrono({ debut, dureeSecondes }) {
  const ecoulees = useSecondesEcoulees(debut)
  const reste = dureeSecondes - ecoulees
  const termine = reste <= 0
  const depassement = -reste

  const valeur = depassement > 0 ? `+${formaterMinutesSecondes(depassement)}` : formaterMinutesSecondes(Math.max(reste, 0))

  return (
    <div className={`chrono verre${termine ? ' chrono--alerte' : ''}`} role="timer">
      <Timer aria-hidden="true" />
      <span className="visuellement-cache">{termine ? 'Temps dépassé : ' : 'Temps restant : '}</span>
      <span className="chrono__valeur">{valeur}</span>
      {termine && (
        <span className="chrono__message" role="status">
          Temps écoulé
        </span>
      )}
    </div>
  )
}
