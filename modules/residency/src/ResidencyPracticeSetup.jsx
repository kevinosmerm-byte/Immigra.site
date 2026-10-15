import React,{useEffect,useRef,useState} from 'react';
import {useGlass} from '../../../shared/design-system/Glass.jsx';
import {aosRoutes,aosRoutesEn} from './aosEngine.mjs';
import aosUiEn from './aos-ui.en.json';
import {INTERVIEWERS,interviewerMediaBase} from '../../../shared/interview-ui/interviewer-media.mjs';

const practiceInterviewers=['kevin','sarah','william'].map(id=>INTERVIEWERS.find(person=>person.id===id));

const card='rounded-3xl! border! border-white/80! bg-linear-to-br! from-white/75! via-white/45! to-emerald-50/30! p-5! shadow-[inset_0_1px_0_0_rgba(255,255,255,0.95),0_12px_32px_-20px_rgba(15,70,56,0.3)]! backdrop-blur-xl!';
const waterButton='backdrop-blur-xl! shadow-[inset_0_1px_0_0_rgba(255,255,255,0.75),inset_0_-1px_0_0_rgba(255,255,255,0.2),0_6px_18px_-12px_rgba(6,78,59,0.45)]! transition-[background-color,box-shadow,transform]! duration-200! motion-reduce:transition-none! enabled:active:translate-y-px!';
const selectedWater='border-emerald-300/70! bg-linear-to-b! from-emerald-700/90! via-emerald-700/95! to-emerald-900/95! text-white!';
const focus='focus-visible:outline-2! focus-visible:outline-offset-4! focus-visible:outline-emerald-700!';
const choices={
 status:[['unknown','No estoy seguro / necesito revisar'],['citizen','Ciudadano estadounidense'],['resident','Residente permanente']],
 age:[['unknown','Prefiero revisar / no indicar'],['under21','Menor de 21 años'],['21plus','21 años o más']],
 marital:[['unknown','Prefiero revisar / no indicar'],['single','Soltero/a'],['married','Casado/a'],['previous','Divorciado/a o viudo/a']],
};
const durations=[[6,'6 preguntas · Breve'],[12,'12 preguntas · Recomendada'],[30,'30 preguntas · Extendida'],[100,'Todas las preguntas de esta categoría']];

function Icon({kind,className=''}){
 const paths={people:'M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3M22 21v-3a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',clock:'M12 8v4l3 2',settings:'m9 3-1 3-3 1v3l-2 2 2 2v3l3 1 1 3h6l1-3 3-1v-3l2-2-2-2V7l-3-1-1-3Z',info:'M12 11v6m0-10v1',arrow:'M4 12h16m-6-6 6 6-6 6'};
 return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`h-6! w-6! shrink-0! ${className}`}>
  {kind==='people'&&<circle cx="9" cy="7" r="4"/>}{kind==='clock'&&<circle cx="12" cy="12" r="9"/>}{kind==='settings'&&<circle cx="12" cy="12" r="3"/>}{kind==='info'&&<circle cx="12" cy="12" r="9"/>}<path d={paths[kind]}/>
 </svg>;
}
function InterviewerPreview({person}){
 const {preferences}=useGlass();
 const video=useRef(null);
 useEffect(()=>{
  const element=video.current,media=matchMedia('(prefers-reduced-motion: reduce)');let visible=false;
  const sync=()=>{element.muted=true;if(preferences.reduceMotion||media.matches||document.hidden||!visible)element.pause();else element.play().catch(()=>{});};
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();});observer.observe(element);
  media.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);sync();
  return()=>{element.pause();observer.disconnect();media.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);};
 },[preferences.reduceMotion]);
 return <video ref={video} src={`${interviewerMediaBase(person.id)}listening.mp4`} poster={`/interviewer/portraits/${person.id==='sarah'?'sahara':person.id}.jpg`} muted loop playsInline preload="metadata" tabIndex={-1} aria-hidden="true" className="h-full! w-full! object-cover! object-[50%_20%]!"/>;
}
function SegmentGroup({label,value,options,onChange}){
 return <fieldset className="m-0! min-w-0! border-0! p-0!">
  <legend className="mb-3! text-lg! font-semibold! text-slate-900!">{label}</legend>
  <div className={`grid! gap-2! ${options.length===4?'grid-cols-2! sm:grid-cols-4!':'grid-cols-3!'}`}>
   {options.map(([id,title,display])=><button type="button" key={id} aria-label={title} aria-pressed={value===id} onClick={()=>onChange(id)} className={`min-h-12! min-w-0! rounded-2xl! border! px-3! py-3! text-sm! font-semibold! leading-snug! ${focus} ${waterButton} ${value===id?selectedWater:'border-white/90! bg-linear-to-b! from-white/80! to-white/30! text-slate-800! hover:from-white/95! hover:to-emerald-50/65!'}`}>{display||title}</button>)}
  </div>
 </fieldset>;
}

export default function ResidencyPracticeSetup({lang='es',interviewer,onInterviewer,route,onRoute,status,onStatus,age,onAge,marital,onMarital,count,onCount,consent,onConsent,ai,onAi,starting,onStart,onLegacy,startError=''}){
 const es=lang==='es',t=text=>es?text:(aosUiEn[text]||text),copy=(a,b)=>es?a:b;
 const [expanded,setExpanded]=useState(false),[invalidField,setInvalidField]=useState('');
 const form=useRef(null);
 useEffect(()=>{if(expanded&&invalidField)form.current?.querySelector(`#${invalidField}`)?.focus();},[expanded,invalidField]);
 const fields=[['status',status,onStatus,'Situación del peticionario'],['age',age,onAge,route==='HIJO_A_PADRES'?'Edad del hijo o hija peticionario':'Edad de la persona beneficiaria'],['marital',marital,onMarital,'Estado civil de la persona beneficiaria']];
 const summary=fields.filter(([id,value])=>value!=='unknown').map(([id,value])=>t(choices[id].find(([key])=>key===value)?.[1]||''));
 const explain=t('Las circunstancias orientan la práctica; no determinan una categoría legal ni elegibilidad. Puedes responder «No recuerdo», «No estoy seguro» o «Necesito revisar mis documentos».');
 const education=t('Entiendo que es una simulación educativa. Mis respuestas se conservarán solo en esta pestaña.');
 const aiNotice=t('Activar conversación con IA. Autorizo enviar a OpenAI cada respuesta revisada, la pregunta y el contexto de esta sesión para revisar claridad, comprensión y contexto. El proveedor aplica sus políticas de retención; esta app no guarda las respuestas permanentemente.');
 function submit(event){
  const invalid=fields.find(([id,value])=>!choices[id].some(([key])=>key===value));
  if(invalid){event.preventDefault();setExpanded(true);setInvalidField('practice-'+invalid[0]);return;}
  setInvalidField('');onStart(event);
 }
 return <section className="residency-setup mx-auto! max-w-6xl! bg-transparent! px-4! py-5! text-slate-900! sm:px-7! sm:py-7!">
  <header className="mb-6! flex! items-center! justify-center! gap-3! border-0! bg-transparent! p-0! text-center!">
   <img src="/images/home/residency-20261014.png" alt="" width="56" height="56" className="h-14! w-14! shrink-0! rounded-2xl!"/>
   <div><h1 className="m-0! text-2xl! font-bold! tracking-tight! text-slate-950! sm:text-3xl!">{copy('Práctica de entrevista','Interview practice')}</h1><p className="m-0! mt-1! text-base! text-slate-500!">{copy('Prepárate a tu ritmo','Prepare at your own pace')}</p></div>
  </header>
  <form ref={form} aria-busy={starting} onSubmit={submit} onInvalidCapture={event=>{if(event.target.closest('[data-personalization]')){setExpanded(true);setInvalidField(event.target.id);}}}>
   <fieldset disabled={starting} className="m-0! min-w-0! border-0! p-0!">
    <legend className="sr-only!">{t('Configura tu práctica')}</legend>
    <div className="grid! items-start! gap-6!">
     <div>
      <fieldset className="m-0! min-w-0! border-0! p-0!">
       <legend className="mb-4! w-full! text-center! text-2xl! font-bold! text-slate-950!">{copy('¿Con quién practicamos?','Who shall we practice with?')}</legend>
       <div className="mx-auto! grid! max-w-3xl! grid-cols-3! gap-2! sm:gap-3!">
        {practiceInterviewers.map(person=>{const selected=interviewer===person.id;return <label key={person.id} className={`relative! m-0! cursor-pointer! overflow-hidden! rounded-2xl! border-2! bg-white/35! p-1.5! shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_24px_-18px_rgba(6,78,59,0.4)]! backdrop-blur-xl! has-focus-visible:outline-2! has-focus-visible:outline-offset-4! has-focus-visible:outline-emerald-700! ${selected?'border-emerald-600!':'border-white/80!'}`}>
         <input type="radio" className="sr-only!" name="practice-interviewer" value={person.id} checked={selected} onChange={()=>onInterviewer(person.id)}/>
         <div className="aspect-square! overflow-hidden! rounded-xl!"><InterviewerPreview person={person}/></div>
         {selected&&<span className="absolute! right-2! top-2! grid! h-7! w-7! place-items-center! rounded-full! border-2! border-white! bg-emerald-600! text-white!" aria-hidden="true">✓</span>}
         <span className={`mt-1! block! rounded-b-xl! px-1! py-2! text-center! text-sm! font-bold! sm:text-lg! ${selected?'bg-linear-to-b! from-emerald-700/90! to-emerald-900/95! text-white! shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]!':'bg-white/30! text-slate-950!'}`}>{person.name}</span>
        </label>;})}
       </div>
      </fieldset>
     </div>
     <div className="space-y-4!">
      <section className={card}>
       <h2 className="mb-4! mt-0! flex! items-center! gap-3! text-xl! font-bold! text-slate-950!"><span className="grid! h-11! w-11! place-items-center! rounded-full! bg-emerald-100! text-emerald-800!"><Icon kind="people"/></span>{copy('Tu práctica','Your practice')}</h2>
       <SegmentGroup label={copy('Petición familiar','Family petition')} value={route} options={Object.entries(es?aosRoutes:aosRoutesEn).map(([id,title])=>[id,title,id==='MATRIMONIO'?copy('Cónyuge','Spouse'):id==='HIJO_A_PADRES'?copy('Padres','Parents'):copy('Hijos','Children')])} onChange={onRoute}/><p className="mt-3! text-sm! leading-relaxed! text-slate-500!">{(es?aosRoutes:aosRoutesEn)[route]}</p>
       <div className="my-4! border-t! border-slate-200!"/>
       <SegmentGroup label={t('Duración')} value={count} options={durations.map(([id,label])=>[id,id===100?copy('100 preguntas','100 questions'):t(label)])} onChange={onCount}/>
      </section>
      <details open={expanded} onToggle={event=>setExpanded(event.currentTarget.open)} className={card} data-personalization>
       <summary className={`flex! min-h-12! cursor-pointer! list-none! items-center! gap-3! ${focus}`}>
        <span className="grid! h-11! w-11! shrink-0! place-items-center! rounded-full! bg-emerald-100! text-emerald-800!"><Icon kind="settings"/></span>
        <span className="min-w-0! flex-1!"><strong className="block! text-lg! font-bold! text-slate-950!">{copy('Personalizar mi caso','Personalize my case')}</strong><span className="block! text-sm! leading-relaxed! text-slate-500!">{summary.length?summary.join(' · '):copy('Situación del peticionario, edad y estado civil','Petitioner status, age and marital status')}</span></span>
        <span className="text-xl! text-slate-500!" aria-hidden="true">{expanded?'⌄':'›'}</span>
       </summary>
       <div className="mt-4! space-y-4!">
        {fields.map(([id,value,onChange,label])=><label key={id} htmlFor={'practice-'+id} className="block! text-sm! font-semibold! text-slate-700!">{t(label)}<select id={'practice-'+id} value={value} onChange={event=>{onChange(event.target.value);setInvalidField('');}} aria-invalid={invalidField==='practice-'+id||undefined} aria-describedby="practice-circumstances" className={`mt-2! block! min-h-12! w-full! rounded-xl! border! border-white/90! bg-white/60! shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]! backdrop-blur-md! px-3! py-2! text-base! text-slate-800! ${focus}`}>{choices[id].map(([key,title])=><option key={key} value={key}>{t(title)}</option>)}</select></label>)}
        {invalidField&&<p role="alert" className="text-sm! text-red-700!">{copy('Revisa la selección indicada antes de continuar.','Check the indicated selection before continuing.')}</p>}
        <p id="practice-circumstances" className="text-sm! leading-relaxed! text-slate-500!">{explain}</p>
       </div>
      </details>
      <div className="flex! items-start! gap-2! rounded-2xl! border! border-white/70! bg-emerald-100/55! backdrop-blur-lg! p-3! text-sm! leading-relaxed! text-emerald-900!"><Icon kind="info"/>{t('Práctica educativa. No sustituye asesoría legal ni representa una entrevista oficial de USCIS.')}</div>
      <section className={card} aria-label={copy('Avisos y consentimientos','Notices and consent')}>
       <details className="mb-3!"><summary className={`inline-flex! min-h-11! cursor-pointer! items-center! text-sm! font-semibold! text-emerald-800! underline! ${focus}`}>{copy('Ver detalles','View details')}</summary><div className="space-y-3! text-sm! leading-relaxed! text-slate-600!">
        <p>{explain}</p><p>{aiNotice}</p><p>{copy('El navegador puede enviar audio a servicios externos para transcribirlo. La app no guarda grabaciones.','Your browser may send audio to external services for transcription. The app does not store recordings.')}</p><p>{copy('Autorizo el dictado al pulsar el micrófono.','I authorize dictation when I press the microphone.')}</p>
       </div></details>
       <label className="flex! min-h-11! cursor-pointer! items-start! gap-3! py-2! text-sm! leading-relaxed! text-slate-700!"><input type="checkbox" required checked={consent} onChange={event=>onConsent(event.target.checked)} className={`mt-1! h-5! w-5! shrink-0! accent-emerald-700! ${focus}`}/><span>{education}</span></label>
       <label className="flex! min-h-11! cursor-pointer! items-start! gap-3! py-2! text-sm! leading-relaxed! text-slate-700!"><input type="checkbox" checked={ai} onChange={event=>onAi(event.target.checked)} className={`mt-1! h-5! w-5! shrink-0! accent-emerald-700! ${focus}`}/><span>{copy('Activar conversación con IA (opcional). Autorizo enviar a OpenAI mis respuestas, las preguntas y el contexto de esta sesión.','Enable AI conversation (optional). I authorize sending my answers, questions and this session’s context to OpenAI.')}</span></label>
      </section>
      {startError&&<p role="alert" className="text-sm! text-red-700!">{startError}</p>}
      <button type="submit" disabled={!consent||starting} className={`flex! min-h-14! w-full! items-center! justify-center! gap-3! rounded-3xl! border! ${selectedWater} ${waterButton} px-5! py-4! text-lg! font-bold! text-white! disabled:cursor-not-allowed! disabled:opacity-50! ${focus}`}>{starting?copy('Preparando práctica…','Preparing practice…'):copy('Comenzar práctica','Start practice')}<Icon kind="arrow"/></button>
      <button type="button" onClick={onLegacy} className={`block! min-h-11! w-full! rounded-xl! border! border-white/80! bg-white/40! px-3! text-center! text-sm! font-semibold! text-emerald-900! backdrop-blur-md! ${focus}`}>{copy('Explorar escenarios y herramientas','Explore scenarios and tools')}</button>
     </div>
    </div>
   </fieldset>
  </form>
 </section>;
}
