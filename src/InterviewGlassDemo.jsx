import React,{useEffect,useRef,useState} from 'react';
import {speakAppText,stopAppSpeech} from '../modules/citizenship/src/speech';
import civics from '../modules/citizenship/src/data/uscis2025Civics.json';
import {CivicsStudyCard} from '../modules/citizenship/src/CivicsStudyCard.jsx';
import {getCivicsVisual} from '../modules/citizenship/src/civicsVisuals.js';
import {glassIndex,interviewRoutes,progressRoutes} from './interview-glass-bank.mjs';
import {learningPreview} from './learning-preview.mjs';
import {homeStudyEntryRoutes} from './home-study.mjs';
import {DemoIcon} from './InterviewDemo.jsx';
import './InterviewGlassDemo.css';
import './HomeCivicsStudyCard.css';
const questions=Object.fromEntries(['citizenship','asylum','residency'].map(key=>[key,learningPreview(key,civics)]));
export default function InterviewGlassDemo({lang='es',category='citizenship',onNavigate}){
 const es=lang==='es',t=(a,b)=>es?a:b;
 const [index,setIndex]=useState(0),[speaking,setSpeaking]=useState(false),[error,setError]=useState(false),[revealed,setRevealed]=useState(false);
 const generation=useRef(0),list=questions[category],question=list[index],text=question[es?'es':'en'];
 const answer=question[es?'answerEs':'answerEn'],isCivics=question.kind==='civics';
 const touchRef=useRef(null),visual=isCivics?getCivicsVisual(Number(question.id.replace('civics-',''))):null;
 const stop=()=>{generation.current++;setSpeaking(false);void stopAppSpeech();};
 useEffect(()=>{generation.current++;setSpeaking(false);setError(false);setRevealed(false);void stopAppSpeech();return()=>{generation.current++;void stopAppSpeech();};},[category,index,lang]);
 useEffect(()=>{const hide=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);},[]);
 const read=async()=>{if(speaking){stop();return;}const token=++generation.current;setSpeaking(true);setError(false);let ok=await speakAppText(text,{language:lang,requireLanguageVoice:true});if(token!==generation.current)return;if(ok&&revealed){ok=await speakAppText(answer,{language:question.answerLanguage||lang,requireLanguageVoice:true});if(token!==generation.current)return;}setSpeaking(false);setError(!ok);};
 const move=delta=>{stop();setRevealed(false);setIndex(current=>glassIndex(current,delta,list.length));};
 const go=route=>{stop();onNavigate(route);};
 const titles={citizenship:t('Ciudadanía','Citizenship'),asylum:t('Entrevista de asilo','Asylum interview'),residency:t('Residencia','Residency')};
 return <section className="interview-glass-demo" id="ih-demo" tabIndex={-1} aria-label={isCivics?t('Tarjetas de las 128 preguntas de ciudadanía','128 citizenship study cards'):t('Descubre algo nuevo en tres preguntas','Learn something new in three questions')}>
  <div className="stage">
   <div className="glass-atmosphere" aria-hidden="true"><div className="aura"/><div className="ribbon one"/><div className="ribbon two"/><div className="ribbon three"/><div className="pane-back"/><div className="pane-back second"/></div>
   {isCivics?<div className="home-civics-study">
    <CivicsStudyCard language={lang} question={question.en} questionSpanish={question.es} answers={question.answers}
     image={visual.imagePath} imageAlt={visual.imageAlt} imageFit={visual.imageFit} imagePosition={visual.imagePosition}
     questionNumber={index+1} totalQuestions={list.length} answerVisible={revealed} audioEnabled={true} touchRef={touchRef}
     onToggleAnswer={()=>{stop();setRevealed(value=>!value);}} onPlayAudio={read} onNavigate={move}
     copy={{question:t('PREGUNTA','QUESTION'),answer:t('RESPUESTA','ANSWER'),reveal:t('Toca para ver la respuesta','Tap to reveal answer'),backToQuestion:t('Toca para volver a la pregunta','Tap to return to the question'),playAudio:speaking?t('Detener lectura','Stop reading'):t('Escuchar tarjeta','Listen to card')}}
     footer={({questionNumber,totalQuestions})=><div className="civics-card-controls">
      <div className="civics-deck-navigation">
       <button className="home-card-nav home-card-nav-previous" type="button" disabled={index===0} onClick={()=>move(-1)} aria-label={t('Pregunta anterior','Previous question')}><span aria-hidden="true">←</span> {t('Anterior','Previous')}</button>
       <div className="civics-readable-stats" aria-live="polite"><span><strong>{questionNumber} / {totalQuestions}</strong><em>{t('Tarjeta actual','Current card')}</em></span></div>
       <button className="home-card-nav home-card-nav-next" type="button" disabled={index===list.length-1} onClick={()=>move(1)} aria-label={t('Pregunta siguiente','Next question')}>{t('Siguiente','Next')} <span aria-hidden="true">→</span></button>
      </div>
      <div className="status" role="status">{error?t('La lectura no está disponible en este dispositivo. Puedes seguir leyendo.','Reading aloud is unavailable on this device. You can keep reading.'):speaking?t('Leyendo…','Reading…'):t('128 preguntas de ciudadanía · USCIS','128 citizenship questions · USCIS')}</div>
     </div>}/>
   </div>:<article className="demo" tabIndex={0} aria-label={t('Usa las flechas para cambiar de pregunta','Use arrow keys to change questions')} onKeyDown={event=>{if(event.target!==event.currentTarget)return;if(['ArrowRight','ArrowLeft'].includes(event.key)){event.preventDefault();move(event.key==='ArrowRight'?1:-1);}}}>
    <div className="top"><span className="mode"><span className="symbol" aria-hidden="true">✦</span>{titles[category]}</span><span className="count">{index+1} / {list.length}</span></div>
    <progress className="progress" value={index+1} max={list.length} aria-label={t('Avance por las preguntas','Question browsing progress')}/>
    <div className="question"><p lang={lang} aria-live="polite" aria-atomic="true">{text}</p><button className="round" type="button" onClick={read} aria-pressed={speaking} aria-label={speaking?t('Detener lectura','Stop reading'):revealed?t('Escuchar pregunta y explicación','Listen to question and explanation'):t('Escuchar pregunta','Listen to question')}><DemoIcon name={speaking?'stop':'audio'}/></button></div>
    <div className="learning-explanation" id="ih-learning-explanation" hidden={!revealed} role="region" aria-label={isCivics?t('Respuesta','Answer'):t('Explicación','Explanation')} lang={lang}>
     <p lang={question.answerLanguage||lang}>{answer}</p>
     <small>{isCivics?t('Respuestas oficiales en inglés. La pregunta en español es una traducción de apoyo.','Official answers in English. Spanish questions are supporting translations.'):question.kind==='communication'?t('Ejercicio de comunicación de IMMIGRA. No es una respuesta para tu caso.','IMMIGRA communication exercise. This is not an answer for your case.'):t('Vocabulario de estudio de IMMIGRA.','IMMIGRA study vocabulary.')}</small>
     {question.source&&<a href={question.currentAnswerSource||question.source} target="_blank" rel="noopener noreferrer">{t('Consultar fuente oficial','View official source')}</a>}
    </div>
    <div className="audio-area"><button className="mic learning-reveal" type="button" onClick={()=>{stop();setRevealed(value=>!value);}} aria-expanded={revealed} aria-controls="ih-learning-explanation">{isCivics?(revealed?t('Volver a la pregunta','Back to the question'):t('Ver respuesta','Show answer')):(revealed?t('Volver a pensar la respuesta','Think about the answer again'):t('Descubrir la explicación','Discover the explanation'))}</button></div>
    <div className="footer-controls"><button className="round" type="button" disabled={index===0} onClick={()=>move(-1)} aria-label={t('Pregunta anterior','Previous question')}><DemoIcon name="previous"/></button><span className="sub">{t('Piensa, descubre y sigue aprendiendo','Think, discover and keep learning')}</span><button className="round" type="button" disabled={index===list.length-1} onClick={()=>move(1)} aria-label={t('Pregunta siguiente','Next question')}><DemoIcon name="next"/></button></div>
    <div className="status" role="status">{error?t('La lectura no está disponible en este dispositivo. Puedes seguir leyendo.','Reading aloud is unavailable on this device. You can keep reading.'):speaking?t('Leyendo…','Reading…'):isCivics?t('128 preguntas de ciudadanía · USCIS','128 citizenship questions · USCIS'):t('Tres temas para aprender · sin datos personales','Three learning topics · no personal details')}</div>
   </article>}
   {!isCivics&&<aside className="benefits" aria-label={t('Herramientas existentes','Existing tools')}><button className="benefit" type="button" onClick={()=>go(homeStudyEntryRoutes[category])}><span className="glyph"><DemoIcon name="book"/></span><span>{t('Seguir estudiando','Keep studying')}<small>{titles[category]}</small></span></button><button className="benefit" type="button" onClick={()=>go(interviewRoutes[category])}><span className="glyph"><DemoIcon name="spark"/></span><span>{t('Práctica de entrevista','Interview practice')}<small>{titles[category]}</small></span></button><button className="benefit" type="button" onClick={()=>go(progressRoutes[category])}><span className="glyph"><DemoIcon name="chart"/></span><span>{category==='residency'?t('Práctica local','Local practice'):t('Tu avance e informes','Your progress and reports')}<small>{titles[category]}</small></span></button></aside>}
  </div>
 </section>;
}
