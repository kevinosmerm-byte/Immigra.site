import {useEffect,useRef,useState} from 'react';

export default function InterviewerVideo({mediaBase,interviewerName,speaking,paused,reduced,lang='es'}){
 const videos=useRef({}),[visible,setVisible]=useState('listening'),[ready,setReady]=useState({}),[posterMissing,setPosterMissing]=useState(false);
 const wanted=speaking?'speaking':'listening';
 const person=/^(sarah|sahara)$/i.test(interviewerName)?'sahara':interviewerName.toLowerCase();
 useEffect(()=>{
  let cancelled=false,frame=null,raf=null,settle=null;
  const next=videos.current[wanted],mounted=Object.values(videos.current);
  const stopPending=()=>{if(frame!==null)next?.cancelVideoFrameCallback?.(frame);if(raf!==null)cancelAnimationFrame(raf);clearTimeout(settle);frame=null;raf=null;};
  const commit=()=>{
   if(cancelled||next?.readyState<2)return;
   setReady(old=>old[wanted]?old:{...old,[wanted]:true});setVisible(wanted);
   settle=setTimeout(()=>{for(const [mode,video] of Object.entries(videos.current))if(mode!==wanted)video?.pause();},reduced?0:180);
  };
  const present=()=>{
   if(cancelled||next?.readyState<2)return;
   stopPending();
   if(paused||reduced||document.hidden){commit();return;}
   if(next.requestVideoFrameCallback)frame=next.requestVideoFrameCallback(commit);
   else raf=requestAnimationFrame(()=>{raf=requestAnimationFrame(commit);});
  };
  const sync=()=>{
   stopPending();
   for(const video of Object.values(videos.current))if(video)video.muted=true;
   if(paused||reduced||document.hidden){for(const video of Object.values(videos.current))video?.pause();if(!document.hidden)present();return;}
   next?.play().then(present).catch(()=>{});
  };
  next?.addEventListener('loadeddata',sync);next?.addEventListener('canplay',sync);
  document.addEventListener('visibilitychange',sync);document.addEventListener('pointerup',sync);sync();
  return()=>{cancelled=true;stopPending();next?.removeEventListener('loadeddata',sync);next?.removeEventListener('canplay',sync);document.removeEventListener('visibilitychange',sync);document.removeEventListener('pointerup',sync);for(const video of mounted)video?.pause();};
 },[wanted,paused,reduced,mediaBase]);
 return <>
  {!posterMissing&&<img className="interviewer-poster absolute! inset-0! h-full! w-full! rounded-none! object-cover! object-[center_22%]! pointer-events-none!" src={`/interviewer/portraits/${person}.jpg`} alt="" aria-hidden="true" onError={()=>setPosterMissing(true)}/>}
  {posterMissing&&!ready.listening&&!ready.speaking&&<div className="call-avatar">{interviewerName.slice(0,1)}<span>{interviewerName}</span></div>}
  {['listening','speaking'].map(mode=><video key={mode} ref={element=>{videos.current[mode]=element;}} src={`${mediaBase}${mode}.mp4`} data-interviewer-mode={mode} className="pointer-events-none! will-change-[opacity]! backface-hidden! motion-reduce:transition-none!" muted loop playsInline preload="auto" aria-hidden={visible!==mode} aria-label={(lang==='es'?'Video de ':'Video of ')+interviewerName} style={{opacity:ready[mode]&&(mode==='listening'||visible==='speaking')?1:0,transition:reduced?'none':'opacity 180ms ease-out'}}/>)}
 </>;
}
