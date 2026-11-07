// Convertit les lots rédigés (unites/verbal/exercices/lot-*.md) en banque JSON pour l'app,
// puis contrôle la banque. Usage (depuis le dossier app) :
//   node scripts/convertir-verbal.mjs            -> contrôle puis écrit src/data/exercices/verbal.json
//   node scripts/convertir-verbal.mjs --verifier -> contrôle seulement (n'écrit rien)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'

const DOSSIER = new URL('../../unites/verbal/exercices/', import.meta.url)
const SORTIE = new URL('../src/data/exercices/verbal.json', import.meta.url)
const REPONSES = ['Vrai', 'Faux', 'Indéterminé']
const THEMES = ['société', 'sciences', 'histoire', 'économie']
const NIVEAUX = ['facile', 'moyen', 'difficile']

// ---------- lecture des .md ----------
function lireLot(nomFichier) {
  const textes = []
  let texte = null
  let affirmation = null
  let champ = null // dernier champ ouvert, pour les lignes qui continuent
  const finAffirmation = () => {
    if (affirmation) texte.affirmations.push(affirmation)
    affirmation = null
  }
  const finTexte = () => {
    finAffirmation()
    if (texte) {
      texte.texte = texte.texte.join(' ').trim()
      textes.push(texte)
    }
    texte = null
  }

  for (const brut of readFileSync(new URL(nomFichier, DOSSIER), 'utf8').split('\n')) {
    const ligne = brut.trimEnd()
    let m
    if ((m = ligne.match(/^## Texte (V-\d+) · (.+)$/))) {
      finTexte()
      texte = { id: m[1], titre: m[2].trim(), theme: '', niveau: '', texte: [], affirmations: [] }
      champ = null
    } else if ((m = ligne.match(/^### (V-\d+-\d+)$/))) {
      finAffirmation()
      affirmation = { id: m[1], affirmation: '', reponse: '', correction: '' }
      champ = null
    } else if (ligne === '---' || !texte || ligne.trim() === '') {
      continue
    } else if (!affirmation && (m = ligne.match(/^Thème : (.+)$/))) {
      texte.theme = m[1].trim()
    } else if (!affirmation && (m = ligne.match(/^Niveau : (.+)$/))) {
      texte.niveau = m[1].trim()
    } else if (affirmation && (m = ligne.match(/^Affirmation : (.+)$/))) {
      affirmation.affirmation = m[1]
      champ = 'affirmation'
    } else if (affirmation && (m = ligne.match(/^Réponse : (.+)$/))) {
      affirmation.reponse = m[1].trim()
      champ = null
    } else if (affirmation && (m = ligne.match(/^Correction : (.+)$/))) {
      affirmation.correction = m[1]
      champ = 'correction'
    } else if (affirmation && champ) {
      affirmation[champ] += ' ' + ligne.trim()
    } else if (!affirmation) {
      texte.texte.push(ligne.trim())
    }
  }
  finTexte()
  return textes
}

const fichiers = readdirSync(DOSSIER)
  .filter((f) => /^lot-\d+\.md$/.test(f))
  .sort()
const textes = fichiers.flatMap((f) => lireLot(f).map((t) => ({ ...t, _lot: f })))

// ---------- contrôles ----------
const erreurs = []
const avertissements = []
const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[  ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
const ids = new Set()
for (const t of textes) {
  const ou = `${t._lot} ${t.id}`
  if (ids.has(t.id)) erreurs.push(`${ou} : identifiant en double`)
  ids.add(t.id)
  if (!THEMES.includes(t.theme)) erreurs.push(`${ou} : thème « ${t.theme} » inconnu`)
  if (!NIVEAUX.includes(t.niveau)) erreurs.push(`${ou} : niveau « ${t.niveau} » inconnu`)
  const mots = t.texte.split(/\s+/).length
  if (mots < 70 || mots > 140) avertissements.push(`${ou} : ${mots} mots (attendu 70 à 140)`)
  if (t.affirmations.length < 2 || t.affirmations.length > 3) {
    erreurs.push(`${ou} : ${t.affirmations.length} affirmations (attendu 2 ou 3)`)
  }
  const texteNorm = norm(t.texte)
  t.affirmations.forEach((a, i) => {
    const oua = `${t._lot} ${a.id}`
    if (a.id !== `${t.id}-${i + 1}`) erreurs.push(`${oua} : identifiant hors suite`)
    if (!REPONSES.includes(a.reponse)) erreurs.push(`${oua} : réponse « ${a.reponse} » inconnue`)
    if (!a.affirmation || !a.correction) erreurs.push(`${oua} : affirmation ou correction vide`)
    // Chaque citation « … » de la correction doit exister mot pour mot dans le texte ([…] = coupure).
    for (const [, citation] of a.correction.matchAll(/«\s*([^»]+?)\s*»/g)) {
      const morceaux = citation
        .split('[…]')
        .map((s) => norm(s).replace(/^[,;. ]+|[,;. ]+$/g, ''))
        .filter(Boolean)
      for (const morceau of morceaux) {
        if (!texteNorm.includes(morceau)) avertissements.push(`${oua} : citation absente du texte : « ${morceau} »`)
      }
    }
  })
}
const toutes = textes.flatMap((t) => t.affirmations)
const compte = Object.fromEntries(REPONSES.map((r) => [r, toutes.filter((a) => a.reponse === r).length]))
console.log(`${textes.length} textes, ${toutes.length} affirmations`, compte)
for (const e of erreurs) console.error('ERREUR  ', e)
for (const a of avertissements) console.warn('À VOIR  ', a)

if (erreurs.length) {
  console.error(`\n${erreurs.length} erreur(s) : rien n'a été écrit.`)
  process.exit(1)
}
if (process.argv.includes('--verifier')) process.exit(0)
const banque = { textes: textes.map(({ _lot, ...t }) => t) }
writeFileSync(SORTIE, JSON.stringify(banque, null, 2) + '\n')
console.log('Écrit :', SORTIE.pathname)
