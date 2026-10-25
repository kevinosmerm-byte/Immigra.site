export const destination='AW-17910999514/oryYCMy6yKkdENrT0NxC';
export function validReceipt(r){return Boolean(r&&/^[a-f0-9]{64}$/.test(r.transaction_id)&&Number.isFinite(r.value)&&r.value>0&&r.currency==='USD');}
export function sendPayment(win,doc,receipt,onComplete=()=>{}){
 if(win.location.origin!=='https://immigra.site'||win.location.pathname!=='/payment-confirmation.html'||win.location.search||win.location.hash||!validReceipt(receipt)||doc.getElementById('payment-google-tag'))return false;
 const key='immigra.payment-measured.'+receipt.transaction_id;
 try{if(win.localStorage.getItem(key))return false;}catch{}
 win.dataLayer=win.dataLayer||[];win.gtag=function(){win.dataLayer.push(arguments);};
 win.gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
 win.gtag('set','ads_data_redaction',true);
 win.gtag('consent','update',{ad_storage:'granted',analytics_storage:'denied',ad_user_data:'granted',ad_personalization:'denied'});
 win.gtag('js',new Date());
 win.gtag('config','AW-17910999514',{send_page_view:false,allow_ad_personalization_signals:false,allow_google_signals:false,page_location:'https://immigra.site/payment-confirmation.html',page_referrer:'',page_title:'IMMIGRA'});
 win.gtag('event','conversion',{send_to:destination,value:receipt.value,currency:receipt.currency,transaction_id:receipt.transaction_id,event_callback:()=>{try{win.localStorage.setItem(key,'1');}catch{}onComplete();}});
 const script=doc.createElement('script');script.id='payment-google-tag';script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id=AW-17910999514';doc.head.append(script);return true;
}
export async function initConfirmation(win,doc){
 const es=!/^en\b/i.test(win.navigator.language||'es'),t=(a,b)=>es?a:b,$=id=>doc.getElementById(id);
 doc.documentElement.lang=es?'es':'en';
 $('title').textContent=t('Tu suscripción','Your subscription');$('continue').textContent=t('Continuar a mi cuenta','Continue to my account');$('privacy').textContent=t('Privacidad','Privacy');$('privacy').href=es?'/privacidad':'/privacy';
 $('choice-title').textContent=t('Medición opcional del pago','Optional payment measurement');
 $('explanation').textContent=t('¿Permites informar a Google Ads de este pago para medir nuestros anuncios? Se enviarán el importe, la moneda y un identificador técnico de transacción, además de datos técnicos y cookies publicitarias. No enviamos tu correo, respuestas ni documentos. No usamos anuncios personalizados. Tu acceso no depende de aceptar.','May we report this payment to Google Ads to measure our advertising? We send the amount, currency and an opaque transaction identifier, plus technical data and advertising cookies. We do not send your email, answers or documents. We do not use personalized ads. Your access does not depend on accepting.');
 $('accept').textContent=t('Aceptar medición','Accept measurement');$('decline').textContent=t('Rechazar','Decline');
 try{
  const response=await win.fetch('/api/billing/measurement-receipt',{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(10000)});
  const {receipt}=await response.json();
  if(!response.ok||!validReceipt(receipt))throw Error('No receipt');
  $('status').textContent=t('Pago confirmado. Puedes continuar a tu cuenta.','Payment confirmed. You can continue to your account.');
  let decision;try{decision=win.localStorage.getItem('immigra.payment-decision.'+receipt.transaction_id);}catch{}
  if(decision)return;
  $('measurement').hidden=false;
  const finish=()=>{$('measurement').hidden=true;};
  $('decline').addEventListener('click',()=>{try{win.localStorage.setItem('immigra.payment-decision.'+receipt.transaction_id,'declined');}catch{}finish();});
  $('accept').addEventListener('click',()=>{sendPayment(win,doc,receipt,()=>{try{win.localStorage.setItem('immigra.payment-decision.'+receipt.transaction_id,'accepted');}catch{}});finish();});
 }catch{$('status').textContent=t('Esta confirmación ha caducado o no está disponible. Consulta tu suscripción en tu cuenta; no vuelvas a pagar.','This confirmation has expired or is unavailable. Check your subscription in your account; do not pay again.');}
}
if(typeof window!=='undefined')void initConfirmation(window,document);
