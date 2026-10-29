import { useEffect, useRef, useState } from 'react';
import { GlassButton, GlassCard, GlassStudyCard } from '../../../shared/design-system/Glass.jsx';
import '../../../shared/design-system/civics-study.css';
import { speakAppText, stopAppSpeech } from './speech';
import { n400StudyTokens, nextStudyPage } from './n400StudyText.js';
// Shared selectors target the platform DOM; keep outside legacy module CSS scoping.
import '../../../shared/design-system/n400-study.css';

// Read-only study: deliberately no profile, progress, response or storage props.
export function N400StudyCards({ language = 'es', bank, onBack }) {
  const t = (en, es) => language === 'es' ? es : en;
  const [page, setPage] = useState({ index: 0, direction: null });
  const { index } = page;
  const [translationVisible, setTranslationVisible] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const generation = useRef(0);
  const touch = useRef(null);
  const question = bank.questions[index];
  const stop = () => {
    generation.current += 1;
    setSpeaking(false);
    setAudioEnabled(false);
    void stopAppSpeech();
  };
  useEffect(() => {
    generation.current += 1;
    setSpeaking(false);
    setAudioEnabled(false);
    setAudioError(false);
    void stopAppSpeech();
    return () => { generation.current += 1; void stopAppSpeech(); };
  }, [index, language]);
  const navigate = direction => {
    stop();
    setPage(current => nextStudyPage(current, direction, bank.questions.length));
  };
  const play = async () => {
    if (speaking || !question) return;
    const token = ++generation.current;
    setAudioEnabled(true);
    setSpeaking(true);
    setAudioError(false);
    const succeeded = await speakAppText([question.en, ...(question.formNotes || []).map(note => note.en)].join(' '), { language: 'en', requireLanguageVoice: true });
    if (token !== generation.current) return;
    setSpeaking(false);
    setAudioEnabled(false);
    setAudioError(!succeeded);
  };
  if (!question) return <GlassCard><p>{t('Study cards are unavailable.', 'Las tarjetas no están disponibles.')}</p><GlassButton onClick={onBack}>{t('Back', 'Volver')}</GlassButton></GlassCard>;
  return <div className="practice-screen civics-screen n400-study-screen">
    <GlassCard as="main" className="civics-deck-content">
      <header className="n400-study-heading">
        <GlassButton className="n400-icon-control" aria-label={t('Back to citizenship', 'Volver a ciudadanía')} title={t('Back to citizenship', 'Volver a ciudadanía')} onClick={onBack}><span aria-hidden="true">←</span></GlassButton>
        <h1>N-400</h1>
      </header>
      <GlassStudyCard className="n400-study-card liquid-glass" tabIndex={0} aria-label={t('Study card. Use left and right arrow keys to navigate.', 'Tarjeta de estudio. Usa las flechas izquierda y derecha para navegar.')}
        onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); navigate(event.key === 'ArrowLeft' ? -1 : 1); } }}
        onTouchStart={event => { const p = event.touches[0]; touch.current = { x: p.clientX, y: p.clientY }; }}
        onTouchEnd={event => { const start = touch.current; const p = event.changedTouches[0]; touch.current = null; if (start && p && Math.abs(p.clientX - start.x) > 55 && Math.abs(p.clientX - start.x) > Math.abs(p.clientY - start.y) * 1.35) navigate(p.clientX < start.x ? 1 : -1); }}>
        <div className="n400-study-body" key={index} data-page-direction={page.direction} aria-live="polite" aria-atomic="true">
          <span className="civics-study-eyebrow">{t('Item', 'Ítem')} {question.item}</span>
          <h2 lang="en">{n400StudyTokens(question.en).map((token, i) => token.kind === 'plain' ? token.text : <span key={i} className={`n400-emphasis-${token.kind}`}>{token.text}</span>)}</h2>
          {question.formNotes?.length > 0 && <aside className="n400-form-notes"><strong>{t('Form notes', 'Notas del formulario')}</strong>{question.formNotes.map((note, i) => <p key={i} lang="en">{note.en}</p>)}</aside>}
          {translationVisible && <div id="n400-study-translation"><p lang="es">{question.es}</p>{question.formNotes?.map((note, i) => <p key={i} lang="es">{note.es}</p>)}<small>{t('Spanish support translation · unofficial', 'Traducción de apoyo al español · no oficial')}</small></div>}
        </div>
        <nav className="civics-deck-navigation n400-study-navigation" aria-label={t('Study card navigation', 'Navegación de tarjetas')}>
          <button type="button" className="n400-icon-control n400-page-control" aria-label={t('Previous card', 'Tarjeta anterior')} title={t('Previous card', 'Tarjeta anterior')} disabled={index === 0} onClick={() => navigate(-1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H4m7-7-7 7 7 7" /></svg></button>
          <span className="n400-study-count">{index + 1} / {bank.questions.length}</span>
          <div className="n400-study-tools">
            <button type="button" className="n400-icon-control" aria-label={translationVisible ? t('Hide Spanish translation', 'Ocultar traducción al español') : t('Show Spanish translation', 'Mostrar traducción al español')} title={translationVisible ? t('Hide translation', 'Ocultar traducción') : t('Spanish translation', 'Traducción al español')} aria-expanded={translationVisible} aria-controls="n400-study-translation" onClick={() => { stop(); setTranslationVisible(value => !value); }}><span aria-hidden="true">ES</span></button>
            <button type="button" className="n400-icon-control" aria-label={speaking ? t('Stop reading', 'Detener lectura') : t('Read in English', 'Leer en inglés')} title={speaking ? t('Stop reading', 'Detener lectura') : t('Read in English', 'Leer en inglés')} aria-pressed={audioEnabled} onClick={speaking ? stop : play}>
              {speaking ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9v6h4l5 4V5L9 9H5Zm11.5.5a4 4 0 0 1 0 5M18.8 7a7 7 0 0 1 0 10" /></svg>}
            </button>
          </div>
          <button type="button" className="n400-icon-control n400-page-control" aria-label={t('Next card', 'Tarjeta siguiente')} title={t('Next card', 'Tarjeta siguiente')} disabled={index === bank.questions.length - 1} onClick={() => navigate(1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-7-7 7 7-7 7" /></svg></button>
        </nav>
      </GlassStudyCard>
      <p role="status" className="n400-reader-status">{audioError ? t('Reading aloud is unavailable on this device. You can keep studying the text.', 'La lectura en voz alta no está disponible en este dispositivo. Puedes seguir estudiando el texto.') : ''}</p>
      <details className="n400-study-source"><summary>{t('About these cards', 'Sobre estas tarjetas')}</summary>
        <p>{t('Read and understand the questions. No answers, scores or personal responses are collected here. Educational only, not legal advice.', 'Lee y comprende las preguntas. Aquí no se recopilan respuestas personales ni puntuaciones. Solo educativo; no es asesoría legal.')}</p>
        <p>{t('Audio is off by default and starts only when you press Read. Uses your device’s speech service; no microphone or AI evaluation.', 'El audio está desactivado por defecto y empieza solo al pulsar Leer. Usa el servicio de voz del dispositivo; sin micrófono ni evaluación con IA.')}</p>
        <p>{t('Current item', 'Ítem actual')}: {question.item} · {t('Page', 'Página')} {question.page}</p>
        {question.isAdaptedForCard && <p>{t('Adapted for a reading card; see the official form for its original layout.', 'Adaptada como tarjeta de lectura; consulta el formulario oficial para ver su formato original.')}</p>}
        <p>{t('62 reading cards · Part 9, items 1–37, pages 6–10. This is not the complete N-400 or an official question count. Nonbinary item 22.c is not a card.', '62 tarjetas de lectura · Parte 9, ítems 1–37, páginas 6–10. No es el N-400 completo ni una cantidad oficial de preguntas. El ítem no binario 22.c no es una tarjeta.')}</p>
        <p>{language === 'es' ? bank.generalFormContext.es : bank.generalFormContext.en}</p>
        <p>{t('Form edition', 'Edición del formulario')}: {bank.formEdition} · {t('Text checked', 'Texto cotejado')}: {bank.sourceAudit.checkedAt}</p>
        <p>{t('Compared with indexed official USCIS text. Direct PDF access was blocked; PDF visual verification was not completed. Check the current official form before using it for an application.', 'Cotejado con texto oficial indexado de USCIS. El acceso directo al PDF fue bloqueado; no se completó la verificación visual del PDF. Consulta el formulario oficial vigente antes de usarlo para una solicitud.')}</p>
        <p><a href="https://www.uscis.gov/n-400" target="_blank" rel="noreferrer">{t('Official USCIS Form N-400', 'Formulario N-400 oficial de USCIS')}</a></p>
      </details>
    </GlassCard>
  </div>;
}
