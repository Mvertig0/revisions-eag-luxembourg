import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChartLine, Download, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import EnTete from '../components/EnTete'
import PastilleIcone from '../components/PastilleIcone'
import FenetreConfirmation from '../components/session/FenetreConfirmation'
import { modules } from '../data/modules'
import { effacer, lire } from '../storage/stockage'
import {
  MODULES_SUIVI, NOMS_GROUPES, NOMS_NIVEAUX, analyser, exporter, historique, modulesSansSession, pointsFaibles,
} from '../modules/suivi/calculs'
import '../modules/suivi/suivi.css'

const NOMS_FORMATS = {
  melange: 'Mélange', tous: 'Mélange', vfi: 'Vrai / Faux / Indéterminé', qcm: 'QCM', consignes: 'Consignes', graphiques: 'Graphiques',
  suites: 'Suites', calcul: 'Calculs', tableaux: 'Tableaux', agenda: 'Agenda', priorites: 'Priorités', service: 'Servir le client-usager', conseil: 'Conseiller',
}
const nomFormat = (module, format) => (format ? NOMS_FORMATS[format] ?? NOMS_GROUPES[module]?.[format] ?? format : '—')
const infoModule = (id) => modules.find((m) => m.id === id)
const formaterDate = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
const formaterHeure = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

// Barres : un pourcentage de réussite par session (les 20 dernières), de la plus ancienne à la plus récente.
function GraphiqueSessions({ sessions, couleur, nom }) {
  const dernieres = sessions.slice(-20)
  const W = 300, H = 90, bas = H - 6, haut = 8
  const pas = W / dernieres.length
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="suivi-graphique" role="img" aria-label={`Réussite par session, ${nom} : ${dernieres.map((s) => `${s.pct} %`).join(', ')}`}>
      {[0, 50, 100].map((v) => {
        const y = bas - ((bas - haut) * v) / 100
        return <line key={v} x1="0" x2={W} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.15" strokeDasharray={v === 50 ? '3 3' : undefined} />
      })}
      {dernieres.map((s, i) => {
        const h = Math.max(2, ((bas - haut) * s.pct) / 100)
        const largeur = Math.min(22, pas * 0.7)
        return <rect key={s.id ?? i} x={i * pas + (pas - largeur) / 2} y={bas - h} width={largeur} height={h} rx="2" fill={couleur} />
      })}
    </svg>
  )
}

function Barres({ lignes, couleur }) {
  return (
    <ul className="suivi-barres">
      {lignes.map((l) => (
        <li key={l.cle}>
          <div className="suivi-barres__texte">
            <span>{l.nom}</span>
            <span className="suivi-barres__valeur">
              {l.pct} % <span className="suivi-discret">({l.bonnes}/{l.total})</span>
            </span>
          </div>
          <div className="suivi-barres__piste" role="img" aria-label={`${l.pct} % de réussite`}>
            <div className="suivi-barres__remplissage" style={{ width: `${l.pct}%`, background: couleur }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function Suivi() {
  const [version, setVersion] = useState(0)
  const [confirmation, setConfirmation] = useState(false)
  const analyse = useMemo(() => analyser(lire), [version])
  const total = MODULES_SUIVI.reduce((n, m) => n + analyse[m.id].resume.n, 0)
  const sans = modulesSansSession(analyse)
  const faibles = pointsFaibles(analyse)
  const dernieres = historique(analyse)

  function telecharger() {
    const donnees = exporter(lire)
    const blob = new Blob([JSON.stringify(donnees, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const lien = document.createElement('a')
    lien.href = url
    lien.download = `suivi-eag-${new Date().toISOString().slice(0, 10)}.json`
    lien.click()
    URL.revokeObjectURL(url)
  }

  function toutEffacer() {
    for (const m of MODULES_SUIVI) effacer(m.cle)
    setConfirmation(false)
    setVersion((v) => v + 1)
  }

  return (
    <>
      <EnTete titre="Mon suivi" sousTitre="Tes résultats, module par module. Ils sont gardés dans ce navigateur, sur cet appareil." Icone={ChartLine} couleur="var(--accent)" />

      {total === 0 ? (
        <section className="panneau">
          <h2 className="panneau__titre">Pas encore de résultat</h2>
          <p>Fais une première session dans un module : tes scores apparaîtront ici.</p>
          <Link to="/" className="bouton bouton--plein">
            <ArrowLeft aria-hidden="true" />
            Choisir un module
          </Link>
        </section>
      ) : (
        <>
          <section aria-labelledby="ensemble-titre">
            <h2 id="ensemble-titre" className="suivi-titre">Vue d'ensemble</h2>
            <ul className="suivi-modules">
              {MODULES_SUIVI.map((m) => {
                const info = infoModule(m.id)
                const r = analyse[m.id].resume
                return (
                  <li key={m.id} className="verre suivi-carte">
                    <div className="suivi-carte__entete">
                      <PastilleIcone Icone={info.Icone} couleur={info.couleur} />
                      <h3>{info.nom}</h3>
                    </div>
                    {r.n === 0 ? (
                      <>
                        <p className="suivi-discret">Pas encore travaillé.</p>
                        <Link to={info.chemin} className="bouton bouton--verre">Commencer</Link>
                      </>
                    ) : (
                      <>
                        <p className="suivi-carte__score">{r.derniere} %<span className="suivi-discret"> dernière session</span></p>
                        <p>Moyenne {r.moyenne} % · meilleure {r.meilleure} %</p>
                        <p className="suivi-discret">{r.n} session{r.n > 1 ? 's' : ''} · {r.questions} questions{r.secondesParQuestion ? ` · ${r.secondesParQuestion} s par question` : ''}</p>
                        {r.tendance !== null && (
                          <p className="suivi-tendance">
                            {r.tendance >= 0 ? <TrendingUp aria-hidden="true" /> : <TrendingDown aria-hidden="true" />}
                            {r.tendance === 0 ? 'Stable' : `${r.tendance > 0 ? '+' : '−'}${Math.abs(r.tendance)} points`} sur les dernières sessions
                          </p>
                        )}
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>

          {sans.length > 0 && (
            <section className="panneau suivi-panneau" aria-labelledby="equilibre-titre">
              <h2 id="equilibre-titre" className="panneau__titre">Tous les tests comptent autant</h2>
              <p>
                L'épreuve fait la moyenne de tous les tests, avec le même poids. Tu n'as pas encore travaillé :{' '}
                <strong>{sans.map((id) => infoModule(id).nom).join(', ')}</strong>.
              </p>
            </section>
          )}

          {faibles.length > 0 && (
            <section className="panneau suivi-panneau" aria-labelledby="faibles-titre">
              <h2 id="faibles-titre" className="panneau__titre">À travailler en priorité</h2>
              <p className="suivi-discret">Les types d'exercices où tu réussis le moins (au moins 8 réponses).</p>
              <Barres lignes={faibles.map((f) => ({ cle: `${f.module}-${f.cle}`, nom: `${infoModule(f.module).nom} · ${f.nom}`, pct: f.pct, bonnes: Math.round((f.pct * f.total) / 100), total: f.total }))} couleur="var(--accent)" />
            </section>
          )}

          {MODULES_SUIVI.filter((m) => analyse[m.id].resume.n > 0).map((m) => {
            const info = infoModule(m.id)
            const a = analyse[m.id]
            return (
              <details key={m.id} className="panneau suivi-panneau suivi-detail">
                <summary>
                  <PastilleIcone Icone={info.Icone} couleur={info.couleur} />
                  <span>{info.nom}</span>
                </summary>
                <h3 className="suivi-sous-titre">Réussite par session</h3>
                <GraphiqueSessions sessions={a.sessions} couleur={info.couleur} nom={info.nom} />
                {a.sessions.length > 20 && <p className="suivi-discret">Les 20 dernières sessions.</p>}
                {a.groupes.length > 0 && (
                  <>
                    <h3 className="suivi-sous-titre">Par type d'exercice</h3>
                    <Barres lignes={a.groupes.map((g) => ({ ...g, nom: NOMS_GROUPES[m.id][g.cle] ?? g.cle }))} couleur={info.couleur} />
                  </>
                )}
                {a.niveaux.length > 0 && (
                  <>
                    <h3 className="suivi-sous-titre">Par niveau (exercices générés)</h3>
                    <Barres lignes={[...a.niveaux].sort((x, y) => Object.keys(NOMS_NIVEAUX).indexOf(x.cle) - Object.keys(NOMS_NIVEAUX).indexOf(y.cle)).map((g) => ({ ...g, nom: NOMS_NIVEAUX[g.cle] ?? g.cle }))} couleur={info.couleur} />
                  </>
                )}
              </details>
            )
          })}

          <section className="panneau suivi-panneau" aria-labelledby="histo-titre">
            <h2 id="histo-titre" className="panneau__titre">Dernières sessions</h2>
            <div className="tableau-defile">
              <table className="tableau-donnees">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Module</th>
                    <th scope="col">Format</th>
                    <th scope="col" className="tableau-donnees__droite">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {dernieres.map((s) => (
                    <tr key={`${s.module}-${s.id}`}>
                      <td>{formaterDate(s.date)} <span className="suivi-discret">{formaterHeure(s.date)}</span></td>
                      <td>{infoModule(s.module).nom}</td>
                      <td>{nomFormat(s.module, s.format)}{s.niveau ? ` · ${NOMS_NIVEAUX[s.niveau] ?? s.niveau}` : ''}</td>
                      <td className="tableau-donnees__droite">{s.score}/{s.total} <span className="suivi-discret">({s.pct} %)</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panneau suivi-panneau" aria-labelledby="note-titre">
            <h2 id="note-titre" className="panneau__titre">À savoir</h2>
            <ul className="suivi-notes">
              <li>Les pourcentages sont ceux de <strong>cette application</strong>. L'examen note chaque test de 1 à 9 (stanine) et réussit avec une moyenne d'au moins 5 : cette note dépend des autres candidats, elle ne peut pas se déduire d'un pourcentage.</li>
              <li>Le nombre de questions et le temps par module sont des estimations : le format réel de l'EAG n'est pas publié.</li>
              <li>Tes résultats ne sont pas envoyés sur internet. Si tu vides les données du navigateur ou changes d'appareil, ils disparaissent : exporte-les pour en garder une copie.</li>
            </ul>
            <div className="suivi-actions">
              <button type="button" className="bouton bouton--verre" onClick={telecharger}>
                <Download aria-hidden="true" />
                Exporter mes résultats
              </button>
              <button type="button" className="bouton bouton--verre" onClick={() => setConfirmation(true)}>
                <Trash2 aria-hidden="true" />
                Effacer mes résultats
              </button>
            </div>
          </section>
        </>
      )}

      {confirmation && (
        <FenetreConfirmation
          titre="Effacer tous tes résultats ?"
          texte="Toutes les sessions de tous les modules seront supprimées de ce navigateur. Cette action est définitive."
          libelleAnnuler="Garder"
          libelleConfirmer="Effacer"
          onAnnuler={() => setConfirmation(false)}
          onConfirmer={toutEffacer}
        />
      )}
    </>
  )
}
