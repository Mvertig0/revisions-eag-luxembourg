import { forwardRef } from 'react'
import { CircleCheck, CircleX } from 'lucide-react'
import './session.css'

// Bloc de correction affiché juste après une réponse.
// Il ne suppose aucun format de question : les réponses sont de simples textes.
// - correct : true / false
// - reponseDonnee, reponseAttendue : textes à afficher
// - correction : l'explication
// Le bloc peut recevoir le focus (pour que le lecteur d'écran l'annonce).
const BlocCorrection = forwardRef(function BlocCorrection(
  { correct, reponseDonnee, reponseAttendue, correction },
  ref,
) {
  const Icone = correct ? CircleCheck : CircleX
  return (
    <section
      ref={ref}
      tabIndex={-1}
      className={`correction verre ${correct ? 'correction--bonne' : 'correction--mauvaise'}`}
      aria-label="Correction"
    >
      <h2 className="correction__titre">
        <Icone aria-hidden="true" />
        {correct ? 'Bonne réponse' : 'Mauvaise réponse'}
      </h2>
      <p>
        {!correct && (
          <>
            Tu as répondu : <strong>{reponseDonnee}</strong>.{' '}
          </>
        )}
        La bonne réponse est : <strong>{reponseAttendue}</strong>.
      </p>
      <p className="correction__explication">{correction}</p>
    </section>
  )
})

export default BlocCorrection
