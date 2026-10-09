import {createContext,useContext,useEffect,useRef,useState} from 'react';

export const MODULE_THEMES=Object.freeze({citizenship:'#175CD3',asylum:'#7944C6',residency:'#168464'});
const GlassContext=createContext({moduleId:'citizenship',preferences:{},setPreferences:()=>{}});
export function useGlass(){return useContext(GlassContext);}
const preferenceKey='immigrationai.visual.preferences.v1';
export function GlassProvider({moduleId,children}) {
 const [preferences,setPreferences]=useState(()=>{try{return JSON.parse(localStorage.getItem(preferenceKey))||{};}catch{return {};}});
 const previousModule=useRef('citizenship');
 if(MODULE_THEMES[moduleId])previousModule.current=moduleId;
 const active=previousModule.current;
 useEffect(()=>{
  const root=document.documentElement;
  root.dataset.glassModule=active;
  root.dataset.reduceTransparency=preferences.reduceTransparency?'true':'false';
  root.dataset.reduceMotion=preferences.reduceMotion?'true':'false';
  try{localStorage.setItem(preferenceKey,JSON.stringify(preferences));}catch{/* Preferences remain usable without storage. */}
 },[active,preferences]);
 useEffect(()=>{
  if(!preferences.haptics||preferences.reduceMotion)return;
  const feedback=e=>{if(e.isTrusted&&e.target.closest?.('button:not(:disabled)')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)navigator.vibrate?.(8);};
  document.addEventListener('click',feedback);return()=>document.removeEventListener('click',feedback);
 },[preferences.haptics,preferences.reduceMotion]);
 return <GlassContext.Provider value={{moduleId:active,preferences,setPreferences}}>{children}</GlassContext.Provider>;
}
export function GlassPreferences({language='es'}) {
 const {preferences,setPreferences}=useContext(GlassContext);
 const es=language==='es';
 return <GlassCard className="glass-preferences"><h2>{es?'Accesibilidad visual':'Visual accessibility'}</h2><p>{es?'Adapta la apariencia a tu comodidad.':'Adjust the appearance to your comfort.'}</p>{[
  ['reduceTransparency',es?'Reducir transparencia':'Reduce transparency'],
  ['reduceMotion',es?'Reducir movimiento':'Reduce motion'],
  ['haptics',es?'Vibración al tocar (si el dispositivo la admite)':'Touch vibration (when supported)'],
 ].map(([key,label])=><label key={key}><input type="checkbox" checked={Boolean(preferences[key])} onChange={e=>setPreferences(p=>({...p,[key]:e.target.checked}))}/>{label}</label>)}</GlassCard>;
}
export function GlassButton({variant='secondary',className='',...props}) {return <button className={`glass-button glass-${variant} ${className}`} {...props}/>;}
export function GlassCard({as:Tag='section',className='',...props}) {return <Tag className={`glass-card ${className}`} {...props}/>;}
export function GlassTabBar({items,current,onNavigate,label,className=''}) {return <nav className={`glass-tabs ${className}`} aria-label={label}>{items.map(([id,text])=><GlassButton key={id} aria-current={current===id?'page':undefined} onClick={()=>onNavigate(id)}>{text}</GlassButton>)}</nav>;}
export function GlassProgress({value=0,max=100,label,className=''}) {const safeMax=max>0?max:100;return <progress className={`glass-progress ${className}`} value={Math.max(0,Math.min(safeMax,value))} max={safeMax} aria-label={label}/>;}
export function GlassModal({dialogRef,className='',...props}) {return <dialog ref={dialogRef} className={`glass-modal ${className}`} {...props}/>;}
export function GlassInterviewControl({className='',...props}) {return <GlassButton className={`glass-interview-control ${className}`} {...props}/>;}
export function GlassStudyCard({as:Tag='article',flipped=false,mastered=false,className='',children,...props}) {
 const {moduleId}=useContext(GlassContext),previous=useRef(mastered);
 const [celebrate,setCelebrate]=useState(false);
 useEffect(()=>{let timer;if(moduleId==='citizenship'&&mastered&&!previous.current){setCelebrate(true);timer=setTimeout(()=>setCelebrate(false),1100);}previous.current=mastered;return()=>clearTimeout(timer);},[mastered,moduleId]);
 return <Tag {...props} className={`glass-study-card ${flipped?'is-flipped':''} ${celebrate?'study-achievement':''} ${className}`} data-flipped={flipped}>{children}{celebrate&&<span className="glass-achievement" aria-hidden="true">✓</span>}</Tag>;
}
