import { useEffect, useMemo, useRef } from 'react'
import { ArrowRight, Check, CircleCheck, CircleX } from 'lucide-react'
import BlocCorrection from '../../components/session/BlocCorrection'
import Chrono from '../../components/session/Chrono'
import { useSortie } from '../../components/session/GardeSortie'
import { enonceVisible, imagesOptions, questionTexte } from './rendu'
import { DUREE_SESSION_SECONDES, LETTRES } from './config'
import '../verbal/verbal.css'
import './abstrait.css'

// Un exercice d'abstrait (avant validation) ou sa correction (après validation).
// Les dessins sont du SVG fabriqué par notre propre programme (jamais du texte saisi par quelqu'un).
// `choix` : numéro de la réponse choisie (0 à 4) ou null.
export default function QuestionAbstrait({ question, numero, total, debut, choix, valide, onChoisir, onValider, onSuivante }) {
  const { dialogueOuvert } = useSortie()
  const titreRef = useRef(null)
  const correctionRef = useRef(null)
  const { exercice } = question
  const derniere = numero === total
  const bonne = exercice.indexBonne
  const correct = valide && choix === bonne
  const enonce = useMemo(() => enonceVisible(exercice), [exercice])
  const images = useMemo(() => imagesOptions(exercice), [exercice])

  // Nouvel exercice : on remonte en haut et on place le focus sur « Question n sur N ».
  useEffect(() => {
    if (valide) return
    window.scrollTo(0, 0)
    titreRef.current?.focus({ preventScroll: true })
  }, [numero, valide])

  // Après validation : le focus va sur la correction (le lecteur d'écran l'annonce).
  useEffect(() => {
    if (valide) correctionRef.current?.focus()
  }, [valide])

  // Touche Entrée : valide (si un choix est fait) ou passe à la suite. Sur un bouton ou un lien, le navigateur s'en charge.
  useEffect(() => {
    function surTouche(e) {
      if (e.key !== 'Enter' || e.repeat || e.defaultPrevented) return
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
      if (dialogueOuvert) return
      if (e.target instanceof Element && e.target.closest('button, a, summary, textarea, select')) return
      e.preventDefault()
      if (valide) onSuivante()
      else if (choix !== null) onValider()
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [dialogueOuvert, valide, choix, onValider, onSuivante])

  return (
    <section className="question" aria-label={`Question ${numero} sur ${total}`}>
      <div className="question__haut">
        <h2 ref={titreRef} tabIndex={-1} className="question__progression">
          Question {numero} sur {total}
        </h2>
        <Chrono debut={debut} dureeSecondes={DUREE_SESSION_SECONDES} />
      </div>

      {enonce && (
        <article className="abs-enonce verre">
          <p className="texte-ref__etiquette">{question.titre}</p>
          <div className="abs-enonce__corps" dangerouslySetInnerHTML={{ __html: enonce }} />
        </article>
      )}

      <fieldset className="choix-groupe">
        <legend className="affirmation">{questionTexte(exercice)}</legend>
        <div className="choix-liste abs-choix-liste">
          {images.map((image, i) => {
            const attendue = valide && i === bonne
            const fausse = valide && i === choix && i !== bonne
            const etat = attendue ? ' choix__corps--bonne' : fausse ? ' choix__corps--mauvaise' : ''
            return (
              <label key={i} className="choix">
                <input
                  type="radio"
                  name="reponse"
                  className="choix__entree"
                  value={i}
                  checked={choix === i}
                  disabled={valide}
                  onChange={() => onChoisir(i)}
                  aria-label={`Réponse ${LETTRES[i]}`}
                />
                <span className={`choix__corps verre${etat}`}>
                  <span className="abs-lettre">{LETTRES[i]}</span>
                  <span className="abs-image" aria-hidden="true" dangerouslySetInnerHTML={{ __html: image }} />
                  {attendue && (
                    <span className="choix__marque choix__marque--bonne">
                      <CircleCheck aria-hidden="true" /> Bonne réponse
                    </span>
                  )}
                  {fausse && (
                    <span className="choix__marque choix__marque--mauvaise">
                      <CircleX aria-hidden="true" /> Ta réponse
                    </span>
                  )}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {!valide ? (
        <div className="question__actions">
          <button type="button" className="bouton bouton--plein" disabled={choix === null} onClick={onValider}>
            <Check aria-hidden="true" />
            Valider
          </button>
        </div>
      ) : (
        <>
          <BlocCorrection
            ref={correctionRef}
            correct={correct}
            reponseDonnee={LETTRES[choix]}
            reponseAttendue={LETTRES[bonne]}
            correction={exercice.explication}
          />
          <div className="question__actions">
            <button type="button" className="bouton bouton--plein" onClick={onSuivante}>
              {derniere ? 'Voir mon score' : 'Exercice suivant'}
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </section>
  )
}
