import {PremiumIcon} from '../../shared/design-system/PremiumIcon.jsx';
import React from 'react';
import {SectionTitle,ActionCard} from '../../shared/design-system/Components.jsx';
export default function PlatformHome({language,onStartInterview,onStartN400Interview,onStartCivicsInterview,onOpenFeature,onOpenProgress,onOpenSettings,onOpenImmigrationHelp,onOpenPodcasts,onOpenAccount,onNavigate,onContinue,plan,nextAction,practiceSummary}) {
 const t=(es,en)=>language==='es'?es:en;
 const viewed=practiceSummary?.civics?.viewed||0;
 const activities=[
  ['128',t('128 preguntas oficiales','128 official questions'),t('Estudia las preguntas y respuestas oficiales.','Study the official questions and answers.'),()=>onOpenFeature('civics')],
  ['civics',t('Entrevista cívica','Civics interview'),t('Practica una pregunta a la vez.','Practice one question at a time.'),onStartCivicsInterview],
  ['N-400',t('Entrevista N-400','N-400 interview'),t('Repasa tu solicitud conversando.','Review your application through conversation.'),onStartN400Interview],
  ['Aa',t('Lectura','Reading'),t('Lee en voz alta y recibe comentarios.','Read aloud and receive feedback.'),()=>onOpenFeature('reading')],
  ['write',t('Escritura','Writing'),t('Escucha, escribe y revisa.','Listen, write and review.'),()=>onOpenFeature('writing')],
  ['words',t('Vocabulario','Vocabulary'),t('Entiende las palabras de tu entrevista.','Understand the words in your interview.'),()=>onNavigate('vocabulary')],
 ];
 return <div className="citizen-dashboard">
  <SectionTitle eyebrow={t('CIUDADANÍA','CITIZENSHIP')} title={t('Un paso más cerca.','One step closer.')} description={t('Tu espacio para estudiar y practicar la entrevista.','Your space to study and practice for the interview.')}/>
  <section className="citizen-daily" aria-label={t('Tu plan de hoy','Your plan today')}>
   <div><span className="platform-eyebrow">{t('TU PLAN DE HOY','YOUR PLAN TODAY')}</span><h2>{nextAction.label}</h2><p>{nextAction.detail}</p></div>
   <button className="citizen-primary" onClick={onContinue}>{t('Continuar mi plan','Continue my plan')} <span aria-hidden="true">→</span></button>
   <details><summary>{t('Ver actividades','View activities')}</summary><ol>{plan.items.map(x=><li key={x.id}>{x.label} · {x.minutes} min</li>)}</ol></details>
  </section>
  <div className="citizen-section-label"><h2>{t('¿Qué quieres practicar?','What would you like to practice?')}</h2><span>{t('A tu ritmo','At your pace')}</span></div>
  <div className="citizen-activity-grid">{activities.map(([id,title,description,action])=><ActionCard key={id} icon={<StudyIcon name={id}/>} title={title} description={description} onClick={action}/>)}</div>
  <button className="citizen-progress-link" onClick={onOpenProgress}><StudyIcon name="progress"/><span><strong>{t('Mi progreso','My progress')}</strong><small>{t(`${viewed} de 128 preguntas consultadas`,`${viewed} of 128 questions viewed`)}</small></span><span aria-hidden="true">→</span></button>
  <section className="citizen-resources"><h2>{t('Más formas de aprender','More ways to learn')}</h2><div>
   <button onClick={()=>onOpenFeature('quiz')}>{t('Práctica de preguntas','Question practice')} →</button><button onClick={onOpenPodcasts}>Podcasts →</button><button onClick={()=>onNavigate('civicsGuide')}>{t('Guía oficial','Official guide')} →</button><button onClick={()=>onNavigate('uscisTracker')}>{t('Mi proceso','My journey')} →</button><button onClick={onStartInterview}>{t('Avatar en vivo · Beta','Live avatar · Beta')} →</button>
  </div></section>
  <details className="citizen-account-links"><summary>{t('Perfil, ayuda y preferencias','Profile, help and preferences')}</summary><div><button onClick={()=>onNavigate('profile')}>{t('Mi perfil','My profile')}</button><button onClick={onOpenSettings}>{t('Configuración','Settings')}</button><button onClick={onOpenAccount}>{t('Cuenta y suscripción','Account and subscription')}</button><button onClick={onOpenImmigrationHelp}>{t('Ayuda migratoria','Immigration help')}</button></div></details>
  <details className="citizen-introduction"><summary>{t('Conoce la práctica de ciudadanía','About citizenship practice')}</summary><video controls playsInline preload="none" src="/modules/citizenship/citizenshipai-home-cta.mp4" aria-label={t('Presentación de ciudadanía','Citizenship introduction')}/></details>
 </div>;
}
function StudyIcon({name}) {const icons={'128':'notebook',civics:'video-camera','N-400':'file-text',Aa:'open-book',write:'pencil',words:'text',progress:'chart'};return <PremiumIcon name={icons[name]} library={['Aa','write'].includes(name)?'fluent':'3dicons'}/>;}
