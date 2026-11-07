import { useState } from 'react'
import { CalendarClock, CircleCheck, Lightbulb, Play, Timer } from 'lucide-react'
import { lire } from '../../storage/stockage'
import { CLE_SESSIONS, DUREE_SESSION_SECONDES, NB_QUESTIONS, NIVEAUX, TYPES_SESSION } from './config'
import '../verbal/verbal.css'

// Dernière session enregistrée (la plus récente est en dernier), ou null s'il n'y en a pas.
function derniereSession() {
  const liste = lire(CLE_SESSIONS, [])
  if (!Array.isArray(liste) || liste.length === 0) return null
  const derniere = liste[liste.length - 1]
  const date = new Date(derniere?.date)
  if (!Number.isFinite(derniere?.score) || !Number.isFinite(derniere?.total) || Number.isNaN(date.getTime())) return null
  return { score: derniere.score, total: derniere.total, date }
}

// Écran d'accueil du module : les règles, le choix du format, le bouton pour commencer, la dernière session.
export default function AccueilPlanification({ onCommencer }) {
  const [derniere] = useState(derniereSession)
  const [type, setType] = useState('melange')
  const [niveau, setNiveau] = useState('moyen')
  const nb = NB_QUESTIONS
  // Le temps est proportionnel au nombre de questions (20 minutes pour 12 questions).
  const minutes = Math.max(1, Math.round((DUREE_SESSION_SECONDES * nb) / NB_QUESTIONS / 60))
  const consigne = {
    melange: 'Chaque situation présente un tableau et des règles : choisis la bonne proposition parmi quatre.',
    agenda: "Lis les horaires et les occupations, puis choisis la bonne proposition parmi quatre.",
    priorites: 'Applique les règles de priorité, puis choisis la bonne proposition parmi quatre.',
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
              <strong>{minutes} minutes</strong>, sans blocage : à la fin du chrono, tu es prévenu mais tu peux continuer.
            </span>
          </li>
          <li>
            <CalendarClock aria-hidden="true" />
            <span>
              <strong>Tout est dans l'énoncé</strong> : horaires, durées et règles sont donnés. Un brouillon aide à poser les heures.
            </span>
          </li>
          <li>
            <Lightbulb aria-hidden="true" />
            <span>
              <strong>Correction après chaque réponse</strong>, avec le raisonnement détaillé.
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

        {(
          <fieldset className="choix-groupe formats">
            <legend className="formats__titre">Niveau</legend>
            <div className="choix-liste formats__niveaux">
              {NIVEAUX.map((n) => (
                <label key={n.id} className="choix">
                  <input
                    type="radio"
                    name="niveau"
                    className="choix__entree"
                    value={n.id}
                    checked={niveau === n.id}
                    onChange={() => setNiveau(n.id)}
                  />
                  <span className="choix__corps verre">{n.nom}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <button type="button" className="bouton bouton--plein" onClick={() => onCommencer({ type, niveau })}>
          <Play aria-hidden="true" />
          Commencer une session
        </button>
      </section>

      {derniere && (
        <section className="panneau derniere" aria-labelledby="derniere-titre">
          <h2 id="derniere-titre" className="derniere__titre">
            Dernière session
          </h2>
          <p>
            <strong className="derniere__score">
              {derniere.score} / {derniere.total}
            </strong>{' '}
            <span className="derniere__date">
              le {derniere.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </p>
        </section>
      )}
    </>
  )
}
