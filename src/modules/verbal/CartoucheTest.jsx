import { useState } from 'react'
import { FlaskConical, Plus, Trash2 } from 'lucide-react'
import { ajouterSessionSimulee, effacerSessionsSimulees } from './sessionSimulee'
import './verbal.css'

// Outil de TEST, visible seulement en développement (l'accueil ne l'affiche que si import.meta.env.DEV).
// Pour le retirer : supprimer ce fichier, sessionSimulee.js, et les lignes « CartoucheTest » de AccueilVerbal.jsx.
export default function CartoucheTest({ onChange }) {
  const [message, setMessage] = useState('')

  if (!import.meta.env.DEV) return null

  function ajouter() {
    if (ajouterSessionSimulee()) {
      setMessage('Session simulée ajoutée.')
    } else {
      setMessage('Écriture impossible dans ce navigateur')
    }
    onChange()
  }

  function effacer() {
    const { ok, retirees } = effacerSessionsSimulees()
    if (!ok) setMessage('Écriture impossible dans ce navigateur')
    else if (retirees === 0) setMessage('Aucune session simulée à effacer.')
    else setMessage(retirees === 1 ? '1 session simulée effacée.' : `${retirees} sessions simulées effacées.`)
    onChange()
  }

  return (
    <section className="panneau cartouche-test" aria-labelledby="cartouche-test-titre">
      <div className="cartouche-test__entete">
        <span className="pastille-test">TEST</span>
        <h2 id="cartouche-test-titre" className="cartouche-test__texte">
          <FlaskConical aria-hidden="true" />
          Outil de test : visible seulement en développement
        </h2>
      </div>
      <div className="cartouche-test__boutons">
        <button type="button" className="bouton bouton--verre" onClick={ajouter}>
          <Plus aria-hidden="true" />
          Ajouter une session simulée
        </button>
        <button type="button" className="bouton bouton--verre" onClick={effacer}>
          <Trash2 aria-hidden="true" />
          Effacer les sessions simulées
        </button>
      </div>
      <div role="status">{message && <p className="cartouche-test__message">{message}</p>}</div>
    </section>
  )
}
