import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FenetreConfirmation from './FenetreConfirmation'

// Garde de sortie : quand une session est en cours, toute sortie demande confirmation.
// - bouton « Retour à l'accueil » et touche Retour arrière : passent par `demanderSortie`
// - fermeture / rechargement de l'onglet : message standard du navigateur
// - bouton Retour du navigateur : on pose une entrée « tampon » dans l'historique ;
//   quand on revient dessus, on affiche la fenêtre et on repose le tampon.

const Contexte = createContext({
  gardeActive: false,
  dialogueOuvert: false,
  demanderSortie: (action) => action(),
  definirGarde: () => {},
})

export function useSortie() {
  return useContext(Contexte)
}

// À appeler dans la page qui a une session en cours : useGardeSortie(true) pendant la session.
export function useGardeSortie(actif) {
  const { definirGarde } = useSortie()
  useEffect(() => {
    if (!actif) return undefined
    definirGarde(true)
    return () => definirGarde(false)
  }, [actif, definirGarde])
}

// Comportement habituel de « Retour » : page précédente, sinon accueil.
export function retourOuAccueil(navigate) {
  if (window.history.state && window.history.state.idx > 0) navigate(-1)
  else navigate('/')
}

export function GardeSortieProvider({ children }) {
  const navigate = useNavigate()
  const [garde, setGarde] = useState(false)
  const [demande, setDemande] = useState(null) // { action } quand la fenêtre est ouverte
  const gardeRef = useRef(false) // vrai tant qu'une session est en cours
  const tamponRef = useRef(false) // vrai si l'entrée « tampon » est dans l'historique

  const definirGarde = useCallback((valeur) => {
    gardeRef.current = valeur
    setGarde(valeur)
  }, [])

  const poserTampon = useCallback(() => {
    if (tamponRef.current) return
    window.history.pushState(window.history.state, '', window.location.href)
    tamponRef.current = true
  }, [])

  // Pendant une session : bouton Retour du navigateur + fermeture de l'onglet.
  useEffect(() => {
    if (!garde) {
      // Fin normale de session : on retire le tampon, pour que Retour ne soit pas « mort » une fois.
      if (tamponRef.current) {
        tamponRef.current = false
        window.history.back()
      }
      setDemande(null)
      return undefined
    }

    poserTampon()

    function surRetourNavigateur() {
      if (!gardeRef.current || !tamponRef.current) return
      tamponRef.current = false // le tampon vient d'être consommé : on le repose aussitôt
      poserTampon()
      setDemande((actuelle) => actuelle ?? { action: () => retourOuAccueil(navigate) })
    }
    function surAvantDecharger(e) {
      if (!gardeRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('popstate', surRetourNavigateur)
    window.addEventListener('beforeunload', surAvantDecharger)
    return () => {
      window.removeEventListener('popstate', surRetourNavigateur)
      window.removeEventListener('beforeunload', surAvantDecharger)
    }
  }, [garde, navigate, poserTampon])

  // Lance `action` tout de suite si aucune session n'est en cours, sinon demande confirmation.
  const demanderSortie = useCallback((action) => {
    if (!gardeRef.current) {
      action()
      return
    }
    setDemande((actuelle) => actuelle ?? { action })
  }, [])

  function rester() {
    setDemande(null)
  }

  function quitter() {
    const { action } = demande
    gardeRef.current = false // plus de garde : l'action ne sera pas bloquée
    setDemande(null)
    if (tamponRef.current) {
      // On retire d'abord le tampon, puis on exécute l'action une fois l'historique remis en ordre.
      tamponRef.current = false
      window.addEventListener('popstate', () => action(), { once: true })
      window.history.back()
    } else {
      action()
    }
  }

  const valeur = useMemo(
    () => ({ gardeActive: garde, dialogueOuvert: demande !== null, demanderSortie, definirGarde }),
    [garde, demande, demanderSortie, definirGarde],
  )

  return (
    <Contexte.Provider value={valeur}>
      {children}
      {demande && (
        <FenetreConfirmation
          titre="Quitter la session ?"
          texte="Ta progression sera perdue."
          libelleAnnuler="Rester"
          libelleConfirmer="Quitter"
          onAnnuler={rester}
          onConfirmer={quitter}
        />
      )}
    </Contexte.Provider>
  )
}
