import React,{useEffect,useRef,useState} from 'react';
import {speakAppText,stopAppSpeech} from '../modules/citizenship/src/speech';
import {interviewSamples,sampleIndex} from './interview-samples.mjs';

export function DemoIcon({name}){
 const paths={audio:<><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></>,stop:<rect x="6" y="6" width="12" height="12" rx="2"/>,next:<path d="M4 12h16m-7-7 7 7-7 7"/>,previous:<path d="M20 12H4m7-7-7 7 7 7"/>,book:<><path d="M4 3h13l3 3v15H4Z"/><path d="M8 9h8M8 13h8M8 17h5"/></>,spark:<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>,chart:<path d="M5 20V10m7 10V4m7 16V7"/>,play:<path d="m8 5 12 7-12 7Z"/>};
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]||paths.book}</svg>;
}
export default function InterviewDemo({lang}){
 const t=(es,en)=>lang==='es'?es:en;
 const [route,setRoute]=useState('asylum'),[index,setIndex]=useState(0),[speaking,setSpeaking]=useState(false),[audioError,setAudioError]=useState(false);
 const [audioAvailable,setAudioAvailable]=useState(()=>typeof window!=='undefined'&&'speechSynthesis' in window&&'SpeechSynthesisUtterance' in window);
 const generation=useRef(0);
 const question=interviewSamples[route][index][lang==='es'?'es':'en'];
 const stop=()=>{generation.current++;setSpeaking(false);void stopAppSpeech();};
 useEffect(()=>{generation.current++;setSpeaking(false);setAudioError(false);void stopAppSpeech();return()=>{generation.current++;void stopAppSpeech();};},[route,index,lang]);
 useEffect(()=>{const hide=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);},[]);
 const read=async()=>{if(speaking){stop();return;}const token=++generation.current;setSpeaking(true);setAudioError(false);const ok=await speakAppText(question,{language:lang==='es'?'es':'en',requireLanguageVoice:true});if(token!==generation.current)return;setSpeaking(false);if(!ok){setAudioError(true);setAudioAvailable(false);}};
 const choose=value=>{stop();setRoute(value);setIndex(0);};
 const move=direction=>{stop();setIndex(current=>sampleIndex(current,direction));};
 return <section id="ih-demo" className="ih-glass-demo" tabIndex={-1} aria-label={t('Demostración de preguntas de práctica','Practice question demonstration')}>
  <div className="ih-glass-decoration" aria-hidden="true"><div className="ih-glass-layer ih-layer-one"/><div className="ih-glass-layer ih-layer-two"/><div className="ih-glass-layer ih-layer-three"/></div>
  <div className="ih-question-panel">
   <div className="ih-panel-top"><label><span className="ih-sample-label">{t('DEMO · PREGUNTAS DE MUESTRA','DEMO · SAMPLE QUESTIONS')}</span><select value={route} aria-label={t('Categoría de la demostración','Demonstration category')} onChange={event=>choose(event.target.value)}><option value="citizenship">{t('Ciudadanía','Citizenship')}</option><option value="asylum">{t('Entrevista de asilo','Asylum interview')}</option><option value="residency">{t('Residencia','Residency')}</option></select></label><div className="ih-sample-progress"><span>{index+1} / 3</span><progress value={index+1} max="3" aria-label={t('Pregunta de muestra','Sample question')}/></div></div>
   <div className="ih-sample-question" aria-live="polite" aria-atomic="true"><h2>{question}</h2></div>
   <div className="ih-sample-audio">{audioAvailable?<><span className="ih-static-wave" aria-hidden="true">{[8,16,25,18,32,20,12].map((height,i)=><i key={i} style={{height}}/>)}</span><button type="button" className="ih-audio-button" onClick={read} aria-pressed={speaking} aria-label={speaking?t('Detener lectura','Stop reading'):t('Escuchar pregunta','Listen to question')}><DemoIcon name={speaking?'stop':'audio'}/></button><span className="ih-static-wave" aria-hidden="true">{[12,20,32,18,25,16,8].map((height,i)=><i key={i} style={{height}}/>)}</span></>:<span className="ih-audio-unavailable">{t('Puedes leer la pregunta a tu ritmo.','Read the question at your own pace.')}</span>}</div>
   <div className="ih-sample-navigation"><button type="button" disabled={index===0} onClick={()=>move(-1)} aria-label={t('Pregunta anterior','Previous question')}><DemoIcon name="previous"/></button><small>{t('Muestra educativa · sin grabación','Educational sample · no recording')}</small><button type="button" disabled={index===2} onClick={()=>move(1)} aria-label={t('Pregunta siguiente','Next question')}><DemoIcon name="next"/></button></div>
   <p role="status" className="ih-audio-status">{audioError?t('La lectura no está disponible en este dispositivo.','Reading aloud is unavailable on this device.'):''}</p>
  </div>
  <div className="ih-glass-notes" aria-label={t('Herramientas de preparación','Preparation tools')}><div><DemoIcon name="book"/><span>{t('Preguntas de práctica','Practice questions')}</span></div><div><DemoIcon name="spark"/><span>{t('Estudia a tu ritmo','Study at your pace')}</span></div><div><DemoIcon name="chart"/><span>{t('Español e inglés','Spanish and English')}</span></div></div>
 </section>;
}
