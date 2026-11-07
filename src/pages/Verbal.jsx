import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import EcranScore from '../components/session/EcranScore'
import { useGardeSortie } from '../components/session/GardeSortie'
import EnTete from '../components/EnTete'
import { modules } from '../data/modules'
import { lire, ecrire } from '../storage/stockage'
import AccueilVerbal from '../modules/verbal/AccueilVerbal'
import QuestionVerbal from '../modules/verbal/QuestionVerbal'
import { CLE_SESSIONS, DUREE_SESSION_SECONDES, NB_QUESTIONS } from '../modules/verbal/config'
import { tirerSessionType } from '../modules/verbal/tirage'
import '../modules/verbal/verbal.css'

const module = modules.find((m) => m.id === 'verbal')

function nouvelIdentifiant() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

// Page « Raisonnement verbal » : accueil du module -> questions -> fin de session.
export default function Verbal() {
  const [phase, setPhase] = useState('accueil') // 'accueil' | 'question' | 'correction' | 'fin'
  const [type, setType] = useState('melange') // format de la session
  const [questions, setQuestions] = useState([])
  const [debut, setDebut] = useState(0) // heure de départ du chrono (ms)
  const [index, setIndex] = useState(0)
  const [choix, setChoix] = useState(null)
  const [reponses, setReponses] = useState([]) // réponses déjà validées
  const [resultat, setResultat] = useState(null) // { score, total, dureeSecondes, lignes, sauvegardeOk }
  const enCours = useRef(false)

  // Session en cours = écrans « question » et « correction » : toute sortie demande confirmation.
  useGardeSortie(phase === 'question' || phase === 'correction')

  const commencer = useCallback((nouveauType) => {
    const t = typeof nouveauType === 'string' ? nouveauType : type
    setType(t)
    setQuestions(tirerSessionType(t))
    setDebut(Date.now())
    setIndex(0)
    setChoix(null)
    setReponses([])
    setResultat(null)
    enCours.current = true
    setPhase('question')
  }, [type])

  const valider = useCallback(() => {
    if (phase !== 'question' || !choix) return
    setReponses((r) => [...r, choix])
    setPhase('correction')
  }, [phase, choix])

  const terminer = useCallback(() => {
    if (!enCours.current) return
    enCours.current = false
    const dureeSecondes = Math.max(0, Math.round((Date.now() - debut) / 1000))
    const details = questions.map((q, i) => ({
      idAffirmation: q.id,
      type: q.type, // 'vfi', 'qcm' ou 'consignes' (ajouté le 8/11 ; les anciennes sessions n'ont pas ce champ = 'vfi')
      reponseDonnee: reponses[i],
      reponseAttendue: q.reponseAttendue,
      correct: reponses[i] === q.reponseAttendue,
    }))
    const score = details.filter((d) => d.correct).length
    const entree = {
      id: nouvelIdentifiant(),
      date: new Date().toISOString(),
      dureeSecondes,
      score,
      total: questions.length,
      format: type,
      details,
    }
    // On n'enregistre qu'ici, à la fin. Si le navigateur refuse, on le dit sans bloquer le score.
    const liste = lire(CLE_SESSIONS, [])
    const sauvegardeOk = ecrire(CLE_SESSIONS, [...(Array.isArray(liste) ? liste : []), entree])
    setResultat({
      score,
      total: entree.total,
      dureeSecondes,
      sauvegardeOk,
      lignes: questions.map((q, i) => ({
        id: q.id,
        enonce: q.affirmation,
        contexte: q.texte.titre,
        correct: details[i].correct,
        reponseDonnee: details[i].reponseDonnee,
        reponseAttendue: q.reponseAttendue,
        correction: q.correction,
      })),
    })
    setPhase('fin')
  }, [debut, questions, reponses, type])

  const suivante = useCallback(() => {
    if (phase !== 'correction') return
    if (index + 1 >= questions.length) {
      terminer()
    } else {
      setIndex((i) => i + 1)
      setChoix(null)
      setPhase('question')
    }
  }, [phase, index, questions.length, terminer])

  return (
    <>
      <EnTete titre={module.nom} sousTitre={module.texte} Icone={module.Icone} couleur={module.couleur} compact={phase === 'question' || phase === 'correction'} />

      {phase === 'accueil' && <AccueilVerbal onCommencer={commencer} />}

      {(phase === 'question' || phase === 'correction') && (
        <QuestionVerbal
          question={questions[index]}
          numero={index + 1}
          total={questions.length}
          debut={debut}
          dureeSecondes={Math.max(60, Math.round((DUREE_SESSION_SECONDES * questions.length) / NB_QUESTIONS))}
          choix={choix}
          valide={phase === 'correction'}
          onChoisir={setChoix}
          onValider={valider}
          onSuivante={suivante}
        />
      )}

      {phase === 'fin' && resultat && (
        <EcranScore
          score={resultat.score}
          total={resultat.total}
          dureeSecondes={resultat.dureeSecondes}
          lignes={resultat.lignes}
          messageSauvegarde={resultat.sauvegardeOk ? null : "Ton résultat n'a pas pu être sauvegardé."}
        >
          <div className="fin-actions">
            <p className="et-maintenant">
              <strong>Et maintenant ?</strong>
            </p>
            <div className="fin-actions__boutons">
              <button type="button" className="bouton bouton--plein" onClick={() => commencer()}>
                <RotateCcw aria-hidden="true" />
                Refaire une session
              </button>
              <Link to="/" className="bouton bouton--verre">
                <ArrowLeft aria-hidden="true" />
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </EcranScore>
      )}
    </>
  )
}
