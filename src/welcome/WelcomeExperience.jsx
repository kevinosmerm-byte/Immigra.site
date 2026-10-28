import React,{useEffect,useState} from 'react';
import {useModalFocus} from '../../modules/citizenship/src/useModalFocus.js';
import LiquidBackground from './LiquidBackground.jsx';
import {COPY} from './copy.mjs';
import './welcome.css';
const greetings=['Bienvenido','Welcome','Bienvenue','Bem-vindo','Benvenuto','Willkommen'];
export default function WelcomeExperience({initialLanguage,onComplete}) {
  const [language,setLanguage]=useState(initialLanguage),[chosen,setChosen]=useState(false),[dialog,setDialog]=useState(false),[checked,setChecked]=useState(false),[greeting,setGreeting]=useState(0);
  const [systemReduced,setSystemReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  const reduced=systemReduced, copy=COPY[language];
  const close=()=>setDialog(false);
  const panel=useModalFocus(dialog,close);
  useEffect(()=>{const query=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setSystemReduced(query.matches);query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);

  useEffect(()=>{const previous=document.documentElement.lang;document.documentElement.lang=language;return()=>{document.documentElement.lang=previous;};},[language]);
  useEffect(()=>{
    if(reduced||dialog)return;
    let timer;
    const restart=()=>{clearInterval(timer);if(!document.hidden)timer=setInterval(()=>setGreeting(n=>(n+1)%greetings.length),2700);};
    restart();document.addEventListener('visibilitychange',restart);
    return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',restart);};
  },[reduced,dialog]);
  useEffect(()=>{if(!dialog)return;const before=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=before;};},[dialog]);
  const choose=value=>{setLanguage(value);setChosen(true);};
  return <div className="immigra-welcome" lang={language} data-reduced={reduced}>
    <LiquidBackground reduced={reduced}/>
    <div className="welcome-shell" inert={dialog?true:undefined}>
      <header className="welcome-top"><span className="welcome-brand">IMMIGRA</span></header>
      <main className="welcome-main">
        <p className="welcome-eyebrow">✦ {copy.eyebrow} ✦</p>
        <h1 className="welcome-title"><span className="welcome-sr">{language==='es'?'Bienvenido a IMMIGRA':'Welcome to IMMIGRA'}</span><span aria-hidden="true" key={reduced?language:greeting}>{reduced?(language==='es'?'Bienvenido':'Welcome'):greetings[greeting]}</span></h1>
        <p className="welcome-tagline">{language==='es'?'Tu próximo paso comienza aquí.':'Your next step starts here.'}</p>
        <section className="welcome-card" aria-labelledby="welcome-language">
          <div className="welcome-card-head"><h2 id="welcome-language">{copy.langTitle}</h2><span>{copy.step}</span></div>
          <div className="welcome-choices" role="group" aria-label={copy.langTitle}>{[['es','Español','Spanish'],['en','English','Inglés']].map(([value,label,translation])=><button key={value} aria-pressed={language===value} onClick={()=>choose(value)}><b>{value.toUpperCase()}</b><span>{label}<small>{translation}</small></span></button>)}</div>
          <button className="welcome-primary" disabled={!chosen} onClick={()=>{setChecked(false);setDialog(true);}}><span>{copy.continue} →</span></button>
          <p className="welcome-note">{chosen?copy.note:(language==='es'?'Confirma tu idioma para continuar.':'Confirm your language to continue.')}</p>
        </section>
      </main>
      <footer className="welcome-footer"><span>{language==='es'?'Asilo · Ciudadanía · Residencia':'Asylum · Citizenship · Permanent Residence'}</span></footer>
    </div>
    {dialog&&<div className="welcome-overlay" onClick={e=>{if(e.target===e.currentTarget)close();}}><section ref={panel} className="welcome-dialog" role="dialog" aria-modal="true" aria-labelledby="welcome-notice">
      <button className="welcome-close" onClick={close} aria-label={language==='es'?'Cerrar':'Close'}>×</button>
      <p className="welcome-eyebrow">{copy.dstep}</p><h2 id="welcome-notice">{copy.dtitle}</h2><p>{copy.intro}</p>
      {[1,2,3].map(n=><div className="welcome-point" key={n}><strong>{copy[`p${n}t`]}</strong><p>{copy[`p${n}d`]}</p></div>)}
      <label className="welcome-check"><input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/><span>{copy.ack}</span></label>
      <button className="welcome-primary" disabled={!checked} onClick={()=>{if(checked)onComplete(language);}}><span>{copy.enter} →</span></button>
      <div className="welcome-links"><a href={`https://immigra.site/${language==='es'?'terminos':'terms'}`} target="_blank" rel="noopener noreferrer">{copy.terms} ↗</a><a href={`https://immigra.site/${language==='es'?'privacidad':'privacy'}`} target="_blank" rel="noopener noreferrer">{copy.privacy} ↗</a></div>
      <button className="welcome-back" onClick={close}>{copy.back}</button>
    </section></div>}
  </div>;
}
