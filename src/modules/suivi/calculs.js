// Suivi des résultats : tout est calculé ici à partir des sessions sauvegardées dans le navigateur
// (clés « <module>:sessions »). Aucun affichage ; la page Suivi s'appuie sur ces fonctions.

// Comment regrouper les réponses d'un module pour trouver les points faibles.
export const MODULES_SUIVI = [
  { id: 'abstrait', cle: 'abstrait:sessions', groupe: (d) => d.famille ?? d.type },
  { id: 'verbal', cle: 'verbal:sessions', groupe: (d) => d.type ?? 'vfi' }, // les anciennes sessions n'ont pas de type : c'était du Vrai/Faux/Indéterminé
  { id: 'numerique', cle: 'numerique:sessions', groupe: (d) => d.type },
  { id: 'planification', cle: 'planification:sessions', groupe: (d) => d.modele },
  { id: 'situationnel', cle: 'situationnel:sessions', groupe: (d) => d.competence },
]

export const NOMS_GROUPES = {
  abstrait: { matrice: 'Matrices 3×3', serie: 'Séries de figures', intrus: 'Intrus', analogie: 'Analogies', rotation: 'Rotation mentale', pliage: 'Pliage et perçage', de: 'Dé déplié (patron)', des3: 'Dés vus sous plusieurs angles' },
  verbal: { vfi: 'Vrai / Faux / Indéterminé', qcm: 'QCM de compréhension', consignes: 'Consignes à suivre' },
  numerique: { tableau: 'Tableaux de données', qcm: 'QCM rédigés', graphique: 'Graphiques', suite: 'Suites de nombres', calcul: 'Calculs et problèmes' },
  planification: { 'creneau-commun': 'Créneau commun', 'ordre-valide': 'Ordre des tâches', 'heure-de-fin': 'Heure de fin', messages: 'Priorité des messages', echeance: 'Échéance manquée' },
  situationnel: { service: 'Servir le client-usager', conseil: 'Conseiller' },
}

export const NOMS_NIVEAUX = { facile: 'Facile', moyen: 'Moyen', difficile: 'Difficile', expert: 'Expert' }

const somme = (t) => t.reduce((a, b) => a + b, 0)
const moyenneSimple = (t) => somme(t) / t.length

// Transforme la liste brute lue dans le navigateur en sessions propres, de la plus ancienne à la plus récente.
// Les sessions invalides et les sessions de test (id « test-… », outil de développement) sont écartées.
export function normaliserSessions(brut) {
  if (!Array.isArray(brut)) return []
  return brut
    .filter((s) => s && Number.isFinite(s.score) && Number.isFinite(s.total) && s.total > 0 && s.score >= 0 && s.score <= s.total)
    .filter((s) => !Number.isNaN(new Date(s.date).getTime()))
    .filter((s) => !(typeof s.id === 'string' && s.id.startsWith('test-')))
    .map((s) => ({
      id: s.id,
      date: new Date(s.date),
      dureeSecondes: Number.isFinite(s.dureeSecondes) ? s.dureeSecondes : null,
      score: s.score,
      total: s.total,
      pct: Math.round((100 * s.score) / s.total),
      format: s.format ?? s.famille ?? null, // l'abstrait garde le type choisi dans « famille »
      niveau: s.niveau ?? null,
      details: Array.isArray(s.details) ? s.details : [],
    }))
    .sort((a, b) => a.date - b.date)
}

// Chiffres clés d'un module. `tendance` : moyenne des dernières sessions moins celle des précédentes (en points), ou null s'il y a moins de 4 sessions.
export function resumer(sessions) {
  const n = sessions.length
  if (n === 0) return { n: 0 }
  const questions = somme(sessions.map((s) => s.total))
  const bonnes = somme(sessions.map((s) => s.score))
  const avecDuree = sessions.filter((s) => s.dureeSecondes !== null)
  const k = Math.min(3, Math.floor(n / 2))
  const tendance = k >= 2
    ? Math.round(moyenneSimple(sessions.slice(-k).map((s) => s.pct)) - moyenneSimple(sessions.slice(-2 * k, -k).map((s) => s.pct)))
    : null
  return {
    n,
    questions,
    derniere: sessions[n - 1].pct,
    dateDerniere: sessions[n - 1].date,
    moyenne: Math.round((100 * bonnes) / questions),
    meilleure: Math.max(...sessions.map((s) => s.pct)),
    tendance,
    secondesParQuestion: avecDuree.length ? Math.round(somme(avecDuree.map((s) => s.dureeSecondes)) / somme(avecDuree.map((s) => s.total))) : null,
  }
}

// Réussite par groupe (type d'exercice, compétence…), du plus faible au plus fort. `minimum` : nombre de réponses minimal pour apparaître.
export function repartir(sessions, cleGroupe, minimum = 1) {
  const groupes = new Map()
  for (const s of sessions) {
    for (const d of s.details) {
      const g = cleGroupe(d)
      if (!g) continue
      const e = groupes.get(g) ?? { cle: g, bonnes: 0, total: 0 }
      e.total++
      if (d.correct) e.bonnes++
      groupes.set(g, e)
    }
  }
  return [...groupes.values()]
    .filter((e) => e.total >= minimum)
    .map((e) => ({ ...e, pct: Math.round((100 * e.bonnes) / e.total) }))
    .sort((a, b) => a.pct - b.pct || b.total - a.total)
}

// Lit tous les modules : { id: { sessions, resume, groupes, niveaux } }.
// `lecteur(cle)` renvoie la liste brute sauvegardée (par exemple lire de storage/stockage).
export function analyser(lecteur) {
  const resultat = {}
  for (const m of MODULES_SUIVI) {
    const sessions = normaliserSessions(lecteur(m.cle))
    resultat[m.id] = {
      sessions,
      resume: resumer(sessions),
      groupes: repartir(sessions, m.groupe),
      niveaux: repartir(sessions, (d) => d.niveau),
    }
  }
  return resultat
}

// Les points les plus faibles, tous modules confondus : au moins `minimum` réponses et moins de 100 % de réussite.
export function pointsFaibles(analyse, { minimum = 8, nombre = 3 } = {}) {
  const liste = []
  for (const m of MODULES_SUIVI)
    for (const g of analyse[m.id].groupes)
      if (g.total >= minimum && g.pct < 100) liste.push({ module: m.id, cle: g.cle, nom: NOMS_GROUPES[m.id][g.cle] ?? g.cle, pct: g.pct, total: g.total })
  return liste.sort((a, b) => a.pct - b.pct || b.total - a.total).slice(0, nombre)
}

// Les dernières sessions, tous modules confondus, de la plus récente à la plus ancienne.
export function historique(analyse, nombre = 12) {
  return MODULES_SUIVI.flatMap((m) => analyse[m.id].sessions.map((s) => ({ ...s, module: m.id })))
    .sort((a, b) => b.date - a.date)
    .slice(0, nombre)
}

// Les modules jamais travaillés : tous les tests pèsent autant dans la note.
export const modulesSansSession = (analyse) => MODULES_SUIVI.filter((m) => analyse[m.id].resume.n === 0).map((m) => m.id)

// Copie de toutes les sessions, pour une sauvegarde personnelle.
export function exporter(lecteur, maintenant = new Date()) {
  return { exporteLe: maintenant.toISOString(), version: 1, sessions: Object.fromEntries(MODULES_SUIVI.map((m) => [m.cle, lecteur(m.cle) ?? []])) }
}
