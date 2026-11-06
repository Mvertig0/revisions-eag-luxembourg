import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { default: App } = await vite.ssrLoadModule('/src/App.jsx')
const { ThemeProvider } = await vite.ssrLoadModule('/src/theme/ThemeProvider.jsx')

for (const url of ['/', '/verbal', '/numerique', '/abstrait', '/nimporte']) {
  const html = renderToString(
    createElement(ThemeProvider, null, createElement(StaticRouter, { location: url }, createElement(App))),
  )
  const h1 = (html.match(/<h1[^>]*>(.*?)<\/h1>/) || [])[1]
  const liens = [...html.matchAll(/<a [^>]*href="([^"]*)"/g)].map((m) => m[1])
  const grises = (html.match(/aria-disabled="true"/g) || []).length
  const retour = (html.match(/Retour à l&#x27;accueil/g) || []).length
  console.log(url, '| h1:', h1, '| liens:', liens.join(','), '| grisées:', grises, '| boutons retour:', retour,
    '| "Ce module arrive bientôt":', html.includes('Ce module arrive bientôt.'),
    '| "Et maintenant":', html.includes('Et maintenant ?'))
}
await vite.close()
