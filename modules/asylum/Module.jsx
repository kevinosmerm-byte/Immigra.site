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
  <section className="asylum-surface [&_button[data-scenario]]:min-h-12! [&_button[data-scenario]]:rounded-2xl! [&_button[data-scenario]]:border-purple-300/75! [&_button[data-scenario]]:bg-purple-200/60! [&_button[data-scenario]]:bg-linear-to-b! [&_button[data-scenario]]:from-white/75! [&_button[data-scenario]]:via-purple-200/60! [&_button[data-scenario]]:to-purple-300/65! [&_button[data-scenario]]:font-semibold! [&_button[data-scenario]]:text-purple-950! [&_button[data-scenario]]:backdrop-blur-xl! [&_button[data-scenario]]:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(126,34,206,0.15),0_6px_16px_-8px_rgba(107,33,168,0.35)]! [&_button[data-scenario]]:transition-[background-color,box-shadow,transform]! [&_button[data-scenario]]:duration-200! [&_button[data-scenario]:hover]:bg-purple-300/75! [&_button[data-scenario]:active]:translate-y-px! [&_button[data-scenario]:focus-visible]:outline-2! [&_button[data-scenario]:focus-visible]:outline-offset-4! [&_button[data-scenario]:focus-visible]:outline-purple-700! motion-reduce:[&_button[data-scenario]]:transition-none! motion-reduce:[&_button[data-scenario]:active]:translate-y-0! [[data-reduce-transparency=true]_&_button[data-scenario]]:bg-purple-100! [[data-reduce-transparency=true]_&_button[data-scenario]]:bg-none! [[data-reduce-transparency=true]_&_button[data-scenario]]:backdrop-blur-none!" data-asylum-route={route} ref={ref} hidden={Boolean(call)||prepared}/>
  {prepared&&!call&&<AsylumPreparation language={lang} onBack={()=>{window.location.hash='/asylum/practice';}} onStart={payload=>{if(payload.signal?.aborted)return false;return runtime.current?.startPrepared(payload)===true;}}/>}
  {call&&<ConversationInterview moduleId="asylum" lang={call.language} avatar={call.interviewer} mode={call.mode} initialQuestion={call.question} context={call.context||''} entryConsent={call.entryConsent===true} onBack={()=>{call.stop();setCall(null);window.location.hash='/asylum/setup';}}/>}
 </>;
}
