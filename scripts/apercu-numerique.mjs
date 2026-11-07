// Fabrique une page à ouvrir dans le navigateur pour juger le rendu des graphiques générés :
//   node scripts/apercu-numerique.mjs  ->  ../unites/numerique/apercu.html (ignoré par Git)
import { writeFileSync } from 'node:fs'
import { genererGraphique } from '../src/modules/numerique/graphiques.js'
import { genererSuite } from '../src/modules/numerique/suites.js'
import { genererCalcul } from '../src/modules/numerique/calculs.js'

const sortie = new URL('../../unites/numerique/apercu.html', import.meta.url)
const blocs = []
const vues = new Set()
let graine = 1
while (vues.size < 3 && graine < 500) {
  const ex = genererGraphique(graine, 'difficile')
  if (!vues.has(ex.forme)) {
    vues.add(ex.forme)
    blocs.push(`<section><h2>Graphique : ${ex.forme} (graine ${graine})</h2>${ex.svg}<ol>${ex.questions
      .map((q) => `<li>${q.enonce}<br><small>${q.choix.map((c, i) => (i === q.reponse ? `<b>${c}</b>` : c)).join(' · ')}</small><br><small>${q.correction}</small></li>`)
      .join('')}</ol></section>`)
  }
  graine++
}
for (const niveau of ['facile', 'moyen', 'difficile', 'expert']) {
  const s = genererSuite(11, niveau), c = genererCalcul(11, niveau)
  blocs.push(`<section><h2>Niveau ${niveau}</h2><p>${s.enonce}<br><small>${s.choix.map((x, i) => (i === s.reponse ? `<b>${x}</b>` : x)).join(' · ')}</small><br><small>${s.correction}</small></p><p>${c.enonce}<br><small>${c.choix.map((x, i) => (i === c.reponse ? `<b>${x}</b>` : x)).join(' · ')}</small><br><small>${c.correction}</small></p></section>`)
}
writeFileSync(
  sortie,
  `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Aperçu numérique généré</title>
<style>
:root{color:#1c2430;background:#f6f7f9;--abs-fond:#f6f7f9;--graph-1:#d97706;--graph-2:#2563eb;--graph-3:#059669;--graph-4:#7c3aed;--graph-5:#db2777;--graph-6:#64748b}
@media (prefers-color-scheme:dark){:root{color:#e6e9ee;background:#14181f;--abs-fond:#14181f;--graph-1:#fbbf24;--graph-2:#60a5fa;--graph-3:#34d399;--graph-4:#a78bfa;--graph-5:#f472b6;--graph-6:#94a3b8}}
body{font-family:system-ui,sans-serif;max-width:640px;margin:0 auto;padding:16px}
section{border:1px solid #8884;border-radius:14px;padding:12px 16px;margin:16px 0}
h2{font-size:1rem}
</style><h1>Aperçu du numérique généré</h1>${blocs.join('\n')}</html>`,
)
console.log('Aperçu écrit :', sortie.pathname)
