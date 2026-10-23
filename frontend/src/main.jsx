import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AdaptiveProvider } from './context/AdaptiveContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AdaptiveProvider>
      <App />
    </AdaptiveProvider>
  </StrictMode>,
)
