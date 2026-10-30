import React,{useState} from 'react';
import InterviewGlassDemo from './InterviewGlassDemo.jsx';
import {DemoIcon} from './InterviewDemo.jsx';
import {focusHomeSection} from './home-study.mjs';
import {freeStudyRoutes} from './home-study.mjs';
import './ImmigraHome.css';
import ReviewsRibbon from './ReviewsRibbon.jsx';

// Direct study entry only. Interview and account controls stay in their modules.
export default function ImmigraHome({lang,onNavigate,previewExamples=false}) {
 const t=(es,en)=>lang==='es'?es:en;
 const [selectedCategory,setSelectedCategory]=useState('asylum');
 const choices=[
  {id:'citizenship',title:t('Ciudadanía','Citizenship'),outcome:t('Estudia las 128 preguntas cívicas, una tarjeta a la vez.','Study the 128 civics questions, one card at a time.')},
  {id:'asylum',title:t('Asilo','Asylum'),outcome:t('Lee preguntas de preparación según tu país de referencia.','Read preparation questions for your reference country.')},
  {id:'residency',title:t('Residencia','Residency'),outcome:t('Explora casos ficticios y practica por escrito, sin micrófono.','Explore fictional cases and practice in writing, without a microphone.')},
 ];
 return <section className="immigra-home" aria-labelledby="ih-title">
  <div className="ih-hero"><header className="ih-intro"><p className="ih-eyebrow">{t('TU PREPARACIÓN, EN UN SOLO LUGAR','ALL YOUR PREPARATION IN ONE PLACE')}</p><h1 id="ih-title">{t('Prepárate para','Prepare for')}<br/>{t('tu entrevista','your interview')}<br/><span>{t('con IA.','with AI.')}</span></h1><p>{t('Prepárate para tu entrevista de ciudadanía, asilo o residencia con preguntas de práctica y herramientas de estudio.','Prepare for your citizenship, asylum or residency interview with practice questions and study tools.')}</p><div className="ih-hero-actions"><button type="button" id="ih-free-start" className="ih-start" onClick={()=>onNavigate(freeStudyRoutes[selectedCategory])}>{t('Comenzar gratis','Start for free')} <span aria-hidden="true">→</span></button><button type="button" className="ih-see-how" onClick={()=>focusHomeSection('ih-demo')}><span className="ih-play-circle"><DemoIcon name="play"/></span><span>{t('Ver cómo funciona','See how it works')}</span></button></div><ul className="ih-brief-benefits"><li><span className="ih-check" aria-hidden="true">✓</span>{t('A tu ritmo','At your pace')}</li><li><span className="ih-check" aria-hidden="true">✓</span>{t('Preguntas de práctica','Practice questions')}</li><li><span className="ih-check" aria-hidden="true">✓</span>{t('Español e inglés','Spanish and English')}</li></ul></header><InterviewGlassDemo lang={lang} onNavigate={onNavigate} onCategoryChange={setSelectedCategory}/></div>
  <div id="ih-study" className="ih-study-options" tabIndex={-1} aria-label={t('Elige tu proceso para estudiar gratis','Choose your process to study for free')}>{choices.map(choice=><article className={`ih-study-card ih-${choice.id}`} key={choice.id}>
   <img src={`/images/home/${choice.id}-20261014-160.webp`} srcSet={`/images/home/${choice.id}-20261014-80.webp 80w, /images/home/${choice.id}-20261014-160.webp 160w, /images/home/${choice.id}-20261014-240.webp 240w`} sizes="72px" width="72" height="72" alt=""/>
   <h2>{choice.title}</h2><p>{choice.outcome}</p>
   <button type="button" onClick={()=>onNavigate(choice.id)} aria-label={`${t('Practicar','Practice')} ${choice.title}`}><span>{t('Practicar','Practice')} {choice.title.toLocaleLowerCase(lang)}</span><span aria-hidden="true">→</span></button>
  </article>)}</div>
  <p className="ih-scope-note">{t('Estudio gratuito. Las entrevistas con IA tienen condiciones de acceso. Herramienta educativa, no asesoría legal.','Free study. AI interviews have separate access requirements. Educational tool, not legal advice.')}</p>
  <ReviewsRibbon lang={lang} previewExamples={previewExamples}/>
 </section>;
}
