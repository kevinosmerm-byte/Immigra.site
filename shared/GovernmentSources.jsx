import React from 'react';

import { governmentSources } from './government-sources.mjs';

export default function GovernmentSources({language='en'}) {
  const es=language==='es';
  return <section aria-label={es?'Fuentes oficiales e independencia':'Official sources and independence'}>
    <h2>{es?'Fuentes oficiales e independencia':'Official sources and independence'}</h2>
    <p><strong>{es?'Immigra no representa a USCIS ni a ninguna entidad gubernamental. No está afiliada, respaldada ni operada por el gobierno.':'Immigra does not represent USCIS or any government entity. It is not affiliated with, endorsed by or operated by the government.'}</strong></p>
    <p>{es?'Estas fuentes respaldan las referencias gubernamentales de estudio. Las simulaciones de asilo, N-400 y residencia, los escenarios ficticios y los comentarios de IA son material educativo de Immigra, no preguntas oficiales ni decisiones gubernamentales. Las traducciones y resúmenes pueden contener errores. Consulta la fuente vigente y tus avisos oficiales; la app no determina qué examen o beneficio te corresponde.':'These sources support the governmental study references. Asylum, N-400 and residency simulations, fictional scenarios and AI feedback are Immigra educational material, not official questions or government decisions. Translations and summaries may contain errors. Consult current sources and your official notices; the app does not determine which test or benefit applies to you.'}</p>
    <ul>{governmentSources.map(([en,spanish,url])=><li key={url}><a href={url} target="_blank" rel="noopener noreferrer">{es?spanish:en}</a></li>)}</ul>
  </section>;
}
