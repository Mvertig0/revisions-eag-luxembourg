import { ChevronDown, CircleCheck, CircleX } from 'lucide-react'
import './session.css'

// 754 -> « 12 min 34 s »
export function formaterDuree(secondes) {
  const s = Math.max(0, Math.round(secondes))
  const minutes = Math.floor(s / 60)
  const reste = s % 60
  return minutes > 0 ? `${minutes} min ${String(reste).padStart(2, '0')} s` : `${reste} s`
}

// Écran de fin de session : score, durée, liste dépliable, puis les boutons passés en `children`.
// - score, total : nombres
// - dureeSecondes : nombre
// - lignes : une par question { id, enonce, contexte?, correct, reponseDonnee, reponseAttendue, correction }
// - messageSauvegarde : texte facultatif (ex. « Ton résultat n'a pas pu être sauvegardé. »)
export default function EcranScore({ score, total, dureeSecondes, lignes, messageSauvegarde, children }) {
  return (
    <section className="score" aria-labelledby="score-titre">
      <div className="score__resume verre">
        <h2 id="score-titre" className="score__etiquette">
          Ton score
        </h2>
        <p className="score__grand">
          {score} / {total}
        </p>
        <p className="score__duree">Durée de la session : {formaterDuree(dureeSecondes)}</p>
        {messageSauvegarde && (
          <p className="score__avertissement" role="status">
            {messageSauvegarde}
          </p>
        )}
      </div>

      <div className="score__liste-bloc">
        <h3 className="score__sous-titre">Détail des {total} questions</h3>
        <ul className="lignes">
          {lignes.map((ligne, i) => (
            <li key={ligne.id}>
              <details className="ligne verre">
                <summary className="ligne__resume">
                  <span className="ligne__numero">Question {i + 1}</span>
                  <span className={`ligne__statut ${ligne.correct ? 'ligne__statut--bonne' : 'ligne__statut--mauvaise'}`}>
                    {ligne.correct ? <CircleCheck aria-hidden="true" /> : <CircleX aria-hidden="true" />}
                    {ligne.correct ? 'Bonne réponse' : 'Mauvaise réponse'}
                  </span>
                  <ChevronDown className="ligne__chevron" aria-hidden="true" />
                </summary>
                <div className="ligne__detail">
                  {ligne.contexte && <p className="ligne__contexte">{ligne.contexte}</p>}
                  <p className="ligne__enonce">{ligne.enonce}</p>
                  <dl className="ligne__reponses">
                    <div>
                      <dt>Ta réponse</dt>
                      <dd>{ligne.reponseDonnee}</dd>
                    </div>
                    <div>
                      <dt>Bonne réponse</dt>
                      <dd>{ligne.reponseAttendue}</dd>
                    </div>
                  </dl>
                  <p className="ligne__correction">{ligne.correction}</p>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </div>

      {children}
    </section>
  )
}
