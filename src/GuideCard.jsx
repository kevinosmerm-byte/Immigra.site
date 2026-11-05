import React from 'react';
import './GuideCard.css';

// Retain the existing guide destination. Only ImmigraHome (the web homepage) renders this card.
export const guideUrl = '/guias/index.html';
const artwork = '/images/guide/guide-card-reference.png';

export default function GuideCard({lang}) {
  const es = lang === 'es';
  return <section className="guide-card" aria-labelledby="guide-card-title">
    <svg className="guide-card-icon" viewBox="58 92 124 124" aria-hidden="true" focusable="false">
      <image href={artwork} width="1877" height="427"/>
    </svg>
    <div className="guide-card-copy">
      <h2 id="guide-card-title">{es ? 'Toma el control de tu trámite migratorio' : 'Take charge of your immigration application'}</h2>
      <p>{es ? 'Hazlo tú mismo. Te guiamos paso a paso con imágenes, formularios y listas de documentos.' : 'Do it yourself. We’ll guide you step by step with illustrated instructions, forms, and document checklists.'}</p>
      <a className="guide-card-button" href={guideUrl}>
        <span>{es ? 'Elige tu trámite' : 'Choose your application type'}</span><span aria-hidden="true">→</span>
      </a>
    </div>
    <svg className="guide-card-art" viewBox="1170 30 680 360" aria-hidden="true" focusable="false">
      <image href={artwork} width="1877" height="427"/>
    </svg>
  </section>;
}
