import {useEffect,useState} from 'react';
import CallView from '../../shared/interview-ui/CallView.jsx';

export default function CoachCall({language,started,speaking,listening,thinking,reply,history,onStart,onMic,onRepeat,onSuspend,onExit}) {
 const [paused,setPaused]=useState(false),[captions,setCaptions]=useState(true),[elapsed,setElapsed]=useState(0),[ended,setEnded]=useState(false);
 const t=(es,en)=>language==='es'?es:en;
 useEffect(()=>{if(!started||ended)return;const timer=setInterval(()=>setElapsed(v=>v+1),1000);return()=>clearInterval(timer);},[started,ended]);
 if(ended)return <section className="citizen-coach-report"><span className="platform-eyebrow">{t('CONVERSACIÓN EN INGLÉS','ENGLISH CONVERSATION')}</span><h1>{t('Tu práctica de hoy','Your practice today')}</h1><p>{t('Conversación finalizada.','Conversation ended.')}</p><p>{history.filter(x=>x.role==='user').length} {t('respuestas practicadas','responses practiced')} · {Math.floor(elapsed/60)}:{String(elapsed%60).padStart(2,'0')}</p><button className="citizen-primary" onClick={onExit}>{t('Volver a ciudadanía','Back to citizenship')}</button></section>;
 if(!started)return <section className="call-setup"><span className="platform-eyebrow">{t('CONVERSACIÓN EN INGLÉS','ENGLISH CONVERSATION')}</span><h1>{t('Practica con Sarah','Practice with Sarah')}</h1><p>{t('Una conversación para practicar tu inglés.','A conversation to practice your English.')}</p><button className="citizen-primary" onClick={onStart}>{t('Comenzar entrevista','Start interview')}</button><button className="back-button" onClick={onExit}>{t('Volver','Back')}</button></section>;
 const suspend=()=>{onSuspend();setPaused(true);};
 return <CallView moduleId="citizenship" lang={language} interviewerName="Sarah" interviewType={t('Conversación en inglés','English conversation')} mode="personal" mediaBase="/modules/citizenship/sarah-" state={paused?'paused':thinking?'processing':speaking?'speaking':'listening'} elapsed={elapsed} muted={!listening} captions={[{who:'ai',text:reply||"Hi! I'm Sarah. Let's practice English together. Tell me about yourself."}]} showCaptions={captions} onCaptions={()=>setCaptions(v=>!v)} onMic={()=>{if(!paused&&!thinking)onMic();}} onRepeat={()=>{onSuspend();onRepeat();}} onPause={()=>{if(paused)setPaused(false);else suspend();}} onSuspend={suspend} onFinish={()=>{onSuspend();setEnded(true);}}/>;
}
