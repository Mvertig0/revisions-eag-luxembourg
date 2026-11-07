// Préparation d'une session de « Raisonnement verbal ».
// Ce fichier ne contient aucun affichage : il prend la banque d'exercices et renvoie la liste des questions.
// Trois formats : Vrai / Faux / Indéterminé (vfi), QCM de compréhension (qcm), consignes à suivre (consignes).

import banque from '../../data/exercices/verbal.json'
import { NB_QUESTIONS } from './config'

// Mélange une liste (Fisher-Yates) sans modifier l'originale.
// `hasard` renvoie un nombre entre 0 et 1 ; on peut le remplacer pour les tests.
export function melanger(liste, hasard = Math.random) {
  const copie = [...liste]
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1))
    ;[copie[i], copie[j]] = [copie[j], copie[i]]
  }
  return copie
}

// ---------- mise en forme : tout devient des « groupes » { texte, questions } ----------
// Une question : { id, affirmation, reponseAttendue, correction, texte, type, choix? }
// - `affirmation` est l'énoncé affiché (affirmation à juger ou question posée) ;
// - `reponseAttendue` est le TEXTE de la bonne réponse (« Vrai », ou le texte du bon choix) ;
// - `choix` n'existe que pour les QCM et les consignes (propositions déjà mélangées).

function groupesVfi(textes) {
  return textes.map((texte) => ({
    texte,
    questions: texte.affirmations.map((a) => ({
      id: a.id,
      affirmation: a.affirmation,
      reponseAttendue: a.reponse,
      correction: a.correction,
      texte,
      type: 'vfi',
    })),
  }))
}

function groupesChoix(blocs, type, hasard) {
  return blocs.map(({ questions, ...texte }) => ({
    texte,
    questions: questions.map((q) => ({
      id: q.id,
      affirmation: q.enonce,
      reponseAttendue: q.choix[q.reponse],
      correction: q.correction,
      texte,
      type,
      choix: melanger(q.choix, hasard), // l'ordre des propositions change à chaque session
    })),
  }))
}

const compter = (groupes) => groupes.reduce((n, g) => n + g.questions.length, 0)

// Tire des GROUPES entiers (comme à l'examen : quelques textes, plusieurs questions chacun) jusqu'à avoir
// au moins `nb` questions. Si on dépasse, on retire l'excédent au hasard sans jamais vider un groupe.
function piocher(groupes, nb, hasard) {
  const choisis = []
  let total = 0
  for (const g of melanger(groupes, hasard)) {
    if (total >= nb) break
    choisis.push({ questions: [...g.questions] })
    total += g.questions.length
  }
  for (let aRetirer = total - nb; aRetirer > 0; aRetirer--) {
    const candidats = choisis.filter((c) => c.questions.length > 1)
    if (candidats.length === 0) break
    const c = candidats[Math.floor(hasard() * candidats.length)]
    c.questions.splice(Math.floor(hasard() * c.questions.length), 1)
  }
  return choisis.flatMap((c) => c.questions)
}

// ---------- session « Vrai / Faux / Indéterminé » (le format d'origine) ----------
// Les textes à 2 affirmations (anciens lots) ne sont pas équilibrés : on retire au sort jusqu'à obtenir
// une session où chaque réponse (Vrai, Faux, Indéterminé) pèse entre 25 % et 45 % des questions.
export function tirerSession(textes = banque.textes, hasard = Math.random) {
  const groupes = groupesVfi(textes)
  const min = Math.ceil(NB_QUESTIONS * 0.25)
  const max = Math.ceil(NB_QUESTIONS * 0.45)
  let session = piocher(groupes, NB_QUESTIONS, hasard)
  for (let essai = 0; essai < 200; essai++) {
    const nombres = ['Vrai', 'Faux', 'Indéterminé'].map((r) => session.filter((q) => q.reponseAttendue === r).length)
    if (nombres.every((n) => n >= min && n <= max) || session.length < NB_QUESTIONS) break
    session = piocher(groupes, NB_QUESTIONS, hasard)
  }
  return session
}

// ---------- sessions par type ----------
// type : 'melange' (les trois formats), 'vfi', 'qcm' ou 'consignes'.
// Le mélange prend jusqu'à 5 questions de QCM et 5 de consignes, le reste en Vrai / Faux / Indéterminé.
export function tirerSessionType(type = 'melange', donnees = banque, hasard = Math.random) {
  if (type === 'vfi') return tirerSession(donnees.textes, hasard)
  const qcm = groupesChoix(donnees.qcm ?? [], 'qcm', hasard)
  const consignes = groupesChoix(donnees.consignes ?? [], 'consignes', hasard)
  if (type === 'qcm') return piocher(qcm, NB_QUESTIONS, hasard)
  if (type === 'consignes') return piocher(consignes, NB_QUESTIONS, hasard)
  const nbQcm = Math.min(5, compter(qcm))
  const nbConsignes = Math.min(5, compter(consignes))
  const parties = [
    piocher(groupesVfi(donnees.textes), NB_QUESTIONS - nbQcm - nbConsignes, hasard),
    piocher(qcm, nbQcm, hasard),
    piocher(consignes, nbConsignes, hasard),
  ].filter((p) => p.length > 0)
  return melanger(parties, hasard).flat() // les formats se suivent par blocs, dans un ordre aléatoire
}

// Nombre de questions d'une session de ce type (peut être inférieur à NB_QUESTIONS si la banque est petite).
export function nombreQuestions(type = 'melange', donnees = banque) {
  const vfi = compter(groupesVfi(donnees.textes))
  const qcm = (donnees.qcm ?? []).reduce((n, b) => n + b.questions.length, 0)
  const consignes = (donnees.consignes ?? []).reduce((n, b) => n + b.questions.length, 0)
  if (type === 'vfi') return Math.min(NB_QUESTIONS, vfi)
  if (type === 'qcm') return Math.min(NB_QUESTIONS, qcm)
  if (type === 'consignes') return Math.min(NB_QUESTIONS, consignes)
  return Math.min(NB_QUESTIONS, vfi + Math.min(5, qcm) + Math.min(5, consignes))
}
