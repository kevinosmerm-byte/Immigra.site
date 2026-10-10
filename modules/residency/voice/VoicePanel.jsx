import React,{useEffect,useRef,useState} from 'react';
import {createVoiceController,speechSupport,videoForState} from './voiceAdapter.mjs';
import './voice.css';
const videoUrls={listening:import.meta.env.BASE_URL+'interviewer/listening.mp4',speaking:import.meta.env.BASE_URL+'interviewer/speaking.mp4'};
export default function VoicePanel({question,lang,active,draft,onDraft,sessionId,defaultEnabled=false}){
 const t=(es,en)=>lang==='es'?es:en;
 const [enabled,setEnabled]=useState(defaultEnabled),[consent,setConsent]=useState(false),[state,setState]=useState('idle'),[error,setError]=useState(''),[interim,setInterim]=useState(''),[muted,setMuted]=useState(false),[missing,setMissing]=useState({}),[reduced,setReduced]=useState(false);
 const controller=useRef(null),draftRef=useRef(draft),changeRef=useRef(onDraft),baseRef=useRef('');draftRef.current=draft;changeRef.current=onDraft;
 const support=speechSupport();const videoState=videoForState(state);const videoRef=useRef(null);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 useEffect(()=>{
  const c=createVoiceController({onState:setState,onError:setError,onInterim:setInterim,onTranscript:text=>changeRef.current([baseRef.current,text].filter(Boolean).join(' ').slice(0,5000))});controller.current=c;
  const visibility=()=>{if(document.hidden)c.cancel();};document.addEventListener('visibilitychange',visibility);
  return()=>{document.removeEventListener('visibilitychange',visibility);c.dispose();if(controller.current===c)controller.current=null;};
 },[question.id,lang,active,sessionId]);
 useEffect(()=>{setError('');setInterim('');},[question.id,lang,active]);
 useEffect(()=>{if(!active||!enabled)controller.current?.cancel();},[active,enabled]);
 useEffect(()=>{if(videoRef.current){if(!active||reduced)videoRef.current.pause();else videoRef.current.play().catch(()=>setMissing(old=>({...old,[videoState]:true})));}},[active,reduced,videoState,enabled]);
 function listen(){if(!active)return;setError('');baseRef.current=draftRef.current;controller.current?.listen({locale:lang,consent});}
 function speak(){if(!active||muted)return;setError('');controller.current?.speak(question.question,lang);}
 const errors={
 'female-voice-unavailable':t('No hay una voz femenina reconocida disponible para este idioma. Instala una voz femenina en el dispositivo y vuelve a intentar. Puedes continuar escribiendo.','No recognized feminine voice is available for this language. Install a feminine voice on your device and try again. You can continue typing.'),
 'consent-required':t('Acepta primero el aviso de voz.','Accept the voice notice first.'),
 'insecure-context':t('El micrófono requiere HTTPS o localhost. Puedes continuar escribiendo.','The microphone requires HTTPS or localhost. You can keep typing.'),
 'recognition-unavailable':t('Este navegador no ofrece reconocimiento de voz. Continúa en modo escrito.','This browser does not offer speech recognition. Continue in text mode.'),
 'not-allowed':t('Permiso de micrófono denegado. Puedes habilitarlo en el navegador o seguir escribiendo.','Microphone permission denied. You can enable it in the browser or keep typing.'),
 'service-not-allowed':t('El servicio de reconocimiento no está permitido. Continúa escribiendo.','The recognition service is not allowed. Keep typing.'),
 'audio-capture':t('No se encontró un micrófono disponible.','No available microphone was found.'),
 'network':t('El reconocimiento no pudo conectarse. Reintenta o continúa escribiendo.','Recognition could not connect. Retry or keep typing.'),
 'no-speech':t('No se recibió una transcripción. Puedes reintentar.','No transcript was received. You can retry.'),
 'tts-unavailable':t('La lectura en voz no está disponible en este navegador.','Speech playback is unavailable in this browser.'),
 'tts-error':t('No se pudo leer la pregunta. El texto sigue disponible.','The question could not be read aloud. The text remains available.')};
 const labels={loading:t('Buscando voz femenina','Finding feminine voice'),idle:t('En espera','Ready'),requesting:t('Solicitando micrófono','Requesting microphone'),listening:t('Escuchando','Listening'),processing:t('Terminando dictado','Finishing dictation'),speaking:t('Leyendo pregunta','Reading question'),error:t('Requiere atención','Needs attention')};
 return <section className="voice-panel" aria-label={t('Voz experimental','Experimental voice')}>
 <button type="button" className="res-secondary" aria-expanded={enabled} onClick={()=>setEnabled(v=>!v)}>{enabled?t('Cerrar controles de voz','Close voice controls'):t('Abrir modo voz','Open voice mode')}</button>
 {enabled&&<><div className="voice-top"><h3>{t('Sahara · voz femenina','Sahara · feminine voice')}</h3><span role="status">{labels[state]||labels.idle}</span></div><div className="voice-stage">
 {!missing[videoState]&&!reduced?<video key={videoState} ref={videoRef} src={videoUrls[videoState]} muted loop playsInline autoPlay={active} onError={()=>setMissing(old=>({...old,[videoState]:true}))} aria-label={t('Video decorativo del entrevistador','Decorative interviewer video')}/>:<div className="voice-avatar"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="23" r="11"/><path d="M12 57c0-22 40-22 40 0"/></svg><strong>{t('Práctica guiada','Guided practice')}</strong><small>{t('Avatar de reserva','Fallback avatar')}</small></div>}
 <p className="voice-caption">{question.question}</p></div>
 <p className="voice-notice">{t('Voz experimental por turnos. El navegador puede enviar audio a servicios externos para transcribirlo. No uses datos sensibles. Esta aplicación no graba ni guarda audio.','Experimental voice in turns. Your browser may send audio to external services for transcription. Do not use sensitive data. This app does not record or store audio.')}</p>
 <label className="res-consent"><input type="checkbox" checked={consent} onChange={e=>{setConsent(e.target.checked);if(!e.target.checked)controller.current?.cancel();}}/><span>{t('Entiendo el procesamiento externo posible y autorizo activar el micrófono al pulsar Dictar.','I understand possible external processing and authorize microphone activation when I press Dictate.')}</span></label>
 {!support.recognition&&<p className="voice-notice">{errors['recognition-unavailable']}</p>}
 <div className="res-actions"><button type="button" className="res-secondary" onClick={speak} disabled={!active||muted||!support.synthesis}>{t('Leer / repetir pregunta','Read / repeat question')}</button>
 {['listening','requesting','processing'].includes(state)?<button type="button" className="res-primary" onClick={()=>controller.current?.stopListening()}>{t('Detener dictado','Stop dictation')}</button>:<button type="button" className="res-primary" disabled={!active||!consent||!support.recognition||!support.secure} onClick={listen}>{state==='speaking'?t('Interrumpir y dictar','Interrupt and dictate'):t('Dictar respuesta','Dictate answer')}</button>}
 <button type="button" className="res-secondary" onClick={()=>{setMuted(v=>!v);if(state==='speaking')controller.current?.cancel();}}>{muted?t('Activar lectura','Unmute reading'):t('Silenciar lectura','Mute reading')}</button>
 <button type="button" className="res-secondary" onClick={()=>controller.current?.cancel()}>{t('Pausar voz','Pause voice')}</button></div>
 {error&&<p role="alert" className="res-error">{errors[error]||t('La voz no está disponible ahora. Reintenta o continúa escribiendo.','Voice is unavailable right now. Retry or keep typing.')}</p>}
 <p className="voice-transcript" role="status">{interim?t('Transcripción provisional: ','Interim transcript: ')+interim:t('El dictado se añade al cuadro de respuesta. Revísalo antes de pulsar Continuar.','Dictation is added to the answer box. Review it before pressing Continue.')}</p>
 <p className="res-small">{t('Los videos son decorativos, sin sincronización labial. Hablar y escuchar son acciones separadas.','Videos are decorative, without lip synchronization. Speaking and listening are separate actions.')}</p></>}
 </section>;
}
