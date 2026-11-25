import React,{useState} from 'react';
import {useAccount} from '../modules/citizenship/src/accountContext.js';
import {dailyCivicsPlan, readGuestStarter, readSavedStarter, starterNextStep, starterReviewRoute, starterRoute} from '../shared/civics-starter.mjs';
import InterviewGlassDemo from './InterviewGlassDemo.jsx';
import {DemoIcon} from './InterviewDemo.jsx';
import {howItWorksVideo,focusHomeSection} from './home-study.mjs';
import {readHomeCategory,rememberHomeCategory} from './home-study.mjs';
import './ImmigraHome.css';
import ReviewsRibbon from './ReviewsRibbon.jsx';
import StudyMessagesRibbon from './StudyMessagesRibbon.jsx';
import StoreDownloads from './StoreDownloads.jsx';
import GuideCard from './GuideCard.jsx';

// Direct study entry only. Interview and account controls stay in their modules.
export default function ImmigraHome({lang,onNavigate,previewExamples=false}) {
 const t=(es,en)=>lang==='es'?es:en;
 const {session} = useAccount();
 let progress = null;
 try { progress = session && !session.isEmailTrial ? readSavedStarter(session.user.id, window.localStorage) : readGuestStarter(window.localStorage); } catch {}
 const nextStep = starterNextStep(progress);
 const studyAction = {
   resume: t('Continuar mis tres preguntas','Resume my three questions'),
   review: t('Repasar una pregunta','Review a question'),
   plan: t('Abrir mi plan de hoy','Open my daily plan'),
 }[nextStep];
 const studyRoute = {resume: '#' + starterRoute, review: starterReviewRoute, plan: dailyCivicsPlan}[nextStep];
 const [selectedCategory,setSelectedCategory]=useState(readHomeCategory);
 const chooseCategory=category=>{setSelectedCategory(rememberHomeCategory(category));requestAnimationFrame(()=>focusHomeSection('ih-demo'));};
 const choices=[
  {id:'citizenship',title:t('Ciudadanía','Citizenship'),outcome:t('Estudia las 128 preguntas de ciudadanía, una tarjeta a la vez.','Study the 128 citizenship questions, one card at a time.')},
  {id:'asylum',title:t('Asilo','Asylum'),outcome:t('Aprende a distinguir recuerdos, aproximaciones y hechos.','Learn to distinguish memories, estimates and facts.')},
  {id:'residency',title:t('Residencia','Residency'),outcome:t('Entiende palabras y conceptos que aparecen en los formularios.','Understand words and concepts that appear in forms.')},
 ];
 return <section className="immigra-home" aria-labelledby="ih-title">
  <div className="ih-hero"><header className="ih-intro"><p className="ih-eyebrow">{t('TU PREPARACIÓN, EN UN SOLO LUGAR','ALL YOUR PREPARATION IN ONE PLACE')}</p><h1 id="ih-title">{t('Prepárate para','Prepare for')}<br/>{t('tu entrevista','your interview')}<br/><span>{t('con IA.','with AI.')}</span></h1><p>{t('Descubre conceptos que pueden ayudarte en tu entrevista. Elige un tema, piensa tu respuesta y aprende con una explicación breve.','Discover concepts that can help you prepare for your interview. Choose a topic, think about your answer and learn with a short explanation.')}</p><div className="ih-hero-actions"><button type="button" id="ih-free-start" className="ih-start" aria-controls="ih-study" onClick={()=>focusHomeSection('ih-study')}>{t('Comenzar gratis','Start for free')} <span aria-hidden="true">→</span></button><a className="ih-see-how" href={howItWorksVideo} target="_blank" rel="noopener noreferrer"><span className="ih-play-circle"><DemoIcon name="play"/></span><span>{t('Ver cómo funciona','See how it works')}</span></a></div></header><InterviewGlassDemo key={selectedCategory} lang={lang} onNavigate={onNavigate} category={selectedCategory}/></div>
  <div id="ih-study" className="ih-study-options" tabIndex={-1} aria-label={t('Elige tu proceso para estudiar gratis','Choose your process to study for free')}>{choices.map(choice=>{
   const resumeAction=choice.id==='citizenship'&&studyAction;
   return <button type="button" className={`ih-study-card ih-${choice.id}`} key={choice.id}
    onClick={()=>{if(resumeAction){window.location.hash=studyRoute;}else{chooseCategory(choice.id);}}}
    aria-controls={resumeAction?undefined:'ih-demo'} aria-label={resumeAction||`${t('Aprender sobre','Learn about')} ${choice.title}`} aria-describedby={`ih-${choice.id}-description`}>
    <img src={`/images/home/${choice.id}-20261014-160.webp`} srcSet={`/images/home/${choice.id}-20261014-80.webp 80w, /images/home/${choice.id}-20261014-160.webp 160w, /images/home/${choice.id}-20261014-240.webp 240w`} sizes="72px" width="72" height="72" alt=""/>
    <span className="ih-study-title">{choice.title}</span><span className="ih-study-description" id={`ih-${choice.id}-description`}>{choice.outcome}</span>
    <span className="ih-study-action"><span>{resumeAction||(choice.id==='citizenship'?t('Estudiar las 128 preguntas','Study the 128 questions'):t('Descubrir tres temas','Discover three topics'))}</span><span aria-hidden="true">→</span></span>
   </button>;
  })}</div>
  <p className="ih-scope-note">{t('Estudio gratuito. Las entrevistas con IA tienen condiciones de acceso. Herramienta educativa, no asesoría legal.','Free study. AI interviews have separate access requirements. Educational tool, not legal advice.')}</p>
  <GuideCard lang={lang}/>
  <StoreDownloads lang={lang}/>
  <StudyMessagesRibbon lang={lang}/>
  {previewExamples && <ReviewsRibbon lang={lang} previewExamples={previewExamples}/>}
 </section>;
}
