// Lecture / écriture dans le navigateur (localStorage).
// Toutes les clés commencent par « eag: ». Si le navigateur refuse
// (mode privé, stockage plein…), on ne plante pas : on renvoie la valeur par défaut.

const PREFIXE = 'eag:'

export function lire(cle, valeurParDefaut = null) {
  try {
    const brut = window.localStorage.getItem(PREFIXE + cle)
    return brut === null ? valeurParDefaut : JSON.parse(brut)
  } catch {
    return valeurParDefaut
  }
}

export function ecrire(cle, valeur) {
  try {
    window.localStorage.setItem(PREFIXE + cle, JSON.stringify(valeur))
    return true
  } catch {
    return false
  }
}

export function effacer(cle) {
  try {
    window.localStorage.removeItem(PREFIXE + cle)
    return true
  } catch {
    return false
  }
}
