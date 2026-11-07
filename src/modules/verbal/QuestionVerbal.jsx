import { useEffect, useRef } from 'react'
import { ArrowRight, Check, CircleCheck, CircleX } from 'lucide-react'
import BlocCorrection from '../../components/session/BlocCorrection'
import Chrono from '../../components/session/Chrono'
import { useSortie } from '../../components/session/GardeSortie'
import { DUREE_SESSION_SECONDES, REPONSES } from './config'
import './verbal.css'

// Une question (avant validation) ou sa correction (après validation).
// Le chrono reste affiché pendant les deux : le composant n'est jamais remonté entre les deux écrans.
export default function QuestionVerbal({
  question,
  numero,
  total,
  debut,
  dureeSecondes = DUREE_SESSION_SECONDES,
  choix,
  valide,
  onChoisir,
  onValider,
  onSuivante,
}) {
  const { dialogueOuvert } = useSortie()
  const titreRef = useRef(null)
  const correctionRef = useRef(null)
  const derniere = numero === total
  const correct = valide && choix === question.reponseAttendue

  // Nouvelle question : on remonte en haut et on place le focus sur « Question n sur N ».
  useEffect(() => {
    if (valide) return
    window.scrollTo(0, 0)
    titreRef.current?.focus({ preventScroll: true })
  }, [numero, valide])

  // Après validation : le focus va sur la correction (le lecteur d'écran l'annonce).
  useEffect(() => {
    if (valide) correctionRef.current?.focus()
  }, [valide])

  // Touche Entrée : valide (si un choix est fait) ou passe à la suite.
  // Sur un bouton ou un lien, on laisse le navigateur faire son travail (sinon l'action serait lancée deux fois).
  useEffect(() => {
    function surTouche(e) {
      if (e.key !== 'Enter' || e.repeat || e.defaultPrevented) return
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
      if (dialogueOuvert) return
      if (e.target instanceof Element && e.target.closest('button, a, summary, textarea, select')) return
      e.preventDefault()
      if (valide) onSuivante()
      else if (choix) onValider()
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [dialogueOuvert, valide, choix, onValider, onSuivante])

  const { texte } = question
  // Vrai / Faux / Indéterminé pour le format d'origine ; propositions déjà mélangées pour les QCM et les consignes.
  const propositions = question.choix ?? REPONSES

  return (
    <section className="question" aria-label={`Question ${numero} sur ${total}`}>
      <div className="question__haut">
        <h2 ref={titreRef} tabIndex={-1} className="question__progression">
          Question {numero} sur {total}
        </h2>
        <Chrono debut={debut} dureeSecondes={dureeSecondes} />
      </div>

      <article className="texte-ref verre" aria-labelledby="texte-ref-titre">
        <p className="texte-ref__etiquette">{texte.regles ? 'Consignes' : `Texte de référence · ${texte.theme}`}</p>
        <h3 id="texte-ref-titre" className="texte-ref__titre">
          {texte.titre}
        </h3>
        {texte.regles ? (
          <>
            <p className="texte-ref__corps">{texte.intro}</p>
            <ol className="texte-ref__regles">
              {texte.regles.map((regle, i) => (
                <li key={i}>{regle}</li>
              ))}
            </ol>
          </>
        ) : (
          <p className="texte-ref__corps">{texte.texte}</p>
        )}
      </article>

      <fieldset className="choix-groupe">
        <legend className="affirmation">{question.affirmation}</legend>
        <div className="choix-liste">
          {propositions.map((reponse) => {
            const attendue = valide && reponse === question.reponseAttendue
            const fausse = valide && reponse === choix && reponse !== question.reponseAttendue
            const etat = attendue ? ' choix__corps--bonne' : fausse ? ' choix__corps--mauvaise' : ''
            return (
              <label key={reponse} className="choix">
                <input
                  type="radio"
                  name="reponse"
                  className="choix__entree"
                  value={reponse}
                  checked={choix === reponse}
                  disabled={valide}
                  onChange={() => onChoisir(reponse)}
                />
                <span className={`choix__corps verre${etat}`}>
                  <span className="choix__puce" aria-hidden="true">
                    <Check />
                  </span>
                  <span className="choix__texte">{reponse}</span>
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
          <button type="button" className="bouton bouton--plein" disabled={!choix} onClick={onValider}>
            <Check aria-hidden="true" />
            Valider
          </button>
        </div>
      ) : (
        <>
          <BlocCorrection
            ref={correctionRef}
            correct={correct}
            reponseDonnee={choix}
            reponseAttendue={question.reponseAttendue}
            correction={question.correction}
          />
          <div className="question__actions">
            <button type="button" className="bouton bouton--plein" onClick={onSuivante}>
              {derniere ? 'Voir mon score' : 'Question suivante'}
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </section>
  )
}
