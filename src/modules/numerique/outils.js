// Outils communs aux générateurs d'exercices de numérique (graphiques, suites, calculs).
// Aucun affichage ici. Les exercices sont créés à partir d'un numéro (graine) : même numéro = même exercice.
import { melanger } from '../abstrait/generateur.js'

export const entier = (r, a, b) => a + Math.floor(r() * (b - a + 1))
export const tirer = (r, tab) => tab[Math.floor(r() * tab.length)]

// 1234.5 -> « 1 234,5 » (espace fine insécable entre les milliers) ; unite : « 25 % », « 3 200 € ».
// signe : true -> « +25 % » ou « −20 % ».
export function fmt(n, unite = '', signe = false) {
  const arrondi = Math.round(n * 100) / 100
  const [ent, dec] = String(Math.abs(arrondi)).split('.')
  const groupe = ent.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  const prefixe = arrondi < 0 ? '−' : signe && arrondi > 0 ? '+' : ''
  const corps = prefixe + groupe + (dec ? ',' + dec : '')
  return unite ? `${corps} ${unite}` : corps
}

// Construit les 4 propositions d'un QCM : la bonne valeur, les erreurs classiques (`pieges`, dans l'ordre de
// vraisemblance), puis des valeurs proches si besoin. Toutes distinctes et non nulles.
// Renvoie { choix (textes), indexBonne, valeurs (nombres, dans le même ordre) }.
export function proposer(r, bonne, pieges, unite = '', signe = false) {
  const valeurs = [bonne]
  const decimales = Number.isInteger(bonne) ? 0 : 1
  const arrondir = (v) => (decimales ? Math.round(v * 10) / 10 : Math.round(v))
  const ajouter = (v) => {
    const x = arrondir(v)
    if (!Number.isFinite(x) || x === 0) return
    if (!signe && x < 0) return
    if (valeurs.some((y) => Math.abs(y - x) < 1e-9)) return
    valeurs.push(x)
  }
  for (const p of pieges) if (valeurs.length < 4) ajouter(p)
  const pas = Math.max(1, Math.round(Math.abs(bonne) * 0.1))
  const proches = [bonne + pas, bonne - pas, bonne * 2, bonne / 2, bonne + 2 * pas, bonne - 2 * pas, bonne + 3 * pas, bonne + 5 * pas]
  for (const v of proches) if (valeurs.length < 4) ajouter(v)
  const ordre = melanger(r, valeurs)
  return { choix: ordre.map((v) => fmt(v, unite, signe)), indexBonne: ordre.indexOf(bonne), valeurs: ordre }
}

// Idem pour des propositions qui sont des textes (« 2019 → 2020 »).
export function proposerTextes(r, bonne, autres) {
  const valeurs = [bonne, ...melanger(r, [...new Set(autres)].filter((a) => a !== bonne)).slice(0, 3)]
  const ordre = melanger(r, valeurs)
  return { choix: ordre, indexBonne: ordre.indexOf(bonne) }
}

// Essaie plusieurs tirages jusqu'à ce que `creer(r)` renvoie un exercice (sinon null = on retente).
export function essayer(creer, graine, alea) {
  for (let k = 0; k < 300; k++) {
    const ex = creer(alea(graine * 1000 + k))
    if (ex) return ex
  }
  throw new Error(`Aucun exercice valide pour la graine ${graine}`)
}
