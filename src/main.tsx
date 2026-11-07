import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { SiteFooter } from './components/SiteFooter'
import './styles/global.css'

const root = document.getElementById('root')
if (!root) throw new Error('Missing root element')

createRoot(root).render(
  <StrictMode>
    <App />
    <SiteFooter />
  </StrictMode>,
)
