import {GlassProgress} from '../../../shared/design-system/Glass.jsx';
export function ProgressDashboard({ language, summary, viewed, events, onBack, onPractice }) {
  const es = language === 'es';
  const t = (en, spanish) => es ? spanish : en;
  const count = Math.min(128, new Set(viewed).size);
  const labels = { civics: t('Civics', 'Civismo'), reading: t('Reading', 'Lectura'), writing: t('Writing', 'Escritura'), interview: t('Interviews', 'Entrevistas'), quiz: t('Quiz', 'Cuestionario') };
  const recent = events.filter(e => labels[e.module]).slice(-5).reverse();
  return <div className="app progress-simple-screen"><main className="progress-simple-content">
    <header><button className="simple-back" onClick={onBack}>← {t('Home', 'Inicio')}</button><h1>{t('My progress', 'Mi progreso')}</h1><p>{t('Your study activity, in one place.', 'Tu actividad de estudio, en un solo lugar.')}</p></header>
    <section className="progress-simple-hero"><span>{t('Civics questions studied', 'Preguntas cívicas estudiadas')}</span><strong>{count}<small> / 128</small></strong><GlassProgress value={count} max={128} label={t('Questions studied', 'Preguntas estudiadas')} /><p>{t('Studying a card does not mean you have mastered it.', 'Ver una tarjeta no significa que ya la domines.')}</p><button onClick={() => onPractice('civics')}>{t('Continue studying', 'Seguir estudiando')} →</button></section>
    <section className="progress-simple-grid" aria-label={t('Practice results', 'Resultados de práctica')}>
      {['quiz', 'reading', 'writing', 'interview'].map(key => <button key={key} className="progress-simple-module" onClick={() => onPractice(key)}><span>{labels[key]}</span><strong>{summary[key].score === null ? '—' : `${summary[key].score}%`}</strong><small>{summary[key].attempts} {t('completed sessions', 'sesiones completadas')}</small><small>{summary[key].score === null ? t('Start your first practice', 'Empieza tu primera práctica') : t('Average practice score', 'Promedio de práctica')}</small></button>)}
    </section>
    <section className="progress-simple-history"><h2>{t('Recent activity', 'Actividad reciente')}</h2>{recent.length ? <ul>{recent.map((event,i) => <li key={`${event.at}-${i}`}><div><strong>{labels[event.module]}</strong><small>{new Date(event.at).toLocaleDateString(es ? 'es' : 'en', {month:'short',day:'numeric'})}</small></div><span>{Number.isFinite(event.score) ? `${event.score}%` : t('Completed','Completada')}</span></li>)}</ul> : <p>{t('Your completed practices will appear here.', 'Tus prácticas completadas aparecerán aquí.')}</p>}</section>
    <p className="progress-simple-note">{t('These results describe practice in this app. They do not predict passing the USCIS test.', 'Estos resultados describen tu práctica en la app. No predicen la aprobación del examen de USCIS.')}</p>
  </main></div>;
}
