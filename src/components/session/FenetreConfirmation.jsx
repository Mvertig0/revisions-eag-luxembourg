import { useEffect, useRef } from 'react'
import './session.css'

// Fenêtre de confirmation (ex. « Quitter la session ? »).
// - Le focus arrive sur le bouton « sûr » (Rester) ; Tab reste dans la fenêtre.
// - La touche Échap = annuler. Le focus revient où il était à la fermeture.
export default function FenetreConfirmation({
  titre,
  texte,
  libelleAnnuler = 'Rester',
  libelleConfirmer = 'Quitter',
  onAnnuler,
  onConfirmer,
}) {
  const boutonAnnuler = useRef(null)
  const boutonConfirmer = useRef(null)
  const surAnnuler = useRef(onAnnuler)
  surAnnuler.current = onAnnuler

  useEffect(() => {
    const avant = document.activeElement
    boutonAnnuler.current?.focus()

    function surTouche(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        surAnnuler.current()
      } else if (e.key === 'Tab') {
        const premier = boutonAnnuler.current
        const dernier = boutonConfirmer.current
        if (e.shiftKey && document.activeElement === premier) {
          e.preventDefault()
          dernier.focus()
        } else if (!e.shiftKey && document.activeElement === dernier) {
          e.preventDefault()
          premier.focus()
        }
      }
    }
    document.addEventListener('keydown', surTouche, true)
    return () => {
      document.removeEventListener('keydown', surTouche, true)
      if (avant instanceof HTMLElement && document.contains(avant)) avant.focus()
    }
  }, [])

  return (
    <div className="fenetre-voile">
      <div
        className="fenetre verre"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="fenetre-titre"
        aria-describedby="fenetre-texte"
      >
        <h2 id="fenetre-titre" className="fenetre__titre">
          {titre}
        </h2>
        <p id="fenetre-texte">{texte}</p>
        <div className="fenetre__boutons">
          <button ref={boutonAnnuler} type="button" className="bouton bouton--plein" onClick={onAnnuler}>
            {libelleAnnuler}
          </button>
          <button ref={boutonConfirmer} type="button" className="bouton bouton--verre verre" onClick={onConfirmer}>
            {libelleConfirmer}
          </button>
        </div>
      </div>
    </div>
  )
}
