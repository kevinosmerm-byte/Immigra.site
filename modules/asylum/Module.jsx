import {ModuleNavigation} from '../../shared/design-system/Components.jsx';
import React,{useEffect,useRef,useState} from 'react';
import {mountAsylum} from './runtime.generated.js';
import CallView from '../../shared/interview-ui/CallView.jsx';
import './packages/design/style.css';
import './packages/design/master.css';
import '../../shared/design-system/platform.css';
export default function Asylum({lang='es'}){
 const [route,setRoute]=useState(()=>window.location.hash.split('/')[2]||'practice');
 useEffect(()=>{if(/^#\/asylum\/?$/.test(window.location.hash))window.location.hash='/asylum/practice';const sync=()=>setRoute(window.location.hash.split('/')[2]||'practice');window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync);},[]);
 const items=lang==='es'?[['practice','Inicio'],['fiction','Casos ficticios'],['case-workspace','Mi expediente'],['full-bank','Preguntas'],['practice-report','Informe'],['vault','Mis datos']]:[['practice','Home'],['fiction','Fictional cases'],['case-workspace','My case'],['full-bank','Questions'],['practice-report','Report'],['vault','My data']];
 const ref=useRef();const [call,setCall]=useState(null),[paused,setPaused]=useState(false),[captions,setCaptions]=useState(true),[draft,setDraft]=useState(''),[mic,setMic]=useState(false),[speaking,setSpeaking]=useState(false),[elapsed,setElapsed]=useState(0),[error,setError]=useState('');
 const click=selector=>ref.current?.querySelector(selector)?.click();
 useEffect(()=>mountAsylum(ref.current,c=>{setCall(c);setDraft('');setPaused(false);setError('');}),[]);
 useEffect(()=>{if(!call)return;const observer=new MutationObserver(()=>{setMic(ref.current.querySelector('#mic-start')?.getAttribute('aria-pressed')==='true');setSpeaking(ref.current.querySelector('#interviewer-video')?.getAttribute('src')?.includes('-speaking')||false);const text=ref.current.querySelector('#voice-status')?.textContent||'';setError(/denegado|denied|no est|unavailable|no pudo|failed/i.test(text)?text:'');setDraft(ref.current.querySelector('#master-answer')?.value||'');});observer.observe(ref.current,{subtree:true,attributes:true,childList:true,characterData:true});return()=>observer.disconnect();},[call]);
 const inCall=!!call;
 useEffect(()=>{if(!inCall){setElapsed(0);return;}const id=setInterval(()=>setElapsed(v=>v+1),1000);return()=>clearInterval(id);},[inCall]);
 const update=value=>{const input=ref.current.querySelector('#master-answer');if(input){input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));}setDraft(value);};
 return <>{!inCall&&<ModuleNavigation items={items} current={route} label="Asilo" onNavigate={id=>{window.location.hash='/asylum/'+id;}}/>}<section className="asylum-surface" ref={ref} hidden={inCall}/>{call&&<CallView moduleId="asylum" lang={call.language} state={paused?'paused':speaking?'speaking':'listening'} elapsed={elapsed} muted={!mic} captions={[{who:'ai',text:call.question}]} showCaptions={captions} onCaptions={()=>setCaptions(v=>!v)} onMic={()=>{if(!paused)click(mic?'#voice-stop':'#mic-start');}} onRepeat={()=>click('#voice-repeat')} onPause={()=>{call.stop();setPaused(v=>!v);}} onSuspend={()=>{call.stop();setPaused(true);}} onFinish={()=>{call.stop();click('[data-master="finish"]');}} interviewerName={call.interviewer==='kevin'?'Kevin':'Sahara'} interviewType={call.language==='es'?'Asilo':'Asylum'} mediaBase={'/modules/asylum/assets/'+call.interviewer+'-'} mode={call.mode} error={error}>
 <form onSubmit={e=>{e.preventDefault();click('[data-master="answer"]');}}><input aria-label={call.language==='es'?'Respuesta revisada':'Reviewed answer'} value={draft} disabled={paused} maxLength={10000} onChange={e=>update(e.target.value)}/><button disabled={paused||!draft.trim()}>{call.language==='es'?'Continuar':'Continue'}</button></form>
 {paused&&<details><summary>{call.language==='es'?'Revisar y opciones':'Review and options'}</summary><button onClick={()=>click('[data-master="uncertain"]')}>No recuerdo / Unsure</button><button onClick={()=>click('[data-master="skip"]')}>Omitir / Skip</button><p>La evaluación opcional y la revisión del expediente se conservan en el módulo.</p><button onClick={()=>{call.stop();setCall(null);}}>Abrir revisión de respuesta</button></details>}
 </CallView>}</>;
}
