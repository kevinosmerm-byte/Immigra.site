import aosUiEn from './aos-ui.en.json';
import {aosQuestion,aosRoutesEn,aosTopic} from './aosEngine.mjs';
import RealtimeInterview from '../realtime/RealtimeInterview.jsx';
import React,{useEffect,useRef,useState} from 'react';
import {selectAosQuestions,aosRoutes,isUncertain} from './aosEngine.mjs';
import {authenticatedFetch} from '../../../shared/authentication/fetch.mjs';
import VoicePanel from '../voice/VoicePanel.jsx';
import './aos.css';
export default function AosPractice({onHome,onLegacy,active,lang='es'}){
 const t=text=>lang==='en'?(aosUiEn[text]||text):text;
 const routeLabels=lang==='en'?aosRoutesEn:aosRoutes;
 const [route,setRoute]=useState('MATRIMONIO'),[status,setStatus]=useState('unknown'),[age,setAge]=useState('unknown'),[marital,setMarital]=useState('unknown'),[count,setCount]=useState(12),[consent,setConsent]=useState(false),[ai,setAi]=useState(false);
 const [session,setSession]=useState(null),[index,setIndex]=useState(0),[draft,setDraft]=useState(''),[turns,setTurns]=useState([]),[followup,setFollowup]=useState(''),[review,setReview]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[finished,setFinished]=useState(false);
 const [beta,setBeta]=useState(false);
 const request=useRef(null),generation=useRef(0);
 useEffect(()=>()=>{generation.current++;request.current?.abort();},[]);
 useEffect(()=>{if(!active){generation.current++;request.current?.abort();setBusy(false);}},[active]);
 const base=session?.questions[index];const question=followup||(base?aosQuestion(base,lang):undefined);
 function start(e){e.preventDefault();if(!consent)return;if(ai){setBeta(true);return;}setSession({id:crypto.randomUUID(),route,status,age,marital,ai,questions:selectAosQuestions({route,count,petitionerStatus:status,age,marital})});setIndex(0);setTurns([]);setDraft('');setFollowup('');setReview(null);setFinished(false);setError('');}
 function reset(){generation.current++;request.current?.abort();setSession(null);setTurns([]);setDraft('');setFollowup('');setReview(null);setBusy(false);setError('');setFinished(false);}
 function advance(){setDraft('');setFollowup('');setReview(null);setError('');if(index+1>=session.questions.length)setFinished(true);else setIndex(i=>i+1);}
 async function respond(skip=false){
  if(busy||!active||(!skip&&!draft.trim()))return;
  const answer=skip?t("Omitida"):draft.trim();
  if(skip){setTurns(t=>[...t,{question,answer,skipped:true}]);advance();return;}
  if(!session.ai){setTurns(t=>[...t,{question,answer}]);setReview({observations:[],followup:'',local:true});return;}
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
 if(beta)return <RealtimeInterview lang={lang} practiceOptions={{petitionerStatus:status,age,marital,count}} relationshipType={route==='MATRIMONIO'?'marriage_husband_petitioner':route==='HIJO_A_PADRES'?'child_petitions_mother':'parent_petitions_child'} mode="personal" scenarioId={null} active={active} onBack={()=>setBeta(false)}/>;
 return <section className="aos-practice"><button className="aos-back" onClick={onHome}>{t("← Volver al inicio")}</button><header><p className="aos-eyebrow">{t("RESIDENCIA · AJUSTE DE ESTATUS")}</p><h1>{finished?t("Tu resumen de práctica"):session?t("Conversemos, una pregunta a la vez"):t("Practica tu entrevista familiar")}</h1><p>{t("Práctica educativa. No sustituye asesoría legal ni representa una entrevista oficial de USCIS.")}</p></header>
 {!session?<form className="aos-glass aos-setup" onSubmit={start}><div className="aos-heading"><img src="/images/home/residency-icon.webp" alt=""/><div><h2>{t("Configura tu práctica")}</h2><p>{t("300 preguntas educativas · Español e inglés")}</p></div></div>
 <div className="aos-sahara"><video src="/interviewer/listening.mp4" poster="/modules/citizenship/sarah.png" muted autoPlay loop playsInline preload="metadata" aria-label={t("Sahara, entrevistadora virtual")}/><div><h3>{t("Sahara · Tu entrevistadora")}</h3><p>{t("Practica hablando por micrófono o escribiendo.")}</p><button type="button" className="aos-primary" onClick={()=>setBeta(true)}>{t("Conversar con Sahara · Beta")}</button></div></div>
 <label>{t("¿Qué familiar presentó la petición?")}<select value={route} onChange={e=>{setRoute(e.target.value);setStatus(e.target.value==='HIJO_A_PADRES'?'citizen':'unknown');}}>{Object.entries(routeLabels).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
 <label>{t("Situación del peticionario")}<select value={status} onChange={e=>setStatus(e.target.value)}><option value="unknown">{t("No estoy seguro / necesito revisar")}</option><option value="citizen">{t("Ciudadano estadounidense")}</option><option value="resident">{t("Residente permanente")}</option></select></label>
 <label>{route==='HIJO_A_PADRES'?t("Edad del hijo o hija peticionario"):t("Edad de la persona beneficiaria")}<select value={age} onChange={e=>setAge(e.target.value)}><option value="unknown">{t("Prefiero revisar / no indicar")}</option><option value="under21">{t("Menor de 21 años")}</option><option value="21plus">{t("21 años o más")}</option></select></label>
 <label>{t("Estado civil de la persona beneficiaria")}<select value={marital} onChange={e=>setMarital(e.target.value)}><option value="unknown">{t("Prefiero revisar / no indicar")}</option><option value="single">{t("Soltero/a")}</option><option value="married">{t("Casado/a")}</option><option value="previous">{t("Divorciado/a o viudo/a")}</option></select></label>
 <label>{t("Duración")}<select value={count} onChange={e=>setCount(Number(e.target.value))}><option value={6}>{t("6 preguntas · Breve")}</option><option value={12}>{t("12 preguntas · Recomendada")}</option><option value={30}>{t("30 preguntas · Extendida")}</option><option value={100}>{t("Todas las preguntas de esta categoría")}</option></select></label>
 <p className="aos-note">{t("Las circunstancias orientan la práctica; no determinan una categoría legal ni elegibilidad. Puedes responder «No recuerdo», «No estoy seguro» o «Necesito revisar mis documentos».")}</p>
 <label className="aos-check"><input type="checkbox" checked={consent} required onChange={e=>setConsent(e.target.checked)}/>{t("Entiendo que es una simulación educativa. Mis respuestas se conservarán solo en esta pestaña.")}</label>
 <label className="aos-check"><input type="checkbox" checked={ai} onChange={e=>setAi(e.target.checked)}/>{t("Activar conversación con IA. Autorizo enviar a OpenAI cada respuesta revisada, la pregunta y el contexto de esta sesión para revisar claridad, comprensión y contexto. El proveedor aplica sus políticas de retención; esta app no guarda las respuestas permanentemente.")}</label>
 <button className="aos-primary" disabled={!consent}>{t("Comenzar práctica →")}</button><button type="button" className="aos-back" onClick={onLegacy}>{t("Abrir práctica anterior, escenarios y herramientas")}</button></form>:finished?<section className="aos-glass"><h2>{turns.filter(t=>!t.skipped).length} {t('respuestas practicadas')}</h2><p>{t("Observaciones educativas de claridad y contexto. No son conclusiones sobre credibilidad, fraude ni elegibilidad. Los turnos sin observaciones no implican aprobación.")}</p>{turns.map((turn,i)=><details key={i}><summary>{turn.question}</summary><p>{turn.answer}</p>{turn.observations?.map((o,j)=><p key={j}>{labels[o.kind]}: «{o.quote}»</p>)}</details>)}<button className="aos-primary" onClick={reset}>{t("Eliminar sesión y volver a empezar")}</button></section>:<section className="aos-glass aos-conversation"><p className="aos-eyebrow">{routeLabels[session.route]} · {index+1} / {session.questions.length}</p><progress value={index} max={session.questions.length}/><p>{aosTopic(base.bloque,lang)} · {aosTopic(base.dificultad,lang)}{followup?t(" · Aclaración"):''}</p><h2>{question}</h2>
 {!review?<><VoicePanel defaultEnabled question={{id:base.id+(followup?'-followup':''),question}} lang={lang} active={active&&!busy} draft={draft} onDraft={setDraft} sessionId={session.id}/><label>{t("Tu respuesta")}<textarea rows={4} maxLength={5000} value={draft} disabled={busy} onChange={e=>setDraft(e.target.value)}/></label><div className="aos-actions">{[t("No recuerdo"),t("No estoy seguro"),t("Necesito revisar mis documentos")].map(text=><button key={text} disabled={busy} onClick={()=>setDraft(text)}>{text}</button>)}</div><p className="aos-note">{t("Revisa el dictado antes de enviarlo. La aplicación no conserva grabaciones.")}</p><button className="aos-primary" disabled={busy||!draft.trim()||!active} onClick={()=>respond()}>{busy?t("Escuchando tu respuesta…"):t("Enviar respuesta")}</button><button className="aos-back" disabled={busy} onClick={()=>respond(true)}>{t("Omitir pregunta")}</button></>:<div aria-live="polite"><p>{review.local?t("Respuesta registrada en esta sesión."):t("Gracias. Revisemos lo que expresaste.")}</p>{review.observations.map((o,i)=><p key={i}><strong>{labels[o.kind]}</strong>: «{o.quote}»</p>)}{!review.local&&!review.observations.length&&<p>{t("No hay observaciones específicas para esta respuesta.")}</p>}<button className="aos-primary" onClick={next}>{review.followup?t("Continuar con una aclaración"):t("Continuar conversación →")}</button></div>}
 {error&&<div role="alert"><p>{error}</p><button onClick={()=>{setSession(s=>({...s,ai:false}));setError('');}}>{t("Continuar sin IA")}</button></div>}<div className="aos-actions"><button onClick={finish}>{t("Terminar y ver resumen")}</button><button onClick={reset}>{t("Eliminar sesión")}</button></div></section>}
 </section>;
}
