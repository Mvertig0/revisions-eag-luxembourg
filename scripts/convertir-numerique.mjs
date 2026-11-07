// Convertit les lots de numérique rédigés (unites/numerique/exercices/lot-*.md) en banque JSON pour l'app,
// puis contrôle la banque. Usage (depuis le dossier app) :
//   node scripts/convertir-numerique.mjs            -> contrôle puis écrit src/data/exercices/numerique.json
//   node scripts/convertir-numerique.mjs --verifier -> contrôle seulement (n'écrit rien)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'

const DOSSIER = new URL('../../unites/numerique/exercices/', import.meta.url)
const SORTIE = new URL('../src/data/exercices/numerique.json', import.meta.url)
const REPONSES_VFI = ['Vrai', 'Faux', 'Indéterminé']
const NIVEAUX = ['facile', 'moyen', 'moyen à difficile', 'difficile']

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[  ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
const sansEspaces = (s) => norm(s).replace(/ /g, '')

// ---------- lecture des .md ----------
const decouperLigneTableau = (ligne) =>
  ligne
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim())

function lireLot(nomFichier) {
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
      bloc.intro = bloc.intro.join(' ').trim()
      blocs.push(bloc)
    }
    bloc = null
  }
  for (const brut of readFileSync(new URL(nomFichier, DOSSIER), 'utf8').split('\n')) {
    const ligne = brut.trimEnd()
    let m
    if ((m = ligne.match(/^## (Tableau|Série) (N-\d+) · (.+)$/))) {
      finBloc()
      bloc = { genre: m[1] === 'Tableau' ? 'tableau' : 'serie', id: m[2], titre: m[3].trim(), theme: '', niveau: '', intro: [], table: [], questions: [] }
      champ = null
    } else if ((m = ligne.match(/^### (N-\d+-\d+)$/))) {
      finQ()
      q = { id: m[1], enonce: '', choix: [], reponseBrute: '', correction: '' }
      champ = null
    } else if (ligne === '---' || !bloc || ligne.trim() === '') {
      continue
    } else if (!q && (m = ligne.match(/^Thème : (.+)$/))) {
      bloc.theme = m[1].trim()
    } else if (!q && (m = ligne.match(/^Niveau : (.+)$/))) {
      bloc.niveau = m[1].trim()
    } else if (!q && ligne.startsWith('Format :')) {
      continue
    } else if (!q && ligne.startsWith('|')) {
      bloc.table.push(ligne)
    } else if (!q) {
      bloc.intro.push(ligne.trim())
    } else if ((m = ligne.match(/^(?:Question|Affirmation) : (.+)$/))) {
      q.enonce = m[1]
      champ = 'enonce'
    } else if ((m = ligne.match(/^([A-D])\) (.+)$/))) {
      q.choix.push(m[2].trim())
      champ = null
    } else if ((m = ligne.match(/^Réponse : (.+)$/))) {
      q.reponseBrute = m[1].trim()
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

const fichiers = readdirSync(DOSSIER)
  .filter((f) => /^lot-\d+\.md$/.test(f))
  .sort()
const blocs = fichiers.flatMap((f) => lireLot(f).map((b) => ({ ...b, _lot: f })))

// ---------- contrôles ----------
const erreurs = []
const avertissements = []
const ids = new Set()
const lettres = []
let plusLongue = 0
let plusCourte = 0
let nbQcm = 0
const vfi = { Vrai: 0, Faux: 0, Indéterminé: 0 }

for (const b of blocs) {
  const ou = `${b._lot} ${b.id}`
  if (ids.has(b.id)) erreurs.push(`${ou} : identifiant en double`)
  ids.add(b.id)
  if (!NIVEAUX.includes(b.niveau)) erreurs.push(`${ou} : niveau « ${b.niveau} » inconnu`)
  if (!b.theme) erreurs.push(`${ou} : thème manquant`)
  if (b.questions.length < 1) erreurs.push(`${ou} : aucune question`)
  if (b.genre === 'tableau') {
    if (b.table.length < 3) erreurs.push(`${ou} : tableau absent ou incomplet`)
    else {
      const [entetes, separateur, ...lignes] = b.table.map(decouperLigneTableau)
      if (!separateur.every((c) => /^:?-+:?$/.test(c))) erreurs.push(`${ou} : ligne de séparation du tableau invalide`)
      if (lignes.some((l) => l.length !== entetes.length) || separateur.length !== entetes.length) erreurs.push(`${ou} : lignes du tableau de longueurs différentes`)
      b.entetes = entetes
      b.alignements = separateur.map((c) => (c.endsWith(':') ? 'droite' : 'gauche'))
      b.lignes = lignes
    }
  }
  b.questions.forEach((q, i) => {
    const oua = `${b._lot} ${q.id}`
    if (q.id !== `${b.id.replace('N-', 'N-')}-${i + 1}`) erreurs.push(`${oua} : identifiant hors suite`)
    if (!q.enonce || !q.correction) erreurs.push(`${oua} : énoncé ou correction vide`)
    if (b.genre === 'tableau') {
      if (!REPONSES_VFI.includes(q.reponseBrute)) erreurs.push(`${oua} : réponse « ${q.reponseBrute} » inconnue`)
      else vfi[q.reponseBrute]++
      q.reponse = q.reponseBrute
    } else {
      nbQcm++
      if (q.choix.length !== 4) erreurs.push(`${oua} : ${q.choix.length} choix (attendu 4)`)
      if (new Set(q.choix.map(norm)).size !== q.choix.length) erreurs.push(`${oua} : deux choix identiques`)
      const m = q.reponseBrute.match(/^([A-D])\) (.+)$/)
      if (!m) erreurs.push(`${oua} : réponse « ${q.reponseBrute} » mal formée (attendu « B) texte »)`)
      else {
        const index = 'ABCD'.indexOf(m[1])
        if (q.choix[index] !== m[2].trim()) erreurs.push(`${oua} : la réponse « ${q.reponseBrute} » ne correspond pas au choix ${m[1]} (« ${q.choix[index]} »)`)
        q.reponse = index
        lettres.push(m[1])
        if (q.choix.every((c, k) => k === index || c.length < q.choix[index].length)) plusLongue++
        if (q.choix.every((c, k) => k === index || c.length > q.choix[index].length)) plusCourte++
        // le nombre de la bonne réponse doit apparaître dans la correction (espaces ignorés : « 2 816 » = « 2816 »)
        const nombre = q.choix[index].match(/\d[\d\s.,]*/)?.[0]
        if (nombre && !sansEspaces(q.correction).includes(sansEspaces(nombre).replace(/[.,]$/, ''))) {
          avertissements.push(`${oua} : le nombre de la bonne réponse « ${q.choix[index]} » n'apparaît pas dans la correction`)
        }
      }
    }
  })
}

const parLettre = Object.fromEntries('ABCD'.split('').map((l) => [l, lettres.filter((x) => x === l).length]))
console.log(`${blocs.length} blocs : ${blocs.filter((b) => b.genre === 'tableau').length} tableaux (Vrai/Faux/Indéterminé :`, vfi, `), ${nbQcm} QCM, lettres`, parLettre, `| bonne réponse la plus longue : ${plusLongue}/${nbQcm}, la plus courte : ${plusCourte}/${nbQcm}`)
if (nbQcm >= 8 && Object.values(parLettre).some((v) => v > nbQcm * 0.4 || v < nbQcm * 0.1)) avertissements.push('QCM : lettres de réponse mal réparties')
if (nbQcm >= 8 && plusLongue > nbQcm * 0.4) avertissements.push(`QCM : la bonne réponse est la plus longue dans ${plusLongue}/${nbQcm} questions`)
if (nbQcm >= 8 && plusCourte > nbQcm * 0.4) avertissements.push(`QCM : la bonne réponse est la plus courte dans ${plusCourte}/${nbQcm} questions`)
for (const e of erreurs) console.error('ERREUR  ', e)
for (const a of avertissements) console.warn('À VOIR  ', a)

if (erreurs.length) {
  console.error(`\n${erreurs.length} erreur(s) : rien n'a été écrit.`)
  process.exit(1)
}
if (process.argv.includes('--verifier')) process.exit(0)

const banque = {
  tableaux: blocs
    .filter((b) => b.genre === 'tableau')
    .map((b) => ({
      id: b.id, titre: b.titre, theme: b.theme, niveau: b.niveau, intro: b.intro,
      entetes: b.entetes, alignements: b.alignements, lignes: b.lignes,
      questions: b.questions.map((q) => ({ id: q.id, affirmation: q.enonce, reponse: q.reponse, correction: q.correction })),
    })),
  series: blocs
    .filter((b) => b.genre === 'serie')
    .map((b) => ({
      id: b.id, titre: b.titre, theme: b.theme, niveau: b.niveau,
      questions: b.questions.map((q) => ({ id: q.id, enonce: q.enonce, choix: q.choix, reponse: q.reponse, correction: q.correction })),
    })),
}
writeFileSync(SORTIE, JSON.stringify(banque, null, 2) + '\n')
console.log('Écrit :', SORTIE.pathname)
