import {starterQuestions, starterRoute} from '../shared/civics-starter.mjs';
import {escapeHtml as e} from '../shared/seo-pages.mjs';

export function starterCard(lang) {
  const es = lang === 'es', t = (a,b) => es ? a : b;
  const q = starterQuestions(lang)[0];
  return `<div class="starter-card" id="first-question" tabindex="-1" data-starter-card data-correct="${q.correct}" data-answer="${e(q.answer)}">
    <div class="starter-host"><img src="/images/home/william-home-640.webp" srcset="/images/home/william-home-640.webp 640w, /images/home/william-home.webp 1024w" sizes="52px" alt="" width="52" height="52"><span>${t('Práctica de civismo','Civics practice')}<small>${t('William · Entrevistador virtual','William · Virtual interviewer')}</small></span></div>
    <h2>${e(q.prompt)}</h2>
    <div class="starter-choices" role="group" aria-label="${t('Elige una respuesta','Choose an answer')}" hidden>
      ${q.choices.map((label,i) => `<button type="button" data-choice="${i}">${e(label)}</button>`).join('')}
    </div>
    <p class="starter-feedback" role="status"></p>
    <div class="starter-next" hidden><a class="cta" href="/?lang=${lang}#${starterRoute}">${t('Continuar la práctica','Continue practicing')} →</a><small>${t('Completa tres preguntas gratis, sin registrarte. Después puedes guardar tu avance con tu correo.','Complete three free questions without registering. Then save your progress with your email.')}</small></div>
    <noscript><details><summary>${t('Ver respuesta en inglés','Show the answer')}</summary><p lang="en">${e(q.answer)}</p></details><a href="/?lang=${lang}#${starterRoute}">${t('Continuar la práctica','Continue practicing')}</a></noscript>
  </div>`;
}
