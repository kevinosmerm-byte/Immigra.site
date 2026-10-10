import {THEME_STORAGE_KEY,normalizeThemePreference,resolveTheme} from '../../modules/citizenship/src/theme.js';
import './liquid-glass.css';
import {createContext,useContext,useEffect,useRef,useState} from 'react';

export const MODULE_THEMES=Object.freeze({citizenship:'#175CD3',asylum:'#7944C6',residency:'#168464'});
const GlassContext=createContext({moduleId:'citizenship',preferences:{},setPreferences:()=>{}});
export function useGlass(){return useContext(GlassContext);}
const preferenceKey='immigrationai.visual.preferences.v1';
export function GlassProvider({moduleId,children}) {
 const [preferences,setPreferences]=useState(()=>{try{return JSON.parse(localStorage.getItem(preferenceKey))||{};}catch{return {};}});
 useEffect(()=>{
  const media=matchMedia('(prefers-color-scheme:light)');
  const apply=()=>{let pref='light';try{pref=normalizeThemePreference(localStorage.getItem(THEME_STORAGE_KEY));}catch{}document.documentElement.dataset.theme=resolveTheme(pref,media.matches);};
  apply();media.addEventListener('change',apply);window.addEventListener('storage',apply);
  return()=>{media.removeEventListener('change',apply);window.removeEventListener('storage',apply);};
 },[]);
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
export function GlassCard({as:Tag='section',className='',...props}) {return <Tag className={`glass-card liquid-glass ${className}`} {...props}/>;}
export function GlassTabBar({items,current,onNavigate,label,className=''}) {return <nav className={`glass-tabs liquid-glass ${className}`} aria-label={label}>{items.map(([id,text])=><GlassButton key={id} aria-current={current===id?'page':undefined} onClick={()=>onNavigate(id)}>{({home:"home",civics:"▤",practice:"target",progress:"▥"})[id]&&<GlassIcon name={({home:"home",civics:"▤",practice:"target",progress:"▥"})[id]}/>}<span>{text}</span></GlassButton>)}</nav>;}
export function GlassProgress({value=0,max=100,label,className=''}) {const safeMax=max>0?max:100;return <progress className={`glass-progress ${className}`} value={Math.max(0,Math.min(safeMax,value))} max={safeMax} aria-label={label}/>;}
export function GlassModal({dialogRef,className='',...props}) {return <dialog ref={dialogRef} className={`glass-modal ${className}`} {...props}/>;}
export function GlassInterviewControl({className='',...props}) {return <GlassButton className={`glass-interview-control ${className}`} {...props}/>;}
export function GlassStudyCard({as:Tag='article',flipped=false,mastered=false,className='',children,...props}) {
 const {moduleId}=useContext(GlassContext),previous=useRef(mastered);
 const [celebrate,setCelebrate]=useState(false);
 useEffect(()=>{let timer;if(moduleId==='citizenship'&&mastered&&!previous.current){setCelebrate(true);timer=setTimeout(()=>setCelebrate(false),1100);}previous.current=mastered;return()=>clearTimeout(timer);},[mastered,moduleId]);
 return <Tag {...props} className={`glass-study-card ${flipped?'is-flipped':''} ${celebrate?'study-achievement':''} ${className}`} data-flipped={flipped}>{children}{celebrate&&<span className="glass-achievement" aria-hidden="true">✓</span>}</Tag>;
}

export function GlassSection({title,description,icon,children,className='',...props}) {
 return <GlassCard className={`glass-section ${className}`} {...props}><div className="glass-section-heading">{icon&&<span className="glass-icon" aria-hidden="true">{typeof icon==='string'?<GlassIcon name={icon}/>:icon}</span>}<div><h2>{title}</h2>{description&&<p>{description}</p>}</div></div>{children}</GlassCard>;
}
export function GlassToggle({label,description,icon,checked,onChange,disabled=false}) {
 return <GlassCard as="label" className="glass-toggle"><span className="glass-icon" aria-hidden="true">{typeof icon==='string'?<GlassIcon name={icon}/>:icon}</span><input type="checkbox" role="switch" aria-label={label} checked={checked} onChange={onChange} disabled={disabled}/><strong>{label}</strong><span>{description}</span></GlassCard>;
}
export function GlassAccordion({title,children,className='',...props}) {
 return <GlassCard as="details" className={`glass-accordion ${className}`} {...props}><summary>{title}<span aria-hidden="true">⌄</span></summary><div className="glass-accordion-body">{children}</div></GlassCard>;
}

export function GlassIcon({name}) {
 const paths={
 'home':'m2 11 10-9 10 9M5 9v13h5v-7h4v7h5V9',
 'target':'M21 12a9 9 0 1 1-9-9M17 12a5 5 0 1 1-5-5M12 12l9-9M17 3h4v4',
 '⚙':'M10 2h4l1 3 3 1 3 2-1 4 1 4-3 2-3 1-1 3h-4l-1-3-3-1-3-2 1-4-1-4 3-2 3-1Z M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0',
 '♧':'m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6Z M8 12l3 3 5-6',
 '▤':'M5 2h9l5 5v15H5Z M14 2v6h5 M8 12h8 M8 16h8',
 '◧':'M3 3h18v18H3ZM3 12h18M12 12v9',
 '∿':'M2 12h4l3-8 5 16 3-8h5',
 '▯':'M6 2h12v20H6ZM10 18h4',
 '↓':'M12 2v13m-5-5 5 5 5-5M4 16v5h16v-5',
 '⇩':'M12 2v13m-5-5 5 5 5-5M4 16v5h16v-5',
 '⌫':'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7',
 '◎':'M16 7a4 4 0 1 0-8 0 4 4 0 0 0 8 0 M4 22v-3c0-8 16-8 16 0v3Z',
 '♔':'m3 5 5 5 4-7 4 7 5-5-2 14H5ZM5 22h14',
 '✎':'m3 16 13-13 5 5L8 21H3Zm10-10 5 5',
 '♬':'M4 4h16v13H9l-5 4Z M8 9h8m-8 4h5',
 '▥':'M3 12h4v10H3ZM10 3h4v19h-4ZM17 8h4v14h-4Z',
 'i':'M22 12a10 10 0 1 0-20 0 10 10 0 0 0 20 0 M12 11v6m0-10v1',
 '☼':'M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0 M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2'
 };
 return <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]||paths['▤']}/></svg>;
}
