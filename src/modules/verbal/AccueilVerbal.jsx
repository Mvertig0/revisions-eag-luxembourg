import { useState } from 'react'
import { CircleCheck, Lightbulb, Play, Timer } from 'lucide-react'
import { lire } from '../../storage/stockage'
import { CLE_SESSIONS, DUREE_SESSION_SECONDES, NB_QUESTIONS, TYPES_SESSION } from './config'
import CartoucheTest from './CartoucheTest'
import { estSimulee } from './sessionSimulee'
import { nombreQuestions } from './tirage'
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
  const [type, setType] = useState('melange')
  const nb = nombreQuestions(type)
  // Le temps est proportionnel au nombre de questions (15 minutes pour 20 questions).
  const minutes = Math.max(1, Math.round((DUREE_SESSION_SECONDES * nb) / NB_QUESTIONS / 60))
  const consigne = {
    melange: 'Selon la question : Vrai, Faux ou Indéterminé, ou la bonne proposition d\'après le texte ou les consignes.',
    vfi: 'Pour chaque affirmation, réponds Vrai, Faux ou Indéterminé d\'après le texte.',
    qcm: 'Pour chaque question, choisis la bonne proposition d\'après le texte.',
    consignes: 'Pour chaque question, applique les règles données pour trouver la bonne proposition.',
  }[type]

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
              <strong>{nb} questions.</strong> {consigne}
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
        <fieldset className="choix-groupe formats">
          <legend className="formats__titre">Format</legend>
          <div className="choix-liste">
            {TYPES_SESSION.map((t) => (
              <label key={t.id} className="choix">
                <input
                  type="radio"
                  name="format"
                  className="choix__entree"
                  value={t.id}
                  checked={type === t.id}
                  onChange={() => setType(t.id)}
                />
                <span className="choix__corps verre">
                  <span>{t.nom}</span>
                  <span className="formats__description">{t.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <button type="button" className="bouton bouton--plein" onClick={() => onCommencer(type)}>
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
