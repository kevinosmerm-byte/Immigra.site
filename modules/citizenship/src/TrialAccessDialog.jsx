import GoogleSignInButton from './GoogleSignInButton.jsx';
import { Capacitor } from "@capacitor/core";
import { useRef, useState } from "react";
import { useModalFocus } from "./useModalFocus.js";
export function TrialAccessDialog({ pending, billing, openCheckout, startEmailTrial, onClose }) {
  const modal = useModalFocus(true, onClose);
  const [opening, setOpening] = useState(false);
  const [email,setEmail]=useState('');
  const [error, setError] = useState(false);
  const inFlight = useRef(false);
  const es = pending.language === "es";
  const accountRequired = pending.reason === "account_required";
  const expired = pending.reason === "trial_expired";
  const purchase = async () => {
    if (inFlight.current) return;
    inFlight.current = true; setOpening(true); setError(false);
    try { await openCheckout("monthly"); } catch { setError(true); }
    finally { inFlight.current = false; setOpening(false); }
  };
  const button = `trial-access-action flex! items-center! justify-center! gap-3! min-h-14! w-full! m-0! rounded-2xl! border-white/35! bg-[linear-gradient(180deg,#3279ba,#123a63)]! [html[data-glass-module=asylum]_&]:bg-[linear-gradient(180deg,#8b5acb,#61329e)]! [html[data-glass-module=residency]_&]:bg-[linear-gradient(180deg,#119475,#08634e)]! px-5! py-4! text-base! font-semibold! text-white! shadow-[inset_0_1px_1px_#ffffff80,0_6px_16px_#123a6320]! transition-[filter,transform]! hover:brightness-110! active:scale-[.99]! disabled:opacity-60! motion-reduce:transition-none!`;
  const secondary = "min-h-12! rounded-2xl! border-[var(--color-border,#d8e2ec)]! bg-[var(--liquid-hover)]! px-4! py-3! text-sm! text-[var(--liquid-text)]! shadow-[inset_0_1px_1px_#ffffffb0,0_3px_10px_#123a630a]! hover:brightness-105!";
  return <div className="trial-access-backdrop p-4! pt-[max(1rem,env(safe-area-inset-top))]! pb-[max(1rem,env(safe-area-inset-bottom))]! bg-[#123a63]/25!" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={modal} role="dialog" aria-modal="true" aria-labelledby="trial-access-title" aria-describedby="trial-access-description" aria-busy={opening} className={`trial-access-panel w-full! max-w-lg! max-h-[calc(100dvh-4rem)]! rounded-[2rem]! border-white/80! p-6! pt-6! sm:p-8! shadow-[inset_0_1px_1px_#ffffffed,0_24px_80px_#123a6333]! bg-[var(--liquid-hover)]! backdrop-blur-2xl! backdrop-saturate-150! [html[data-reduce-transparency=true]_&]:bg-[var(--liquid-solid)]! [@media(prefers-reduced-transparency:reduce)]:bg-[var(--liquid-solid)]!`}>
      <div className="mb-6! flex! items-center! justify-between! gap-3!">
      <span aria-hidden="true" className="flex! size-12! shrink-0! items-center! justify-center! rounded-2xl! border! border-white/70! bg-[var(--liquid-hover)]! text-[var(--color-navy,#123a63)]! shadow-[inset_0_1px_2px_#ffffff,0_4px_12px_#123a6310]!">
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="4"/><path d="M7 3v4m10-4v4M3 11h18m-10 4h4l-3 4"/></svg>
      </span>
      <button type="button" className={`trial-access-close static! min-w-0! w-auto! ${secondary}`} onClick={onClose}><span aria-hidden="true">×</span> {es ? "Cerrar" : "Close"}</button>
      </div>
      <h2 id="trial-access-title" className="mb-4! text-2xl! leading-tight! font-bold! sm:text-3xl!">{accountRequired ? (es ? "Prueba gratis durante 7 días" : "Try free for 7 days") : expired ? (es ? "Tu prueba de 7 días terminó" : "Your 7-day trial has ended") : (es ? "No pudimos verificar el acceso" : "We could not verify access")}</h2>
      <p id="trial-access-description" className="mb-6! text-base! leading-relaxed!">{accountRequired ? (es ? "Agrega tu correo para empezar, sin contraseña ni confirmación por email. Los 7 días comienzan al registrar tu correo, sin cuotas de práctica y sin tarjeta." : "Enter your email to start without a password or email confirmation. Your 7 days begin when you register your email, with no practice quotas or payment card.") : expired ? (es ? "Para continuar con entrevistas, transcripción y comentarios de IA necesitas suscripción. No hubo ningún cobro automático al terminar la prueba." : "A subscription is required for interviews, transcription and AI feedback. No automatic charge occurred when your trial ended.") : (es ? "Inténtalo de nuevo cuando el servicio esté disponible. El estudio gratuito sigue abierto." : "Try again when the service is available. Free study remains open.")}</p>
      {accountRequired&&<GoogleSignInButton language={es?'es':'en'} disabled={opening} onBusyChange={setOpening}/>}
      {accountRequired&&<form className="grid! gap-3!" onSubmit={async event=>{event.preventDefault();if(inFlight.current)return;inFlight.current=true;setOpening(true);setError(false);try{await startEmailTrial(email);onClose();}catch{setError(true);}finally{inFlight.current=false;setOpening(false);}}}><label className="block! text-sm! font-semibold! text-[var(--liquid-text)]!" htmlFor="trial-access-email">{es?'Correo electrónico':'Email address'}</label><input className="box-border! min-h-14! w-full! min-w-0! appearance-none! rounded-2xl! border! border-[var(--color-border,#d8e2ec)]! bg-[var(--liquid-solid)]! px-4! py-3! text-base! text-[var(--liquid-text)]! shadow-[inset_0_2px_4px_#123a6308]! outline-none! placeholder:text-[var(--liquid-muted)]! focus:border-[var(--color-primary,#2563a6)]! focus:ring-3! focus:ring-[var(--color-ai,#4da3e6)]/35! disabled:opacity-60!" placeholder={es ? "tu@correo.com" : "you@example.com"} inputMode="email" autoCapitalize="none" spellCheck={false} id="trial-access-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event=>setEmail(event.target.value)} disabled={opening}/><button type="submit" className={button} disabled={opening}>{opening?(es?'Un momento…':'One moment…'):(es?'Comenzar con mi correo':'Start with my email')}</button><button type="button" className={`w-full! ${secondary}`} disabled={opening} onClick={()=>{onClose();window.location.hash='/account';}}>{es?'Ya tengo cuenta · Entrar':'I already have an account · Sign in'}</button></form>}
      {expired && billing?.enabled && !Capacitor.isNativePlatform() && <button type="button" className={button} disabled={opening} onClick={purchase}>{opening ? (es ? "Abriendo…" : "Opening…") : (es ? "Ver suscripción mensual" : "View monthly subscription")}</button>}
      {expired && (!billing?.enabled || Capacitor.isNativePlatform()) && <p className="">{es ? "Las compras no están disponibles ahora. Puedes seguir estudiando gratis." : "Purchases are currently unavailable. You can keep studying for free."}</p>}
      {error && <p role="alert" className="my-4! rounded-2xl! border! border-red-200! bg-red-50! p-4! text-sm! text-red-800!">{es ? "No pudimos continuar. Si ya usaste este correo en otro dispositivo, entra con un enlace seguro desde Cuenta." : "We could not continue. If you used this email on another device, sign in with a secure link from Account."}</p>}
      <p className="mt-6! mb-0! border-t! border-[var(--color-border,#d8e2ec)]! pt-5! text-sm! leading-relaxed!">{es ? "Civismo, tarjetas, cuestionarios locales, podcasts, vocabulario, guía y recursos educativos siguen gratis. Las grabaciones conservan límites técnicos y protección frente a uso automatizado." : "Civics, flashcards, local quizzes, podcasts, vocabulary, the guide and educational resources remain free. Recording limits and protection against automated use still apply."}</p>
    </section>
  </div>;
}
