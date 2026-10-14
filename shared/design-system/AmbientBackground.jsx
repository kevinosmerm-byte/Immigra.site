import {useGlass} from './Glass.jsx';
import React,{useEffect,useRef,useState} from 'react';
import './ambient.css';

const poster='/media/ambient-20261014.jpg';
export default function AmbientBackground({inCall=false}){
 const {preferences}=useGlass();
 const ref=useRef(null),[paused,setPaused]=useState(false),[unavailable,setUnavailable]=useState(false);
 useEffect(()=>{
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const sync=()=>{
   const video=ref.current;if(!video)return;
   video.muted=true;
   if(paused||preferences.reduceMotion||media.matches||document.hidden||(!inCall&&document.body.classList.contains('in-call')))video.pause();
   else video.play().catch(()=>{});
  };
  sync();media.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);document.addEventListener('pointerup',sync);document.addEventListener('touchend',sync);
  const observer=new MutationObserver(sync);observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  return()=>{
   ref.current?.pause();observer.disconnect();media.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);document.removeEventListener('pointerup',sync);document.removeEventListener('touchend',sync);
  };
 },[paused,inCall,preferences.reduceMotion,unavailable]);
 const es=document.documentElement.lang==='es';
 return <>
  <div className={`ambient-background pointer-events-none! inset-0! overflow-hidden! bg-[#030305]! bg-cover! bg-center! ${inCall?'absolute! z-0!':'fixed! -z-10!'}`} style={{backgroundImage:`url("${poster}")`}} aria-hidden="true">
   {!unavailable&&<video ref={ref} className="h-full! w-full! object-cover! opacity-100!" src="/media/ambient-20261014.mp4" poster={poster} muted autoPlay loop playsInline preload="metadata" tabIndex={-1} onError={()=>setUnavailable(true)}/>}
   <div className="absolute! inset-0! bg-black/65!"/>
  </div>
  {!unavailable&&<button type="button" className="ambient-toggle min-h-11! rounded-xl! border-white/20! bg-slate-900/90! text-white! backdrop-blur-md! focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-blue-500!" onClick={()=>setPaused(v=>!v)} aria-pressed={paused}>{es?(paused?'Animar fondo':'Pausar fondo'):(paused?'Play background':'Pause background')}</button>}
 </>;
}
