import {withDeadline} from '../shared/async-deadline.mjs';
// A failed Vite CSS preload leaves React.lazy rejected until a page reload.
// Retry only the named, same-origin stylesheet before retrying the module.
// Do not reload the app: another module may contain unsaved practice state.
export async function loadModule(load,{doc=globalThis.document,origin=globalThis.location?.origin,timeout=12000,importModule=url=>import(/* @vite-ignore */ url)}={}) {
 try{return await withDeadline(load,timeout);}catch(error){
  const script=/^Failed to fetch dynamically imported module: (.+)$/.exec(error?.message||'');
  const match=script||/^Unable to preload CSS for (.+)$/.exec(error?.message||'');
  if(!match)throw error;
  let url;try{url=new URL(match[1],origin);}catch{throw error;}
  if(url.origin!==origin||!/^\/assets\/[^/]+\.(css|js)$/.test(url.pathname)||url.username||url.password)throw error;
  if(script){url.searchParams.set('immigra_retry','1');return withDeadline(()=>importModule(url.href),timeout);}
  await new Promise((resolve,reject)=>{
   const link=doc.createElement('link');link.rel='stylesheet';link.href=url.href;
   const timer=setTimeout(()=>finish(false),timeout);
   function finish(ok){clearTimeout(timer);link.onload=null;link.onerror=null;if(ok)resolve();else{link.remove();reject(error);}}
   link.onload=()=>finish(true);link.onerror=()=>finish(false);doc.head.appendChild(link);
  });
  return withDeadline(load,timeout);
 }
}
