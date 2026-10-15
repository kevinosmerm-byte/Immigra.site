import {AsylumPreparation} from '../../shared/AsylumPreparation.jsx';
import ConversationInterview from '../../shared/interview-ui/ConversationInterview.jsx';
import {ModuleNavigation} from '../../shared/design-system/Components.jsx';
import React,{useEffect,useRef,useState} from 'react';
import {mountAsylum} from './runtime.generated.js';
import './packages/design/style.css';
import './packages/design/master.css';
import '../../shared/design-system/platform.css';
import '../../shared/design-system/asylum-home.css';
export default function Asylum({lang='es'}){
 const [route,setRoute]=useState(()=>window.location.hash.split('/')[2]||'practice');
 useEffect(()=>{if(/^#\/asylum\/?$/.test(window.location.hash))window.location.hash='/asylum/practice';const sync=()=>setRoute(window.location.hash.split('/')[2]||'practice');window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync);},[]);
 const items=lang==='es'?[['practice','Inicio'],['fiction','Casos ficticios'],['case-workspace','Mi expediente'],['full-bank','Preguntas'],['practice-report','Informe'],['vault','Mis datos']]:[['practice','Home'],['fiction','Fictional cases'],['case-workspace','My case'],['full-bank','Questions'],['practice-report','Report'],['vault','My data']];
 const ref=useRef(null),runtime=useRef(null);
 const prepared=route==='case-workspace';
 const [call,setCall]=useState(null);
 useEffect(()=>{runtime.current=mountAsylum(ref.current,setCall,lang);return ()=>runtime.current?.();},[]);
 useEffect(()=>runtime.current?.setLanguage(lang),[lang]);
 return <>
  {!call&&<div className="[&_.platform-module-nav]:border-white/80! [&_.platform-module-nav]:bg-white/45! [&_.platform-module-nav]:backdrop-blur-xl! [&_.platform-module-nav]:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_24px_-16px_rgba(65,35,100,0.3)]! [&_button]:min-h-11! [&_button]:border-white/80! [&_button]:bg-white/35! [&_button]:text-slate-800! [&_button_span]:text-inherit! [&_button[aria-current=page]]:bg-purple-100/80! [&_button[aria-current=page]]:text-purple-900!"><ModuleNavigation items={items} current={route} label={lang==='es'?'Asilo':'Asylum'} onNavigate={id=>{window.location.hash='/asylum/'+id;}}/></div>}
  <section className="asylum-surface" data-asylum-route={route} ref={ref} hidden={Boolean(call)||prepared}/>
  {prepared&&!call&&<AsylumPreparation language={lang} onBack={()=>{window.location.hash='/asylum/practice';}} onStart={payload=>{if(payload.signal?.aborted)return false;return runtime.current?.startPrepared(payload)===true;}}/>}
  {call&&<ConversationInterview moduleId="asylum" lang={call.language} avatar={call.interviewer} mode={call.mode} initialQuestion={call.question} context={call.context||''} entryConsent={call.entryConsent===true} onBack={()=>{call.stop();setCall(null);window.location.hash='/asylum/setup';}}/>}
 </>;
}
