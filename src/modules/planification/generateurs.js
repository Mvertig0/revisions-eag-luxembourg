// Exercices de planification générés par programme : créneaux communs, ordre des tâches, heure de fin,
// priorités de messages, échéances. GovJobs décrit ce test ainsi : « gérer un agenda, en tenant compte des
// délais, des disponibilités et des priorités ». Chaque réponse est calculée, puis recalculée par un solveur
// indépendant dans verif-planification.mjs. Même numéro (graine) = même exercice.
import { alea, melanger } from '../abstrait/generateur.js'
import { entier, tirer, essayer } from '../numerique/outils.js'

// ---------- heures ----------
// Une heure = un nombre de minutes depuis minuit (9 h 30 = 570).
export const H = (m) => {
  const h = Math.floor(m / 60), mm = m % 60
  return mm ? `${h} h ${String(mm).padStart(2, '0')}` : `${h} h`
}
const plage = (a, b) => `de ${H(a)} à ${H(b)}`
const PRENOMS = ['Alice', 'Bruno', 'Camille', 'David', 'Emma', 'Farid']
const TACHES = [
  ['Courrier', [30, 45]], ['Rapport', [60, 90]], ['Appels', [30, 45]], ['Archivage', [30, 60]],
  ['Planning', [45, 60]], ['Budget', [60, 90]], ['Compte rendu', [30, 60]], ['Dossiers', [45, 90]],
]
const tableau = (entetes, lignes, droite = []) => ({ entetes, alignements: entetes.map((_, i) => (droite.includes(i) ? 'droite' : 'gauche')), lignes })

// ---------- 1. créneau commun ----------
// Une réunion doit réunir tout le monde : quelle proposition tombe en dehors de toute occupation ?
function creneauCommun(r, niveau) {
  const nbPers = { facile: 2, moyen: 3, difficile: 3, expert: 4 }[niveau]
  const noms = melanger(r, PRENOMS).slice(0, nbPers)
  const duree = niveau === 'facile' ? 60 : tirer(r, [60, 90, 120])
  const occupe = noms.map(() => {
    const premier = 480 + 30 * entier(r, 0, 8), l1 = tirer(r, [60, 90, 120])
    const debut2 = premier + l1 + 30 * entier(r, 1, 5), l2 = tirer(r, [60, 90, 120])
    return debut2 + l2 > 1080 ? null : [[premier, premier + l1], [debut2, debut2 + l2]]
  })
  if (occupe.some((o) => o === null)) return null
  const pause = niveau === 'difficile' || niveau === 'expert' ? [720, 810] : null // pause déjeuner commune
  const libre = (p, a, b) => occupe[p].every(([x, y]) => b <= x || a >= y) && (!pause || b <= pause[0] || a >= pause[1])
  const valides = [], presque = []
  for (let a = 480; a + duree <= 1080; a += 30) {
    const n = noms.filter((_, p) => libre(p, a, a + duree)).length
    if (n === nbPers) valides.push(a)
    else if (n >= nbPers - 1) presque.push(a)
  }
  if (valides.length === 0 || presque.length < 3) return null
  const bonne = tirer(r, valides)
  const autres = melanger(r, presque).slice(0, 3)
  const options = melanger(r, [bonne, ...autres])
  const lib = (a) => plage(a, a + duree)
  const choix = options.map(lib)
  const detail = (a) => {
    const raisons = noms.map((n, p) => {
      const ev = occupe[p].find(([x, y]) => !(a + duree <= x || a >= y))
      return ev ? `${n} est occupé(e) ${plage(...ev)}` : null
    }).filter(Boolean)
    if (pause && !(a + duree <= pause[0] || a >= pause[1])) raisons.push('c\'est la pause déjeuner')
    return raisons.join(' ; ')
  }
  return {
    modele: 'creneau-commun',
    titre: 'Trouver un créneau pour une réunion',
    intro: `Une réunion de ${duree} minutes doit réunir ${noms.join(', ').replace(/, ([^,]*)$/, ' et $1')} aujourd'hui, entre 8 h et 18 h. Le tableau indique quand chaque personne est occupée.`,
    tableau: tableau(['Personne', 'Occupé(e)'], noms.map((n, p) => [n, occupe[p].map(([x, y]) => `${H(x)} – ${H(y)}`).join(' ; ')])),
    regles: pause ? ['Personne n\'est disponible pendant la pause déjeuner, de 12 h à 13 h 30.'] : [],
    enonce: `Parmi ces propositions, quel créneau convient à tout le monde ?`,
    choix, reponse: options.indexOf(bonne), valeur: lib(bonne),
    correction: `Il faut un créneau de ${duree} minutes où personne n'est occupé. Le créneau ${lib(bonne)} convient. Les autres propositions échouent : ${options.filter((a) => a !== bonne).map((a) => `${lib(a)} (${detail(a)})`).join(' ; ')}.`,
    donnees: { noms, occupe, duree, pause, options, bonne },
  }
}

// ---------- 2. ordre valide ----------
// Quel ordre de traitement respecte toutes les contraintes ? (une seule proposition est valide)
const permutations = (t) => (t.length <= 1 ? [t] : t.flatMap((x, i) => permutations([...t.slice(0, i), ...t.slice(i + 1)]).map((p) => [x, ...p])))
function horaires(taches, ordre, debut) {
  let t = debut
  return ordre.map((i) => { const d = [t, t + taches[i].duree]; t = d[1]; return d })
}
function violations(taches, contraintes, ordre, debut) {
  const h = horaires(taches, ordre, debut)
  const fin = (i) => h[ordre.indexOf(i)][1]
  return contraintes.filter((c) => {
    if (c.type === 'avant') return ordre.indexOf(c.a) > ordre.indexOf(c.b)
    if (c.type === 'premier') return ordre[0] !== c.a
    if (c.type === 'dernier') return ordre.at(-1) !== c.a
    return fin(c.a) > c.h
  })
}
const texteContrainte = (taches, c) => ({
  avant: `La tâche « ${taches[c.a]?.nom} » doit être faite avant la tâche « ${taches[c.b]?.nom} ».`,
  premier: `La tâche « ${taches[c.a]?.nom} » est traitée en premier.`,
  dernier: `La tâche « ${taches[c.a]?.nom} » est traitée en dernier.`,
  'fin-avant': `La tâche « ${taches[c.a]?.nom} » doit être terminée au plus tard à ${H(c.h ?? 0)}.`,
}[c.type])

function ordreValide(r, niveau) {
  const n = { facile: 3, moyen: 4, difficile: 5, expert: 5 }[niveau]
  const nbContraintes = { facile: 2, moyen: 3, difficile: 4, expert: 5 }[niveau]
  const choisies = melanger(r, TACHES).slice(0, n)
  const taches = choisies.map(([nom, ds]) => ({ nom, duree: tirer(r, ds) }))
  const debut = 540
  const idx = taches.map((_, i) => i)
  const contraintes = []
  const essais = melanger(r, [
    ...idx.flatMap((a) => idx.filter((b) => b !== a).map((b) => ({ type: 'avant', a, b }))),
    ...idx.map((a) => ({ type: 'premier', a })),
    ...idx.map((a) => ({ type: 'dernier', a })),
    ...idx.flatMap((a) => [0, 1].map(() => ({ type: 'fin-avant', a, h: debut + 15 * entier(r, 6, 24) }))),
  ])
  const toutes = permutations(idx)
  for (const c of essais) {
    if (contraintes.length === nbContraintes) break
    if (contraintes.some((x) => x.type === c.type && x.a === c.a && (c.type !== 'avant' || x.b === c.b))) continue
    if (contraintes.some((x) => (x.type === 'premier' && c.type === 'premier') || (x.type === 'dernier' && c.type === 'dernier'))) continue
    const suite = [...contraintes, c]
    if (toutes.some((o) => violations(taches, suite, o, debut).length === 0)) contraintes.push(c)
  }
  if (contraintes.length < nbContraintes) return null
  const valides = toutes.filter((o) => violations(taches, contraintes, o, debut).length === 0)
  if (valides.length === 0 || valides.length > 6) return null
  const invalides = melanger(r, toutes.filter((o) => violations(taches, contraintes, o, debut).length > 0))
    .sort((p, q) => violations(taches, contraintes, p, debut).length - violations(taches, contraintes, q, debut).length)
  const bonne = tirer(r, valides)
  const options = melanger(r, [bonne, ...invalides.slice(0, 3)])
  const nom = (o) => o.map((i) => taches[i].nom).join(' → ')
  const horaire = (o) => horaires(taches, o, debut).map(([a, b], k) => `${taches[o[k]].nom} ${H(a)}–${H(b)}`).join(', ')
  return {
    modele: 'ordre-valide',
    titre: 'Ordonner des tâches',
    intro: `Un agent commence sa journée à ${H(debut)} et traite les tâches ci-dessous l'une après l'autre, sans pause ni interruption.`,
    tableau: tableau(['Tâche', 'Durée (minutes)'], taches.map((t) => [t.nom, String(t.duree)]), [1]),
    regles: contraintes.map((c) => texteContrainte(taches, c)),
    enonce: 'Quel ordre de traitement respecte toutes les règles ?',
    choix: options.map(nom), reponse: options.indexOf(bonne), valeur: nom(bonne),
    correction: `Ordre ${nom(bonne)} : ${horaire(bonne)}. Toutes les règles sont respectées. Les autres propositions en enfreignent au moins une : ${options.filter((o) => o !== bonne).map((o) => `${nom(o)} (${violations(taches, contraintes, o, debut).map((c) => texteContrainte(taches, c).replace(/\.$/, '').toLowerCase()).join(' ; ')})`).join(' ; ')}.`,
    donnees: { taches, contraintes, debut, options, bonne },
  }
}

// ---------- 3. heure de fin ----------
// Des tâches s'enchaînent ; des réunions fixes les interrompent (la tâche en cours reprend après).
export function heureDeFin(taches, debut, blocs) {
  let t = debut
  for (const d of taches) {
    let reste = d
    while (reste > 0) {
      const bloc = blocs.find(([a, b]) => t >= a && t < b)
      if (bloc) { t = bloc[1]; continue }
      const prochain = blocs.filter(([a]) => a > t).map(([a]) => a).sort((x, y) => x - y)[0]
      const duree = prochain === undefined ? reste : Math.min(reste, prochain - t)
      t += duree
      reste -= duree
    }
  }
  return t
}
function heureFin(r, niveau) {
  const nbT = niveau === 'facile' ? 2 : 3
  const durees = Array.from({ length: nbT }, () => tirer(r, [30, 45, 60, 90]))
  const debut = tirer(r, [480, 510, 540])
  const premiere = debut + 60 + 30 * entier(r, 0, 2)
  const blocs = [[premiere, premiere + tirer(r, [30, 60, 90])]] // une réunion obligatoire
  if (pausePrevue(niveau)) blocs.push([720, 810]) // pause déjeuner
  if (niveau === 'expert') {
    const deuxieme = blocs[0][1] + 60 + 30 * entier(r, 0, 2)
    blocs.push([deuxieme, deuxieme + 30])
  }
  blocs.sort((a, b) => a[0] - b[0])
  for (let k = 1; k < blocs.length; k++) if (blocs[k][0] < blocs[k - 1][1] + 30) return null
  const fin = heureDeFin(durees, debut, blocs)
  const somme = durees.reduce((a, b) => a + b, 0)
  const sans = debut + somme
  const touches = blocs.filter(([a]) => a < fin) // les blocages qui ont vraiment lieu avant la fin
  if (fin === sans || touches.length === 0) return null // la réunion doit réellement décaler la fin
  const dureeBlocs = touches.reduce((s, [a, b]) => s + (b - a), 0)
  const pieges = [sans, debut + somme + (touches[0][1] - touches[0][0]), fin - 30, fin + 30, debut + somme + dureeBlocs + 30, fin + 60]
  const options = [fin]
  for (const p of pieges) if (options.length < 4 && p > debut && !options.includes(p)) options.push(p)
  if (options.length < 4) return null
  const ordre = melanger(r, options)
  const nom = ([a, b]) => (a === 720 && b === 810 ? `la pause déjeuner (${plage(a, b)})` : `la réunion (${plage(a, b)})`)
  return {
    modele: 'heure-de-fin',
    titre: 'Calculer une heure de fin',
    intro: `Un agent commence à ${H(debut)} et enchaîne ${nbT} tâches dans l'ordre indiqué. Aucune tâche ne se déroule pendant une réunion ou une pause : une tâche en cours est interrompue, puis reprend ensuite pour sa durée restante.`,
    tableau: tableau(['Tâche', 'Durée (minutes)'], durees.map((d, i) => [`Tâche ${i + 1}`, String(d)]), [1]),
    regles: blocs.map(([a, b]) => (a === 720 && b === 810 ? `Pause déjeuner : ${plage(a, b)}.` : `Réunion obligatoire : ${plage(a, b)}.`)),
    enonce: "À quelle heure l'agent termine-t-il sa dernière tâche ?",
    choix: ordre.map(H), reponse: ordre.indexOf(fin), valeur: H(fin),
    correction: `Le travail total est ${durees.join(' + ')} = ${somme} minutes. Sans interruption, l'agent finirait à ${H(sans)}. Mais il ne travaille pas pendant ${touches.map(nom).join(' ni pendant ')} : ${dureeBlocs} minutes de blocage tombent avant la fin, ce qui repousse l'heure de fin. En avançant tâche par tâche, en reprenant juste après chaque blocage, il termine à ${H(fin)}.`,
    donnees: { durees, debut, blocs, fin },
  }
}
const pausePrevue = (niveau) => niveau === 'difficile' || niveau === 'expert'

// ---------- 4. priorité des messages ----------
const EMETTEURS = { Direction: 3, Usager: 2, Collègue: 1, Fournisseur: 0 }
const ECHEANCES = { "Aujourd'hui": 3, Demain: 2, Vendredi: 1, 'Sans échéance': 0 }
function messages(r, niveau) {
  const n = 5
  const lignes = Array.from({ length: n }, (_, i) => ({
    id: `M${i + 1}`, emetteur: tirer(r, Object.keys(EMETTEURS)), echeance: tirer(r, Object.keys(ECHEANCES)), duree: 10 * entier(r, 1, 9),
  }))
  const regle = { facile: 'R1', moyen: 'R2', difficile: 'R3', expert: 'R3' }[niveau]
  const cle = (m) => ({
    // clé de tri : plus petite = traité plus tôt
    R1: [-ECHEANCES[m.echeance], m.duree],
    R2: [m.echeance === "Aujourd'hui" ? 0 : 1, m.echeance === "Aujourd'hui" ? -EMETTEURS[m.emetteur] : 0, m.duree],
    R3: [-(EMETTEURS[m.emetteur] + ECHEANCES[m.echeance]), m.duree],
  }[regle])
  const compare = (a, b) => { const [x, y] = [cle(a), cle(b)]; for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0 }
  const tri = [...lignes].sort(compare)
  for (let i = 1; i < tri.length; i++) if (compare(tri[i - 1], tri[i]) === 0) return null // pas d'égalité complète
  const rang = tirer(r, [1, 1, 5])
  const bonne = rang === 1 ? tri[0] : tri.at(-1)
  const options = melanger(r, [bonne, ...melanger(r, lignes.filter((m) => m !== bonne)).slice(0, 3)])
  const textesRegle = {
    R1: ["On traite d'abord le message dont l'échéance est la plus proche (Aujourd'hui, puis Demain, puis Vendredi, puis Sans échéance).", "À échéance égale, on traite d'abord le message le plus court."],
    R2: ["On traite d'abord les messages dont l'échéance est aujourd'hui, puis tous les autres.", "Parmi les messages à échéance aujourd'hui, la Direction passe avant les Usagers, les Usagers avant les Collègues, les Collègues avant les Fournisseurs.", "À égalité (et pour les messages qui ne sont pas à échéance aujourd'hui), on traite d'abord le message le plus court."],
    R3: ["Chaque message reçoit un score : points de l'expéditeur (Direction 3, Usager 2, Collègue 1, Fournisseur 0) + points de l'échéance (Aujourd'hui 3, Demain 2, Vendredi 1, Sans échéance 0).", "On traite d'abord le message qui a le score le plus élevé.", "À score égal, on traite d'abord le message le plus court."],
  }[regle]
  const score = (m) => EMETTEURS[m.emetteur] + ECHEANCES[m.echeance]
  const ordreTexte = tri.map((m) => (regle === 'R3' ? `${m.id} (score ${score(m)}, ${m.duree} min)` : `${m.id}`)).join(' → ')
  return {
    modele: 'messages',
    titre: 'Classer des messages par priorité',
    intro: 'Un agent a reçu cinq messages à traiter. Le tableau donne, pour chacun, son expéditeur, son échéance et le temps nécessaire.',
    tableau: tableau(['Message', 'Expéditeur', 'Échéance', 'Durée (minutes)'], lignes.map((m) => [m.id, m.emetteur, m.echeance, String(m.duree)]), [3]),
    regles: textesRegle,
    enonce: rang === 1 ? 'Quel message faut-il traiter en premier ?' : 'Quel message sera traité en dernier ?',
    choix: options.map((m) => m.id), reponse: options.indexOf(bonne), valeur: bonne.id,
    correction: `En appliquant les règles, l'ordre de traitement est : ${ordreTexte}. Le message à traiter ${rang === 1 ? 'en premier' : 'en dernier'} est donc ${bonne.id}.`,
    donnees: { lignes, regle, rang, bonne: bonne.id },
  }
}

// ---------- 5. échéance manquée ----------
function echeance(r, niveau) {
  const n = niveau === 'facile' ? 4 : 5
  const debut = tirer(r, [480, 510, 540])
  const choisies = melanger(r, TACHES).slice(0, n)
  const durees = choisies.map(([, ds]) => tirer(r, ds))
  const fins = []
  let t = debut
  for (const d of durees) { t += d; fins.push(t) }
  const retard = entier(r, 1, n - 1)
  const echeances = fins.map((f, i) => (i === retard ? f - 15 * entier(r, 1, 2) : f + 15 * entier(r, 0, 4)))
  const bonne = choisies[retard][0]
  const autres = choisies.map(([nom]) => nom)
  const options = melanger(r, autres.slice(0, 4).includes(bonne) ? autres.slice(0, 4) : [bonne, ...melanger(r, autres.filter((x) => x !== bonne)).slice(0, 3)])
  if (options.length !== 4 || new Set(options).size !== 4) return null
  return {
    modele: 'echeance',
    titre: 'Repérer une échéance manquée',
    intro: `Un agent commence à ${H(debut)} et traite les tâches dans l'ordre du tableau, l'une après l'autre, sans pause.`,
    tableau: tableau(['Tâche', 'Durée (minutes)', 'À terminer avant'], choisies.map(([nom], i) => [nom, String(durees[i]), H(echeances[i])]), [1, 2]),
    regles: [],
    enonce: 'Quelle tâche sera terminée après son échéance ?',
    choix: options, reponse: options.indexOf(bonne), valeur: bonne,
    correction: `En enchaînant les tâches, elles se terminent à ${choisies.map(([nom], i) => `${H(fins[i])} (${nom})`).join(', ')}. Seule la tâche « ${bonne} » finit après son échéance (${H(fins[retard])} au lieu de ${H(echeances[retard])}).`,
    donnees: { debut, noms: choisies.map(([nom]) => nom), durees, echeances, bonne },
  }
}

const MODELES = { 'creneau-commun': creneauCommun, 'ordre-valide': ordreValide, 'heure-de-fin': heureFin, messages, echeance }
export const NOMS_MODELES = Object.keys(MODELES)
const MODELES_PAR_NIVEAU = {
  facile: ['creneau-commun', 'ordre-valide', 'heure-de-fin', 'messages', 'echeance'],
  moyen: ['creneau-commun', 'ordre-valide', 'heure-de-fin', 'messages', 'echeance'],
  difficile: ['creneau-commun', 'ordre-valide', 'heure-de-fin', 'messages', 'echeance'],
  expert: ['creneau-commun', 'ordre-valide', 'heure-de-fin', 'messages', 'echeance'],
}

// `parmi` : liste de modèles autorisés (par défaut, tous ceux du niveau).
export function genererPlanification(graine, niveau = 'moyen', parmi = null) {
  return essayer((r) => {
    const nom = tirer(r, MODELES_PAR_NIVEAU[niveau].filter((m) => !parmi || parmi.includes(m)))
    const ex = MODELES[nom](r, niveau)
    if (!ex || ex.choix.length !== 4 || new Set(ex.choix).size !== 4) return null
    return { type: 'planification', niveau, graine, ...ex }
  }, graine, alea)
}
