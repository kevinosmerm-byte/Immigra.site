import React from 'react';
import {seoPages} from '../shared/seo-pages.mjs';

export default function PreparationGuides({lang = 'es'}) {
 return <nav className="preparation-guides" aria-label={lang === 'es' ? 'Guías de preparación' : 'Preparation guides'}>
  <p>{lang === 'es' ? 'Guías de preparación' : 'Preparation guides'}</p>
  <ul>{[lang, lang === 'es' ? 'en' : 'es'].flatMap(language => seoPages.filter(page => page.lang === language)).map(page =>
   <li key={page.path}><a href={`/${page.path}`} hrefLang={page.lang} lang={page.lang}>{page.heading} ({page.lang.toUpperCase()})</a></li>
  )}</ul>
 </nav>;
}
