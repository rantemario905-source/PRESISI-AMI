import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ProgressProvider } from './context/ProgressContext.jsx'
import {
  bersihkanPenandaPerbarui,
  muatUlangSekali,
} from './utils/pemulihanHalaman.js'
import './index.css'

// Deploy baru dapat menghapus chunk lama; muat ulang sekali agar HTML/aset
// terbaru dipakai, bukan layar putih.
window.addEventListener('vite:preloadError', (event) => {
  if (muatUlangSekali()) event.preventDefault()
})

bersihkanPenandaPerbarui()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ProgressProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ProgressProvider>
    </ErrorBoundary>
  </StrictMode>,
)
