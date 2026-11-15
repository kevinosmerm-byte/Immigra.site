import React, {useEffect, useRef, useState} from 'react';
import {useAccount} from '../modules/citizenship/src/accountContext.js';
import {loadStarter, saveStarter, starterQuestions} from '../shared/civics-starter.mjs';

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
  const [reviewIndex,setReviewIndex] = useState(null);
  const started = useRef(false);
  const promptRef = useRef(null);
  const requestBusy = useRef(false);
  const record = name => { void recordAccountEvent(name, 'civics_intro').catch(() => {}); };
  useEffect(() => { if(user) saveStarter(user, progress, storage); }, [user, progress, storage]);
  useEffect(() => {
    if (user && !started.current) {
      started.current = true;
      void recordAccountEvent('practice_started', 'civics_intro').catch(() => {});
    }
  }, [user, recordAccountEvent]);
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
  function next() {
    if (selection === null) return;
    if (reviewing) {
      update({...progress, review: selection === question.correct ? progress.review.filter(i => i !== index) : progress.review});
      record('practice_completed');
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
      <h1 tabIndex="-1" ref={promptRef} id="starter-title">{t('Tres preguntas practicadas','Three questions practiced')}</h1>
      <p>{progress.review.length?t('Guardamos las preguntas que puedes repasar en este dispositivo.','Your review questions are saved on this device.'):t('Completaste tu primera práctica de civismo. La próxima vez puedes repasar una pregunta o continuar con el banco completo.','You finished your first civics practice. Next time, review a question or continue with the full study bank.')}</p>
      <button className="cta" onClick={()=>{setReviewIndex(progress.review[0] ?? 0);setSelection(null);requestAnimationFrame(()=>promptRef.current?.focus());}}>{t('Repasar una pregunta','Review a question')}</button>
    </> : <>
      <p>{reviewing?t('Repaso','Review'):t('Práctica de civismo','Civics practice') + ' · ' + (index + 1) + ' / ' + questions.length}</p>
      <h1 id="starter-title" tabIndex="-1" ref={promptRef}>{question.prompt}</h1>
      <div className="starter-choices">{question.choices.map((choice,i)=><button key={choice} disabled={selection!==null} data-result={selection===null?undefined:i===question.correct?'correct':i===selection?'review':undefined} onClick={()=>setSelection(i)}>{choice}</button>)}</div>
      {selection!==null && <><p role="status">{selection===question.correct?t('¡Correcto!','Correct!'):t('Para repasar.','Worth reviewing.')} {t('Respuesta en inglés: ','Answer: ')}<span lang="en">{question.answer}</span></p><button className="cta" onClick={next}>{reviewing||index===questions.length-1?t('Ver mi avance','See my progress'):t('Siguiente pregunta','Next question')}</button></>}
    </>}
    <div><a className="starter-link" href={practice}>{t('Abrir el banco de civismo','Open the civics study bank')}</a></div>
  </section>;
}
