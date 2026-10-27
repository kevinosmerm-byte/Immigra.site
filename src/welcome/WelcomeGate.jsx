import React,{useEffect,useState} from 'react';
import {moduleFromHash} from '../../shared/navigation/routes.mjs';
import WelcomeExperience from './WelcomeExperience.jsx';
import {accepted,initialLanguage,readAcceptance,requiresWelcome,saveAcceptance} from './state.mjs';
const safeStorage={getItem(key){try{return localStorage.getItem(key);}catch{return null;}},setItem(key,value){try{localStorage.setItem(key,value);}catch{}}};
let memoryAcceptance=null;
export const getSessionWelcomeLanguage=()=>memoryAcceptance?.language;
export default function WelcomeGate({children}) {
  const [page,setPage]=useState(()=>moduleFromHash(location.hash,location.search));
  const [record,setRecord]=useState(()=>memoryAcceptance||readAcceptance(safeStorage));
  useEffect(()=>{const sync=()=>setPage(moduleFromHash(location.hash,location.search));window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync);},[]);
  const review=page==='welcome';
  if(review||(requiresWelcome(page)&&!accepted(record)))return <WelcomeExperience initialLanguage={initialLanguage(safeStorage,record?.language||navigator.language)} onComplete={language=>{
    memoryAcceptance=saveAcceptance(safeStorage,language);
    const url=new URL(location.href);
    // A marketing-language hint must not override the explicit welcome choice.
    if(url.searchParams.has("lang")){url.searchParams.delete("lang");history.replaceState(history.state,"",url.pathname+url.search+url.hash);}
    setRecord(memoryAcceptance);
    if(review)location.hash='/';
    // Preserve the complete destination hash and all non-language query parameters.
  }}/>;
  return children;
}
