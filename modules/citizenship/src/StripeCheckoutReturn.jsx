import {useEffect,useRef,useState} from 'react';
import {billingErrorMessage} from './billingMessages.mjs';
import {lastAccountEmail} from './accountStorage.js';
import {useAccount} from './accountContext.js';

const action='min-h-12! rounded-2xl! border! border-white/70! bg-[var(--color-primary,#2563A6)]! px-5! py-3! font-semibold! text-white! shadow-sm! focus-visible:outline-2! focus-visible:outline-offset-4! focus-visible:outline-[var(--color-primary,#2563A6)]! disabled:opacity-50!';
export default function StripeCheckoutReturn({language='es',checkoutId,loading,embedded,modalRef,onClose}){
 const {session,completeGuestCheckout,sendMagicLink,signOut,configured}=useAccount();
 const es=language==='es',t=(a,b)=>es?a:b;
 const [recoveryEmail,setRecoveryEmail]=useState(lastAccountEmail);
 const [state,setState]=useState({code:'checking'}),[attempt,setAttempt]=useState(0),[sending,setSending]=useState(false),[sent,setSent]=useState(false),[sendError,setSendError]=useState(false);
 const inFlight=useRef(false);
 useEffect(()=>{
  if(loading)return;
  let active=true,timer;const controller=new AbortController();let polls=0;
  async function check(){
   setState({code:'checking'});
   try{
    const result=await completeGuestCheckout(checkoutId,controller.signal);
    if(!active)return;
    if(result.pending){if(++polls<5)timer=setTimeout(check,2500);else setState({code:'pending'});}
   }catch(error){if(active)setState({code:error.code||'checkout_unavailable',email:error.email,reference:error.reference});}
  }
  void check();return()=>{active=false;clearTimeout(timer);controller.abort();};
 },[checkoutId,session?.user?.id,session?.isEmailTrial,loading,attempt]);
 const checking=loading||state.code==='checking', verify=['verification_required','checkout_verification_required','checkout_email_mismatch','checkout_owner_mismatch','invalid_session','authentication_required'].includes(state.code);
 async function send(){if(inFlight.current)return;inFlight.current=true;setSending(true);setSendError(false);try{const result=await sendMagicLink(state.email||session?.user?.email||recoveryEmail);if(result.error)throw result.error;setSent(true);}catch{setSendError(true);}finally{setSending(false);inFlight.current=false;}}
 return <section ref={modalRef} role={embedded?'region':'dialog'} aria-modal={embedded?undefined:true} aria-labelledby="checkout-return-title" className={`mx-auto! my-6! max-w-2xl! space-y-5! rounded-3xl! border! border-white/70! bg-[var(--liquid-surface)]! p-6! text-[var(--liquid-text)]! shadow-xl! backdrop-blur-xl! sm:p-8! ${embedded?'':'fixed! inset-x-4! top-8! z-50! max-h-[85dvh]! overflow-y-auto!'}`}>
  {!embedded&&<button type="button" onClick={onClose} className={action}>{t('Cerrar','Close')}</button>}
  <h1 id="checkout-return-title" className="text-2xl! font-bold!">{checking?t('Comprobando tu suscripción…','Checking your subscription…'):verify?t('Protege el acceso a tu cuenta','Protect access to your account'):t('Tu suscripción','Your subscription')}</h1>
  <p role="status" className="text-base! leading-relaxed!">{checking?t('Estamos confirmando el pago con Stripe. No vuelvas a comprar.','We are confirming your payment with Stripe. Do not purchase again.'):verify?t('Para vincular la compra a una cuenta existente, verifica el correo que usaste en Stripe mediante un enlace seguro. No necesitas volver a pagar.','To link your purchase to an existing account, verify the email you used in Stripe with a secure sign-in link. You do not need to pay again.'):state.code==='pending'?t('Stripe todavía no ha confirmado el pago. Puedes comprobarlo de nuevo sin repetir la compra.','Stripe has not confirmed payment yet. You can check again without purchasing again.'):state.code==='subscription_already_active'?t('Esta cuenta ya tiene otra suscripción activa. No compres otra vez. Contacta con soporte para revisar la compra.','This account already has another active subscription. Do not purchase again. Contact support to review the purchase.'):state.code==='checkout_subscription_inactive'?t('Esta suscripción ya no está activa. Revisa su estado con soporte.','This subscription is no longer active. Contact support to review its status.'):billingErrorMessage(state,language)}</p>
  {verify&&<>
   {state.email&&<p className="break-words! font-semibold!">{state.email}</p>}
   {['checkout_email_mismatch','invalid_session','authentication_required'].includes(state.code)&&session?<button className={action} type="button" disabled={sending} onClick={async()=>{setSending(true);try{await signOut();setAttempt(v=>v+1);}catch{setSendError(true);}finally{setSending(false);}}}>{t('Usar la cuenta del pago','Use the payment account')}</button>:<>
    {!state.email&&!session?.user?.email&&<label className="block! space-y-2!">{t('Correo que usaste en Stripe','Email you used in Stripe')}<input type="email" required autoComplete="email" value={recoveryEmail} onChange={e=>setRecoveryEmail(e.target.value)} className="min-h-12! w-full! rounded-xl! border! border-slate-300! bg-white! px-4! text-[var(--color-text,#172B3D)]!"/></label>}
    <button className={action} type="button" disabled={sending||!configured||!(state.email||session?.user?.email||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail))} onClick={send}>{sending?t('Enviando…','Sending…'):sent?t('Enviar otro enlace seguro','Send another secure link'):t('Enviar enlace seguro','Send secure link')}</button>
   </>}

   {sent&&<p role="status">{t('Revisa tu correo y abre el enlace más reciente. Conservaremos la compra para continuar.','Check your email and open the latest link. We will keep your purchase ready to continue.')}</p>}
  </>}
  {!checking&&<button type="button" className={action} onClick={()=>setAttempt(v=>v+1)}>{t('Comprobar de nuevo','Check again')}</button>}
  {sendError&&<p role="alert">{t('No pudimos continuar. Revisa la conexión e inténtalo de nuevo.','Could not continue. Check your connection and try again.')}</p>}
  {state.reference&&<p>{t('Referencia para soporte: ','Support reference: ')}{state.reference}</p>}
  {!checking&&<a href="mailto:info@citizenshipai.us" className="inline-flex! min-h-12! items-center! underline!">{t('Contactar con soporte','Contact support')}</a>}
 </section>;
}
