import React,{useEffect,useRef,useState,useReducer} from 'react';
import {modules} from './modules.js';
import './ImmigraHome.css';
import {heroExamples,freeStudyRoutes,heroDemoReducer,initialHeroDemo} from './hero-demo.mjs';


function focusAndScroll(ref) {
 ref.current?.focus({preventScroll:true});
 ref.current?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.reduceMotion==='true'?'auto':'smooth',block:'start'});
}

function Symbol({name}) {
 const paths={mic:<><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></>,book:<><path d="M12 5c-3-3-7-3-10-2v16c4-1 7 0 10 2 3-2 6-3 10-2V3c-3-1-7-1-10 2Z"/><path d="M12 5v16"/></>,chart:<path d="M5 20v-6M12 20V8M19 20V3"/>,play:<><circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4Z"/></>};
 return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]||paths.book}</svg>;
}

export function InterviewPreview({lang,demo,dispatch,previewRef}) {
 const t=(es,en)=>lang==='es'?es:en;
 const example=heroExamples[demo.route][lang==='es'?'es':'en'];
 const steps=[t('Pregunta','Question'),t('Respuesta','Answer'),t('Mejora','Improve')];
 return <figure id="ih-demo" className="ih-preview" ref={previewRef} tabIndex={-1} aria-label={t('Demostración interactiva ficticia','Fictional interactive demonstration')}>
  <figcaption>{t('DEMO · EJEMPLO FICTICIO','DEMO · FICTIONAL EXAMPLE')}</figcaption>
  <div className="ih-demo-scene">
   <img className="ih-demo-portrait" src="/images/home/william-home.webp" srcSet="/images/home/william-home-640.webp 640w, /images/home/william-home.webp 1024w" sizes="(max-width: 600px) calc(100vw - 52px), (max-width: 1000px) 670px, 52vw" width="1024" height="1536" alt={t('William, entrevistador virtual de IMMIGRA','William, IMMIGRA virtual interviewer')} fetchPriority="high"/>
   <div className="ih-demo-content">
    <nav className="ih-demo-steps" aria-label={t('Pasos de la demostración','Demonstration steps')}>{steps.map((label,i)=><button type="button" key={i} aria-current={demo.step===i?'step':undefined} onClick={()=>dispatch({type:'step',step:i})}><b>{i+1}</b><span>{label}</span></button>)}</nav>
    <div className="ih-demo-cards" aria-live={demo.playing?'off':'polite'} aria-atomic="true">
     <div className="ih-demo-question"><small>{steps[0]}</small><strong>{example.question}</strong></div>
     {demo.step>=1&&<div className="ih-demo-answer"><small>{t('Respuesta ficticia de ejemplo','Fictional example answer')}</small><p>{example.answer}</p></div>}
     {demo.step>=2&&<div className="ih-demo-feedback"><small>{t('Qué puede mejorar','What can improve')}</small><p>{example.feedback}</p></div>}
    </div>
   </div>
  </div>
  <div className="ih-demo-controls"><button type="button" onClick={()=>dispatch({type:demo.playing?'pause':'play'})}>{demo.playing?t('Pausar','Pause'):t('Reproducir','Play')}</button><button type="button" onClick={()=>dispatch({type:'replay'})} aria-label={t('Reiniciar demostración','Replay demonstration')}>↻</button><span>{demo.step+1} / 3 · {steps[demo.step]}</span><small>{t('Interactiva · no graba audio','Interactive · does not record audio')}</small></div>
 </figure>;
}

export default function ImmigraHome({lang,onNavigate}) {
 const t=(es,en)=>lang==='es'?es:en;
 const processes=useRef(null), explanation=useRef(null), preview=useRef(null);
 const [demo,dispatch]=useReducer(heroDemoReducer,undefined,initialHeroDemo);
 useEffect(()=>{dispatch({type:'reset'});},[lang]);
 useEffect(()=>{const pauseHidden=()=>{if(document.hidden)dispatch({type:'pause'});};document.addEventListener('visibilitychange',pauseHidden);return()=>document.removeEventListener('visibilitychange',pauseHidden);},[]);
 useEffect(()=>{if(!demo.playing)return;const timer=setTimeout(()=>dispatch({type:'tick',revision:demo.revision}),6000);return()=>clearTimeout(timer);},[demo.playing,demo.revision]);
 const showDemo=()=>{dispatch({type:'replay'});focusAndScroll(preview);};
 const [expanded,setExpanded]=useState(false);
 // Wait for React to remove hidden before moving focus on the first click.
 useEffect(()=>{if(expanded)focusAndScroll(explanation);},[expanded]);
 const showExplanation=()=>{if(expanded)focusAndScroll(explanation);else setExpanded(true);};
 const benefits={citizenship:[t('Simulaciones de entrevista con IA','AI interview simulations'),t('Preguntas cívicas y N-400','Civics and N-400 questions'),t('Material de estudio','Study materials')],asylum:[t('Preguntas personalizadas','Personalized questions'),t('Práctica basada en tu declaración','Practice based on your statement'),t('Material de preparación','Preparation resources')],residency:[t('Entrevistas simuladas','Simulated interviews'),t('Preguntas sobre tu situación','Questions about your situation'),t('Preparación para ajuste de estatus','Adjustment of status preparation')]};
 return <div className="immigra-home"><section className="ih-hero"><div className="ih-copy"><span className="ih-eyebrow">{t('TU PREPARACIÓN, EN UN SOLO LUGAR','ALL YOUR PREPARATION IN ONE PLACE')}</span><h1>{t('Prepárate antes de tu ','Prepare before your ')}<span>{t('entrevista.','interview.')}</span></h1><p>{t('Simulaciones con IA para ciudadanía, asilo y residencia, en un solo lugar.','AI simulations for citizenship, asylum and residency, all in one place.')}</p><div className="ih-route-choice" role="group" aria-label={t('Elige tu proceso','Choose your process')}>{modules.map(m=><button type="button" key={m.id} aria-pressed={demo.route===m.id} className={`ih-route-${m.id}`} onClick={()=>dispatch({type:'route',route:m.id})}>{m.id==='residency'?t('Residencia','Residency'):lang==='es'?m.es:m.en}</button>)}</div><div className="ih-actions"><button className="ih-primary" onClick={()=>onNavigate(freeStudyRoutes[demo.route])}>{t('Comienza a estudiar gratis','Start studying for free')} <span aria-hidden="true">→</span></button><button className="ih-secondary" aria-controls="ih-demo" onClick={showDemo}><Symbol name="play"/>{t('Ver cómo funciona','See how it works')}</button></div><p className="ih-free-note">{t('Material de estudio gratuito. Las entrevistas con IA tienen condiciones de acceso.','Free study materials. AI interviews have separate access requirements.')}</p><ul className="ih-highlights">{[t('A tu ritmo','At your pace'),t('Español e inglés','Spanish and English'),t('Orientación educativa','Educational guidance')].map(x=><li key={x}><span aria-hidden="true">✓</span>{x}</li>)}</ul></div><InterviewPreview lang={lang} demo={demo} dispatch={dispatch} previewRef={preview}/></section><section className="ih-processes" ref={processes} tabIndex={-1} aria-label={t('Elige tu proceso','Choose your process')}><div className="ih-process-grid">{modules.map(m=><article className={`ih-card ih-${m.id}`} key={m.id}><div className="ih-card-heading"><img src={`/images/home/${m.id}-20261014-160.webp`} srcSet={`/images/home/${m.id}-20261014-80.webp 80w, /images/home/${m.id}-20261014-160.webp 160w, /images/home/${m.id}-20261014-240.webp 240w`} sizes="(max-width: 600px) 80px, 72px" width="84" height="84" alt=""/><div><h2>{m.id==='residency'?t('Residencia','Residency'):lang==='es'?m.es:m.en}</h2><p>{lang==='es'?m.descEs:m.descEn}</p></div></div><ul>{benefits[m.id].map(x=><li key={x}><span aria-hidden="true">✓</span>{x}</li>)}</ul><button onClick={()=>onNavigate(m.id)}>{t('Practicar','Practice')} {m.id==='residency'?t('residencia','residency'):(lang==='es'?m.es:m.en).toLowerCase()} <span aria-hidden="true">→</span></button></article>)}</div></section><section className="ih-features" aria-label={t('Herramientas de preparación','Preparation tools')}>{[['mic',t('Entrevistas simuladas','Simulated interviews'),t('Practica con herramientas de inteligencia artificial.','Practice with artificial intelligence tools.')],['book',t('Estudia a tu ritmo','Study at your own pace'),t('Accede a materiales y recursos de preparación.','Access preparation materials and resources.')],['chart',t('Identifica qué mejorar','Identify what to improve'),t('Recibe orientación durante tus ejercicios.','Receive guidance during your exercises.')]].map(([icon,title,copy])=><div key={icon}><span className={`ih-feature-icon ih-${icon}`}><Symbol name={icon}/></span><div><h2>{title}</h2><p>{copy}</p></div></div>)}</section><button type="button" className="ih-how-toggle" aria-expanded={expanded} aria-controls="ih-how" onClick={showExplanation}>{t('Sobre la preparación y sus límites','About preparation and its limits')}</button><section id="ih-how" className="ih-how" ref={explanation} tabIndex={-1} hidden={!expanded}><h2>{t('Así funciona tu preparación','How your preparation works')}</h2><ol><li>{t('Elige ciudadanía, asilo o residencia.','Choose citizenship, asylum or residency.')}</li><li>{t('Explora el material y elige una práctica dentro del módulo.','Explore the materials and select a practice within the module.')}</li><li>{t('Revisa los avisos y permisos antes de comenzar. Puedes estudiar y practicar a tu ritmo.','Review the notices and permissions before starting. Study and practice at your own pace.')}</li></ol><p>{t('La demostración de arriba es ficticia: no graba audio ni evalúa respuestas. La práctica es educativa, no asesoría legal ni garantía de aprobación.','The preview above is fictional: it does not record audio or evaluate answers. Practice is educational, not legal advice or a guarantee of approval.')}</p></section></div>;
}
