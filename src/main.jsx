import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AppErrorBoundary from './AppErrorBoundary.jsx'
import { PodcastProvider } from './PodcastPlayer.jsx'
import { PromotionAccessProvider } from './PromotionAccess.jsx'
import { AccountProvider } from './Account.jsx'

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error)
    })
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <AccountProvider>
        <PromotionAccessProvider>
          <PodcastProvider>
            <App />
          </PodcastProvider>
        </PromotionAccessProvider>
      </AccountProvider>
    </AppErrorBoundary>
  </StrictMode>,
)
