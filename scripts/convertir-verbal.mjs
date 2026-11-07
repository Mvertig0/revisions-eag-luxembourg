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
const erreursDejaAffichees = erreurs.length
const avertissementsDejaAffiches = avertissements.length

// ---------- QCM de compréhension et consignes à suivre (qcm-*.md, consignes-*.md) ----------
// Même idée que les lots, mais chaque question a 4 choix A) à D) et une lettre de réponse.
function lireBlocs(nomFichier, mot) {
  const blocs = []
  let bloc = null
  let q = null
  let champ = null
  const finQ = () => {
    if (q) bloc.questions.push(q)
    q = null
  }
  const finBloc = () => {
    finQ()
    if (bloc) {
      bloc.texte = bloc.texte.join(' ').trim()
      bloc.intro = bloc.intro.join(' ').trim()
      blocs.push(bloc)
    }
    bloc = null
  }
  const entete = new RegExp(`^## ${mot} ([A-Z]-\\d+) · (.+)$`)
  for (const brut of readFileSync(new URL(nomFichier, DOSSIER), 'utf8').split('\n')) {
    const ligne = brut.trimEnd()
    let m
    if ((m = ligne.match(entete))) {
      finBloc()
      bloc = { id: m[1], titre: m[2].trim(), theme: '', niveau: '', texte: [], intro: [], regles: [], questions: [] }
      champ = null
    } else if ((m = ligne.match(/^### ([A-Z]-\d+-\d+)$/))) {
      finQ()
      q = { id: m[1], enonce: '', choix: [], lettre: '', correction: '' }
      champ = null
    } else if (ligne === '---' || !bloc || ligne.trim() === '') {
      continue
    } else if (!q && (m = ligne.match(/^Thème : (.+)$/))) {
      bloc.theme = m[1].trim()
    } else if (!q && (m = ligne.match(/^Niveau : (.+)$/))) {
      bloc.niveau = m[1].trim()
    } else if (!q && (m = ligne.match(/^\d+\.\s+(.+)$/))) {
      bloc.regles.push(m[1].trim())
    } else if (!q) {
      bloc.texte.push(ligne.trim())
      bloc.intro.push(ligne.trim())
    } else if ((m = ligne.match(/^Question : (.+)$/))) {
      q.enonce = m[1]
      champ = 'enonce'
    } else if ((m = ligne.match(/^([A-D])\) (.+)$/))) {
      q.choix.push(m[2].trim())
      champ = null
    } else if ((m = ligne.match(/^Réponse : ([A-D])$/))) {
      q.lettre = m[1]
      champ = null
    } else if ((m = ligne.match(/^Correction : (.+)$/))) {
      q.correction = m[1]
      champ = 'correction'
    } else if (champ) {
      q[champ] += ' ' + ligne.trim()
    }
  }
  finBloc()
  return blocs
}

function lireFamille(motif, mot) {
  return readdirSync(DOSSIER)
    .filter((f) => motif.test(f))
    .sort()
    .flatMap((f) => lireBlocs(f, mot).map((b) => ({ ...b, _lot: f })))
}
const qcm = lireFamille(/^qcm-\d+\.md$/, 'QCM')
const consignes = lireFamille(/^consignes-\d+\.md$/, 'Consignes')

function controlerBlocs(blocs, genre) {
  const lettres = []
  let plusLongue = 0
  let plusCourte = 0
  for (const b of blocs) {
    const ou = `${b._lot} ${b.id}`
    if (ids.has(b.id)) erreurs.push(`${ou} : identifiant en double`)
    ids.add(b.id)
    if (!NIVEAUX.includes(b.niveau)) erreurs.push(`${ou} : niveau « ${b.niveau} » inconnu`)
    if (genre === 'qcm') {
      if (!THEMES.includes(b.theme)) erreurs.push(`${ou} : thème « ${b.theme} » inconnu`)
      const mots = b.texte.split(/\s+/).length
      if (mots < 70 || mots > 140) avertissements.push(`${ou} : ${mots} mots (attendu 70 à 140)`)
    } else if (b.regles.length < 3 || b.regles.length > 6) {
      erreurs.push(`${ou} : ${b.regles.length} règles (attendu 3 à 6)`)
    }
    if (b.questions.length < 1 || b.questions.length > 3) erreurs.push(`${ou} : ${b.questions.length} questions (attendu 1 à 3)`)
    const base = norm(genre === 'qcm' ? b.texte : [b.intro, ...b.regles].join(' '))
    b.questions.forEach((q, i) => {
      const oua = `${b._lot} ${q.id}`
      if (q.id !== `${b.id}-${i + 1}`) erreurs.push(`${oua} : identifiant hors suite`)
      if (!q.enonce || !q.correction) erreurs.push(`${oua} : question ou correction vide`)
      if (q.choix.length !== 4) erreurs.push(`${oua} : ${q.choix.length} choix (attendu 4)`)
      if (new Set(q.choix.map(norm)).size !== q.choix.length) erreurs.push(`${oua} : deux choix identiques`)
      if (!q.lettre) erreurs.push(`${oua} : réponse manquante`)
      lettres.push(q.lettre)
      const bonne = 'ABCD'.indexOf(q.lettre)
      if (bonne >= 0 && q.choix.length === 4 && q.choix.every((c, k) => k === bonne || c.length < q.choix[bonne].length)) plusLongue++
      if (bonne >= 0 && q.choix.length === 4 && q.choix.every((c, k) => k === bonne || c.length > q.choix[bonne].length)) plusCourte++
      for (const [, citation] of q.correction.matchAll(/«\s*([^»]+?)\s*»/g)) {
        const morceaux = citation.split('[…]').map((s) => norm(s).replace(/^[,;. ]+|[,;. ]+$/g, '')).filter(Boolean)
        for (const morceau of morceaux) {
          if (!base.includes(morceau)) avertissements.push(`${oua} : citation absente de l'énoncé : « ${morceau} »`)
        }
      }
    })
  }
  const n = lettres.length
  const parLettre = Object.fromEntries('ABCD'.split('').map((l) => [l, lettres.filter((x) => x === l).length]))
  console.log(`${genre === 'qcm' ? 'QCM' : 'Consignes'} : ${blocs.length} blocs, ${n} questions, lettres`, parLettre, `| bonne réponse la plus longue : ${plusLongue}/${n}, la plus courte : ${plusCourte}/${n}`)
  if (n >= 8 && Object.values(parLettre).some((v) => v > n * 0.4 || v < n * 0.1)) avertissements.push(`${genre} : lettres de réponse mal réparties`)
  if (genre === 'qcm' && n >= 8 && plusLongue > n * 0.4) avertissements.push(`qcm : la bonne réponse est la plus longue dans ${plusLongue}/${n} questions (piège trop visible)`)
  if (genre === 'qcm' && n >= 8 && plusCourte > n * 0.4) avertissements.push(`qcm : la bonne réponse est la plus courte dans ${plusCourte}/${n} questions (piège trop visible)`)
}
controlerBlocs(qcm, 'qcm')
controlerBlocs(consignes, 'consignes')
for (const e of erreurs.slice(erreursDejaAffichees)) console.error('ERREUR  ', e)
for (const a of avertissements.slice(avertissementsDejaAffiches)) console.warn('À VOIR  ', a)

if (erreurs.length) {
  console.error(`\n${erreurs.length} erreur(s) : rien n'a été écrit.`)
  process.exit(1)
}
if (process.argv.includes('--verifier')) process.exit(0)
// Dans le JSON, une question a ses choix dans l'ordre d'écriture et `reponse` = numéro (0 à 3) du bon choix.
const questionJson = ({ lettre, ...q }) => ({ ...q, reponse: 'ABCD'.indexOf(lettre) })
const banque = {
  textes: textes.map(({ _lot, ...t }) => t),
  qcm: qcm.map(({ _lot, intro, regles, ...b }) => ({ ...b, questions: b.questions.map(questionJson) })),
  consignes: consignes.map(({ _lot, texte, theme, ...b }) => ({ ...b, questions: b.questions.map(questionJson) })),
}
writeFileSync(SORTIE, JSON.stringify(banque, null, 2) + '\n')
console.log('Écrit :', SORTIE.pathname)
