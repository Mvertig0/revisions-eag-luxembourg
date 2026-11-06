import { BookOpenText, Calculator, CalendarClock, Shapes, Users } from 'lucide-react'

// Liste des 5 modules, dans l'ordre d'affichage.
// - statut : 'disponible' (la carte s'ouvre) ou 'bientot' (carte grisée)
// - couleur : une variable définie dans theme.css (jamais une couleur écrite ici)
export const modules = [
  {
    id: 'verbal',
    nom: 'Raisonnement verbal',
    texte: 'Comprendre des textes, jouer avec les mots et les idées.',
    Icone: BookOpenText,
    couleur: 'var(--couleur-verbal)',
    statut: 'disponible',
    version: 'v1',
    chemin: '/verbal',
  },
  {
    id: 'numerique',
    nom: 'Raisonnement numérique',
    texte: 'Calculs, pourcentages, tableaux et graphiques.',
    Icone: Calculator,
    couleur: 'var(--couleur-numerique)',
    statut: 'disponible',
    version: 'v1',
    chemin: '/numerique',
  },
  {
    id: 'abstrait',
    nom: 'Raisonnement abstrait',
    texte: 'Repérer la logique dans des suites de formes.',
    Icone: Shapes,
    couleur: 'var(--couleur-abstrait)',
    statut: 'disponible',
    version: 'v1',
    chemin: '/abstrait',
  },
  {
    id: 'planification',
    nom: 'Planification',
    texte: 'Organiser des tâches, des horaires et des priorités.',
    Icone: CalendarClock,
    couleur: 'var(--couleur-planification)',
    statut: 'bientot',
    version: 'v2',
    chemin: '/planification',
  },
  {
    id: 'situationnel',
    nom: 'Jugement situationnel',
    texte: 'Choisir la meilleure réaction face à une situation de travail.',
    Icone: Users,
    couleur: 'var(--couleur-situationnel)',
    statut: 'bientot',
    version: 'v2',
    chemin: '/situationnel',
  },
]

export const modulesDisponibles = modules.filter((m) => m.statut === 'disponible')
