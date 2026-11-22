import React, {useEffect, useRef, useState} from 'react';
import {useAccount} from '../modules/citizenship/src/accountContext.js';
import {allowStarterTransfer, claimStarter, dailyCivicsPlan, loadStarter, saveStarter, starterNextStep, starterQuestions, starterReviewRoute} from '../shared/civics-starter.mjs';
import {useEmailLinkDelivery} from '../shared/useEmailLinkDelivery.js';

const practice = '#/citizenship/civics';
function localDay() { return new Date().toLocaleDateString('en-CA'); }
function readStorage() { try { return window.localStorage; } catch { return null; } }

export default function CivicsStarter({lang}) {
  const {session, configured, sendMagicLink, recordAccountEvent} = useAccount();
  const user = session && !session.isEmailTrial ? session.user.id : null;
  return <StarterSession key={user || 'guest'} {...{lang, user, session, configured, sendMagicLink, recordAccountEvent}}/>;
}

function StarterSession({lang, user, session, configured, sendMagicLink, recordAccountEvent}) {
  const storage = readStorage();
  const es = lang === 'es', t = (a,b) => es ? a : b;
  const questions = starterQuestions(lang);
  const [progress, setProgress] = useState(() => claimStarter(user, storage) ?? loadStarter(user, storage));
  const [email,setEmail] = useState(session?.user?.email || '');
  const [sentTo,setSentTo] = useState('');
  const mail = useEmailLinkDelivery();
  const [selection,setSelection] = useState(null);
  const [reviewIndex,setReviewIndex] = useState(() => window.location.hash === starterReviewRoute && starterNextStep(progress) === 'review' ? progress.review[0] : null);
  const [showChoices,setShowChoices] = useState(false);
  const [reviewAttempted,setReviewAttempted] = useState(false);
  const firstChoice = useRef(null);
  const started = useRef(false);
  const promptRef = useRef(null);
  const record = name => { if (user) void recordAccountEvent(name, 'civics_intro').catch(() => {}); };
  useEffect(() => { saveStarter(user, progress, storage); }, [user, progress, storage]);
  useEffect(() => {
    if (user && (starterNextStep(progress) === 'resume' || reviewIndex !== null) && !started.current) {
      started.current = true;
      void recordAccountEvent('practice_started', 'civics_intro').catch(() => {});
    }
  }, [user, progress, reviewIndex, recordAccountEvent]);
  const update = next => { saveStarter(user, next, storage); setProgress(next); };
  async function send(event) {
    event.preventDefault();
    if (!configured) return;
    const recipient = email.trim();
    if (await mail.send(() => sendMagicLink(recipient, {civicsLanguage: lang}))) {
      setSentTo(recipient);
      allowStarterTransfer(storage);
    }
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
    {finished && !reviewing ? <>
      <h1 tabIndex="-1" ref={promptRef} id="starter-title">{reviewAttempted ? t('Repaso completado','Review complete') : returning ? t('Tu práctica de hoy','Your practice today') : t('Tres preguntas practicadas','Three questions practiced')}</h1>
      <p>{progress.review.length ? t(`${questions.length} preguntas completadas · ${progress.review.length} para repasar.`,`${questions.length} questions completed · ${progress.review.length} to review.`) : t('Completaste las tres preguntas. Puedes continuar con tu plan de estudio.','You completed all three questions. You can continue with your study plan.')}</p>
      {!user && <div className="starter-save">
        <h2>{t('Guarda este avance con tu cuenta','Save this progress with your account')}</h2>
        <p>{t('Tu primera cuenta incluye siete días de entrevistas con IA al registrarte. Sin tarjeta ni cobros automáticos.','Your first account includes seven days of AI interviews when you register. No card or automatic charges.')}</p>
        <form onSubmit={send} aria-busy={mail.status === 'sending'}><label htmlFor="starter-email">{t('Correo electrónico','Email address')}</label>
          <input id="starter-email" required type="email" autoComplete="email" maxLength={254} value={email} disabled={mail.status === 'sending'} onChange={e=>setEmail(e.target.value)}/>
          <button className="cta" disabled={!configured || mail.status === 'sending' || mail.remaining > 0}>{mail.status === 'sending' ? t('Enviando…','Sending…') : mail.remaining > 0 ? t(`Reenviar en ${mail.remaining} s`,`Resend in ${mail.remaining}s`) : sentTo ? t('Reenviar enlace','Resend link') : t('Guardar y continuar con mi correo','Save and continue with my email')}</button>
        </form>
        <p role="status">{!configured ? t('El registro no está disponible ahora. Puedes seguir estudiando gratis.','Registration is unavailable right now. You can keep studying for free.') : mail.status === 'sent' ? t(`Enlace enviado a ${sentTo}. Revisa también spam y abre el correo más reciente. Puedes corregir la dirección arriba.`,`Link sent to ${sentTo}. Check spam too and open the latest email. You can edit the address above.`) : mail.status === 'limited' ? t('Espera antes de solicitar otro enlace. Si ya recibiste uno, abre el más reciente.','Please wait before requesting another link. If one arrived, open the latest email.') : mail.status === 'error' ? t('No pudimos enviar el enlace. Comprueba tu correo y la conexión y vuelve a intentarlo.','We couldn’t send the link. Check your address and connection, then try again.') : ''}</p>
        <small>{t('Para vincular este avance, abre el enlace en este navegador. Se guarda en este dispositivo; no se sincroniza con otros.','To link this progress, open the email link in this browser. Progress stays on this device and does not sync to others.')}</small>
      </div>}
      <p>{offerReview
        ? t('Vuelve a intentar una pregunta que te costó. Primero trata de recordar la respuesta.','Try a question you missed. First, see if you can recall the answer.')
        : t('Tu plan de ciudadanía te sugiere la siguiente actividad y te indica cuánto tiempo lleva.','Your citizenship plan suggests your next activity and shows how long it takes.')}</p>
      {offerReview
        ? <button className="cta" onClick={startReview}>{t('Repasar una pregunta','Review a question')}</button>
        : <a className="cta" href={dailyCivicsPlan}>{t('Abrir mi plan de hoy','Open my daily plan')}</a>}
    </> : <>
      <p>{reviewing?t('Repaso','Review'):t('Práctica de civismo','Civics practice') + ' · ' + (index + 1) + ' / ' + questions.length}</p>
      {!user && !reviewing && <small>{t('Tres preguntas gratis. No necesitas registrarte.','Three free questions. No registration needed.')}</small>}
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
