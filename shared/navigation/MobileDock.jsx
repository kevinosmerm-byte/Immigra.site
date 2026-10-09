import {FreeIcon} from '../design-system/PremiumIcon.jsx';
import {useEffect,useRef,useState} from 'react';
import './mobile-dock.css';

export default function MobileDock({lang,navigate,modules,Icon}) {
 const [open,setOpen]=useState(false),[showModules,setShowModules]=useState(false);
 const root=useRef(null),toggle=useRef(null);
 const t=(es,en)=>lang==='es'?es:en;
 useEffect(()=>{
  const close=()=>{setOpen(false);setShowModules(false);};
  const outside=e=>{if(!root.current?.contains(e.target))close();};
  const scroll=()=>{if(!root.current?.contains(document.activeElement))close();};
  const key=e=>{if(e.key==='Escape'&&open){close();toggle.current?.focus();}};
  window.addEventListener('hashchange',close);
  document.addEventListener('pointerdown',outside);
  window.addEventListener('scroll',scroll,{passive:true});
  document.addEventListener('keydown',key);
  return()=>{window.removeEventListener('hashchange',close);document.removeEventListener('pointerdown',outside);window.removeEventListener('scroll',scroll);document.removeEventListener('keydown',key);};
 },[open]);
 const go=route=>{setOpen(false);setShowModules(false);navigate(route);};
 return <div ref={root} className={'mobile-dock'+(open?' is-open':'')}>
  <div id="mobile-dock-panel" className="mobile-dock-panel" inert={!open} aria-hidden={!open}>
   {showModules&&<div className="mobile-dock-modules" id="mobile-dock-modules">{modules.map(m=><button key={m.id} onClick={()=>go(m.id)}>{lang==='es'?m.es:m.en}</button>)}</div>}
   <nav aria-label={t('Navegación rápida','Quick navigation')}>
    <button onClick={()=>go('help')}><span className="dock-help" aria-hidden="true">?</span><span>{t('Ayuda','Help')}</span></button>
    <button onClick={()=>go('')}><FreeIcon name="home-01"/><span>{t('Inicio','Home')}</span></button>
    <button onClick={()=>setShowModules(v=>!v)} aria-expanded={showModules} aria-controls="mobile-dock-modules"><FreeIcon name="menu-01"/><span>{t('Módulos','Modules')}</span></button>
    <button onClick={()=>go('account')}><Icon name="user"/><span>{t('Cuenta','Account')}</span></button>
   </nav>
  </div>
  <button ref={toggle} className="mobile-dock-toggle" aria-controls="mobile-dock-panel" aria-expanded={open} aria-label={open?t('Ocultar navegación','Hide navigation'):t('Mostrar navegación','Show navigation')} onClick={()=>{setOpen(v=>!v);setShowModules(false);}}><span aria-hidden="true"/>{t('Menú','Menu')}<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d={open?'m4 6 4 4 4-4':'m4 10 4-4 4 4'} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>
 </div>;
}
