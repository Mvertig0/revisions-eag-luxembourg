// Problèmes de calcul appliqué générés par programme (pourcentages, proportions, moyennes, vitesses…).
// Chaque modèle tire des nombres « bien choisis » (résultat exact) et écrit la correction pas à pas, avec l'erreur
// classique qui sert de mauvaise réponse. verif-numerique.mjs recalcule chaque réponse d'une autre façon.
import { alea, melanger } from '../abstrait/generateur.js'
import { entier, tirer, fmt, proposer, essayer } from './outils.js'

const rond = (x) => Math.round(x * 100) / 100
const entierExact = (x) => Math.abs(x - Math.round(x)) < 1e-9

const MODELES = {
  net: (r) => {
    const B = 100 * entier(r, 15, 45), p = tirer(r, [8, 10, 12, 15, 20])
    const cot = (B * p) / 100
    return {
      enonce: `Un agent a un salaire brut de ${fmt(B, '€')}. Les cotisations représentent ${p} % de ce salaire. Quel est son salaire net ?`,
      bonne: B - cot, pieges: [B + cot, cot, B - p], unite: '€',
      correction: `Les cotisations valent ${fmt(B)} × ${fmt(p / 100)} = ${fmt(cot)} €. Le net est ${fmt(B)} − ${fmt(cot)} = ${fmt(B - cot)} €. Autre méthode : ${fmt(B)} × ${fmt(1 - p / 100)} = ${fmt(B - cot)} €. Erreurs classiques : ajouter les cotisations au lieu de les retirer, ou répondre le montant des cotisations.`,
      args: { B, p },
    }
  },
  tva: (r) => {
    const HT = 100 * entier(r, 2, 40)
    return {
      enonce: `Un article coûte ${fmt(HT, '€')} hors taxes. Avec une TVA de 17 %, quel est son prix toutes taxes comprises ?`,
      bonne: (HT * 117) / 100, pieges: [(HT * 17) / 100, HT + 17, HT * 1.7], unite: '€',
      correction: `La TVA est de ${fmt(HT)} × 0,17 = ${fmt((HT * 17) / 100)} €. Le prix TTC est ${fmt(HT)} + ${fmt((HT * 17) / 100)} = ${fmt((HT * 117) / 100)} €. Autre méthode : ${fmt(HT)} × 1,17. Erreurs classiques : répondre le montant de la TVA seul, ou ajouter 17 € au lieu de 17 %.`,
      args: { HT },
    }
  },
  'tva-inverse': (r) => {
    const HT = 100 * entier(r, 2, 40), TTC = (HT * 117) / 100
    return {
      enonce: `Un article coûte ${fmt(TTC, '€')} toutes taxes comprises (TVA de 17 %). Quel est son prix hors taxes ?`,
      bonne: HT, pieges: [rond(TTC * 0.83), TTC - 17, rond(TTC * 0.17)], unite: '€',
      correction: `Le prix TTC est le prix hors taxes multiplié par 1,17. Donc prix HT = ${fmt(TTC)} ÷ 1,17 = ${fmt(HT)} €. Vérification : ${fmt(HT)} × 1,17 = ${fmt(TTC)}. Erreur classique : retirer 17 % du prix TTC (${fmt(TTC)} × 0,83), alors que les 17 % portent sur le prix hors taxes.`,
      args: { HT },
    }
  },
  proportion: (r) => {
    const h = entier(r, 2, 6), cadence = entier(r, 4, 25), H = entier(r, h + 1, 9)
    const n = h * cadence
    return {
      enonce: `Un service traite ${n} dossiers en ${h} heures. À ce rythme, combien de dossiers traite-t-il en ${H} heures ?`,
      bonne: cadence * H, pieges: [n + (H - h), n * H, (n * h) / H, cadence * (H - h)], unite: '',
      correction: `En 1 heure, le service traite ${n} ÷ ${h} = ${cadence} dossiers. En ${H} heures : ${cadence} × ${H} = ${cadence * H} dossiers. Erreur classique : ajouter ${H - h} (les heures en plus) au lieu de multiplier par la cadence.`,
      args: { n, h, H },
    }
  },
  echelle: (r) => {
    const S = tirer(r, [20000, 25000, 50000, 100000]), cm = entier(r, 2, 12)
    const km = rond((cm * S) / 100000)
    return {
      enonce: `Sur un plan à l'échelle 1/${fmt(S)}, la distance entre deux bureaux mesure ${cm} cm. Quelle est la distance réelle entre ces deux bureaux, en kilomètres ?`,
      bonne: km, pieges: [km * 10, km / 10, rond((cm * S) / 1000)], unite: 'km',
      correction: `${cm} cm sur le plan représentent ${cm} × ${fmt(S)} = ${fmt(cm * S)} cm dans la réalité, soit ${fmt((cm * S) / 100)} m ou ${fmt(km)} km (1 km = 100 000 cm). Erreur classique : se tromper d'une puissance de 10 en convertissant.`,
      args: { S, cm },
    }
  },
  'moyenne-manquante': (r) => {
    const cible = entier(r, 10, 15), notes = [entier(r, 7, 17), entier(r, 7, 17), entier(r, 7, 17)]
    const manque = 4 * cible - notes.reduce((a, b) => a + b, 0)
    if (manque < 3 || manque > 20 || new Set([manque, ...notes]).size < 4) return null
    return {
      enonce: `Un candidat a obtenu ${notes[0]}, ${notes[1]} et ${notes[2]} sur 20 aux trois premières épreuves. Quelle note doit-il obtenir à la quatrième épreuve pour avoir une moyenne de ${cible} sur 20 ?`,
      bonne: manque, pieges: [cible, manque - 1, manque + 1], unite: '',
      correction: `Pour une moyenne de ${cible} sur 4 épreuves, la somme des notes doit valoir 4 × ${cible} = ${4 * cible}. Les trois premières notes font ${notes.join(' + ')} = ${notes.reduce((a, b) => a + b, 0)}. Il manque ${4 * cible} − ${notes.reduce((a, b) => a + b, 0)} = ${manque}. Erreur classique : répondre la moyenne visée.`,
      args: { notes, cible },
    }
  },
  'moyenne-ponderee': (r) => {
    const e1 = 10 * entier(r, 1, 8), e2 = 10 * entier(r, 1, 8), m1 = entier(r, 8, 18), m2 = entier(r, 8, 18)
    const moy = (e1 * m1 + e2 * m2) / (e1 + e2)
    if (!entierExact(moy) || m1 === m2 || e1 === e2) return null
    return {
      enonce: `Dans un groupe de ${e1} agents, la note moyenne est de ${m1} sur 20 ; dans un autre groupe de ${e2} agents, elle est de ${m2} sur 20. Quelle est la note moyenne des ${e1 + e2} agents ?`,
      bonne: moy, pieges: [(m1 + m2) / 2, moy + 1, moy - 1], unite: '',
      correction: `Le total des notes est ${e1} × ${m1} + ${e2} × ${m2} = ${e1 * m1 + e2 * m2}. On divise par ${e1 + e2} agents : ${fmt(e1 * m1 + e2 * m2)} ÷ ${e1 + e2} = ${fmt(moy)}. Erreur classique : faire la moyenne simple de ${m1} et ${m2} sans tenir compte des effectifs.`,
      args: { e1, e2, m1, m2 },
    }
  },
  'remise-inverse': (r) => {
    const I = 20 * entier(r, 3, 20), rem = tirer(r, [10, 20, 25, 40])
    const P = (I * (100 - rem)) / 100
    return {
      enonce: `Après une remise de ${rem} %, un article coûte ${fmt(P, '€')}. Quel était son prix avant la remise ?`,
      bonne: I, pieges: [rond(P * (1 + rem / 100)), P + rem, rond(P * (1 - rem / 100))], unite: '€',
      correction: `Après une remise de ${rem} %, on paie ${100 - rem} % du prix initial : prix initial × ${fmt((100 - rem) / 100)} = ${fmt(P)}, donc prix initial = ${fmt(P)} ÷ ${fmt((100 - rem) / 100)} = ${fmt(I)} €. Erreur classique : ajouter ${rem} % au prix payé, alors que ces ${rem} % portent sur le prix initial.`,
      args: { I, rem },
    }
  },
  'hausse-baisse': (r) => {
    const I = 100 * entier(r, 1, 10), a = tirer(r, [10, 20, 25, 50]), b = tirer(r, [10, 20, 25, 40])
    const F = (I * (100 + a) * (100 - b)) / 10000
    if (!entierExact(F)) return null
    const apres = (I * (100 + a)) / 100
    return {
      enonce: `Un prix de ${fmt(I, '€')} augmente de ${a} %. Le nouveau prix baisse ensuite de ${b} %. Quel est le prix final ?`,
      bonne: F, pieges: [rond(I * (1 + (a - b) / 100)), rond(I * (1 - b / 100)), apres], unite: '€',
      correction: `Après la hausse de ${a} % : ${fmt(I)} × ${fmt(1 + a / 100)} = ${fmt(apres)} €. La baisse de ${b} % porte sur ce nouveau prix : ${fmt(apres)} × ${fmt(1 - b / 100)} = ${fmt(F)} €. Erreur classique : calculer ${a} % − ${b} % = ${a - b} % comme si les deux pourcentages avaient la même base.`,
      args: { I, a, b },
    }
  },
  partage: (r) => {
    const [x, y, z] = tirer(r, [[2, 3, 5], [1, 2, 3], [3, 4, 5], [2, 3, 7], [1, 3, 6]])
    const m = 100 * entier(r, 1, 9), S = (x + y + z) * m, i = entier(r, 0, 2), k = [x, y, z][i]
    return {
      enonce: `Une commune répartit une subvention de ${fmt(S, '€')} entre trois associations, proportionnellement à leur nombre de membres : ${x * 6}, ${y * 6} et ${z * 6}. Quelle somme reçoit l'association de ${k * 6} membres ?`,
      bonne: k * m, pieges: [rond(S / 3), (k * 6 * S) / 100, S - k * m], unite: '€',
      correction: `Le nombre total de membres est ${x * 6} + ${y * 6} + ${z * 6} = ${(x + y + z) * 6}. L'association de ${k * 6} membres en représente ${k * 6}/${(x + y + z) * 6} = ${k}/${x + y + z}. Elle reçoit ${fmt(S)} × ${k}/${x + y + z} = ${fmt(k * m)} €. Erreur classique : partager la somme en trois parts égales.`,
      args: { S, x, y, z, k },
    }
  },
  'vitesse-aller-retour': (r) => {
    const [v1, v2] = tirer(r, [[60, 40], [30, 60], [20, 30], [40, 60], [60, 90], [45, 90]])
    const d = tirer(r, [60, 90, 120, 180])
    const t1 = d / v1, t2 = d / v2
    const bonne = rond((2 * d) / (t1 + t2))
    return {
      enonce: `Un agent fait un trajet de ${d} km à l'aller à ${v1} km/h, puis revient par le même chemin à ${v2} km/h. Quelle est sa vitesse moyenne sur l'ensemble de l'aller-retour, en km/h ?`,
      bonne, pieges: [(v1 + v2) / 2, rond(bonne / 2), v1 + v2], unite: 'km/h',
      correction: `À l'aller, il roule ${d} km à ${v1} km/h : ${fmt(t1)} h. Au retour, ${d} km à ${v2} km/h : ${fmt(t2)} h. Au total, ${2 * d} km en ${fmt(t1 + t2)} h : la vitesse moyenne est ${2 * d} ÷ ${fmt(t1 + t2)} = ${fmt(bonne)} km/h. Erreur classique : faire la moyenne simple de ${v1} et ${v2} (${fmt((v1 + v2) / 2)} km/h), alors que le trajet le plus lent dure plus longtemps.`,
      args: { d, v1, v2 },
    }
  },
  'travail-commun': (r) => {
    const [a, b] = tirer(r, [[6, 3], [12, 4], [10, 15], [20, 5], [6, 12], [8, 8], [30, 20], [15, 10]])
    const bonne = rond(1 / (1 / a + 1 / b))
    return {
      enonce: `Un agent classe seul un lot d'archives en ${a} heures. Sa collègue le classe seule en ${b} heures. Ils travaillent ensemble, chacun à son rythme habituel. En combien d'heures classent-ils le lot ?`,
      bonne, pieges: [(a + b) / 2, a + b, Math.abs(a - b)], unite: 'h',
      correction: `En 1 heure, l'agent fait 1/${a} du lot et sa collègue 1/${b}. Ensemble : 1/${a} + 1/${b} = ${fmt(1 / a + 1 / b)} du lot par heure. Le lot entier demande donc 1 ÷ ${fmt(1 / a + 1 / b)} = ${fmt(bonne)} h. Erreur classique : faire la moyenne des deux durées.`,
      args: { a, b },
    }
  },
  'pourcentage-de-pourcentage': (r) => {
    const N = 100 * entier(r, 1, 6), p1 = tirer(r, [10, 20, 25, 40, 50, 60]), p2 = tirer(r, [10, 20, 25, 50])
    const premier = (N * p1) / 100, bonne = (premier * p2) / 100
    if (!entierExact(premier) || !entierExact(bonne)) return null
    return {
      enonce: `Un service compte ${fmt(N)} agents. ${p1} % d'entre eux travaillent à temps partiel, et ${p2} % de ces agents à temps partiel travaillent le mercredi. Combien d'agents travaillent le mercredi à temps partiel ?`,
      bonne, pieges: [(N * p2) / 100, premier, rond((N * (p1 + p2)) / 100)], unite: '',
      correction: `Les agents à temps partiel sont ${fmt(N)} × ${fmt(p1 / 100)} = ${fmt(premier)}. Parmi eux, ${p2} % travaillent le mercredi : ${fmt(premier)} × ${fmt(p2 / 100)} = ${fmt(bonne)}. Erreur classique : appliquer ${p2} % à tous les agents, ou additionner les deux pourcentages.`,
      args: { N, p1, p2 },
    }
  },
  'interets-simples': (r) => {
    const C = 1000 * entier(r, 2, 20), t = tirer(r, [2, 3, 4, 5]), n = entier(r, 2, 5)
    const I = (C * t * n) / 100
    return {
      enonce: `Une somme de ${fmt(C, '€')} est placée pendant ${n} ans à intérêts simples, au taux annuel de ${t} %. Quel est le montant total des intérêts ?`,
      bonne: I, pieges: [(C * t) / 100, C + I, rond((C * t * n) / 1000)], unite: '€',
      correction: `Chaque année, l'intérêt est ${fmt(C)} × ${fmt(t / 100)} = ${fmt((C * t) / 100)} €. Sur ${n} ans (intérêts simples, donc sans réintérêt) : ${fmt((C * t) / 100)} × ${n} = ${fmt(I)} €. Erreur classique : donner l'intérêt d'une seule année, ou le capital augmenté des intérêts.`,
      args: { C, t, n },
    }
  },
}
const MODELES_PAR_NIVEAU = {
  facile: ['net', 'tva', 'proportion', 'echelle'],
  moyen: ['moyenne-manquante', 'moyenne-ponderee', 'remise-inverse', 'partage', 'pourcentage-de-pourcentage', 'interets-simples', 'tva'],
  difficile: ['hausse-baisse', 'vitesse-aller-retour', 'travail-commun', 'tva-inverse', 'remise-inverse', 'partage'],
  expert: ['hausse-baisse', 'vitesse-aller-retour', 'travail-commun', 'tva-inverse', 'pourcentage-de-pourcentage', 'moyenne-ponderee'],
}
export const NOMS_MODELES = Object.keys(MODELES)

export function genererCalcul(graine, niveau = 'moyen') {
  return essayer((r) => {
    const nom = tirer(r, MODELES_PAR_NIVEAU[niveau])
    const m = MODELES[nom](r)
    if (!m) return null
    const { choix, indexBonne } = proposer(r, m.bonne, m.pieges, m.unite)
    return {
      type: 'calcul', niveau, graine, modele: nom, args: m.args,
      enonce: m.enonce, choix, reponse: indexBonne, valeur: m.bonne, correction: m.correction,
    }
  }, graine, alea)
}
export { melanger }
