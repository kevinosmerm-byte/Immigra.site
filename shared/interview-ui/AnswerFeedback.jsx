import React,{useEffect,useRef,useState} from 'react';
import {authenticatedFetch} from '../authentication/fetch.mjs';
import './answer-feedback.css';
export default function AnswerFeedback({module,question,answer,lang='es',domain='personal',disabled=false}){
 const es=lang==='es',t=(a,b)=>es?a:b;
 const [consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[result,setResult]=useState(null),[error,setError]=useState('');
 const generation=useRef(0),controller=useRef(null);
 useEffect(()=>{generation.current++;controller.current?.abort();setBusy(false);setResult(null);setError('');setConsent(false);return()=>{generation.current++;controller.current?.abort();};},[module,question,answer]);
 async function review(){
  if(busy||disabled||!consent||!answer?.trim())return;
  const current=++generation.current;controller.current=new AbortController();
  const timeout=setTimeout(()=>controller.current?.abort(),35000);
  setBusy(true);setError('');setResult(null);
  try{
   const response=await authenticatedFetch('/api/interview/feedback',{method:'POST',headers:{'content-type':'application/json'},signal:controller.current.signal,body:JSON.stringify({module,question,text:answer,domain,language:es?'es':'en',task:'interview_feedback',source_id:'practice-answer',consent:true,consent_version:'interview-feedback-v1'})});
   if(current!==generation.current)return;
   if(!response.ok){setError(response.status===401?t('Inicia sesión en Mi cuenta para evaluar tu respuesta.','Sign in to your account to review your answer.'):response.status===429?t('Alcanzaste las 30 evaluaciones diarias. Puedes seguir practicando y volver a evaluar mañana.','You reached the 30 daily reviews. Keep practicing and review again tomorrow.'):t('No se pudo completar la evaluación. Tu respuesta sigue aquí; vuelve a intentarlo.','The review could not be completed. Your answer is still here; please retry.'));return;}
   const data=await response.json();
   if(!Array.isArray(data.observations)||data.observations.some(o=>!answer.includes(o.quote)||!['clear_detail','uncertainty','needs_clarification'].includes(o.kind)))throw Error('Invalid feedback');
   if(current===generation.current)setResult(data.observations);
  }catch{if(current===generation.current)setError(t('No se pudo conectar con la evaluación. Inténtalo de nuevo.','Could not connect to the review service. Please retry.'));}
  finally{clearTimeout(timeout);if(current===generation.current)setBusy(false);}
 }
 return <section className="answer-feedback" aria-label={t('Evaluación de respuesta','Answer review')}>
  <label><input type="checkbox" checked={consent} disabled={busy||disabled} onChange={e=>setConsent(e.target.checked)}/>{t('Autorizo enviar esta pregunta y respuesta a OpenAI para revisar su claridad.','I authorize sending this question and answer to OpenAI to review clarity.')}</label>
  <button type="button" onClick={review} disabled={disabled||busy||!consent||!answer?.trim()}>{busy?t('Evaluando…','Reviewing…'):t('Evaluar respuesta con IA','Review answer with AI')}</button>
  <div role="status">{error}{result&&<><p>{t('Evaluación de claridad completada. No evalúa elegibilidad ni aprobación.','Clarity review completed. This does not assess eligibility or approval.')}</p>{result.length?result.map((o,i)=><p key={i}><strong>{o.kind==='clear_detail'?t('Detalle expresado','Stated detail'):o.kind==='uncertainty'?t('Incertidumbre expresada: es válido no recordar','Acknowledged uncertainty: it is valid not to remember'):t('Referencia que puedes aclarar','Reference you may clarify')}</strong>: “{o.quote}”</p>):<p>{t('No se identificaron observaciones específicas en esta respuesta.','No specific observations were identified in this answer.')}</p>}</>}</div>
 </section>;
}
