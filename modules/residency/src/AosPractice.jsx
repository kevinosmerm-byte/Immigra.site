import React,{useEffect,useRef,useState} from 'react';
import {selectAosQuestions,aosRoutes,isUncertain} from './aosEngine.mjs';
import {authenticatedFetch} from '../../../shared/authentication/fetch.mjs';
import VoicePanel from '../voice/VoicePanel.jsx';
import './aos.css';
export default function AosPractice({onHome,onLegacy,active}){
 const [route,setRoute]=useState('MATRIMONIO'),[status,setStatus]=useState('unknown'),[age,setAge]=useState('unknown'),[marital,setMarital]=useState('unknown'),[count,setCount]=useState(12),[consent,setConsent]=useState(false),[ai,setAi]=useState(false);
 const [session,setSession]=useState(null),[index,setIndex]=useState(0),[draft,setDraft]=useState(''),[turns,setTurns]=useState([]),[followup,setFollowup]=useState(''),[review,setReview]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[finished,setFinished]=useState(false);
 const request=useRef(null),generation=useRef(0);
 useEffect(()=>()=>{generation.current++;request.current?.abort();},[]);
 useEffect(()=>{if(!active){generation.current++;request.current?.abort();setBusy(false);}},[active]);
 const base=session?.questions[index];const question=followup||base?.pregunta_es;
 function start(e){e.preventDefault();if(!consent)return;setSession({id:crypto.randomUUID(),route,status,age,marital,ai,questions:selectAosQuestions({route,count,petitionerStatus:status,age,marital})});setIndex(0);setTurns([]);setDraft('');setFollowup('');setReview(null);setFinished(false);setError('');}
 function reset(){generation.current++;request.current?.abort();setSession(null);setTurns([]);setDraft('');setFollowup('');setReview(null);setBusy(false);setError('');setFinished(false);}
 function advance(){setDraft('');setFollowup('');setReview(null);setError('');if(index+1>=session.questions.length)setFinished(true);else setIndex(i=>i+1);}
 async function respond(skip=false){
  if(busy||!active||(!skip&&!draft.trim()))return;
  const answer=skip?'Omitida':draft.trim();
  if(skip){setTurns(t=>[...t,{question,answer,skipped:true}]);advance();return;}
  if(!session.ai){setTurns(t=>[...t,{question,answer}]);setReview({observations:[],followup:'',local:true});return;}
  const token=++generation.current;request.current=new AbortController();const timer=setTimeout(()=>request.current?.abort(),30000);setBusy(true);setError('');
  try{
   const r=await authenticatedFetch('/api/residency/conversation',{method:'POST',signal:request.current.signal,headers:{'content-type':'application/json'},body:JSON.stringify({question,answer,history:turns.filter(t=>!t.skipped).slice(-6).map(({question,answer})=>({question,answer})),allowFollowup:!followup&&!isUncertain(answer),consent:true})});
   if(token!==generation.current)return;
   if(!r.ok){setError(r.status===401?'Inicia sesión en Mi cuenta para conversar con IA. Tu respuesta sigue aquí.':r.status===429?'Alcanzaste el límite diario de evaluaciones. Puedes continuar sin IA.':'La IA no pudo responder. Puedes reintentar o continuar sin evaluación.');return;}
   const result=await r.json();if(token!==generation.current)return;
   setTurns(t=>[...t,{question,answer,observations:result.observations,followup:!!followup}]);setReview(result);
  }catch{if(token===generation.current)setError('No se pudo conectar. Tu respuesta no se ha perdido.');}
  finally{clearTimeout(timer);if(token===generation.current)setBusy(false);}
 }
 function next(){if(review.followup){setFollowup(review.followup);setDraft('');setReview(null);}else advance();}
 function finish(){generation.current++;request.current?.abort();setBusy(false);setFinished(true);}
 const labels={clear:'Detalle expresado con claridad',clarify:'Puedes aclarar esta expresión',uncertain:'Es válido no recordar',context:'Conviene aclarar el contexto'};
 return <section className="aos-practice"><button className="aos-back" onClick={onHome}>← Volver al inicio</button><header><p className="aos-eyebrow">RESIDENCIA · AJUSTE DE ESTATUS</p><h1>{finished?'Tu resumen de práctica':session?'Conversemos, una pregunta a la vez':'Practica tu entrevista familiar'}</h1><p>Práctica educativa. No sustituye asesoría legal ni representa una entrevista oficial de USCIS.</p></header>
 {!session?<form className="aos-glass aos-setup" onSubmit={start}><div className="aos-heading"><img src="/images/home/residency-icon.webp" alt=""/><div><h2>Configura tu práctica</h2><p>300 preguntas educativas · Banco original en español</p></div></div>
 <label>¿Qué familiar presentó la petición?<select value={route} onChange={e=>{setRoute(e.target.value);setStatus(e.target.value==='HIJO_A_PADRES'?'citizen':'unknown');}}>{Object.entries(aosRoutes).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
 <label>Situación del peticionario<select value={status} onChange={e=>setStatus(e.target.value)}><option value="unknown">No estoy seguro / necesito revisar</option><option value="citizen">Ciudadano estadounidense</option><option value="resident">Residente permanente</option></select></label>
 <label>{route==='HIJO_A_PADRES'?'Edad del hijo o hija peticionario':'Edad de la persona beneficiaria'}<select value={age} onChange={e=>setAge(e.target.value)}><option value="unknown">Prefiero revisar / no indicar</option><option value="under21">Menor de 21 años</option><option value="21plus">21 años o más</option></select></label>
 <label>Estado civil de la persona beneficiaria<select value={marital} onChange={e=>setMarital(e.target.value)}><option value="unknown">Prefiero revisar / no indicar</option><option value="single">Soltero/a</option><option value="married">Casado/a</option><option value="previous">Divorciado/a o viudo/a</option></select></label>
 <label>Duración<select value={count} onChange={e=>setCount(Number(e.target.value))}><option value={6}>6 preguntas · Breve</option><option value={12}>12 preguntas · Recomendada</option><option value={30}>30 preguntas · Extendida</option><option value={100}>Todas las preguntas de esta categoría</option></select></label>
 <p className="aos-note">Las circunstancias orientan la práctica; no determinan una categoría legal ni elegibilidad. Puedes responder «No recuerdo», «No estoy seguro» o «Necesito revisar mis documentos».</p>
 <label className="aos-check"><input type="checkbox" checked={consent} required onChange={e=>setConsent(e.target.checked)}/>Entiendo que es una simulación educativa. Mis respuestas se conservarán solo en esta pestaña.</label>
 <label className="aos-check"><input type="checkbox" checked={ai} onChange={e=>setAi(e.target.checked)}/>Activar conversación con IA. Autorizo enviar a OpenAI cada respuesta revisada, la pregunta y hasta seis turnos anteriores para revisar claridad, comprensión y contexto. Requiere iniciar sesión. El proveedor aplica sus políticas de retención; esta app no guarda las respuestas permanentemente.</label>
 <button className="aos-primary" disabled={!consent}>Comenzar práctica →</button><button type="button" className="aos-back" onClick={onLegacy}>Abrir práctica anterior, escenarios y herramientas</button></form>:finished?<section className="aos-glass"><h2>{turns.filter(t=>!t.skipped).length} respuestas practicadas</h2><p>Observaciones educativas de claridad y contexto. No son conclusiones sobre credibilidad, fraude ni elegibilidad. Los turnos sin observaciones no implican aprobación.</p>{turns.map((turn,i)=><details key={i}><summary>{turn.question}</summary><p>{turn.answer}</p>{turn.observations?.map((o,j)=><p key={j}>{labels[o.kind]}: «{o.quote}»</p>)}</details>)}<button className="aos-primary" onClick={reset}>Eliminar sesión y volver a empezar</button></section>:<section className="aos-glass aos-conversation"><p className="aos-eyebrow">{aosRoutes[session.route]} · {index+1} / {session.questions.length}</p><progress value={index} max={session.questions.length}/><p>{base.bloque} · {base.dificultad}{followup?' · Aclaración':''}</p><h2>{question}</h2>
 {!review?<><VoicePanel question={{id:base.id+(followup?'-followup':''),question}} lang="es" active={active&&!busy} draft={draft} onDraft={setDraft} sessionId={session.id}/><label>Tu respuesta<textarea rows={4} maxLength={5000} value={draft} disabled={busy} onChange={e=>setDraft(e.target.value)}/></label><div className="aos-actions">{['No recuerdo','No estoy seguro','Necesito revisar mis documentos'].map(text=><button key={text} disabled={busy} onClick={()=>setDraft(text)}>{text}</button>)}</div><p className="aos-note">Revisa el dictado antes de enviarlo. La aplicación no conserva grabaciones.</p><button className="aos-primary" disabled={busy||!draft.trim()||!active} onClick={()=>respond()}>{busy?'Escuchando tu respuesta…':'Enviar respuesta'}</button><button className="aos-back" disabled={busy} onClick={()=>respond(true)}>Omitir pregunta</button></>:<div aria-live="polite"><p>{review.local?'Respuesta registrada en esta sesión.':'Gracias. Revisemos lo que expresaste.'}</p>{review.observations.map((o,i)=><p key={i}><strong>{labels[o.kind]}</strong>: «{o.quote}»</p>)}{!review.local&&!review.observations.length&&<p>No hay observaciones específicas para esta respuesta.</p>}<button className="aos-primary" onClick={next}>{review.followup?'Continuar con una aclaración':'Continuar conversación →'}</button></div>}
 {error&&<div role="alert"><p>{error}</p><button onClick={()=>{setSession(s=>({...s,ai:false}));setError('');}}>Continuar sin IA</button></div>}<div className="aos-actions"><button onClick={finish}>Terminar y ver resumen</button><button onClick={reset}>Eliminar sesión</button></div></section>}
 </section>;
}
