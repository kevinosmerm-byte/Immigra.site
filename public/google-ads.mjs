// Google Ads is restricted to public, static preparation pages. Never load it
// in the SPA, where navigation can expose personal interview/account screens.
export const adsId='AW-17910999514';
const key='immigra.ads-consent.v1';
export function eligible(location){const params=new URLSearchParams(location.search);const safeQuery=[...params].every(([k,v])=>['gclid','gbraid','wbraid','gad_source','gad_campaignid'].includes(k)&&/^[A-Za-z0-9_-]{1,256}$/.test(v));return location.protocol==='https:'&&location.hostname==='immigra.site'&&safeQuery&&!location.hash&&/^\/(ciudadania|asilo|residencia|en\/(citizenship|asylum|residency))\/?$/.test(location.pathname);}
export function installAds(win,doc){
 if(!eligible(win.location)||doc.getElementById('immigra-google-tag'))return false;
 win.dataLayer=win.dataLayer||[];
 win.gtag=win.gtag||function(){win.dataLayer.push(arguments);};
 win.gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
 win.gtag('set','ads_data_redaction',true);
 win.gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'denied',analytics_storage:'denied'});
 win.gtag('js',new Date());
 win.gtag('config',adsId,{allow_ad_personalization_signals:false,allow_google_signals:false,page_location:win.location.origin+win.location.pathname,page_referrer:'',page_title:'IMMIGRA.site'});
 const script=doc.createElement('script');script.id='immigra-google-tag';script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+adsId;doc.head.append(script);return true;
}
export function initAdsConsent(win,doc){
 if(!eligible(win.location))return;
 const es=doc.documentElement.lang==='es',t=(a,b)=>es?a:b;
 let choice;try{choice=win.localStorage.getItem(key);}catch{}
 if(choice==='granted')installAds(win,doc);
 const samplePage=doc.body.dataset?.seoModule==='citizenship';
 let sampleConsent=false;
 try { sampleConsent=win.localStorage.getItem('immigra.sample-measurement.v1')==='granted'; } catch {}
 let answered=false;
 const sent=new Set();
 function countSample(stage){
   if(!samplePage||choice!=='granted'||!sampleConsent||sent.has(stage))return;
   const key='immigra.sample-event.v1:'+doc.documentElement.lang+':'+stage;
   try { if(win.sessionStorage.getItem(key))return; } catch {}
   sent.add(stage);
   const query=new URLSearchParams(win.location.search);
   const source=['gclid','gbraid','wbraid','gad_campaignid'].some(k=>query.has(k))?'ads':'other';
   win.fetch('/api/account/public-practice-count',{method:'POST',credentials:'omit',referrerPolicy:'no-referrer',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({stage,language:es?'es':'en',source})})
    .then(r=>{if(!r.ok)throw Error();try{win.sessionStorage.setItem(key,'1');}catch{}}).catch(()=>{sent.delete(stage);});
 }
 if(samplePage){countSample('visit');doc.addEventListener('immigra:sample-completed',()=>{answered=true;countSample('answered');});}
 const region=doc.createElement('section');region.className='ads-consent';region.setAttribute('aria-label',t('Preferencias de medición','Measurement preferences'));
 const text=doc.createElement('p');text.textContent=t('¿Permites medir visitas con Google Ads en estas páginas públicas? Google puede recibir datos técnicos y utilizar cookies. No enviamos tus respuestas ni datos de cuenta. Puedes rechazar sin perder funciones.','Allow Google Ads measurement on these public pages? Google may receive technical data and use cookies. We do not send your answers or account data. You can decline without losing features.');
 if(samplePage)text.textContent+=' '+t('IMMIGRA también cuenta visitas y primeras preguntas practicadas de forma anónima.','IMMIGRA also counts visits and first questions practiced anonymously.');
 const accept=doc.createElement('button');accept.textContent=t('Aceptar medición','Accept measurement');
 const reject=doc.createElement('button');reject.textContent=t('Rechazar','Decline');
 const privacy=doc.createElement('a');privacy.href=es?'/privacidad':'/privacy';privacy.textContent=t('Privacidad','Privacy');
 const preferences=doc.createElement('button');preferences.className='ads-preferences';preferences.textContent=t('Preferencias de medición','Measurement preferences');
 const save=value=>{choice=value;sampleConsent=value==='granted';if(samplePage){try{win.localStorage.setItem('immigra.sample-measurement.v1',value);}catch{}}countSample('visit');if(answered)countSample('answered');try{win.localStorage.setItem(key,value);}catch{}region.hidden=true;if(value==='granted')installAds(win,doc);else if(doc.getElementById('immigra-google-tag'))win.location.reload();};
 accept.addEventListener('click',()=>save('granted'));reject.addEventListener('click',()=>save('denied'));preferences.addEventListener('click',()=>{region.hidden=false;reject.focus();});
 region.append(text,accept,reject,privacy);region.hidden=Boolean(choice)&&!(samplePage&&choice==='granted'&&!sampleConsent);doc.body.append(region);(doc.querySelector('footer')||doc.body).append(preferences);
}
if(typeof window!=='undefined')initAdsConsent(window,document);
