import {interviewerLabel} from "../../../shared/interview-ui/interviewer-media.mjs";
import React,{useEffect,useRef,useState} from 'react';
import CallView from '../../../shared/interview-ui/CallView.jsx';
import {createVoiceController} from './voiceAdapter.mjs';

export default function ResidencyCall({avatar="sarah",question,lang,active,draft,onDraft,onSubmit,onSkip,onFinish}){
 const t=(es,en)=>lang==='es'?es:en;
 const [state,setState]=useState('idle'),[paused,setPaused]=useState(false),[captions,setCaptions]=useState(true),[consent,setConsent]=useState(false),[error,setError]=useState('');
 const controller=useRef(null),change=useRef(onDraft);change.current=onDraft;
 useEffect(()=>{
  const voice=createVoiceController({avatar,onState:setState,onTranscript:text=>change.current(text),onError:code=>setError(code==='consent-required'?t('Acepta el aviso de voz en Escribir antes de activar el micrófono.','Accept the voice notice under Type before enabling the microphone.'):t('La voz no está disponible. Puedes reintentar o escribir tu respuesta.','Voice is unavailable. Retry or type your answer.'))});
  controller.current=voice;setError('');
  return()=>voice.dispose();
 },[question.id,lang,avatar]);
 useEffect(()=>{if(!active)controller.current?.cancel();},[active]);
 const suspend=()=>{controller.current?.cancel();setPaused(true);};
 const listening=['listening','requesting','processing'].includes(state);
 if(!active)return null;
 return <CallView moduleId="residency" lang={lang} interviewerName={interviewerLabel(avatar)} state={paused?'paused':state==='speaking'?'speaking':state==='processing'?'processing':'listening'} muted={!listening} captions={[{who:'ai',text:question.question},...(draft?[{who:'user',text:draft}]:[])]} showCaptions={captions} onCaptions={()=>setCaptions(v=>!v)} onMic={()=>{setError('');if(listening)controller.current?.stopListening();else controller.current?.listen({locale:lang,consent});}} onRepeat={()=>{setError('');controller.current?.speak(question.question,lang);}} onPause={()=>paused?setPaused(false):suspend()} onSuspend={suspend} onFinish={()=>{controller.current?.cancel();onFinish();}} onSkip={()=>{controller.current?.cancel();onSkip();}} error={error}>
  <p>{t('El navegador puede enviar audio a servicios externos para transcribirlo. La app no guarda grabaciones.','Your browser may send audio to external services for transcription. The app does not store recordings.')}</p>
  <label><input type="checkbox" checked={consent} onChange={e=>{setConsent(e.target.checked);if(!e.target.checked)controller.current?.cancel();}}/>{t('Autorizo el dictado al pulsar el micrófono.','I authorize dictation when I press the microphone.')}</label>
  <form className={draft?'has-reviewed-answer':''} onSubmit={e=>{e.preventDefault();controller.current?.cancel();onSubmit();}}>
   <input aria-label={t('Tu respuesta','Your answer')} value={draft} onChange={e=>onDraft(e.target.value)} maxLength={5000} disabled={paused||listening}/>
   <button disabled={paused||listening||!draft.trim()}>{t('Enviar respuesta','Send answer')}</button>
  </form>
 </CallView>;
}
