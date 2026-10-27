import { StrictMode } from 'react'
import { Capacitor } from '@capacitor/core'
import { loadGoogleAdsTag } from './googleAdsConversions.js'
import { createRoot } from 'react-dom/client'
import './index.css'
import './tailwind.css'
import App from './App.jsx'
import AppErrorBoundary from './AppErrorBoundary.jsx'
import { PodcastProvider } from './PodcastPlayer.jsx'
import { PromotionAccessProvider } from './PromotionAccess.jsx'
import { AccountProvider } from './Account.jsx'
import './companion.js'

// Website-only measurement: never initialize the Google Ads web tag in iOS/Android builds.
if (import.meta.env.PROD && !Capacitor.isNativePlatform()) {
  loadGoogleAdsTag().catch(() => {});
}

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
            <citizenship-companion />
          </PodcastProvider>
        </PromotionAccessProvider>
      </AccountProvider>
    </AppErrorBoundary>
  </StrictMode>,
)

if (import.meta.env.PROD) {
  const recover = () => import('./styleRecovery.js').then(({ recoverStyles }) => recoverStyles());
  if (document.readyState === 'complete') recover();
  else window.addEventListener('load', recover, { once: true });
  window.addEventListener('online', recover);
}

import './ThemeConsistency.css'
import './WhiteStyle.css'
import './PodcastPlayerStyle.css'
import './InstitutionalSpacing.css'
