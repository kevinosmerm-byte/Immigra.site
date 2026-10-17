import {useGlass} from './Glass.jsx';
import React,{useEffect,useRef,useState} from 'react';
import './ambient.css';

const poster='/media/ambient-6177df6a.jpg';
export default function AmbientBackground({inCall=false}){
 const {preferences}=useGlass();
 const ref=useRef(null),[unavailable,setUnavailable]=useState(false);
 useEffect(()=>{
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const sync=()=>{
   const video=ref.current;if(!video)return;
   video.muted=true;
   if(preferences.reduceMotion||media.matches||document.hidden||(!inCall&&document.body.classList.contains('in-call')))video.pause();
   else video.play().catch(()=>{});
  };
  sync();media.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);document.addEventListener('pointerup',sync);document.addEventListener('touchend',sync);
  const observer=new MutationObserver(sync);observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  return()=>{
   ref.current?.pause();observer.disconnect();media.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);document.removeEventListener('pointerup',sync);document.removeEventListener('touchend',sync);
  };
 },[inCall,preferences.reduceMotion,unavailable]);
 return <>
  <div className={`ambient-background pointer-events-none! inset-0! overflow-hidden! bg-[#f6f8fa]! bg-cover! bg-center! ${inCall?'absolute! z-0!':'fixed! -z-10!'}`} style={{backgroundImage:`url("${poster}")`}} aria-hidden="true">
   {!unavailable&&<video ref={ref} className="h-full! w-full! object-cover! opacity-100!" src="/media/ambient-6177df6a.mp4" poster={poster} muted autoPlay loop playsInline preload="metadata" tabIndex={-1} onError={()=>setUnavailable(true)}/>}
  </div>
 </>;
}
