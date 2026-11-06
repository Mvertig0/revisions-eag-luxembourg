// Carré arrondi coloré avec une icône blanche (comme les Réglages Système).
// `couleur` est une variable CSS (ex. 'var(--couleur-verbal)').
export default function PastilleIcone({ Icone, couleur, taille = 'moyenne', grisee = false }) {
  const classes = ['pastille', `pastille--${taille}`, grisee ? 'pastille--grisee' : '']
    .filter(Boolean)
    .join(' ')
  return (
    <span className={classes} style={{ '--pastille': couleur }} aria-hidden="true">
      <Icone strokeWidth={2} />
    </span>
  )
}
