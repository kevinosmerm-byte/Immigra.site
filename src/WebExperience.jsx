import React,{useEffect,useRef} from 'react';
import {modules} from './modules.js';
import {howItWorksVideo} from './home-study.mjs';

export function WebHeader({lang,setLang,page}) {
  const t=(es,en)=>lang==='es'?es:en;
  const menuRef=useRef(null);
  const closeMenu=()=>{if(menuRef.current)menuRef.current.open=false;};
  useEffect(()=>{
    const dismiss=event=>{if(menuRef.current&&!menuRef.current.contains(event.target))menuRef.current.open=false;};
    document.addEventListener('pointerdown',dismiss);
    window.addEventListener('hashchange',closeMenu);
    return()=>{document.removeEventListener('pointerdown',dismiss);window.removeEventListener('hashchange',closeMenu);};
  },[]);
  return <header className="website-header">
    <a className="website-brand" href="#/" aria-label={t('IMMIGRA · Inicio','IMMIGRA · Home')}>IMMIGRA</a>
    <div className="website-actions">
      <details className="website-menu" ref={menuRef} onKeyDown={event=>{if(event.key==='Escape'){closeMenu();menuRef.current?.querySelector('summary')?.focus();}}}>
        <summary>{t('Menú','Menu')}<span aria-hidden="true">⌄</span></summary>
        <nav aria-label={t('Navegación principal','Main navigation')} onClick={event=>{if(event.target.closest('a'))closeMenu();}}>
          <a href="#/" aria-current={!page?'page':undefined}>{t('Inicio','Home')}</a>
          <a href="#/account">{t('Planes','Plans')}</a>
          <a href="#/help" aria-current={page==='help'?'page':undefined}>{t('Recursos','Resources')}</a>
          <a href="#/settings" aria-current={page==='settings'?'page':undefined}>{t('Ajustes','Settings')}</a>
          <a href={howItWorksVideo} target="_blank" rel="noopener noreferrer">{t('Cómo funciona','How it works')}</a>
        </nav>
      </details>
      <a className="website-account" href="#/account" aria-label={t('Mi cuenta','My account')} aria-current={page==='account'?'page':undefined}>{t('Cuenta','Account')}</a>
      <button className="website-language" type="button" onClick={()=>{closeMenu();setLang(lang==='es'?'en':'es');}} aria-label={t('Cambiar a inglés','Switch to Spanish')}>{lang==='es'?'ES':'EN'}</button>
    </div>
  </header>;
}

export function WebHome({lang}) {
  const t=(es,en)=>lang==='es'?es:en;
  return <div className="website-home"><section className="website-hero"><div><p className="website-kicker">{t('APRENDE. PRACTICA. AVANZA.','LEARN. PRACTICE. MOVE FORWARD.')}</p><h1>{t('Prepárate para tu próximo paso.','Prepare for your next step.')}</h1><p className="website-intro">{t('Un espacio para estudiar, practicar entrevistas y organizar tu preparación migratoria. A tu ritmo y desde donde estés.','A space to study, practice interviews and organize your immigration preparation. At your own pace, wherever you are.')}</p><a className="website-primary" href="#/citizenship">{t('Explorar ciudadanía','Explore citizenship')} <span aria-hidden="true">↗</span></a><p className="website-note">{t('También encontrarás herramientas para asilo y residencia.','You will also find tools for asylum and residency.')}</p></div><aside className="website-overview" aria-label={t('Áreas de preparación','Preparation areas')}><span className="website-kicker">IMMIGRA.site</span><h2>{t('Tres caminos. Un lugar para prepararte.','Three paths. One place to prepare.')}</h2>{modules.map(m=><a href={`#/${m.id}`} key={m.id}><img src={`/images/home/${m.id}-20261014.png`} alt="" width="56" height="56"/><span><strong>{lang==='es'?m.es:m.en}</strong><small>{lang==='es'?m.descEs:m.descEn}</small></span><span aria-hidden="true">→</span></a>)}</aside></section><section className="website-tools"><p className="website-kicker">{t('PREPARACIÓN A TU MEDIDA','PREPARATION THAT FITS YOU')}</p><h2>{t('Elige por dónde comenzar','Choose where to begin')}</h2><div className="website-grid">{modules.map((m,i)=><article key={m.id} style={{'--web-accent':m.color}}><span className="website-number">0{i+1}</span><h3>{lang==='es'?m.es:m.en}</h3><p>{lang==='es'?m.descEs:m.descEn}</p><a href={`#/${m.id}`}>{t('Explorar herramientas','Explore tools')} →</a></article>)}</div></section><section className="website-explainer"><h2>{t('Practica con un propósito, sin prisas.','Practice with purpose, at your own pace.')}</h2><p>{t('Elige tu área, explora los recursos y comienza una práctica cuando estés listo. Tu cuenta y tus herramientas siguen en el mismo lugar.','Choose your area, explore the resources and start a practice when you are ready. Your account and tools are still in the same place.')}</p><a href="#/help">{t('Conocer los recursos de ayuda','Explore help resources')} →</a><p className="website-note">{t('IMMIGRA es una herramienta educativa independiente. No está afiliada al Gobierno ni ofrece asesoría legal.','IMMIGRA is an independent educational tool. It is not affiliated with the government and does not provide legal advice.')}</p></section></div>;
}
