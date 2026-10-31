import React,{useEffect,useRef,useState} from 'react';
import {messageLanguages,studyMessages,messageCycleSeconds} from './study-encouragement.mjs';
import './StudyMessagesRibbon.css';
function MessageCard({message,duplicate=false}){const language=messageLanguages[message.language];return <article className="study-message-card" lang={message.language} tabIndex={duplicate?undefined:0}><header><span className="study-message-drop" aria-hidden="true">✦</span><strong>IMMIGRA</strong><span className="study-message-language"><span aria-hidden="true">{language.flag}</span> {language.label}</span></header><p>{message.text}</p></article>;}
export default function StudyMessagesRibbon({lang='es'}){
 const es=lang==='es',group=useRef(null),windowRef=useRef(null),[paused,setPaused]=useState(false),[seconds,setSeconds]=useState(600);
 useEffect(()=>{const measure=()=>{if(group.current)setSeconds(messageCycleSeconds(group.current.getBoundingClientRect().width));};measure();if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(measure);observer.observe(group.current);return()=>observer.disconnect();}window.addEventListener('resize',measure);return()=>window.removeEventListener('resize',measure);},[]);
 return <section className="study-messages-ribbon" aria-labelledby="study-messages-title" data-paused={paused}>
  <div className="study-messages-heading"><div><h2 id="study-messages-title">{es?'Un poco de ánimo para tu estudio':'A little encouragement for your study'}</h2><p>{es?'Mensajes de IMMIGRA en siete idiomas. No son reseñas ni opiniones de usuarios.':'Messages from IMMIGRA in seven languages. Not reviews or user opinions.'}</p></div><button type="button" aria-pressed={paused} onClick={()=>setPaused(value=>!value)}>{paused?(es?'Reanudar mensajes':'Resume messages'):(es?'Pausar mensajes':'Pause messages')}</button></div>
  <div ref={windowRef} className="study-messages-window" tabIndex={0} role="region" aria-label={es?'Mensajes de ánimo; desplaza para leer más':'Encouragement messages; scroll to read more'} onTouchStart={()=>setPaused(true)} onKeyDown={event=>{if(event.target!==event.currentTarget)return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();setPaused(true);event.currentTarget.scrollBy({left:event.key==='ArrowRight'?280:-280,behavior:'auto'});}}}>
   <div className="study-messages-track" style={{'--message-cycle':`${seconds}s`}}><div ref={group} className="study-messages-group">{studyMessages.map(message=><MessageCard key={message.id} message={message}/>)}</div><div className="study-messages-group study-messages-duplicate" aria-hidden="true" inert={true}>{studyMessages.map(message=><MessageCard key={message.id} message={message} duplicate/>)}</div></div>
  </div>
 </section>;
}
