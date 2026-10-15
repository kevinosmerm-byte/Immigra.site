import {saveCheckoutIntent,readCheckoutIntent} from "./checkoutIntent.mjs";
import {lastAccountEmail,rememberAccountEmail} from "./accountStorage.js";
import {PRO_PLAN} from "../shared/featureAccessConfig.js";
import {useRef,useState} from 'react';

const focus='focus-visible:outline-2! focus-visible:outline-offset-4! focus-visible:outline-blue-600!';
const button=`min-h-12! rounded-xl! border! border-blue-700! bg-blue-700! px-5! py-3! font-semibold! text-white! disabled:opacity-50! ${focus}`;
export default function EmailTrialAccount({language='es',session,usage,billing,webBillingEnabled,startEmailTrial,sendMagicLink,signOut,onContinue,modalRef,embedded,onClose,signInError=false}){
 const es=language==='es',t=(a,b)=>es?a:b;
 const expired=usage?.access?.status==='trial_expired';
 const [email,setEmail]=useState(session?.user?.email||lastAccountEmail()),[verify,setVerify]=useState(()=>Boolean(signInError||readCheckoutIntent(session?.user?.email||lastAccountEmail()))),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [selectedPlan,setSelectedPlan]=useState(()=>readCheckoutIntent(session?.user?.email||lastAccountEmail()));
 const form=useRef(null);
 const signingIn=verify||expired;
 async function submit(event){
  event.preventDefault();if(busy)return;setBusy(true);setMessage('');
  try{
   if(signingIn){const plan=readCheckoutIntent(email);if(plan)saveCheckoutIntent(plan,email);const {error}=await sendMagicLink(email.trim());if(error)throw error;setMessage(t('Revisa tu correo y abre el enlace seguro para continuar.','Check your email and open the secure link to continue.'));}
   else{await startEmailTrial(email.trim());onContinue();}
  }catch(error){
   if(error.code==='verification_required'){setVerify(true);setMessage(t('Para un correo ya registrado o al cambiar de dispositivo, usa el enlace seguro. Así protegemos tu cuenta y conservamos las fechas de tu prueba.','For a registered email or a different device, use the secure link to protect your account and preserve your trial dates.'));}
   else setMessage(t('No pudimos continuar. Comprueba el correo y vuelve a intentarlo.','Could not continue. Check your email and try again.'));
  }finally{setBusy(false);}
 }
 function subscribe(interval){
  saveCheckoutIntent(interval,email);setSelectedPlan(interval);setVerify(true);setMessage(t('Para abrir Stripe, primero confirma tu correo. Pulsa «Enviar enlace seguro» y abre el enlace recibido; continuaremos con el plan que elegiste.','To open Stripe, first verify your email. Select “Send secure link” and open the email link; we will continue with your selected plan.'));
  requestAnimationFrame(()=>{form.current?.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});form.current?.querySelector('input')?.focus({preventScroll:true});});
 }
 const content=<section ref={modalRef} role={embedded?'region':'dialog'} aria-modal={embedded?undefined:true} aria-labelledby="email-trial-title" className={`mx-auto! my-6! max-w-3xl! space-y-5! rounded-3xl! border! border-white/50! bg-white/95! p-5! text-slate-900! shadow-sm! backdrop-blur-md! sm:p-8! ${embedded?'':'fixed! inset-x-4! top-8! z-50! max-h-[85dvh]! overflow-y-auto!'}`}>
  {!embedded&&<button type="button" className={`min-h-11! rounded-xl! bg-slate-100! px-4! text-slate-800! ${focus}`} onClick={onClose}>{t('Cerrar','Close')}</button>}
  <h1 id="email-trial-title" className="m-0! text-3xl! font-bold! text-slate-950!">{verify?t('Verifica tu correo para continuar','Verify your email to continue'):expired?t('Tu prueba gratuita terminó','Your free trial has ended'):t('Prueba Immigra gratis durante 7 días','Try Immigra free for 7 days')}</h1>
  <p className="text-base! leading-relaxed! text-slate-600!">{verify?t('Confirma tu correo para continuar con el plan elegido en Stripe. El cobro solo se realiza cuando aceptas el pago en Stripe.','Verify your email to continue with your selected plan in Stripe. You are charged only when you confirm payment in Stripe.'):expired?t('El estudio gratuito sigue disponible. Para continuar con entrevistas e IA, verifica tu correo y elige una suscripción.','Free study remains available. To continue interviews and AI, verify your email and choose a subscription.'):t('Solo necesitas agregar tu correo para empezar. Sin contraseña, sin confirmar el correo, sin tarjeta y sin suscripción. Los siete días comienzan al usar por primera vez una entrevista o función de pago.','Just enter your email to start. No password, email confirmation, payment card or subscription. Your seven days start when you first use an interview or paid feature.')}</p>
  {session&&!expired&&!verify?<div className="space-y-3! rounded-2xl! bg-emerald-50! p-5! text-emerald-950!">
   <strong>{session.user.email}</strong><p>{usage?.access?.status==='trial_active'?t(`Prueba activa · ${usage.access.remainingDays??7} días restantes.`,`Trial active · ${usage.access.remainingDays??7} days remaining.`):t('Tu acceso está preparado. La prueba comienza con tu primera práctica de pago.','Your access is ready. The trial starts with your first paid-feature practice.')}</p>
   <button type="button" className={button} onClick={onContinue}>{t('Continuar practicando','Continue practicing')}</button>
  </div>:<form ref={form} onSubmit={submit} className="space-y-3!" aria-busy={busy}>
   {signingIn&&<p className="text-base! text-slate-700!">{t('Para suscribirte o proteger una cuenta existente, confirma tu identidad con el enlace seguro. Después de los siete días, las entrevistas y funciones de pago requieren una suscripción activa.','To subscribe or protect an existing account, verify your identity with a secure link. After seven days, interviews and paid features require an active subscription.')}</p>}
   <label htmlFor="email-trial-email" className="block! font-semibold!">{t('Correo electrónico','Email address')}</label>
   <input id="email-trial-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event=>setEmail(event.target.value)} disabled={busy} className={`min-h-12! w-full! rounded-xl! border! border-slate-300! bg-white! px-4! py-3! text-base! text-slate-900! ${focus}`}/>
   <button type="submit" disabled={busy} className={`${button} w-full!`}>{busy?t('Un momento…','One moment…'):signingIn?t('Enviar enlace seguro','Send secure link'):t('Comenzar gratis con mi correo','Start free with my email')}</button>
  </form>}
  <p className="text-sm! leading-relaxed! text-slate-600!">{t('Este dispositivo recordará tu acceso para que no tengas que escribir el correo cada vez. Si cierras sesión, borras los datos del navegador o cambias de dispositivo, tendrás que entrar otra vez. Esto no reinicia la prueba gratuita.','This device remembers your access so you do not need to enter your email every time. Signing out, clearing browser data or switching devices requires signing in again. This does not restart your free trial.')}</p>
  {!session&&email&&<button type="button" onClick={()=>{rememberAccountEmail('');setEmail('');setVerify(false);setSelectedPlan(null);setMessage('');document.getElementById('email-trial-email')?.focus();}} className={`min-h-11! rounded-xl! bg-transparent! px-2! text-blue-800! underline! ${focus}`}>{t('Usar otra cuenta','Use another account')}</button>}
  {signInError&&<p role="alert" className="rounded-xl! bg-amber-50! p-4! text-amber-950!">{t('El enlace de acceso venció o no es válido. Solicita uno nuevo y abre únicamente el correo más reciente.','The sign-in link expired or is invalid. Request a new link and open only the latest email.')}</p>}
  {message&&<p role="status" className="rounded-xl! bg-blue-50! p-4! text-sm! leading-relaxed! text-blue-950!">{message}</p>}
  <p className="text-sm! leading-relaxed! text-slate-600!">{t('Después de la prueba tendrás que iniciar sesión y suscribirte para continuar con entrevistas e IA. El estudio gratuito sigue disponible. No hay cobros automáticos al registrar tu correo.','After the trial, sign in and subscribe to continue interviews and AI. Free study remains available. Entering your email never creates automatic charges.')}</p>
  {webBillingEnabled&&<section className="space-y-3! rounded-2xl! border! border-slate-200! bg-slate-50! p-5!">
   <h2 className="text-xl! font-bold! text-slate-900!">{t('Suscripción web PRO','Web PRO subscription')}</h2>
   <p className="text-sm! text-slate-600!">{t('Entrevistas con Sahara, Kevin y William y práctica con IA. El pago se confirma en Stripe, después de verificar tu correo.','Interviews with Sahara, Kevin and William and AI practice. Payment is confirmed in Stripe after verifying your email.')}</p>
   <div className="grid! gap-3! sm:grid-cols-2!">{[['monthly',(billing.introductoryOfferEnabled?billing.introductoryMonthlyPriceCents:billing.monthlyPriceCents)??PRO_PLAN.regularMonthlyPriceCents,t('Mensual','Monthly')],['annual',billing.annualPriceCents??PRO_PLAN.annualPriceCents,t('Anual','Annual')]].map(([interval,cents,label])=><button type="button" key={interval} className={button} disabled={busy} aria-pressed={selectedPlan===interval} onClick={()=>subscribe(interval)}>{selectedPlan===interval&&<span aria-hidden="true">✓ </span>}{label} · {new Intl.NumberFormat(es?'es-US':'en-US',{style:'currency',currency:'USD'}).format(Number(cents)/100)}</button>)}</div>
   <p className="text-sm! text-slate-600!">{t('Renovación automática del plan contratado. Revisa el importe y las condiciones antes de confirmar el pago.','Your purchased plan renews automatically. Review the amount and terms before confirming payment.')}</p>
  </section>}
  {!signingIn&&!session&&<button type="button" className={`min-h-11! rounded-xl! bg-transparent! px-2! font-semibold! text-blue-800! underline! ${focus}`} onClick={()=>setVerify(true)}>{t('Ya tengo cuenta · Iniciar sesión','I already have an account · Sign in')}</button>}
  {session&&<button type="button" className={`min-h-11! rounded-xl! bg-transparent! px-2! text-slate-700! underline! ${focus}`} disabled={busy} onClick={async()=>{setBusy(true);setMessage('');try{await signOut();}catch{setMessage(t('No pudimos cerrar la sesión. Revisa la conexión y vuelve a intentarlo.','Could not sign out. Check your connection and try again.'));}finally{setBusy(false);}}}>{t('Salir de este dispositivo','Sign out on this device')}</button>}
  <a href="#/settings" className="inline-flex! min-h-11! items-center! text-sm! text-blue-800! underline!">{t('Privacidad y documentos legales','Privacy and legal documents')}</a>
 </section>;
 return content;
}
