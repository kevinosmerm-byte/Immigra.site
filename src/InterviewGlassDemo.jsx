import React,{useEffect,useRef,useState} from 'react';
import {speakAppText,stopAppSpeech} from '../modules/citizenship/src/speech';
import civics from '../modules/citizenship/src/data/uscis2025Civics.json';
import asylumText from '../modules/asylum/master-package/03_question_bank/question_bank.jsonl?raw';
import residency from '../modules/residency/data/questions.json';
import {glassQuestions,glassIndex,interviewRoutes,progressRoutes} from './interview-glass-bank.mjs';
import {freeStudyRoutes} from './home-study.mjs';
import {DemoIcon} from './InterviewDemo.jsx';
import './InterviewGlassDemo.css';
const banks={civics,asylum:asylumText.trim().split(/\r?\n/).map(line=>JSON.parse(line)),residency};
const questions=Object.fromEntries(['citizenship','asylum','residency'].map(key=>[key,glassQuestions(key,banks)]));
export default function InterviewGlassDemo({lang='es',onNavigate,onCategoryChange}){
 const es=lang==='es',t=(a,b)=>es?a:b;
 const [category,setCategory]=useState('asylum'),[index,setIndex]=useState(0),[speaking,setSpeaking]=useState(false),[error,setError]=useState(false);
 const generation=useRef(0),list=questions[category],question=list[index],text=question[es?'es':'en'];
 const stop=()=>{generation.current++;setSpeaking(false);void stopAppSpeech();};
 useEffect(()=>{generation.current++;setSpeaking(false);setError(false);void stopAppSpeech();return()=>{generation.current++;void stopAppSpeech();};},[category,index,lang]);
 useEffect(()=>{const hide=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);},[]);
 const read=async()=>{if(speaking){stop();return;}const token=++generation.current;setSpeaking(true);setError(false);const ok=await speakAppText(text,{language:es?'es':'en',requireLanguageVoice:true});if(token!==generation.current)return;setSpeaking(false);setError(!ok);};
 const move=delta=>{stop();setIndex(current=>glassIndex(current,delta,list.length));};
 const choose=value=>{stop();setCategory(value);setIndex(0);onCategoryChange?.(value);};
 const go=route=>{stop();onNavigate(route);};
 const titles={citizenship:t('Ciudadanía','Citizenship'),asylum:t('Entrevista de asilo','Asylum interview'),residency:t('Residencia','Residency')};
 return <section className="interview-glass-demo" id="ih-demo" tabIndex={-1} aria-label={t('Preguntas del banco de estudio','Study bank questions')}>
  <div className="stage">
   <div className="glass-atmosphere" aria-hidden="true"><div className="aura"/><div className="ribbon one"/><div className="ribbon two"/><div className="ribbon three"/><div className="pane-back"/><div className="pane-back second"/></div>
   <article className="demo" tabIndex={0} aria-label={t('Usa las flechas para cambiar de pregunta','Use arrow keys to change questions')} onKeyDown={event=>{if(event.target!==event.currentTarget)return;if(['ArrowRight','ArrowLeft'].includes(event.key)){event.preventDefault();move(event.key==='ArrowRight'?1:-1);}}}>
    <div className="top"><span className="mode"><span className="symbol" aria-hidden="true">✦</span>{titles[category]}</span><span className="count">{index+1} / {list.length}</span></div>
    <progress className="progress" value={index+1} max={list.length} aria-label={t('Avance por las preguntas','Question browsing progress')}/>
    <div className="question"><p lang={lang} aria-live="polite" aria-atomic="true">{text}</p><button className="round" type="button" onClick={read} aria-pressed={speaking} aria-label={speaking?t('Detener lectura','Stop reading'):t('Escuchar pregunta','Listen to question')}><DemoIcon name={speaking?'stop':'audio'}/></button></div>
    <div className="audio-area"><div className="bars" aria-hidden="true">{[13,26,16,35,24,13,28].map((height,i)=><i key={i} style={{'--height':height+'px'}}/>)}</div><button className="mic" type="button" onClick={()=>go(interviewRoutes[category])} aria-label={t('Abrir preparación de entrevista por voz; no inicia el micrófono','Open voice interview setup; microphone does not start')} title={t('Preparar entrevista por voz','Set up a voice interview')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/></svg></button><div className="bars" aria-hidden="true">{[15,29,40,20,32,12,23].map((height,i)=><i key={i} style={{'--height':height+'px'}}/>)}</div></div>
    <div className="footer-controls"><button className="round" type="button" disabled={index===0} onClick={()=>move(-1)} aria-label={t('Pregunta anterior','Previous question')}><DemoIcon name="previous"/></button><span className="sub">{t('El micrófono abre la preparación de entrevista','Microphone opens interview setup')}</span><button className="round" type="button" disabled={index===list.length-1} onClick={()=>move(1)} aria-label={t('Pregunta siguiente','Next question')}><DemoIcon name="next"/></button></div>
    <div className="status" role="status">{error?t('La lectura no está disponible en este dispositivo. Puedes seguir leyendo.','Reading aloud is unavailable on this device. You can keep reading.'):speaking?t('Leyendo pregunta…','Reading question…'):t('Sin grabación aquí · acceso y permisos en la entrevista','No recording here · access and permissions in interview setup')}</div>
   </article>
   <aside className="benefits" aria-label={t('Herramientas existentes','Existing tools')}><button className="benefit" type="button" onClick={()=>go(freeStudyRoutes[category])}><span className="glyph"><DemoIcon name="book"/></span><span>{t('Preguntas de estudio','Study questions')}</span></button><button className="benefit" type="button" onClick={()=>go(interviewRoutes[category])}><span className="glyph"><DemoIcon name="spark"/></span><span>{t('Práctica de entrevista','Interview practice')}</span></button><button className="benefit" type="button" onClick={()=>go(progressRoutes[category])}><span className="glyph"><DemoIcon name="chart"/></span><span>{category==='residency'?t('Práctica local','Local practice'):t('Tu avance e informes','Your progress and reports')}</span></button></aside>
  </div>
  <div className="selector" role="group" aria-label={t('Elegir tipo de entrevista','Choose interview type')}>{['citizenship','asylum','residency'].map(value=><button key={value} type="button" aria-pressed={category===value} onClick={()=>choose(value)}>{titles[value]}</button>)}</div>
 </section>;
}
