import React,{useEffect,useRef,useState} from 'react';
import './ambient.css';
export default function AmbientBackground({inCall=false}){
 const ref=useRef(null),[paused,setPaused]=useState(false);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>{const video=ref.current;if(!video)return;video.muted=true;if(paused||media.matches||document.hidden||(!inCall&&document.body.classList.contains('in-call')))video.pause();else video.play().catch(()=>{});};sync();media.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);const observer=new MutationObserver(sync);observer.observe(document.body,{attributes:true,attributeFilter:['class']});return()=>{observer.disconnect();media.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);};},[paused,inCall]);
 return <><div className="ambient-background" aria-hidden="true"><video ref={ref} src="/media/ambient-background.mp4" poster="/media/ambient-poster.jpg" muted loop playsInline preload="metadata" tabIndex={-1}/></div><button className="ambient-toggle" onClick={()=>setPaused(v=>!v)} aria-pressed={paused}>{document.documentElement.lang==='es'?(paused?'Animar fondo':'Pausar fondo'):(paused?'Play background':'Pause background')}</button></>;
}
