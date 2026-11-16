import React, {useEffect, useRef, useState} from 'react';
import {useAccount} from '../modules/citizenship/src/accountContext.js';
import {dailyCivicsPlan, loadStarter, saveStarter, starterNextStep, starterQuestions, starterReviewRoute} from '../shared/civics-starter.mjs';

const practice = '#/citizenship/civics';
function localDay() { return new Date().toLocaleDateString('en-CA'); }
function readStorage() { try { return window.localStorage; } catch { return null; } }

export default function CivicsStarter({lang}) {
  const {session, configured, sendMagicLink, recordAccountEvent} = useAccount();
  const user = session && !session.isEmailTrial ? session.user.id : null;
  const storage = readStorage();
  const es = lang === 'es', t = (a,b) => es ? a : b;
  const questions = starterQuestions(lang);
  const [progress, setProgress] = useState(() => {
    const saved = loadStarter(user, storage);
    if (!user || saved.completedDay || saved.position !== 1) return saved;
    try {
      const sample = JSON.parse(storage.getItem('immigra.civics.sample.v1'));
      if (sample?.review === true && Date.now() - sample.time < 3600000) return {...saved, review: [...new Set([0, ...saved.review])]};
    } catch {}
    return saved;
  });
  const [email,setEmail] = useState(session?.user?.email || '');
  const [mail,setMail] = useState('idle');
  const [selection,setSelection] = useState(null);
  const [reviewIndex,setReviewIndex] = useState(() => window.location.hash === starterReviewRoute && starterNextStep(progress) === 'review' ? progress.review[0] : null);
  const [showChoices,setShowChoices] = useState(false);
  const [reviewAttempted,setReviewAttempted] = useState(false);
  const firstChoice = useRef(null);
  const started = useRef(false);
  const promptRef = useRef(null);
  const requestBusy = useRef(false);
  const record = name => { void recordAccountEvent(name, 'civics_intro').catch(() => {}); };
  useEffect(() => { if(user) saveStarter(user, progress, storage); }, [user, progress, storage]);
  useEffect(() => {
    if (user && (starterNextStep(progress) === 'resume' || reviewIndex !== null) && !started.current) {
      started.current = true;
      void recordAccountEvent('practice_started', 'civics_intro').catch(() => {});
    }
  }, [user, progress, reviewIndex, recordAccountEvent]);
  const update = next => { saveStarter(user, next, storage); setProgress(next); };
  async function send(event) {
    event.preventDefault();
    if (!configured || requestBusy.current) return;
    requestBusy.current = true; setMail('sending');
    try {
      const {error} = await sendMagicLink(email.trim(), {civicsLanguage: lang});
      if (error) throw error;
      setMail('sent');
    } catch { setMail('error'); } finally { requestBusy.current = false; }
  }
  const finished = progress.position >= questions.length;
  const index = reviewIndex ?? progress.position;
  const question = questions[index];
  const reviewing = reviewIndex !== null;
  const offerReview = starterNextStep(progress) === 'review' && !reviewAttempted;
  const returning = progress.completedDay && progress.completedDay !== localDay();
  function startReview() {
    setReviewIndex(progress.review[0]);
    setShowChoices(false);
    setSelection(null);
    started.current = true;
    record('practice_started');
    requestAnimationFrame(() => promptRef.current?.focus());
  }
  function next() {
    if (selection === null) return;
    if (reviewing) {
      const remaining = progress.review.filter(i => i !== index);
      if (selection !== question.correct) remaining.push(index);
      update({...progress, review: remaining});
      record('practice_completed');
      setReviewAttempted(true);
      setReviewIndex(null);
    } else {
      const position = index + 1;
      const review = [...new Set([...progress.review, ...(selection === question.correct ? [] : [index])])];
      update({position, review, completedDay: position === questions.length ? localDay() : ''});
      if (position === questions.length) {
        record('practice_completed');
        try { storage.removeItem('immigra.civics.sample.v1'); } catch {}
      }
    }
    setSelection(null);
    requestAnimationFrame(() => promptRef.current?.focus());
  }
  return <section className="starter-card starter-panel" aria-labelledby="starter-title">
    <link rel="stylesheet" href="/civics-starter.css" precedence="default"/>
    {!user ? <>
      <h1 id="starter-title">{t('Guarda tu primera práctica','Save your first practice')}</h1>
      <p>{t('Verifica tu correo y continúa con la segunda pregunta. Si es tu primera cuenta, tendrás siete días de entrevistas con IA sin tarjeta.','Verify your email to continue with question two. A new account includes seven days of AI interview practice without a card.')}</p>
      <form onSubmit={send}><label htmlFor="starter-email">{t('Correo electrónico','Email address')}</label>
        <input id="starter-email" required type="email" autoComplete="email" maxLength={254} value={email} onChange={e=>{setEmail(e.target.value);setMail('idle');}}/>
        <button className="cta" disabled={!configured || mail==='sending' || mail==='sent'}>{mail==='sending'?t('Enviando…','Sending…'):t('Enviarme el enlace','Email me the link')}</button>
      </form>
      <p role="status">{!configured?t('El registro no está disponible en este momento. Puedes seguir estudiando.','Registration is unavailable right now. You can keep studying.'):mail==='sent'?t('Revisa tu correo. El enlace abre la siguiente pregunta.','Check your email. The link opens your next question.'):mail==='error'?t('No pudimos enviar el enlace. Comprueba el correo y vuelve a intentarlo.','We couldn’t send the link. Check your address and try again.'):''}</p>
    </> : finished && !reviewing ? <>
      <h1 tabIndex="-1" ref={promptRef} id="starter-title">{reviewAttempted ? t('Repaso completado','Review complete') : returning ? t('Tu práctica de hoy','Your practice today') : t('Tres preguntas practicadas','Three questions practiced')}</h1>
      <p>{offerReview
        ? t('Vuelve a intentar una pregunta que te costó. Primero trata de recordar la respuesta.','Try a question you missed. First, see if you can recall the answer.')
        : t('Tu plan de ciudadanía te sugiere la siguiente actividad y te indica cuánto tiempo lleva.','Your citizenship plan suggests your next activity and shows how long it takes.')}</p>
      {offerReview
        ? <button className="cta" onClick={startReview}>{t('Repasar una pregunta','Review a question')}</button>
        : <a className="cta" href={dailyCivicsPlan}>{t('Abrir mi plan de hoy','Open my daily plan')}</a>}
    </> : <>
      <p>{reviewing?t('Repaso','Review'):t('Práctica de civismo','Civics practice') + ' · ' + (index + 1) + ' / ' + questions.length}</p>
      <h1 id="starter-title" tabIndex="-1" ref={promptRef}>{question.prompt}</h1>
      {reviewing && !showChoices ? <>
        <p>{t('Intenta responder en voz alta antes de ver las opciones.','Try answering out loud before you look at the choices.')}</p>
        <button className="cta" onClick={()=>{setShowChoices(true); requestAnimationFrame(()=>firstChoice.current?.focus());}}>{t('Ver opciones','Show choices')}</button>
      </> : <div className="starter-choices">{question.choices.map((choice,i)=><button ref={i===0?firstChoice:undefined} key={choice} disabled={selection!==null} data-result={selection===null?undefined:i===question.correct?'correct':i===selection?'review':undefined} onClick={()=>setSelection(i)}>{choice}</button>)}</div>}
      {selection!==null && <><p role="status">{selection===question.correct?t('¡Correcto!','Correct!'):t('Para repasar.','Worth reviewing.')} {t('Respuesta en inglés: ','Answer: ')}<span lang="en">{question.answer}</span></p><button className="cta" onClick={next}>{reviewing||index===questions.length-1?t('Ver mi avance','See my progress'):t('Siguiente pregunta','Next question')}</button></>}
    </>}
    <div><a className="starter-link" href={practice}>{t('Abrir el banco de civismo','Open the civics study bank')}</a></div>
  </section>;
}
