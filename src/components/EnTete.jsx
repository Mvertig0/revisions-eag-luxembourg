import PastilleIcone from './PastilleIcone'

// Grand en-tête de page : pastille d'icône + titre + sous-titre.
// `compact` : pendant une session, on réduit l'en-tête sur téléphone pour laisser la place aux réponses.
export default function EnTete({ titre, sousTitre, Icone, couleur, compact = false }) {
  return (
    <header className={compact ? 'en-tete en-tete--session' : 'en-tete'}>
      {Icone && <PastilleIcone Icone={Icone} couleur={couleur} taille="grande" />}
      <div>
        <h1 className="en-tete__titre">{titre}</h1>
        {sousTitre && <p className="en-tete__sous-titre">{sousTitre}</p>}
      </div>
    </header>
  )
}
