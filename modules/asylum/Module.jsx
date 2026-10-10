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
 const [call,setCall]=useState(null);
 useEffect(()=>{runtime.current=mountAsylum(ref.current,setCall,lang);return ()=>runtime.current?.();},[]);
 useEffect(()=>runtime.current?.setLanguage(lang),[lang]);
 return <>
  {!call&&<ModuleNavigation items={items} current={route} label={lang==='es'?'Asilo':'Asylum'} onNavigate={id=>{window.location.hash='/asylum/'+id;}}/>}
  <section className="asylum-surface" data-asylum-route={route} ref={ref} hidden={Boolean(call)}/>
  {call&&<ConversationInterview moduleId="asylum" lang={call.language} avatar={call.interviewer} mode={call.mode} initialQuestion={call.question} context={call.context||''} onBack={()=>{call.stop();setCall(null);window.location.hash='/asylum/setup';}}/>}
 </>;
}
