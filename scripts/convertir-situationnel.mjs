// Convertit les scénarios rédigés (unites/situationnel/exercices/lot-*.md) en banque JSON pour l'app,
// puis contrôle la banque. Usage (depuis le dossier app) :
//   node scripts/convertir-situationnel.mjs            -> contrôle puis écrit src/data/exercices/situationnel.json
//   node scripts/convertir-situationnel.mjs --verifier -> contrôle seulement (n'écrit rien)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { CRITERES, scoreReaction } from '../src/modules/situationnel/criteres.js'

const DOSSIER = new URL('../../unites/situationnel/exercices/', import.meta.url)
const SORTIE = new URL('../src/data/exercices/situationnel.json', import.meta.url)
const NIVEAUX = ['facile', 'moyen', 'difficile']
const COMPETENCES = ['service', 'conseil']

// ---------- lecture des .md ----------
function lireLot(nomFichier) {
  const blocs = []
  let b = null
  let zone = null // 'contexte' | 'reactions'
  const fin = () => {
    if (b) {
      b.contexte = b.contexte.join(' ').trim()
      blocs.push(b)
    }
    b = null
  }
  for (const brut of readFileSync(new URL(nomFichier, DOSSIER), 'utf8').split('\n')) {
    const ligne = brut.trimEnd()
    let m
    if ((m = ligne.match(/^## Scénario ([A-Z]-\d+) · (.+)$/))) {
      fin()
      b = { id: m[1], titre: m[2].trim(), competence: '', niveau: '', contexte: [], principe: '', reactions: [] }
      zone = 'contexte'
    } else if (!b || ligne === '---' || ligne.trim() === '') {
      continue
    } else if ((m = ligne.match(/^Compétence : (.+)$/))) {
      b.competence = m[1].trim()
    } else if ((m = ligne.match(/^Niveau : (.+)$/))) {
      b.niveau = m[1].trim()
    } else if ((m = ligne.match(/^Principe : (.+)$/))) {
      b.principe = m[1].trim()
    } else if (ligne.startsWith('### Réactions')) {
      zone = 'reactions'
    } else if (zone === 'reactions' && (m = ligne.match(/^([A-D])\) (.+?) :: (.+)$/))) {
      b.reactions.push({ lettre: m[1], texte: m[2].trim(), tags: m[3].split(',').map((t) => t.trim()).filter(Boolean) })
    } else if (zone === 'contexte') {
      b.contexte.push(ligne.trim())
    }
  }
  fin()
  return blocs
}

const fichiers = readdirSync(DOSSIER).filter((f) => /^lot-\d+\.md$/.test(f)).sort()
const scenarios = fichiers.flatMap((f) => lireLot(f).map((s) => ({ ...s, _lot: f })))

// ---------- contrôles ----------
const erreurs = []
const avertissements = []
const ids = new Set()
let meilleureLongue = 0
let meilleureCourte = 0
const mots = (t) => t.split(/\s+/).length

for (const s of scenarios) {
  const ou = `${s._lot} ${s.id}`
  if (ids.has(s.id)) erreurs.push(`${ou} : identifiant en double`)
  ids.add(s.id)
  if (!COMPETENCES.includes(s.competence)) erreurs.push(`${ou} : compétence « ${s.competence} » inconnue`)
  if (!NIVEAUX.includes(s.niveau)) erreurs.push(`${ou} : niveau « ${s.niveau} » inconnu`)
  if (!s.principe) erreurs.push(`${ou} : principe manquant`)
  const nbMots = mots(s.contexte)
  if (nbMots < 15 || nbMots > 90) avertissements.push(`${ou} : contexte de ${nbMots} mots (attendu 15 à 90)`)
  if (s.reactions.length !== 4 || s.reactions.map((r) => r.lettre).join('') !== 'ABCD') {
    erreurs.push(`${ou} : il faut exactement les réactions A, B, C, D (trouvé : ${s.reactions.map((r) => r.lettre).join('')})`)
    continue
  }
  for (const r of s.reactions) {
    for (const t of r.tags) {
      if (!(t in CRITERES)) erreurs.push(`${ou} ${r.lettre} : critère « ${t} » inconnu`)
      else if (CRITERES[t].competence !== 'les deux' && CRITERES[t].competence !== s.competence) erreurs.push(`${ou} ${r.lettre} : critère « ${t} » réservé à la compétence ${CRITERES[t].competence}`)
    }
    if (r.tags.length === 0) erreurs.push(`${ou} ${r.lettre} : aucun critère`)
    const n = mots(r.texte)
    if (n < 15 || n > 45) avertissements.push(`${ou} ${r.lettre} : réaction de ${n} mots (attendu 15 à 45)`)
  }
  if (erreurs.some((e) => e.startsWith(ou))) continue
  for (const r of s.reactions) r.score = scoreReaction(r.tags)
  const scores = s.reactions.map((r) => r.score)
  const max = Math.max(...scores), min = Math.min(...scores)
  if (scores.filter((x) => x === max).length !== 1) erreurs.push(`${ou} : la meilleure réaction n'est pas unique (scores ${scores.join(', ')})`)
  if (scores.filter((x) => x === min).length !== 1) erreurs.push(`${ou} : la pire réaction n'est pas unique (scores ${scores.join(', ')})`)
  if (erreurs.some((e) => e.startsWith(ou))) continue
  s.meilleure = scores.indexOf(max)
  s.pire = scores.indexOf(min)
  const seconds = [...scores].sort((a, b) => b - a)
  if (seconds[0] - seconds[1] < 2) avertissements.push(`${ou} : écart de ${seconds[0] - seconds[1]} point(s) seulement entre la meilleure et la suivante`)
  if (s.reactions[s.meilleure].tags.filter((t) => CRITERES[t].poids > 0).length < 2) avertissements.push(`${ou} : la meilleure réaction a moins de 2 qualités`)
  const longueurs = s.reactions.map((r) => r.texte.length)
  if (longueurs.every((l, k) => k === s.meilleure || l < longueurs[s.meilleure])) meilleureLongue++
  if (longueurs.every((l, k) => k === s.meilleure || l > longueurs[s.meilleure])) meilleureCourte++
}

const n = scenarios.length
console.log(`${n} scénarios (${COMPETENCES.map((c) => `${c} : ${scenarios.filter((s) => s.competence === c).length}`).join(', ')}) | meilleure réaction la plus longue : ${meilleureLongue}/${n}, la plus courte : ${meilleureCourte}/${n}`)
if (n >= 8 && meilleureLongue > n * 0.4) avertissements.push(`la meilleure réaction est la plus longue dans ${meilleureLongue}/${n} scénarios (piège trop visible)`)
if (n >= 8 && meilleureCourte > n * 0.4) avertissements.push(`la meilleure réaction est la plus courte dans ${meilleureCourte}/${n} scénarios (piège trop visible)`)
for (const e of erreurs) console.error('ERREUR  ', e)
for (const a of avertissements) console.warn('À VOIR  ', a)

if (erreurs.length) {
  console.error(`\n${erreurs.length} erreur(s) : rien n'a été écrit.`)
  process.exit(1)
}
if (process.argv.includes('--verifier')) process.exit(0)
const banque = {
  scenarios: scenarios.map(({ _lot, ...s }) => ({
    ...s,
    reactions: s.reactions.map(({ lettre, ...r }) => r), // l'ordre d'écriture est conservé ; les lettres sont refaites à chaque session
  })),
}
writeFileSync(SORTIE, JSON.stringify(banque, null, 2) + '\n')
console.log('Écrit :', SORTIE.pathname)
