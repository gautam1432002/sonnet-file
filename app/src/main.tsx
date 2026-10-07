import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { THEMES } from './themes'
import '@fontsource/inter'

// Set initial theme
const savedThemeId = Number(localStorage.getItem('sonnet_theme')) || 1;
const savedTheme = THEMES.find(t => t.id === savedThemeId) || THEMES[0];
document.documentElement.style.setProperty('--bg-from', savedTheme.from);
document.documentElement.style.setProperty('--bg-via', savedTheme.via);
document.documentElement.style.setProperty('--bg-to', savedTheme.to);
document.documentElement.style.setProperty('--accent', savedTheme.accent);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
