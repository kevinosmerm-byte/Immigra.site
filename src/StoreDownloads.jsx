import React from 'react';
import './StoreDownloads.css';

// Matches capacitor.config.ts and android/app/build.gradle; public listing verified 2026-11-03.
export const googlePlayUrl = 'https://play.google.com/store/apps/details?id=us.citizenshipai.app';

export default function StoreDownloads({lang}) {
  const t = (es, en) => lang === 'es' ? es : en;
  return <section className="store-downloads" aria-labelledby="store-downloads-title">
    <div><h2 id="store-downloads-title">{t('Lleva IMMIGRA contigo', 'Take IMMIGRA with you')}</h2>
      <p>{t('Descarga la app para Android. La versión para iPhone estará disponible próximamente.', 'Download the Android app. The iPhone version is coming soon.')}</p></div>
    <div className="store-downloads-options">
      <a className="store-downloads-play" href={googlePlayUrl}>
        <span>{t('Descargar en', 'Get it on')}</span><strong>Google Play</strong>
      </a>
      <div className="store-downloads-soon">
        <span>{t('Próximamente', 'Coming soon')}</span><strong>App Store</strong>
      </div>
    </div>
  </section>;
}
