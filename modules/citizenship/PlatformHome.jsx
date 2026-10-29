import {GlassCard,GlassSection,GlassProgress} from '../../shared/design-system/Glass.jsx';
import '../../shared/design-system/citizenship-dashboard.css';
import {PremiumIcon} from '../../shared/design-system/PremiumIcon.jsx';
import React from 'react';
import {SectionTitle,ActionCard} from '../../shared/design-system/Components.jsx';
export default function PlatformHome({language,onStartN400Interview,onStartCivicsInterview,onOpenFeature,onOpenProgress,onOpenPodcasts,onNavigate,onContinue,plan,nextAction,practiceSummary}) {
 const t=(es,en)=>language==='es'?es:en;
 const viewed=practiceSummary?.civics?.viewed||0;
 const progress=Math.min(100,Math.round(viewed/128*100));
 const activities=[
  ['128',t('128 preguntas oficiales','128 official questions'),t('Estudia las preguntas y respuestas oficiales.','Study the official questions and answers.'),()=>onOpenFeature('civics')],
  ['civics',t('Entrevista cívica','Civics interview'),t('Practica una pregunta a la vez.','Practice one question at a time.'),onStartCivicsInterview],
  ['study-n400','Have You Ever',t('Tarjetas de estudio N-400 · Parte 9. Sin respuestas personales.','N-400 Part 9 study cards. No personal responses.'),()=>onNavigate('n400Study')],
  ['N-400',t('Entrevista N-400','N-400 interview'),t('Repasa tu solicitud conversando.','Review your application through conversation.'),onStartN400Interview],
  ['Aa',t('Lectura','Reading'),t('Lee en voz alta y recibe comentarios.','Read aloud and receive feedback.'),()=>onOpenFeature('reading')],
  ['write',t('Escritura','Writing'),t('Escucha, escribe y revisa.','Listen, write and review.'),()=>onOpenFeature('writing')],
  ['words',t('Vocabulario','Vocabulary'),t('Entiende las palabras de tu entrevista.','Understand the words in your interview.'),()=>onNavigate('vocabulary')],
 ];
 return <div className="citizen-dashboard">
  <SectionTitle eyebrow={t('CIUDADANÍA','CITIZENSHIP')} title={t('Un paso más cerca.','One step closer.')} description={t('Tu espacio para estudiar y practicar la entrevista.','Your space to study and practice for the interview.')}/>
  <GlassCard className="citizen-daily" aria-label={t('Tu plan de hoy','Your plan today')}>
   <span className="daily-plan-icon"><PremiumIcon name="calender"/></span><div className="daily-plan-copy"><span className="platform-eyebrow">{t('TU PLAN DE HOY','YOUR PLAN TODAY')}</span><h2>{nextAction.label}</h2><p>{nextAction.detail}</p></div>
   <div className="daily-plan-summary"><span className="daily-plan-ring"><b>{plan.totalMinutes}</b><small>min</small></span><span><strong>{t("Tu plan de hoy","Your plan today")}</strong><small>{plan.items.length} {t("actividades sugeridas","suggested activities")}</small></span></div>
   <button className="citizen-primary" onClick={onContinue}>{t('Continuar mi plan','Continue my plan')} <span aria-hidden="true">→</span></button>
   <details><summary>{t('Ver actividades','View activities')}</summary><ol>{plan.items.map(x=><li key={x.id}>{x.label} · {x.minutes} min</li>)}</ol></details>
  </GlassCard>
  <div className="citizen-section-label"><h2>{t('¿Qué quieres practicar?','What would you like to practice?')}</h2><span>{t('A tu ritmo','At your pace')}</span></div>
  <div className="citizen-activity-grid">{activities.map(([id,title,description,action])=><ActionCard key={id} icon={<StudyIcon name={id}/>} title={title} description={description} onClick={action}/>)}</div>
  <GlassCard as="button" className="citizen-progress-link" onClick={onOpenProgress}><StudyIcon name="progress"/><span><strong>{t('Mi progreso','My progress')}</strong><small>{t(`${viewed} de 128 preguntas consultadas`,`${viewed} of 128 questions viewed`)}</small></span><GlassProgress value={viewed} max={128} label={t("Preguntas consultadas","Questions viewed")}/><b>{progress}%</b><span aria-hidden="true">→</span></GlassCard>
  <GlassSection className="citizen-resources" icon={<PremiumIcon name="bulb"/>} title={t('Más formas de aprender','More ways to learn')} description={t('Recursos adicionales para apoyar tu práctica.','Additional resources to support your practice.')}><div className="citizen-resource-grid">
   {[
    ['file-text',t('Práctica de preguntas','Question practice'),()=>onOpenFeature('quiz')],
    ['headphone','Podcasts',onOpenPodcasts],
    ['notebook',t('Guía oficial','Official guide'),()=>onNavigate('civicsGuide')],
   ].map(([icon,label,action])=><GlassCard as="button" key={icon} onClick={action}><PremiumIcon name={icon}/><span>{label}</span>{icon==='headphone'&&<span className="podcast-status-light" aria-hidden="true"/>}<span aria-hidden="true">›</span></GlassCard>)}
  </div></GlassSection>
 </div>;
}
function StudyIcon({name}) {const icons={'128':'notebook',civics:'video-camera','N-400':'file-text','study-n400':'notebook',Aa:'open-book',write:'pencil',words:'text',progress:'chart'};return <PremiumIcon name={icons[name]} library={['Aa','write'].includes(name)?'fluent':'3dicons'}/>;}
