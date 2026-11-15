import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonts are installed with npm and served by the site itself (no external font service).
import '@fontsource/anton/400.css'
import '@fontsource-variable/manrope'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
