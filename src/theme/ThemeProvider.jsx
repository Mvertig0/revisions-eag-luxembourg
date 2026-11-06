import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react'
import { ecrire, lire } from '../storage/stockage'

// Les trois choix possibles : 'auto' (réglage de l'appareil), 'clair', 'sombre'.
export const CHOIX_THEME = ['auto', 'clair', 'sombre']
const CLE = 'theme'

function choixEnregistre() {
  const valeur = lire(CLE, 'auto')
  return CHOIX_THEME.includes(valeur) ? valeur : 'auto'
}

// Écrit le choix sur la page : theme.css s'occupe ensuite des couleurs.
function appliquer(choix) {
  const racine = document.documentElement
  if (choix === 'auto') racine.removeAttribute('data-theme')
  else racine.setAttribute('data-theme', choix)
}

// Appelé avant le premier affichage pour éviter un flash de la mauvaise couleur.
export function appliquerThemeInitial() {
  appliquer(choixEnregistre())
}

const ContexteTheme = createContext({ choix: 'auto', changer: () => {} })

export function ThemeProvider({ children }) {
  const [choix, setChoix] = useState(choixEnregistre)

  useLayoutEffect(() => {
    appliquer(choix)
  }, [choix])

  const changer = useCallback((nouveau) => {
    if (!CHOIX_THEME.includes(nouveau)) return
    setChoix(nouveau)
    ecrire(CLE, nouveau)
  }, [])

  const valeur = useMemo(() => ({ choix, changer }), [choix, changer])
  return <ContexteTheme.Provider value={valeur}>{children}</ContexteTheme.Provider>
}

export function useTheme() {
  return useContext(ContexteTheme)
}
