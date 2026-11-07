// Exercices de numérique sur graphiques : barres, courbe, camembert. Chaque graphique est dessiné en SVG
// (couleurs : variables --graph-1 à --graph-6 de theme.css) et accompagné de 3 questions à 4 propositions.
// Les réponses sont calculées à partir des données du graphique ; verif-numerique.mjs les recalcule autrement.
import { alea, melanger } from '../abstrait/generateur.js'
import { entier, tirer, fmt, proposer, proposerTextes, essayer } from './outils.js'

// ---------- contextes ----------
const CONTEXTES_TEMPS = [
  { titre: 'Dossiers traités chaque année par un service', axe: 'Dossiers traités', unite: '', u: 10, kmin: 12, kmax: 60 },
  { titre: "Visiteurs d'une exposition municipale", axe: 'Visiteurs', unite: '', u: 100, kmin: 8, kmax: 40 },
  { titre: "Appels reçus par un centre d'information", axe: 'Appels reçus', unite: '', u: 20, kmin: 10, kmax: 50 },
  { titre: "Budget de formation d'un office public", axe: 'Milliers d\'euros', unite: 'k€', u: 10, kmin: 8, kmax: 40 },
  { titre: "Consommation d'électricité d'un bâtiment public", axe: 'MWh', unite: 'MWh', u: 5, kmin: 10, kmax: 50 },
  { titre: 'Inscriptions à des formations', axe: 'Inscriptions', unite: '', u: 10, kmin: 10, kmax: 50 },
]
const CONTEXTES_CAT = [
  { titre: 'Demandes traitées par service', axe: 'Demandes traitées', unite: '', labels: ['Service A', 'Service B', 'Service C', 'Service D', 'Service E'], u: 20, kmin: 5, kmax: 30 },
  { titre: 'Agents par direction', axe: 'Agents', unite: '', labels: ['Direction 1', 'Direction 2', 'Direction 3', 'Direction 4', 'Direction 5'], u: 10, kmin: 4, kmax: 25 },
  { titre: 'Usagers reçus par site', axe: 'Usagers reçus', unite: '', labels: ['Nord', 'Sud', 'Est', 'Ouest', 'Centre'], u: 50, kmin: 4, kmax: 20 },
  { titre: 'Rapports rendus par équipe', axe: 'Rapports', unite: '', labels: ['Équipe 1', 'Équipe 2', 'Équipe 3', 'Équipe 4', 'Équipe 5'], u: 5, kmin: 6, kmax: 30 },
]
const PERIODES = [
  (r) => { const a = entier(r, 2016, 2019); return Array.from({ length: entier(r, 5, 6) }, (_, i) => String(a + i)) },
  (r) => { const a = entier(r, 2016, 2019); return Array.from({ length: 5 }, (_, i) => String(a + i)) },
  () => ['T1', 'T2', 'T3', 'T4'],
  () => ['Jan.', 'Fév.', 'Mars', 'Avril', 'Mai', 'Juin'],
]
const CONTEXTES_PARTS = [
  { titre: 'Modes de déplacement domicile-travail des agents', noms: 'agents', labels: ['Voiture', 'Transports en commun', 'Vélo', 'Marche', 'Autre'] },
  { titre: 'Demandes reçues selon le canal utilisé', noms: 'demandes', labels: ['Guichet', 'Courrier', 'Téléphone', 'Internet', 'Autre'] },
  { titre: 'Participants aux formations selon le domaine', noms: 'participants', labels: ['Informatique', 'Langues', 'Management', 'Droit', 'Autre'] },
]

// ---------- dessin ----------
function echelle(max) {
  const pas = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000].find((p) => max / p <= 5)
  return { pas, haut: Math.ceil(max / pas) * pas }
}
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const enTete = (titre, W, H) =>
  `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(titre)}" style="width:100%;max-width:520px;height:auto" font-family="inherit">`

function repere({ axe, labels, valeurs }) {
  const W = 360, H = 240, g = 46, d = 12, h = 30, b = 38
  const { pas, haut } = echelle(Math.max(...valeurs))
  const larg = W - g - d, hauteur = H - h - b
  const y = (v) => h + hauteur - (v / haut) * hauteur
  const bande = larg / labels.length
  let s = `<text x="${g}" y="14" font-size="11" fill="currentColor" fill-opacity="0.75">${esc(axe)}</text>`
  for (let v = 0; v <= haut; v += pas) {
    s += `<line x1="${g}" y1="${y(v)}" x2="${W - d}" y2="${y(v)}" stroke="currentColor" stroke-opacity="0.15"/>`
    s += `<text x="${g - 6}" y="${y(v) + 4}" font-size="10.5" text-anchor="end" fill="currentColor" fill-opacity="0.75">${fmt(v)}</text>`
  }
  labels.forEach((l, i) => {
    s += `<text x="${g + (i + 0.5) * bande}" y="${H - b + 16}" font-size="10.5" text-anchor="middle" fill="currentColor">${esc(l)}</text>`
  })
  return { W, H, g, bande, y, base: h + hauteur, s }
}

export function svgBarres({ titre, axe, labels, valeurs }) {
  const p = repere({ axe, labels, valeurs })
  let s = enTete(titre, p.W, p.H) + p.s
  valeurs.forEach((v, i) => {
    const x = p.g + i * p.bande + p.bande * 0.18
    s += `<rect x="${x}" y="${p.y(v)}" width="${p.bande * 0.64}" height="${p.base - p.y(v)}" rx="2" fill="var(--graph-1)"/>`
    s += `<text x="${x + p.bande * 0.32}" y="${p.y(v) - 4}" font-size="11" font-weight="700" text-anchor="middle" fill="currentColor">${fmt(v)}</text>`
  })
  return s + '</svg>'
}

export function svgCourbe({ titre, axe, labels, valeurs }) {
  const p = repere({ axe, labels, valeurs })
  const pts = valeurs.map((v, i) => [p.g + (i + 0.5) * p.bande, p.y(v)])
  let s = enTete(titre, p.W, p.H) + p.s
  s += `<polyline points="${pts.map((q) => q.join(',')).join(' ')}" fill="none" stroke="var(--graph-1)" stroke-width="3" stroke-linejoin="round"/>`
  pts.forEach(([x, y], i) => {
    s += `<circle cx="${x}" cy="${y}" r="4.5" fill="var(--graph-1)"/>`
    s += `<text x="${x}" y="${y - 9}" font-size="11" font-weight="700" text-anchor="middle" fill="currentColor">${fmt(valeurs[i])}</text>`
  })
  return s + '</svg>'
}

export function svgCamembert({ titre, labels, pourcents }) {
  const W = 400, H = 190, cx = 84, cy = 95, R = 72
  let s = enTete(titre, W, H)
  let angle = -Math.PI / 2
  pourcents.forEach((p, i) => {
    const a2 = angle + (p / 100) * 2 * Math.PI
    const [x1, y1, x2, y2] = [cx + R * Math.cos(angle), cy + R * Math.sin(angle), cx + R * Math.cos(a2), cy + R * Math.sin(a2)]
    s += `<path d="M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${p > 50 ? 1 : 0} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="var(--graph-${i + 1})" stroke="var(--abs-fond)" stroke-width="1.5"/>`
    angle = a2
  })
  labels.forEach((l, i) => {
    const y = 36 + i * 26
    s += `<rect x="176" y="${y - 11}" width="14" height="14" rx="3" fill="var(--graph-${i + 1})"/>`
    s += `<text x="196" y="${y}" font-size="11.5" fill="currentColor">${esc(l)} : <tspan font-weight="700">${pourcents[i]} %</tspan></text>`
  })
  return s + '</svg>'
}

// ---------- questions sur un graphique à barres ou à courbe ----------
// ctx : { labels, valeurs, unite, mode ('temps' = périodes dans l'ordre, 'cat' = catégories) }
// Chaque modèle renvoie { enonce, bonne, pieges, unite, signe?, correction, modele, args } ou null (on retente).
const somme = (t) => t.reduce((a, b) => a + b, 0)
const paires = (r, n) => melanger(r, Array.from({ length: n }, (_, i) => i).flatMap((i) => Array.from({ length: n }, (_, j) => [i, j]).filter(([a, b]) => a !== b)))
const entierPct = (x) => Math.abs(x - Math.round(x)) < 1e-9

const MODELES = {
  ecart: (c, r) => {
    const [i, j] = paires(r, c.labels.length)[0]
    const [a, b] = [c.valeurs[i], c.valeurs[j]]
    const d = Math.abs(a - b)
    return {
      enonce: `Quel est l'écart entre « ${c.labels[i]} » et « ${c.labels[j]} » ?`,
      bonne: d, pieges: [a + b, Math.max(a, b), (a + b) / 2], unite: c.unite,
      correction: `« ${c.labels[i]} » vaut ${fmt(a)} et « ${c.labels[j]} » vaut ${fmt(b)}. L'écart est ${fmt(Math.max(a, b))} − ${fmt(Math.min(a, b))} = ${fmt(d)}. Piège fréquent : additionner au lieu de soustraire.`,
      modele: 'ecart', args: { i, j },
    }
  },
  total: (c) => {
    const S = somme(c.valeurs)
    return {
      enonce: c.mode === 'temps' ? "Quel est le total sur l'ensemble de la période ?" : 'Quel est le total toutes catégories confondues ?',
      bonne: S, pieges: [S - Math.min(...c.valeurs), S - Math.max(...c.valeurs), S / c.valeurs.length], unite: c.unite,
      correction: `On additionne toutes les valeurs : ${c.valeurs.map((v) => fmt(v)).join(' + ')} = ${fmt(S)}. Piège fréquent : oublier une barre.`,
      modele: 'total', args: {},
    }
  },
  cumul: (c, r) => {
    const n = c.labels.length
    const longueur = entier(r, 2, 3)
    const a = entier(r, 0, n - longueur)
    const sous = c.valeurs.slice(a, a + longueur)
    const S = somme(sous)
    const voisin = c.valeurs[a + longueur] ?? c.valeurs[a - 1]
    return {
      enonce: c.mode === 'temps'
        ? `Quel est le total entre « ${c.labels[a]} » et « ${c.labels[a + longueur - 1]} » (inclus) ?`
        : `Quel est le total pour ${c.labels.slice(a, a + longueur).map((l) => `« ${l} »`).join(', ')} réunis ?`,
      bonne: S, pieges: [S - sous[0], S + voisin, S - sous.at(-1)], unite: c.unite,
      correction: `On additionne : ${sous.map((v) => fmt(v)).join(' + ')} = ${fmt(S)}. Piège fréquent : oublier la première ou la dernière valeur de la période.`,
      modele: 'cumul', args: { a, longueur },
    }
  },
  moyenne: (c) => {
    const S = somme(c.valeurs), n = c.valeurs.length
    if (S % n !== 0) return null
    return {
      enonce: c.mode === 'temps' ? 'Quelle est la valeur moyenne sur la période ?' : 'Quelle est la valeur moyenne par catégorie ?',
      bonne: S / n, pieges: [S / (n - 1), (Math.max(...c.valeurs) + Math.min(...c.valeurs)) / 2, S / n + (Math.max(...c.valeurs) - S / n) / 2], unite: c.unite,
      correction: `Le total est ${fmt(S)} et il y a ${n} valeurs : ${fmt(S)} ÷ ${n} = ${fmt(S / n)}. Piège fréquent : diviser par le mauvais nombre de valeurs.`,
      modele: 'moyenne', args: {},
    }
  },
  part: (c, r) => {
    const S = somme(c.valeurs)
    const i = melanger(r, c.valeurs.map((_, k) => k)).find((k) => entierPct((c.valeurs[k] / S) * 100))
    if (i === undefined) return null
    const p = (c.valeurs[i] / S) * 100
    return {
      enonce: `Quelle part du total représente « ${c.labels[i]} » ?`,
      bonne: p, pieges: [Math.round((c.valeurs[i] / Math.max(...c.valeurs)) * 100), Math.round((c.valeurs[i] / (S - c.valeurs[i])) * 100), c.valeurs[i] / 10], unite: '%',
      correction: `Le total est ${fmt(S)} et « ${c.labels[i]} » vaut ${fmt(c.valeurs[i])}. La part est ${fmt(c.valeurs[i])} ÷ ${fmt(S)} = ${fmt(p / 100)}, soit ${fmt(p)} %. Piège fréquent : diviser par la plus grande valeur au lieu du total.`,
      modele: 'part', args: { i },
    }
  },
  rapport: (c, r) => {
    for (const [i, j] of paires(r, c.labels.length)) {
      const q = c.valeurs[i] / c.valeurs[j]
      if ([1.5, 2, 2.5, 3, 4].some((x) => Math.abs(q - x) < 1e-9)) {
        return {
          enonce: `La valeur de « ${c.labels[i]} » représente combien de fois celle de « ${c.labels[j]} » ?`,
          bonne: q, pieges: [c.valeurs[j] / c.valeurs[i], q + 1, q - 1], unite: 'fois',
          correction: `On divise la valeur de « ${c.labels[i]} » par celle de « ${c.labels[j]} » : ${fmt(c.valeurs[i])} ÷ ${fmt(c.valeurs[j])} = ${fmt(q)}. Piège fréquent : inverser la division.`,
          modele: 'rapport', args: { i, j },
        }
      }
    }
    return null
  },
  variation: (c, r) => {
    for (const [i, j] of paires(r, c.labels.length)) {
      if (i >= j) continue
      const p = ((c.valeurs[j] - c.valeurs[i]) / c.valeurs[i]) * 100
      if (!entierPct(p) || Math.round(p) === 0) continue
      const [a, b] = [c.valeurs[i], c.valeurs[j]]
      return {
        enonce: `Quelle est l'évolution, en pourcentage, entre « ${c.labels[i]} » et « ${c.labels[j]} » ?`,
        bonne: Math.round(p), pieges: [-Math.round(p), Math.round(((b - a) / b) * 100), b - a], unite: '%', signe: true,
        correction: `La valeur passe de ${fmt(a)} à ${fmt(b)} : la variation est ${fmt(b)} − ${fmt(a)} = ${fmt(b - a, '', true)}. En pourcentage de la valeur de départ : ${fmt(b - a, '', true)} ÷ ${fmt(a)} = ${fmt(p / 100, '', true)}, soit ${fmt(p, '%', true)}. Piège fréquent : calculer le pourcentage sur la valeur d'arrivée au lieu de celle de départ.`,
        modele: 'variation', args: { i, j },
      }
    }
    return null
  },
  'ecart-relatif': (c, r) => {
    for (const [i, j] of paires(r, c.labels.length)) {
      const [a, b] = [c.valeurs[i], c.valeurs[j]]
      if (a <= b) continue
      const p = ((a - b) / b) * 100
      if (!entierPct(p)) continue
      return {
        enonce: `De combien de pour cent la valeur de « ${c.labels[i]} » dépasse-t-elle celle de « ${c.labels[j]} » ?`,
        bonne: Math.round(p), pieges: [Math.round(((a - b) / a) * 100), Math.round((a / b) * 100), a - b], unite: '%',
        correction: `L'écart est ${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}. On le compare à la valeur de référence, celle de « ${c.labels[j]} » : ${fmt(a - b)} ÷ ${fmt(b)} = ${fmt((a - b) / b)}, soit ${fmt(p)} %. Piège fréquent : prendre la mauvaise valeur de référence.`,
        modele: 'ecart-relatif', args: { i, j },
      }
    }
    return null
  },
  'plus-forte-hausse': (c, r) => {
    const n = c.labels.length
    if (n < 5) return null
    const d = c.valeurs.slice(1).map((v, i) => v - c.valeurs[i])
    const max = Math.max(...d)
    if (max <= 0 || d.filter((x) => x === max).length !== 1) return null
    const k = d.indexOf(max)
    const nom = (i) => `${c.labels[i]} → ${c.labels[i + 1]}`
    const { choix, indexBonne } = proposerTextes(r, nom(k), d.map((_, i) => nom(i)))
    return {
      enonce: 'Entre quelles périodes consécutives la hausse (en valeur) est-elle la plus forte ?',
      choix, indexBonne, texteBonne: nom(k),
      correction: `Hausses successives : ${d.map((x, i) => `${nom(i)} : ${fmt(x, '', true)}`).join(' ; ')}. La plus forte est ${fmt(max, '', true)}, entre ${nom(k)}.`,
      modele: 'plus-forte-hausse', args: {},
    }
  },
  'hausse-relative': (c, r) => {
    const n = c.labels.length
    if (n < 5) return null
    const d = c.valeurs.slice(1).map((v, i) => v - c.valeurs[i])
    const rel = d.map((x, i) => x / c.valeurs[i])
    const maxRel = Math.max(...rel)
    if (maxRel <= 0 || rel.filter((x) => Math.abs(x - maxRel) < 1e-9).length !== 1) return null
    const k = rel.findIndex((x) => Math.abs(x - maxRel) < 1e-9)
    if (d.indexOf(Math.max(...d)) === k) return null // on veut que la plus forte hausse en % ne soit pas celle en valeur : c'est le piège
    const nom = (i) => `${c.labels[i]} → ${c.labels[i + 1]}`
    const { choix, indexBonne } = proposerTextes(r, nom(k), [nom(d.indexOf(Math.max(...d))), ...d.map((_, i) => nom(i))])
    return {
      enonce: 'Entre quelles périodes consécutives la hausse, en pourcentage, est-elle la plus forte ?',
      choix, indexBonne, texteBonne: nom(k),
      correction: `En pourcentage de la valeur de départ : ${rel.map((x, i) => `${nom(i)} : ${fmt(x * 100, '%', true)}`).join(' ; ')}. La plus forte hausse relative est ${fmt(maxRel * 100, '%', true)}, entre ${nom(k)} (ce n'est pas forcément la plus forte hausse en valeur).`,
      modele: 'hausse-relative', args: {},
    }
  },
}
const TEMPS_SEULEMENT = new Set(['variation', 'plus-forte-hausse', 'hausse-relative'])
const MODELES_PAR_NIVEAU = {
  facile: ['ecart', 'total', 'cumul'],
  moyen: ['moyenne', 'part', 'rapport', 'cumul', 'ecart'],
  difficile: ['variation', 'plus-forte-hausse', 'moyenne', 'part', 'ecart-relatif', 'rapport'],
  expert: ['variation', 'hausse-relative', 'ecart-relatif', 'part', 'rapport'],
}

// ---------- questions sur un camembert ----------
// ctx : { labels, pourcents (multiples de 5, total 100), total (effectif), noms }
const MODELES_PARTS = {
  effectif: (c, r) => {
    const i = entier(r, 0, c.labels.length - 1)
    const e = (c.total * c.pourcents[i]) / 100
    return {
      enonce: `Sur ${fmt(c.total)} ${c.noms}, combien correspondent à « ${c.labels[i]} » ?`,
      bonne: e, pieges: [c.pourcents[i], c.total - e, (c.total * c.pourcents[i]) / 10], unite: '',
      correction: `« ${c.labels[i]} » représente ${c.pourcents[i]} % de ${fmt(c.total)} : ${fmt(c.total)} × ${fmt(c.pourcents[i] / 100)} = ${fmt(e)}. Piège fréquent : répondre le pourcentage lui-même.`,
      modele: 'effectif', args: { i },
    }
  },
  'part-cumulee': (c, r) => {
    const [i, j] = melanger(r, c.labels.map((_, k) => k)).slice(0, 2)
    const p = c.pourcents[i] + c.pourcents[j]
    return {
      enonce: `Quelle part (en %) représentent « ${c.labels[i]} » et « ${c.labels[j]} » réunis ?`,
      bonne: p, pieges: [Math.abs(c.pourcents[i] - c.pourcents[j]), 100 - p, p / 2], unite: '%',
      correction: `On additionne les deux parts : ${c.pourcents[i]} % + ${c.pourcents[j]} % = ${p} %. Piège fréquent : soustraire au lieu d'additionner.`,
      modele: 'part-cumulee', args: { i, j },
    }
  },
  'ecart-effectif': (c, r) => {
    const [i, j] = melanger(r, c.labels.map((_, k) => k)).slice(0, 2)
    const d = (c.total * Math.abs(c.pourcents[i] - c.pourcents[j])) / 100
    return {
      enonce: `Sur ${fmt(c.total)} ${c.noms}, quelle différence d'effectif y a-t-il entre « ${c.labels[i]} » et « ${c.labels[j]} » ?`,
      bonne: d, pieges: [Math.abs(c.pourcents[i] - c.pourcents[j]), (c.total * (c.pourcents[i] + c.pourcents[j])) / 100, d / 2], unite: '',
      correction: `L'écart de parts est |${c.pourcents[i]} % − ${c.pourcents[j]} %| = ${Math.abs(c.pourcents[i] - c.pourcents[j])} points. On l'applique au total : ${fmt(c.total)} × ${fmt(Math.abs(c.pourcents[i] - c.pourcents[j]) / 100)} = ${fmt(d)}.`,
      modele: 'ecart-effectif', args: { i, j },
    }
  },
  hors: (c, r) => {
    const i = entier(r, 0, c.labels.length - 1)
    const e = (c.total * (100 - c.pourcents[i])) / 100
    return {
      enonce: `Sur ${fmt(c.total)} ${c.noms}, combien ne correspondent pas à « ${c.labels[i]} » ?`,
      bonne: e, pieges: [(c.total * c.pourcents[i]) / 100, 100 - c.pourcents[i], c.total - c.pourcents[i]], unite: '',
      correction: `Les autres représentent 100 % − ${c.pourcents[i]} % = ${100 - c.pourcents[i]} % du total : ${fmt(c.total)} × ${fmt((100 - c.pourcents[i]) / 100)} = ${fmt(e)}. Piège fréquent : répondre le nombre correspondant à « ${c.labels[i]} » lui-même.`,
      modele: 'hors', args: { i },
    }
  },
  'effectif-cumule': (c, r) => {
    const [i, j] = melanger(r, c.labels.map((_, k) => k)).slice(0, 2)
    const p = c.pourcents[i] + c.pourcents[j]
    const e = (c.total * p) / 100
    return {
      enonce: `Sur ${fmt(c.total)} ${c.noms}, combien correspondent à « ${c.labels[i]} » ou à « ${c.labels[j]} » ?`,
      bonne: e, pieges: [p, (c.total * c.pourcents[i]) / 100, c.total - e], unite: '',
      correction: `Les deux parts réunies font ${c.pourcents[i]} % + ${c.pourcents[j]} % = ${p} %. Pour ${fmt(c.total)} ${c.noms} : ${fmt(c.total)} × ${fmt(p / 100)} = ${fmt(e)}.`,
      modele: 'effectif-cumule', args: { i, j },
    }
  },
  rapport: (c, r) => {
    for (const [i, j] of paires(r, c.labels.length)) {
      const q = c.pourcents[i] / c.pourcents[j]
      if ([1.5, 2, 2.5, 3, 4].some((x) => Math.abs(q - x) < 1e-9)) {
        return {
          enonce: `« ${c.labels[i]} » représente combien de fois « ${c.labels[j]} » ?`,
          bonne: q, pieges: [c.pourcents[j] / c.pourcents[i], q + 1, c.pourcents[i] - c.pourcents[j]], unite: 'fois',
          correction: `On compare les parts : ${c.pourcents[i]} % ÷ ${c.pourcents[j]} % = ${fmt(q)}. Piège fréquent : inverser la division.`,
          modele: 'rapport', args: { i, j },
        }
      }
    }
    return null
  },
}
const MODELES_PARTS_PAR_NIVEAU = {
  facile: ['effectif', 'part-cumulee'],
  moyen: ['ecart-effectif', 'hors', 'effectif'],
  difficile: ['effectif-cumule', 'rapport', 'hors', 'ecart-effectif'],
  expert: ['effectif-cumule', 'rapport', 'hors', 'ecart-effectif'],
}

// ---------- exercices ----------
function formaterQuestion(r, m) {
  if (m.choix) return { enonce: m.enonce, choix: m.choix, reponse: m.indexBonne, correction: m.correction, modele: m.modele, args: m.args, valeur: m.texteBonne }
  const { choix, indexBonne } = proposer(r, m.bonne, m.pieges, m.unite, m.signe)
  return { enonce: m.enonce, choix, reponse: indexBonne, correction: m.correction, modele: m.modele, args: m.args, valeur: m.bonne }
}

function donneesSerie(r, niveau, mode) {
  const ctx = mode === 'temps' ? tirer(r, CONTEXTES_TEMPS) : tirer(r, CONTEXTES_CAT)
  const labels = mode === 'temps' ? tirer(r, PERIODES)(r) : ctx.labels
  const n = labels.length
  const ks = []
  let k = entier(r, ctx.kmin + 2, ctx.kmax - 2)
  for (let i = 0; i < n; i++) {
    ks.push(k)
    k = mode === 'temps' ? Math.min(ctx.kmax, Math.max(ctx.kmin, k + entier(r, -8, 9))) : entier(r, ctx.kmin, ctx.kmax)
  }
  // Niveau expert : valeurs moins « rondes » (on ajoute une demi-unité à certaines).
  const valeurs = ks.map((x) => x * ctx.u + (niveau === 'expert' ? entier(r, 0, 1) * Math.floor(ctx.u / 2) : 0))
  if (new Set(valeurs).size !== n) return null
  return { ctx, labels, valeurs }
}

export function genererGraphique(graine, niveau = 'moyen') {
  return essayer((r) => {
    const forme = tirer(r, ['barres', 'courbe', 'camembert'])
    if (forme === 'camembert') return exerciceCamembert(r, niveau, graine)
    const mode = forme === 'courbe' ? 'temps' : tirer(r, ['temps', 'cat'])
    const d = donneesSerie(r, niveau, mode)
    if (!d) return null
    const c = { labels: d.labels, valeurs: d.valeurs, unite: d.ctx.unite, mode }
    const candidats = melanger(r, MODELES_PAR_NIVEAU[niveau].filter((m) => mode === 'temps' || !TEMPS_SEULEMENT.has(m)))
    const questions = []
    for (const nom of candidats) {
      const m = MODELES[nom](c, r)
      if (m) questions.push(formaterQuestion(r, m))
      if (questions.length === 3) break
    }
    if (questions.length < 3) return null
    const dessin = { titre: d.ctx.titre, axe: d.ctx.axe, labels: d.labels, valeurs: d.valeurs }
    return {
      type: 'graphique', forme, niveau, graine, titre: d.ctx.titre,
      svg: forme === 'courbe' ? svgCourbe(dessin) : svgBarres(dessin),
      donnees: { labels: d.labels, valeurs: d.valeurs, unite: d.ctx.unite, mode },
      questions,
    }
  }, graine, alea)
}

function exerciceCamembert(r, niveau, graine) {
  const ctx = tirer(r, CONTEXTES_PARTS)
  // 20 parts de 5 % réparties en 5 catégories (au moins une part chacune)
  const parts = [1, 1, 1, 1, 1]
  for (let k = 0; k < 15; k++) parts[entier(r, 0, 4)]++
  const pourcents = parts.map((p) => p * 5)
  if (new Set(pourcents).size < 4) return null
  const total = 20 * entier(r, 10, 60)
  const c = { labels: ctx.labels, pourcents, total, noms: ctx.noms }
  const candidats = melanger(r, MODELES_PARTS_PAR_NIVEAU[niveau])
  const questions = []
  for (const nom of candidats) {
    const m = MODELES_PARTS[nom](c, r)
    if (m) questions.push(formaterQuestion(r, m))
    if (questions.length === 3) break
  }
  if (questions.length < 3) return null
  return {
    type: 'graphique', forme: 'camembert', niveau, graine, titre: ctx.titre,
    svg: svgCamembert({ titre: ctx.titre, labels: ctx.labels, pourcents }),
    donnees: { labels: ctx.labels, pourcents, total, noms: ctx.noms },
    questions,
  }
}
