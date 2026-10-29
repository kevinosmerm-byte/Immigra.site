import { useEffect, useRef, useState } from 'react';
import { GlassButton, GlassCard, GlassStudyCard } from '../../../shared/design-system/Glass.jsx';
import '../../../shared/design-system/civics-study.css';
import { speakAppText, stopAppSpeech } from './speech';
import { n400StudyTokens, nextStudyIndex } from './n400StudyText.js';
import './N400StudyCards.css';

// Read-only study: deliberately no profile, progress, response or storage props.
export function N400StudyCards({ language = 'es', bank, onBack }) {
  const t = (en, es) => language === 'es' ? es : en;
  const [index, setIndex] = useState(0);
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
    void stopAppSpeech();
  };
  useEffect(() => {
    generation.current += 1;
    setSpeaking(false);
    setAudioError(false);
    void stopAppSpeech();
    return () => { generation.current += 1; void stopAppSpeech(); };
  }, [index, language]);
  const navigate = direction => {
    stop();
    setIndex(current => nextStudyIndex(current, direction, bank.questions.length));
  };
  const play = async () => {
    if (!audioEnabled || speaking || !question) return;
    const token = ++generation.current;
    setSpeaking(true);
    setAudioError(false);
    const succeeded = await speakAppText([question.en, ...(question.formNotes || []).map(note => note.en)].join(' '), { language: 'en', requireLanguageVoice: true });
    if (token !== generation.current) return;
    setSpeaking(false);
    setAudioError(!succeeded);
  };
  if (!question) return <GlassCard><p>{t('Study cards are unavailable.', 'Las tarjetas no están disponibles.')}</p><GlassButton onClick={onBack}>{t('Back', 'Volver')}</GlassButton></GlassCard>;
  return <div className="practice-screen civics-screen n400-study-screen">
    <GlassCard as="main" className="civics-deck-content">
      <GlassButton onClick={onBack}>{t('← Citizenship', '← Ciudadanía')}</GlassButton>
      <header className="civics-deck-hero">
        <div className="civics-deck-heading">
          <span>IMMIGRA · {t('Study cards', 'Tarjetas de estudio')}</span>
          <h1>Have You Ever</h1>
          <p>{t('N-400 · Part 9 · Selected questions', 'N-400 · Parte 9 · Preguntas seleccionadas')}</p>
          <small>USCIS N-400 · {t('Edition', 'Edición')} {bank.formEdition} · {t('Pages 6–10', 'Páginas 6–10')}</small>
        </div>
      </header>
      <p className="n400-study-notice">{t('Read and understand the questions. No answers, scores or personal responses are collected here. Educational only, not legal advice.', 'Lee y comprende las preguntas. Aquí no se recopilan respuestas personales ni puntuaciones. Solo educativo; no es asesoría legal.')}</p>
      <GlassStudyCard className="n400-study-card liquid-glass" tabIndex={0} aria-label={t('Study card. Use left and right arrow keys to navigate.', 'Tarjeta de estudio. Usa las flechas izquierda y derecha para navegar.')}
        onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); navigate(event.key === 'ArrowLeft' ? -1 : 1); } }}
        onTouchStart={event => { const p = event.touches[0]; touch.current = { x: p.clientX, y: p.clientY }; }}
        onTouchEnd={event => { const start = touch.current; const p = event.changedTouches[0]; touch.current = null; if (start && p && Math.abs(p.clientX - start.x) > 55 && Math.abs(p.clientX - start.x) > Math.abs(p.clientY - start.y) * 1.35) navigate(p.clientX < start.x ? 1 : -1); }}>
        <div className="n400-study-body" aria-live="polite" aria-atomic="true">
          <span className="civics-study-eyebrow">N-400 · {t('Item', 'Ítem')} {question.item} · {t('Page', 'Página')} {question.page}</span>
          <h2 lang="en">{n400StudyTokens(question.en).map((token, i) => token.kind === 'plain' ? token.text : <span key={i} className={`n400-emphasis-${token.kind}`}>{token.text}</span>)}</h2>
          {question.formNotes?.length > 0 && <aside className="n400-form-notes"><strong>{t('Form notes', 'Notas del formulario')}</strong>{question.formNotes.map((note, i) => <p key={i} lang="en">{note.en}</p>)}</aside>}
          {question.isAdaptedForCard && <small>{t('Adapted for a reading card; see the official form for its original layout.', 'Adaptada como tarjeta de lectura; consulta el formulario oficial para ver su formato original.')}</small>}
          {translationVisible && <div id="n400-study-translation"><p lang="es">{question.es}</p>{question.formNotes?.map((note, i) => <p key={i} lang="es">{note.es}</p>)}<small>{t('Spanish support translation · unofficial', 'Traducción de apoyo al español · no oficial')}</small></div>}
        </div>
        <div className="n400-study-tools">
          <GlassButton aria-expanded={translationVisible} aria-controls="n400-study-translation" onClick={() => { stop(); setTranslationVisible(value => !value); }}>{translationVisible ? t('Hide translation', 'Ocultar traducción') : t('Show Spanish translation', 'Mostrar traducción al español')}</GlassButton>
          <GlassButton aria-pressed={audioEnabled} onClick={() => { stop(); setAudioEnabled(value => !value); setAudioError(false); }}>{audioEnabled ? t('Question reader: on', 'Lector de preguntas: activado') : t('Question reader: off', 'Lector de preguntas: desactivado')}</GlassButton>
          <GlassButton disabled={!audioEnabled} onClick={speaking ? stop : play}>{speaking ? t('Stop', 'Detener') : t('Read in English', 'Leer en inglés')}</GlassButton>
        </div>
        <nav className="civics-deck-navigation" aria-label={t('Study card navigation', 'Navegación de tarjetas')}>
          <button type="button" disabled={index === 0} onClick={() => navigate(-1)}>{t('← Previous', '← Anterior')}</button>
          <div className="civics-readable-stats"><span>{index + 1} / {bank.questions.length}</span></div>
          <button type="button" disabled={index === bank.questions.length - 1} onClick={() => navigate(1)}>{t('Next →', 'Siguiente →')}</button>
        </nav>
      </GlassStudyCard>
      <p role="status" className="n400-reader-status">{audioError ? t('Reading aloud is unavailable on this device. You can keep studying the text.', 'La lectura en voz alta no está disponible en este dispositivo. Puedes seguir estudiando el texto.') : t('Audio starts only when you press Read. Uses your device’s speech service; no microphone or AI evaluation.', 'El audio empieza solo al pulsar Leer. Usa el servicio de voz del dispositivo; sin micrófono ni evaluación con IA.')}</p>
      <details className="n400-study-source"><summary>{t('Scope and source', 'Alcance y fuente')}</summary>
        <p>{t('62 reading cards · Part 9, items 1–37, pages 6–10. This is not the complete N-400 or an official question count. Nonbinary item 22.c is not a card.', '62 tarjetas de lectura · Parte 9, ítems 1–37, páginas 6–10. No es el N-400 completo ni una cantidad oficial de preguntas. El ítem no binario 22.c no es una tarjeta.')}</p>
        <p>{language === 'es' ? bank.generalFormContext.es : bank.generalFormContext.en}</p>
        <p>{t('Form edition', 'Edición del formulario')}: {bank.formEdition} · {t('Text checked', 'Texto cotejado')}: {bank.sourceAudit.checkedAt}</p>
        <p>{t('Compared with indexed official USCIS text. Direct PDF access was blocked; PDF visual verification was not completed. Check the current official form before using it for an application.', 'Cotejado con texto oficial indexado de USCIS. El acceso directo al PDF fue bloqueado; no se completó la verificación visual del PDF. Consulta el formulario oficial vigente antes de usarlo para una solicitud.')}</p>
      </details>
      <p className="n400-study-source"><a href="https://www.uscis.gov/n-400" target="_blank" rel="noreferrer">{t('Official USCIS Form N-400', 'Formulario N-400 oficial de USCIS')}</a></p>
    </GlassCard>
  </div>;
}
