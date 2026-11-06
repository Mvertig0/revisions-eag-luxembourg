import { useState } from 'react'
import { CircleCheck, Lightbulb, Play, Timer } from 'lucide-react'
import { lire } from '../../storage/stockage'
import { CLE_SESSIONS, DUREE_SESSION_SECONDES, NB_QUESTIONS, NIVEAUX } from './config'
import { FAMILLES } from './tirage'
import '../verbal/verbal.css'
import './abstrait.css'

// Dernière session enregistrée (la plus récente est en dernier), ou null s'il n'y en a pas.
function derniereSession() {
  const liste = lire(CLE_SESSIONS, [])
  if (!Array.isArray(liste) || liste.length === 0) return null
  const derniere = liste[liste.length - 1]
  const date = new Date(derniere?.date)
  if (!Number.isFinite(derniere?.score) || !Number.isFinite(derniere?.total) || Number.isNaN(date.getTime())) return null
  return { score: derniere.score, total: derniere.total, date }
}

// Écran d'accueil du module : les règles, le choix du niveau et du type, le bouton pour commencer.
export default function AccueilAbstrait({ onCommencer }) {
  const [derniere] = useState(derniereSession)
  const [niveau, setNiveau] = useState('moyen')
  const [famille, setFamille] = useState('tous')
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
              <strong>{NB_QUESTIONS} exercices.</strong> Pour chacun, choisis la bonne figure parmi les propositions.
            </span>
          </li>
          <li>
            <Timer aria-hidden="true" />
            <span>
              <strong>{minutes} minutes</strong>, sans blocage : à la fin du chrono, tu es prévenu mais tu peux continuer.
            </span>
          </li>
          <li>
            <Lightbulb aria-hidden="true" />
            <span>
              <strong>Correction après chaque réponse</strong>, avec l'explication. Les exercices sont créés à la volée : tu n'auras
              jamais deux fois le même.
            </span>
          </li>
        </ul>

        <div className="abs-reglages">
          <fieldset className="choix-groupe">
            <legend className="abs-etiquette">Niveau</legend>
            <div className="choix-liste abs-niveaux">
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

          <div>
            <label htmlFor="abs-famille" className="abs-etiquette">
              Type d'exercice
            </label>
            <select id="abs-famille" className="abs-select" value={famille} onChange={(e) => setFamille(e.target.value)}>
              <option value="tous">Tous les types (mélange)</option>
              {FAMILLES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="button" className="bouton bouton--plein" onClick={() => onCommencer({ niveau, famille })}>
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
