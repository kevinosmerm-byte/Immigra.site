import { Capacitor } from "@capacitor/core";
import { useRef, useState } from "react";
import { useModalFocus } from "./useModalFocus.js";
export function TrialAccessDialog({ pending, billing, openCheckout, onClose }) {
  const modal = useModalFocus(true, onClose);
  const [opening, setOpening] = useState(false);
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
  const button = "min-h-11 rounded-xl border border-white/15 px-4 py-3 text-slate-100! focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400";
  return <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={modal} role="dialog" aria-modal="true" aria-labelledby="trial-access-title" className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#030305] p-6 text-slate-100 shadow-xl">
      <button type="button" className={button} onClick={onClose}>{es ? "Cerrar" : "Close"}</button>
      <h2 id="trial-access-title" className="my-4 text-xl font-semibold text-slate-100!">{accountRequired ? (es ? "Prueba gratis durante 7 días" : "Try free for 7 days") : expired ? (es ? "Tu prueba de 7 días terminó" : "Your 7-day trial has ended") : (es ? "No pudimos verificar el acceso" : "We could not verify access")}</h2>
      <p className="mb-4 leading-relaxed text-slate-200!">{accountRequired ? (es ? "Crea una cuenta o inicia sesión. Los 7 días comienzan con tu primera entrevista o función de IA, sin cuotas de práctica y sin tarjeta." : "Create an account or sign in. Your 7 days begin with your first interview or AI feature, with no practice quotas or payment card.") : expired ? (es ? "Para continuar con entrevistas, transcripción y comentarios de IA necesitas suscripción. No hubo ningún cobro automático al terminar la prueba." : "A subscription is required for interviews, transcription and AI feedback. No automatic charge occurred when your trial ended.") : (es ? "Inténtalo de nuevo cuando el servicio esté disponible. El estudio gratuito sigue abierto." : "Try again when the service is available. Free study remains open.")}</p>
      {accountRequired && <button type="button" className={button+" w-full bg-indigo-600"} onClick={() => { onClose(); window.dispatchEvent(new Event("citizenshipai:account-request")); }}>{es ? "Crear cuenta o iniciar sesión" : "Create account or sign in"}</button>}
      {expired && billing?.enabled && !Capacitor.isNativePlatform() && <button type="button" className={button+" w-full bg-indigo-600 disabled:opacity-60"} disabled={opening} onClick={purchase}>{opening ? (es ? "Abriendo…" : "Opening…") : (es ? "Ver suscripción mensual" : "View monthly subscription")}</button>}
      {expired && (!billing?.enabled || Capacitor.isNativePlatform()) && <p className="my-3 text-slate-200!">{es ? "Las compras no están disponibles ahora. Puedes seguir estudiando gratis." : "Purchases are currently unavailable. You can keep studying for free."}</p>}
      {expired && Capacitor.isNativePlatform() && <button className={button} type="button" onClick={() => { onClose(); window.dispatchEvent(new Event("citizenshipai:account-request")); }}>{es ? "Ver opciones de la tienda" : "View store options"}</button>}
      {error && <p role="alert" className="my-3 text-red-300!">{es ? "No pudimos abrir el pago seguro. Inténtalo nuevamente." : "We could not open secure checkout. Please try again."}</p>}
      <p className="mt-5 text-sm leading-relaxed text-slate-200!">{es ? "Civismo, tarjetas, cuestionarios locales, podcasts, vocabulario, guía y recursos educativos siguen gratis. Las grabaciones conservan límites técnicos y protección frente a uso automatizado." : "Civics, flashcards, local quizzes, podcasts, vocabulary, the guide and educational resources remain free. Recording limits and protection against automated use still apply."}</p>
    </section>
  </div>;
}
