import './EmailTrialAccount.css';
import GoogleSignInButton from './GoogleSignInButton.jsx';
import PasswordSignIn from './PasswordSignIn.jsx';
import {saveCheckoutIntent,readCheckoutIntent,clearCheckoutIntent,pendingGuestCheckout,resumeGuestCheckout} from "./checkoutIntent.mjs";
import {lastAccountEmail,rememberAccountEmail} from "./accountStorage.js";
import {PRO_PLAN} from "../shared/featureAccessConfig.js";
import {billingErrorMessage} from "./billingMessages.mjs";
import {useRef,useState} from 'react';

const focus='focus-visible:outline-2! focus-visible:outline-offset-4! focus-visible:outline-blue-600!';
const button=`trial-glass-button min-h-12! rounded-xl! border! border-blue-700! bg-blue-700! px-5! py-3! font-semibold! text-white! disabled:opacity-50! ${focus}`;
export default function EmailTrialAccount({language='es',session,usage,billing,webBillingEnabled,openCheckout,startEmailTrial,sendMagicLink,signOut,onContinue,modalRef,embedded,onClose,signInError=false}){
 const es=language==='es',t=(a,b)=>es?a:b;
 const billingReturn=new URLSearchParams(window.location.search).get('billing');
 const expired=usage?.access?.status==='trial_expired';
 const [email,setEmail]=useState(session?.user?.email||lastAccountEmail()),[verify,setVerify]=useState(()=>Boolean(signInError)),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [selectedPlan,setSelectedPlan]=useState(()=>readCheckoutIntent(session?.user?.email||lastAccountEmail()));
 const signingIn=verify;
 const inFlight=useRef(false);
 const [openingCheckout,setOpeningCheckout]=useState(false);
 const [billingReference,setBillingReference]=useState('');
 const captureReference=error=>setBillingReference(/^req_[a-zA-Z0-9]{4,80}$/.test(error?.reference||'')?error.reference:'');
 async function submit(event){
  event.preventDefault();if(inFlight.current)return;inFlight.current=true;setBusy(true);setMessage('');setBillingReference('');
  try{
   if(signingIn){const plan=readCheckoutIntent(email);if(plan)saveCheckoutIntent(plan,email);const {error}=await sendMagicLink(email.trim());if(error)throw error;setMessage(t('Revisa tu correo y abre el enlace seguro para continuar.','Check your email and open the secure link to continue.'));}
   else{await startEmailTrial(email.trim());onContinue();}
  }catch(error){
   captureReference(error);
   if(error.code==='verification_required'){setVerify(true);setMessage(t('Para un correo ya registrado o al cambiar de dispositivo, usa el enlace seguro. Así protegemos tu cuenta y conservamos las fechas de tu prueba.','For a registered email or a different device, use the secure link to protect your account and preserve your trial dates.'));}
   else setMessage(t('No pudimos continuar. Comprueba el correo y vuelve a intentarlo.','Could not continue. Check your email and try again.'));
  }finally{inFlight.current=false;setBusy(false);}
 }
 async function subscribe(interval){
  if(inFlight.current)return;
  saveCheckoutIntent(interval,email);setSelectedPlan(interval);setVerify(false);setMessage('');setBillingReference('');
  inFlight.current=true;setBusy(true);setOpeningCheckout(true);
  try{await openCheckout(interval);}catch(error){captureReference(error);setMessage(billingErrorMessage({code:error.name==='TimeoutError'?'checkout_timeout':error.code},language));}
  finally{inFlight.current=false;setBusy(false);setOpeningCheckout(false);}
 }
 const content=<section ref={modalRef} role={embedded?'region':'dialog'} aria-modal={embedded?undefined:true} aria-labelledby="email-trial-title" className={`email-trial-account mx-auto! my-6! max-w-3xl! space-y-5! rounded-3xl! border! border-white/50! bg-white/95! p-5! text-slate-900! shadow-sm! backdrop-blur-md! sm:p-8! ${embedded?'':'fixed! inset-x-4! top-8! z-50! max-h-[85dvh]! overflow-y-auto!'}`}>
  {!embedded&&<button type="button" className={`min-h-11! rounded-xl! bg-slate-100! px-4! text-slate-800! ${focus}`} onClick={onClose}>{t('Cerrar','Close')}</button>}
  <h1 id="email-trial-title" className="m-0! text-3xl! font-bold! text-slate-950!">{verify?t('Verifica tu correo para continuar','Verify your email to continue'):expired?t('Tu prueba gratuita terminó','Your free trial has ended'):t('Tu cuenta de Immigra','Your Immigra account')}</h1>
  <p className="text-base! leading-relaxed! text-slate-600!">{!webBillingEnabled?t('Entra para consultar tu acceso a entrevistas e IA. El estudio gratuito sigue disponible. Las compras no están disponibles en esta versión de la app.','Sign in to check your interview and AI access. Free study remains available. Purchases are not available in this version of the app.'):verify?t('Usa el enlace seguro para entrar o administrar una cuenta existente. Si elegiste un plan, continuaremos después de entrar.','Use the secure link to sign in or manage an existing account. If you selected a plan, we will continue after sign-in.'):expired?t('El estudio gratuito sigue disponible. Elige una suscripción para continuar con entrevistas e IA.','Free study remains available. Choose a subscription to continue interviews and AI.'):t('Crea tu cuenta para probar entrevistas e IA durante 7 días, sin tarjeta. Si ya tienes cuenta, inicia sesión.','Create your account to try interviews and AI for 7 days, with no card. Already have an account? Sign in.')}</p>
  {openingCheckout&&<p role="status" className="rounded-xl! bg-blue-50! p-4! font-semibold! text-blue-950!">{t('Abriendo el pago seguro de Stripe…','Opening secure Stripe checkout…')}</p>}
  {pendingGuestCheckout()&&<button type="button" className={button} disabled={busy} onClick={()=>resumeGuestCheckout()}>{t('Ya inicié una compra · comprobar pago','I started a purchase · check payment')}</button>}
  {billingReturn==='success'&&<div role="status" className="rounded-2xl! bg-emerald-50! p-4! text-emerald-950!">{usage?.tier==='pro'?t('Tu suscripción está activa. Ya puedes continuar.','Your subscription is active. You can continue now.'):t('Estamos comprobando tu suscripción con Stripe. El acceso se activa cuando el servidor confirma el pago.','We are checking your subscription with Stripe. Access activates when the server confirms payment.')}</div>}
  {billingReturn==='cancelled'&&<p role="status" className="rounded-2xl! bg-blue-50! p-4! text-blue-950!">{t('Puedes retomar el pago eligiendo tu plan.','You can resume checkout by choosing your plan.')}</p>}
  <div className={`trial-content-grid ${webBillingEnabled&&usage?.tier!=='pro'?'trial-content-grid--plans':''}`}>
  <div className="trial-access-column">
  {!session&&<div className="trial-access-choices" role="group" aria-label={t('Acceso a tu cuenta','Account access')}>
   <button type="button" className="trial-glass-button" disabled={busy} aria-pressed={!signingIn} onClick={()=>setVerify(false)}>{t('Crear cuenta','Create account')}</button>
   <button type="button" className="trial-glass-button" disabled={busy} aria-pressed={signingIn} onClick={()=>setVerify(true)}>{t('Iniciar sesión','Sign in')}</button>
  </div>}
  <div className="trial-access-panel">
  {(!session||verify)&&<GoogleSignInButton language={language} disabled={busy} onBusyChange={setBusy}/>}
  {session&&!verify?<div className="space-y-3! rounded-2xl! bg-emerald-50! p-5! text-emerald-950!">
   <strong>{session.user.email}</strong><p>{usage?.tier==='pro'?t('Tu suscripción está activa.','Your subscription is active.'):expired?t('Elige un plan para continuar con entrevistas e IA.','Choose a plan to continue interviews and AI.'):usage?.access?.status==='trial_active'?t(`Prueba activa · ${usage.access.remainingDays??7} días restantes.`,`Trial active · ${usage.access.remainingDays??7} days remaining.`):t('Tu acceso está preparado. La prueba comienza con tu primera práctica de pago.','Your access is ready. The trial starts with your first paid-feature practice.')}</p>
   {!expired&&<button type="button" className={button} disabled={busy} onClick={onContinue}>{t('Continuar practicando','Continue practicing')}</button>}
  </div>:<form onSubmit={submit} className="space-y-3!" aria-busy={busy}>
   {!signingIn&&<><h2 className="text-xl! font-bold! text-slate-900!">{t('Prueba gratis durante 7 días','Try free for 7 days')}</h2><p className="text-sm! text-slate-600!">{t('Empieza con tu correo, sin contraseña ni tarjeta.','Start with your email, no password or card needed.')}</p></>}
   {signingIn&&<p className="text-base! text-slate-700!">{t('Para acceder a una cuenta existente, confirma tu identidad con el enlace seguro. Después de los siete días, las entrevistas y funciones de pago requieren una suscripción activa.','To access an existing account, verify your identity with a secure link. After seven days, interviews and paid features require an active subscription.')}</p>}
   <label htmlFor="email-trial-email" className="block! font-semibold!">{t('Correo electrónico','Email address')}</label>
   <input id="email-trial-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event=>setEmail(event.target.value)} disabled={busy} className={`min-h-12! w-full! rounded-xl! border! border-slate-300! bg-white! px-4! py-3! text-base! text-slate-900! ${focus}`}/>
   <button type="submit" disabled={busy} className={`${button} w-full!`}>{busy?t('Un momento…','One moment…'):signingIn?t('Enviar enlace seguro','Send secure link'):t('Comenzar gratis con mi correo','Start free with my email')}</button>
  </form>}
  {(!session||verify)&&<PasswordSignIn language={language} disabled={busy} onBusyChange={setBusy}/>}
  </div>
  <details className="trial-access-help"><summary>{t('Sobre tu acceso y la prueba gratuita','About your access and free trial')}</summary>
  <p className="text-sm! leading-relaxed! text-slate-600!">{t('Este dispositivo recordará tu acceso para que no tengas que escribir el correo cada vez. Si cierras sesión, borras los datos del navegador o cambias de dispositivo, tendrás que entrar otra vez. Esto no reinicia la prueba gratuita.','This device remembers your access so you do not need to enter your email every time. Signing out, clearing browser data or switching devices requires signing in again. This does not restart your free trial.')}</p>
  </details>
  {!session&&email&&<button type="button" onClick={()=>{clearCheckoutIntent();rememberAccountEmail('');setEmail('');setVerify(false);setSelectedPlan(null);setMessage('');document.getElementById('email-trial-email')?.focus();}} className={`min-h-11! rounded-xl! trial-text-action bg-transparent! px-2! text-blue-800! underline! ${focus}`}>{t('Usar otra cuenta','Use another account')}</button>}
  {signInError&&<p role="alert" className="rounded-xl! bg-amber-50! p-4! text-amber-950!">{t('El enlace de acceso venció o no es válido. Solicita uno nuevo y abre únicamente el correo más reciente.','The sign-in link expired or is invalid. Request a new link and open only the latest email.')}</p>}
  {message&&<p role="status" className="rounded-xl! bg-blue-50! p-4! text-sm! leading-relaxed! text-blue-950!">{message}</p>}
  {billingReference&&<p className="text-sm! text-slate-600!">{t('Referencia para soporte: ','Support reference: ')}<code>{billingReference}</code></p>}
  <p className="text-sm! leading-relaxed! text-slate-600!">{t('Después de la prueba necesitas una suscripción activa para continuar con entrevistas e IA. El estudio gratuito sigue disponible. No hay cobros automáticos al registrar tu correo.','After the trial, an active subscription is needed to continue interviews and AI. Free study remains available. Entering your email never creates automatic charges.')}</p>

  </div>
  {webBillingEnabled&&usage?.tier!=='pro'&&<section className="trial-plans space-y-3! rounded-2xl! border! border-slate-200! bg-slate-50! p-5!" aria-labelledby="trial-plans-title">
   <h2 id="trial-plans-title" className="text-xl! font-bold! text-slate-900!">{t('¿Quieres suscribirte? Elige PRO','Ready to subscribe? Choose PRO')}</h2>
   <p className="text-sm! text-slate-600!">{t('Entrevistas con Sahara, Kevin y William y práctica con IA. Paga de forma segura con Stripe y vincula la suscripción a tu cuenta.','Interviews with Sahara, Kevin and William and AI practice. Pay securely with Stripe and link the subscription to your account.')}</p>
   <div className="trial-plan-options">{[['monthly',(billing.introductoryOfferEnabled?billing.introductoryMonthlyPriceCents:billing.monthlyPriceCents)??PRO_PLAN.regularMonthlyPriceCents,t('Mensual','Monthly')],['annual',billing.annualPriceCents??PRO_PLAN.annualPriceCents,t('Anual','Annual')]].map(([interval,cents,label])=><button type="button" key={interval} className={`${button} trial-plan`} disabled={busy} aria-pressed={selectedPlan===interval} onClick={()=>subscribe(interval)}><span className="trial-plan-label">{selectedPlan===interval&&<span aria-hidden="true">✓ </span>}{label}</span><span className="trial-plan-price">{new Intl.NumberFormat(es?'es-US':'en-US',{style:'currency',currency:'USD'}).format(Number(cents)/100)}<span className="trial-plan-interval">{interval==='monthly'?t(' / mes',' / month'):t(' / año',' / year')}</span></span><span className="trial-plan-period">{interval==='monthly'?t('Cobro mensual','Billed monthly'):t('Un cobro por el año completo','One payment for the full year')}</span><span className="trial-plan-action">{t('Elegir plan','Choose plan')} <span aria-hidden="true">→</span></span></button>)}</div>
   <p className="text-sm! text-slate-600!">{t('Renovación automática del plan contratado. Revisa el importe y las condiciones antes de confirmar el pago.','Your purchased plan renews automatically. Review the amount and terms before confirming payment.')}</p>
  </section>}

  </div>
  {session&&!signingIn&&<button type="button" className={`min-h-11! rounded-xl! trial-text-action bg-transparent! px-2! font-semibold! text-blue-800! underline! ${focus}`} onClick={()=>{if(session){clearCheckoutIntent();setSelectedPlan(null);}setVerify(true);}}>{session?t('Verificar correo para administrar mi cuenta','Verify email to manage my account'):t('Ya tengo cuenta · Iniciar sesión','I already have an account · Sign in')}</button>}
  {session&&<button type="button" className={`min-h-11! rounded-xl! trial-text-action bg-transparent! px-2! text-slate-700! underline! ${focus}`} disabled={busy} onClick={async()=>{setBusy(true);setMessage('');try{await signOut();}catch{setMessage(t('No pudimos cerrar la sesión. Revisa la conexión y vuelve a intentarlo.','Could not sign out. Check your connection and try again.'));}finally{setBusy(false);}}}>{t('Salir de este dispositivo','Sign out on this device')}</button>}
  <a href="#/settings" className="inline-flex! min-h-11! items-center! text-sm! text-blue-800! underline!">{t('Privacidad y documentos legales','Privacy and legal documents')}</a>
 </section>;
 return content;
}
