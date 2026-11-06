import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './theme/theme.css'
import './styles.css'
import App from './App'
import { ThemeProvider, appliquerThemeInitial } from './theme/ThemeProvider'

appliquerThemeInitial()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </ThemeProvider>
  </StrictMode>,
)
