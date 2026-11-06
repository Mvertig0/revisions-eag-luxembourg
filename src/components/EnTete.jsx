import PastilleIcone from './PastilleIcone'

// Grand en-tête de page : pastille d'icône + titre + sous-titre.
export default function EnTete({ titre, sousTitre, Icone, couleur }) {
  return (
    <header className="en-tete">
      {Icone && <PastilleIcone Icone={Icone} couleur={couleur} taille="grande" />}
      <div>
        <h1 className="en-tete__titre">{titre}</h1>
        {sousTitre && <p className="en-tete__sous-titre">{sousTitre}</p>}
      </div>
    </header>
  )
}
