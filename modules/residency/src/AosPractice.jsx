import ResidencyPracticeSetup from "./ResidencyPracticeSetup.jsx";
import {PremiumPracticeBoundary} from "../../citizenship/src/PremiumPracticeBoundary.jsx";
import {useAutomaticAdvance} from "../../citizenship/src/useAutomaticAdvance.js";
import {InterviewAdvanceControls} from "../../citizenship/src/InterviewAdvanceControls.jsx";
import {usePromotionAccess} from "../../citizenship/src/promotionAccessContext.js";
import {useAccount} from "../../citizenship/src/accountContext.js";
import {readQuestionMemory,rememberQuestion} from "../../../shared/interview-ui/question-memory.mjs";
import aosUiEn from './aos-ui.en.json';
import {aosQuestion,aosQuestions,aosRoutesEn,aosTopic} from './aosEngine.mjs';
import RealtimeInterview from '../realtime/RealtimeInterview.jsx';
import React,{useEffect,useRef,useState} from 'react';
import {selectAosQuestions,aosRoutes,isUncertain} from './aosEngine.mjs';
import {authenticatedFetch} from '../../../shared/authentication/fetch.mjs';
import VoicePanel from '../voice/VoicePanel.jsx';
import ResidencyCall from '../voice/ResidencyCall.jsx';
import './aos.css';
export default function AosPractice({onHome,onLegacy,active,lang='es'}){
 const {requestAiSession}=usePromotionAccess();const {session:account}=useAccount();
 const t=text=>lang==='en'?(aosUiEn[text]||text):text;
 const routeLabels=lang==='en'?aosRoutesEn:aosRoutes;
 const [route,setRoute]=useState('MATRIMONIO'),[status,setStatus]=useState('unknown'),[age,setAge]=useState('unknown'),[marital,setMarital]=useState('unknown'),[count,setCount]=useState(12),[consent,setConsent]=useState(false),[ai,setAi]=useState(false);
 const [session,setSession]=useState(null),[index,setIndex]=useState(0),[draft,setDraft]=useState(''),[turns,setTurns]=useState([]),[followup,setFollowup]=useState(''),[review,setReview]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[finished,setFinished]=useState(false);
 const [starting,setStarting]=useState(false),[startError,setStartError]=useState('');
 const [beta,setBeta]=useState(false),[interviewer,setInterviewer]=useState("sarah");
 const request=useRef(null),generation=useRef(0);
 useEffect(()=>()=>{generation.current++;request.current?.abort();},[]);
 useEffect(()=>{if(!active){generation.current++;request.current?.abort();setBusy(false);setStarting(false);}},[active]);
 const base=session?.questions[index];const question=followup||(base?aosQuestion(base,lang):undefined);
 async function start(e){e.preventDefault();if(!consent||starting)return;const token=generation.current;setStarting(true);setStartError('');try{await requestAiSession("realInterview",()=>{if(token===generation.current&&active)startApproved();},lang);}catch{if(token===generation.current)setStartError(lang==='es'?'No pudimos iniciar la práctica. Puedes volver a intentarlo.':'Could not start practice. You can try again.');}finally{if(token===generation.current)setStarting(false);}}
 function startApproved(){if(ai){setBeta(true);return;}setSession({id:crypto.randomUUID(),route,status,age,marital,ai,questions:pendingQuestions()});setIndex(0);setTurns([]);setDraft('');setFollowup('');setReview(null);setFinished(false);setError('');}
 function pendingQuestions(){const selected=selectAosQuestions({route,count:100,petitionerStatus:status,age,marital});const seen=new Set(readQuestionMemory(account?.user?.id,"residency:"+route+":local"));const pending=selected.filter(q=>!seen.has(q.id));return (pending.length?pending:selected).slice(0,count);}
 function reset(){generation.current++;request.current?.abort();setSession(null);setTurns([]);setDraft('');setFollowup('');setReview(null);setBusy(false);setError('');setFinished(false);}
 const automaticAdvance=useAutomaticAdvance({enabled:Boolean(review)&&!finished,turnKey:base?.id+":"+Boolean(followup),busy:busy||!active,onAdvance:()=>next()});
 function advance(){if(base)rememberQuestion(account?.user?.id,'residency:'+route+':local',base.id);setDraft('');setFollowup('');setReview(null);setError('');if(index+1>=session.questions.length)setFinished(true);else setIndex(i=>i+1);}
 async function respond(skip=false){
  if(busy||!active||(!skip&&!draft.trim()))return;
  const answer=skip?t("Omitida"):draft.trim();
  if(skip){setTurns(t=>[...t,{question,answer,skipped:true}]);advance();return;}
  if(!session.ai){setTurns(t=>[...t,{question,answer}]);advance();return;}
  const token=++generation.current;request.current=new AbortController();const timer=setTimeout(()=>request.current?.abort(),30000);setBusy(true);setError('');
  try{
   const r=await authenticatedFetch('/api/residency/conversation',{method:'POST',signal:request.current.signal,headers:{'content-type':'application/json'},body:JSON.stringify({question,answer,history:turns.filter(t=>!t.skipped).slice(-6).map(({question,answer})=>({question,answer})),allowFollowup:!followup&&!isUncertain(answer),consent:true})});
   if(token!==generation.current)return;
   if(!r.ok){setError(r.status===401?t("Inicia sesión en Mi cuenta para conversar con IA. Tu respuesta sigue aquí."):r.status===429?t("Alcanzaste el límite diario de evaluaciones. Puedes continuar sin IA."):t("La IA no pudo responder. Puedes reintentar o continuar sin evaluación."));return;}
   const result=await r.json();if(token!==generation.current)return;
   setTurns(t=>[...t,{question,answer,observations:result.observations,followup:!!followup}]);setReview(result);
  }catch{if(token===generation.current)setError(t("No se pudo conectar. Tu respuesta no se ha perdido."));}
  finally{clearTimeout(timer);if(token===generation.current)setBusy(false);}
 }
 function next(){if(review.followup){setFollowup(review.followup);setDraft('');setReview(null);}else advance();}
 function finish(){generation.current++;request.current?.abort();setBusy(false);setFinished(true);}
 const labels={clear:t("Detalle expresado con claridad"),clarify:t("Puedes aclarar esta expresión"),uncertain:t("Es válido no recordar"),context:t("Conviene aclarar el contexto")};
 if(session&&!finished&&!session.ai)return <PremiumPracticeBoundary feature="realInterview" language={lang} onBack={reset}><ResidencyCall avatar={interviewer} question={{id:base.id,question}} lang={lang} active={active} draft={draft} onDraft={setDraft} onSubmit={()=>respond()} onSkip={()=>respond(true)} onFinish={finish}/></PremiumPracticeBoundary>;
 if(beta)return <RealtimeInterview avatar={interviewer} lang={lang} practiceOptions={{petitionerStatus:status,age,marital,count}} relationshipType={route==='MATRIMONIO'?'marriage_husband_petitioner':route==='HIJO_A_PADRES'?'child_petitions_mother':'parent_petitions_child'} mode="personal" scenarioId={null} active={active} onBack={()=>setBeta(false)}/>;
 if(!session)return <ResidencyPracticeSetup lang={lang} interviewer={interviewer} onInterviewer={setInterviewer} route={route} onRoute={value=>{setRoute(value);setStatus(value==='HIJO_A_PADRES'?'citizen':'unknown');}} status={status} onStatus={setStatus} age={age} onAge={setAge} marital={marital} onMarital={setMarital} count={count} onCount={setCount} consent={consent} onConsent={setConsent} ai={ai} onAi={setAi} starting={starting} startError={startError} onStart={start} onHome={onHome} onLegacy={onLegacy}/>;
 const content=<section className="aos-practice"><button className="aos-back" onClick={onHome}>{t("← Volver al inicio")}</button><header><p className="aos-eyebrow">{t("RESIDENCIA · AJUSTE DE ESTATUS")}</p><h1>{finished?t("Tu resumen de práctica"):session?t("Conversemos, una pregunta a la vez"):t("Practica tu entrevista familiar")}</h1><p>{t("Práctica educativa. No sustituye asesoría legal ni representa una entrevista oficial de USCIS.")}</p></header>
 {finished?<section className="aos-glass"><h2>{turns.filter(t=>!t.skipped).length} {t('respuestas practicadas')}</h2><p>{t("Observaciones educativas de claridad y contexto. No son conclusiones sobre credibilidad, fraude ni elegibilidad. Los turnos sin observaciones no implican aprobación.")}</p>{turns.map((turn,i)=><details key={i}><summary>{turn.question}</summary><p>{turn.answer}</p>{turn.observations?.map((o,j)=><p key={j}>{labels[o.kind]}: «{o.quote}»</p>)}</details>)}<button className="aos-primary" onClick={reset}>{t("Eliminar sesión y volver a empezar")}</button></section>:<section className="aos-glass aos-conversation"><p className="aos-eyebrow">{routeLabels[session.route]} · {index+1} / {session.questions.length}</p><progress value={index} max={session.questions.length}/><p>{aosTopic(base.bloque,lang)} · {aosTopic(base.dificultad,lang)}{followup?t(" · Aclaración"):''}</p><h2>{question}</h2>
 {!review?<><VoicePanel defaultEnabled question={{id:base.id+(followup?'-followup':''),question}} lang={lang} active={active&&!busy} draft={draft} onDraft={setDraft} sessionId={session.id}/><label>{t("Tu respuesta")}<textarea rows={4} maxLength={5000} value={draft} disabled={busy} onChange={e=>setDraft(e.target.value)}/></label><div className="aos-actions">{[t("No recuerdo"),t("No estoy seguro"),t("Necesito revisar mis documentos")].map(text=><button key={text} disabled={busy} onClick={()=>setDraft(text)}>{text}</button>)}</div><p className="aos-note">{t("Revisa el dictado antes de enviarlo. La aplicación no conserva grabaciones.")}</p><button className="aos-primary" disabled={busy||!draft.trim()||!active} onClick={()=>respond()}>{busy?t("Escuchando tu respuesta…"):t("Enviar respuesta")}</button><button className="aos-back" disabled={busy} onClick={()=>respond(true)}>{t("Omitir pregunta")}</button></>:<div aria-live="polite"><p>{review.local?t("Respuesta registrada en esta sesión."):t("Gracias. Revisemos lo que expresaste.")}</p>{review.observations.map((o,i)=><p key={i}><strong>{labels[o.kind]}</strong>: «{o.quote}»</p>)}{!review.local&&!review.observations.length&&<p>{t("No hay observaciones específicas para esta respuesta.")}</p>}<InterviewAdvanceControls language={lang} paused={automaticAdvance.paused} onPause={automaticAdvance.pause} onContinue={next}/></div>}
 {error&&<div role="alert"><p>{error}</p><button onClick={()=>{setSession(s=>({...s,ai:false}));setError('');}}>{t("Continuar sin IA")}</button></div>}<div className="aos-actions"><button onClick={finish}>{t("Terminar y ver resumen")}</button><button onClick={reset}>{t("Eliminar sesión")}</button></div></section>}
 </section>;
 return session&&!finished?<PremiumPracticeBoundary feature="realInterview" language={lang} onBack={reset}>{content}</PremiumPracticeBoundary>:content;
}
