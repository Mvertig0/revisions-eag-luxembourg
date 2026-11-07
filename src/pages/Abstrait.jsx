import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import EcranScore from '../components/session/EcranScore'
import { useGardeSortie } from '../components/session/GardeSortie'
import EnTete from '../components/EnTete'
import { modules } from '../data/modules'
import { lire, ecrire } from '../storage/stockage'
import AccueilAbstrait from '../modules/abstrait/AccueilAbstrait'
import QuestionAbstrait from '../modules/abstrait/QuestionAbstrait'
import { CLE_SESSIONS, LETTRES, NIVEAUX } from '../modules/abstrait/config'
import { tirerSession } from '../modules/abstrait/tirage'
import '../modules/verbal/verbal.css'

const module = modules.find((m) => m.id === 'abstrait')

function nouvelIdentifiant() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

// Page « Raisonnement abstrait » : accueil du module -> exercices -> fin de session.
export default function Abstrait() {
  const [phase, setPhase] = useState('accueil') // 'accueil' | 'question' | 'correction' | 'fin'
  const [reglages, setReglages] = useState({ niveau: 'moyen', famille: 'tous' })
  const [questions, setQuestions] = useState([])
  const [debut, setDebut] = useState(0) // heure de départ du chrono (ms)
  const [index, setIndex] = useState(0)
  const [choix, setChoix] = useState(null) // numéro de la réponse choisie (0 à 4)
  const [reponses, setReponses] = useState([]) // réponses déjà validées
  const [resultat, setResultat] = useState(null)
  const enCours = useRef(false)

  // Session en cours = écrans « question » et « correction » : toute sortie demande confirmation.
  useGardeSortie(phase === 'question' || phase === 'correction')

  const commencer = useCallback((nouveaux) => {
    const r = nouveaux ?? reglages
    setReglages(r)
    setQuestions(tirerSession(r.niveau, r.famille))
    setDebut(Date.now())
    setIndex(0)
    setChoix(null)
    setReponses([])
    setResultat(null)
    enCours.current = true
    setPhase('question')
  }, [reglages])

  const valider = useCallback(() => {
    if (phase !== 'question' || choix === null) return
    setReponses((r) => [...r, choix])
    setPhase('correction')
  }, [phase, choix])

  const terminer = useCallback(() => {
    if (!enCours.current) return
    enCours.current = false
    const dureeSecondes = Math.max(0, Math.round((Date.now() - debut) / 1000))
    // On garde le type, le niveau et le numéro (graine) de chaque exercice : le futur suivi pourra le rejouer.
    const details = questions.map((q, i) => ({
      id: q.id,
      type: q.exercice.type,
      famille: q.famille,
      niveau: q.exercice.niveau,
      graine: q.exercice.graine,
      reponseDonnee: LETTRES[reponses[i]],
      reponseAttendue: LETTRES[q.exercice.indexBonne],
      correct: reponses[i] === q.exercice.indexBonne,
    }))
    const score = details.filter((d) => d.correct).length
    const entree = {
      id: nouvelIdentifiant(),
      date: new Date().toISOString(),
      dureeSecondes,
      score,
      total: questions.length,
      niveau: reglages.niveau,
      famille: reglages.famille,
      details,
    }
    const liste = lire(CLE_SESSIONS, [])
    const sauvegardeOk = ecrire(CLE_SESSIONS, [...(Array.isArray(liste) ? liste : []), entree])
    const nomNiveau = NIVEAUX.find((n) => n.id === reglages.niveau)?.nom ?? reglages.niveau
    setResultat({
      score,
      total: entree.total,
      dureeSecondes,
      sauvegardeOk,
      lignes: questions.map((q, i) => ({
        id: q.id,
        enonce: q.titre,
        contexte: q.famille === 'de' ? null : `Niveau ${nomNiveau}`,
        correct: details[i].correct,
        reponseDonnee: details[i].reponseDonnee,
        reponseAttendue: details[i].reponseAttendue,
        correction: q.exercice.explication,
      })),
    })
    setPhase('fin')
  }, [debut, questions, reponses, reglages])

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

      {phase === 'accueil' && <AccueilAbstrait onCommencer={commencer} />}

      {(phase === 'question' || phase === 'correction') && (
        <QuestionAbstrait
          key={questions[index].id}
          question={questions[index]}
          numero={index + 1}
          total={questions.length}
          debut={debut}
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
