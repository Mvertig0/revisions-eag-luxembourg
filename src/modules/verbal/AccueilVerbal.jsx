import { useState } from 'react'
import { CircleCheck, Lightbulb, Play, Timer } from 'lucide-react'
import { lire } from '../../storage/stockage'
import { CLE_SESSIONS, DUREE_SESSION_SECONDES, NB_QUESTIONS } from './config'
import CartoucheTest from './CartoucheTest'
import { estSimulee } from './sessionSimulee'
import './verbal.css'

// Dernière session enregistrée (la plus récente est en dernier), ou null s'il n'y en a pas.
function derniereSession() {
  const liste = lire(CLE_SESSIONS, [])
  if (!Array.isArray(liste) || liste.length === 0) return null
  const derniere = liste[liste.length - 1]
  const date = new Date(derniere?.date)
  if (!Number.isFinite(derniere?.score) || !Number.isFinite(derniere?.total) || Number.isNaN(date.getTime())) {
    return null
  }
  return { score: derniere.score, total: derniere.total, date, simulee: estSimulee(derniere) }
}

function formaterDate(date) {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Écran d'accueil du module : les règles, le bouton pour commencer, la dernière session.
export default function AccueilVerbal({ onCommencer }) {
  const [derniere, setDerniere] = useState(derniereSession)
  const minutes = Math.round(DUREE_SESSION_SECONDES / 60)

  return (
    <>
      <section className="panneau regles" aria-labelledby="regles-titre">
        <h2 id="regles-titre" className="panneau__titre">
          Comment ça marche
        </h2>
        <ul className="regles__liste">
          <li>
            <CircleCheck aria-hidden="true" />
            <span>
              <strong>{NB_QUESTIONS} questions.</strong> Pour chaque affirmation, réponds Vrai, Faux ou Indéterminé
              d'après le texte.
            </span>
          </li>
          <li>
            <Timer aria-hidden="true" />
            <span>
              <strong>{minutes} minutes</strong>, sans blocage : à la fin du chrono, tu es prévenu mais tu peux
              continuer.
            </span>
          </li>
          <li>
            <Lightbulb aria-hidden="true" />
            <span>
              <strong>Correction après chaque réponse</strong>, avec l'explication.
            </span>
          </li>
        </ul>
        <button type="button" className="bouton bouton--plein" onClick={onCommencer}>
          <Play aria-hidden="true" />
          Commencer une session
        </button>
      </section>

      {derniere && (
        <section className="panneau derniere" aria-labelledby="derniere-titre">
          <div className="derniere__entete">
            <h2 id="derniere-titre" className="derniere__titre">
              Dernière session
            </h2>
            {derniere.simulee && <span className="pastille-test">TEST</span>}
          </div>
          <p>
            <strong className="derniere__score">
              {derniere.score} / {derniere.total}
            </strong>{' '}
            <span className="derniere__date">le {formaterDate(derniere.date)}</span>
          </p>
        </section>
      )}

      {import.meta.env.DEV && <CartoucheTest onChange={() => setDerniere(derniereSession())} />}
    </>
  )
}
