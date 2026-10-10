import {useGlass} from './Glass.jsx';
import React,{useEffect,useRef,useState} from 'react';
import './ambient.css';
export default function AmbientBackground({inCall=false}){
 const {preferences}=useGlass();
 const [hash,setHash]=useState(window.location.hash);
 useEffect(()=>{const sync=()=>setHash(window.location.hash);window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync);},[]);
 const animated=inCall||['','#/','#'].includes(hash)||hash==='#/citizenship/civics';
 const ref=useRef(null),[paused,setPaused]=useState(false);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>{const video=ref.current;if(!video)return;video.muted=true;if(paused||preferences.reduceMotion||media.matches||document.hidden||(!inCall&&document.body.classList.contains('in-call')))video.pause();else video.play().catch(()=>{});};sync();media.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);document.addEventListener('pointerup',sync);document.addEventListener('touchend',sync);const observer=new MutationObserver(sync);observer.observe(document.body,{attributes:true,attributeFilter:['class']});return()=>{observer.disconnect();media.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);document.removeEventListener('pointerup',sync);document.removeEventListener('touchend',sync);};},[paused,inCall,animated,preferences.reduceMotion]);
 return <><div className="ambient-background" aria-hidden="true">{animated&&<video ref={ref} src="/media/ambient-background.mp4" poster="/media/ambient-poster.jpg" muted autoPlay loop playsInline preload="metadata" tabIndex={-1}/>}</div>{animated&&<button className="ambient-toggle" onClick={()=>setPaused(v=>!v)} aria-pressed={paused}>{document.documentElement.lang==='es'?(paused?'Animar fondo':'Pausar fondo'):(paused?'Play background':'Pause background')}</button>}</>;
}
