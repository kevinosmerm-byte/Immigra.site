import {useEffect,useState,useRef} from 'react';
import {registerPlugin} from '@capacitor/core';
import './AppleSubscriptionPlans.css';
const store=registerPlugin('ImmigraSubscriptions');
async function withStoreTimeout(operation) {
  let timer;
  try {
    return await Promise.race([operation, new Promise((_, reject) => {
      timer=setTimeout(()=>reject(Error('apple_store_timeout')),20000);
    })]);
  } finally { clearTimeout(timer); }
}
export default function AppleSubscriptionPlans({session,language,onVerified}) {
  const es=language==='es';
  const [plans,setPlans]=useState([]),[busy,setBusy]=useState('loading'),[message,setMessage]=useState(''),[ready,setReady]=useState(false);
  const active=useRef(true);
  const request=async(path,body)=>{
    const response=await fetch(`/api/apple-billing/${path}`,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
    const data=await response.json();
    if(!response.ok)throw Error(data.code||'apple_unavailable');
    return data;
  };
  const verify=async signedTransaction=>{
    const result=await request('sync',{signedTransaction});
    if(!result.verified)throw Error('apple_verification_unavailable');
    await store.finish({id:result.transactionId});
    await onVerified();
    return result.active;
  };
  const failure=()=>setMessage(es?'No pudimos completar la operación. No vuelvas a comprar si ya confirmaste el pago: utiliza Restaurar compras para recuperar el acceso.':'We could not complete this action. If you already confirmed payment, use Restore purchases instead of buying again.');
  const load=async()=>{
    setBusy('loading');setMessage('');
    try{
      const config=await request('status');
      if(!config.enabled)throw Error('apple_billing_unavailable');
      const result=await withStoreTimeout(store.products({ids:config.productIds}));
      if(!result.plans?.length)throw Error('apple_product_unavailable');
      if(active.current){setPlans(result.plans);setReady(true);}
      try {
        const pending=await withStoreTimeout(store.pending());
        for(const transaction of pending.transactions||[])await verify(transaction);
      } catch { if(active.current)failure(); }
    }catch{if(active.current){setReady(false);setMessage(es?'No se pudieron cargar las suscripciones de App Store. Puedes reintentar.':'App Store subscriptions could not be loaded. Please retry.');}}
    finally{if(active.current)setBusy('');}
  };
  useEffect(()=>{
    active.current=true;let listener;
    void load();
    store.addListener('transactionAvailable',({signedTransaction})=>{if(active.current)void verify(signedTransaction).catch(failure);}).then(value=>{if(active.current)listener=value;else void value.remove();}).catch(()=>{if(active.current)failure();});
    return()=>{active.current=false;void listener?.remove();};
  },[session.user.id]);
  const purchase=async id=>{
    if(busy)return;setBusy(id);setMessage('');
    try{
      // Check server readiness before showing Apple's payment confirmation.
      if(!(await request('status')).enabled)throw Error('apple_billing_unavailable');
      const result=await store.purchase({id,accountToken:session.user.id});
      if(result.status==='purchased'){
        const enabled=await verify(result.signedTransaction);
        setMessage(enabled?(es?'Suscripción verificada. PRO está activo.':'Subscription verified. PRO is active.'):(es?'Compra verificada; la suscripción no está activa.':'Purchase verified; the subscription is not active.'));
      }else if(result.status==='pending')setMessage(es?'Compra pendiente de aprobación de Apple.':'Purchase is pending Apple approval.');
    }catch{failure();}finally{setBusy('');}
  };
  const restore=async()=>{
    if(busy)return;setBusy('restore');setMessage('');
    try{
      const result=await store.restore();let enabled=false;
      for(const transaction of result.transactions||[])enabled=(await verify(transaction))||enabled;
      setMessage(enabled?(es?'Compras restauradas. PRO está activo.':'Purchases restored. PRO is active.'):(es?'No hay suscripciones activas de Apple para esta cuenta.':'No active Apple subscriptions were found for this account.'));
    }catch{failure();}finally{setBusy('');}
  };
  return <div className="account-billing-actions apple-subscription-plans">
    {plans.map(plan=><button key={plan.id} type="button" disabled={Boolean(busy)||!ready} onClick={()=>purchase(plan.id)}><b>{plan.id.endsWith('.monthly')?(es?'Mensual':'Monthly'):(es?'Anual':'Annual')}</b><small>{plan.price}</small></button>)}
    {!ready&&<button type="button" disabled={Boolean(busy)} onClick={load}>{es?'Cargar planes de App Store':'Load App Store plans'}</button>}
    <button type="button" disabled={Boolean(busy)} onClick={restore}>{es?'Restaurar compras':'Restore purchases'}</button>
    {busy&&<p role="status">{es?'Conectando con App Store…':'Connecting to App Store…'}</p>}
    {message&&<p role="status">{message}</p>}
    <p>{es?'Pago mediante tu cuenta de Apple. La suscripción se renueva automáticamente hasta que la canceles en los ajustes de suscripciones de Apple.':'Payment through your Apple account. Your subscription renews automatically until cancelled in Apple subscription settings.'}</p>
    <a href="https://apps.apple.com/account/subscriptions" target="_blank" rel="noreferrer">{es?'Gestionar suscripciones de Apple':'Manage Apple subscriptions'}</a>
    <a href="https://immigra.site/terms" target="_blank" rel="noreferrer">{es?'Términos de uso':'Terms of use'}</a>
    <a href="https://immigra.site/privacy" target="_blank" rel="noreferrer">{es?'Política de privacidad':'Privacy policy'}</a>
  </div>;
}
