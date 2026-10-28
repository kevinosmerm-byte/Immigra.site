import React from 'react';
import {GlassCard,GlassIcon} from '../../shared/design-system/Glass.jsx';
import {SectionTitle,ActionCard} from '../../shared/design-system/Components.jsx';
import {PremiumIcon} from '../../shared/design-system/PremiumIcon.jsx';
import '../../shared/design-system/citizenship-dashboard.css';
import '../../shared/design-system/citizenship-practice.css';

export default function PlatformPractice({language,plan,nextAction,onContinue,onProgress,onNavigate}) {
 const t=(en,es)=>language==='es'?es:en;
 const activities=[
  ['interview-n400','file-text','N-400','N-400','Practice questions from the N-400 interview.','Practica preguntas de la entrevista N-400.'],
  ['interview-civics','user','Interview','Entrevista','Practice an interview conversation.','Practica una conversación de entrevista.'],
  ['civics','notebook','Civics','Civismo','Study the 128 civics questions and answers.','Estudia las 128 preguntas y respuestas de civismo.'],
  ['quiz','target','Quiz','Examen','Test your knowledge with interactive quizzes.','Pon a prueba tus conocimientos.'],
  ['reading','open-book','Reading','Lectura','Read and receive feedback.','Lee y recibe comentarios.'],
  ['writing','pencil','Writing','Escritura','Listen, write and review your answers.','Escucha, escribe y revisa tus respuestas.'],
  ['podcasts','headphone','Listening','Escuchar','Improve your listening comprehension.','Mejora tu comprensión auditiva.'],
 ];
 if(plan.focus==='oath_preparation') activities.unshift(['uscisTracker','file-text','Oath','Juramento','Prepare for your next step.','Prepárate para tu próximo paso.']);
 return <div className="citizen-dashboard practice-dashboard">
  <button type="button" className="practice-progress-link" onClick={onProgress}>← {t('Progress','Progreso')}</button>
  <SectionTitle eyebrow={t('CITIZENSHIP','CIUDADANÍA')} title={t('Practice','Práctica')} description={t('A plan that fits your next step.','Un plan para tu próximo paso.')}/>
  <GlassCard className="citizen-daily">
   <span className="daily-plan-icon"><PremiumIcon name="calender"/></span>
   <div className="daily-plan-copy"><span className="platform-eyebrow">{t('YOUR PLAN TODAY','TU PLAN DE HOY')}</span><h2>{nextAction.label}</h2><p>{nextAction.detail}</p></div>
   <div className="daily-plan-summary"><span className="daily-plan-ring"><b>{plan.totalMinutes}</b><small>min</small></span><span><strong>{t("Today's plan","Tu plan de hoy")}</strong><small>{plan.items.length} {t('suggested activities','actividades sugeridas')}</small></span></div>
   <button type="button" className="citizen-primary" onClick={onContinue}>{t("Continue today's practice","Continuar la práctica de hoy")} <span aria-hidden="true">→</span></button>
   <details><summary>{t('View activities','Ver actividades')} →</summary><ol>{plan.items.map(item=><li key={item.id}>{item.label} · {item.minutes} min</li>)}</ol></details>
  </GlassCard>
  <div className="citizen-activity-grid practice-activity-grid">{activities.map(([id,icon,en,es,description,descripcion])=><ActionCard key={id} icon={icon==='user'?<GlassIcon name="◎"/>:icon==='target'?<GlassIcon name="target"/>:<PremiumIcon name={icon} library={['open-book','pencil'].includes(icon)?'fluent':'3dicons'}/>} title={t(en,es)} description={t(description,descripcion)} onClick={()=>onNavigate(id)}/>)}</div>
 </div>;
}
