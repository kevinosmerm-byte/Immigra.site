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
  const button = "trial-access-action";
  return <div className="trial-access-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={modal} role="dialog" aria-modal="true" aria-labelledby="trial-access-title" className="trial-access-panel">
      <button type="button" className="trial-access-close" onClick={onClose}><span aria-hidden="true">×</span> {es ? "Cerrar" : "Close"}</button>
      <h2 id="trial-access-title" className="">{accountRequired ? (es ? "Prueba gratis durante 7 días" : "Try free for 7 days") : expired ? (es ? "Tu prueba de 7 días terminó" : "Your 7-day trial has ended") : (es ? "No pudimos verificar el acceso" : "We could not verify access")}</h2>
      <p className="">{accountRequired ? (es ? "Crea una cuenta o inicia sesión. Después de las 2 prácticas sin correo, los 7 días comienzan al confirmar tu correo, sin cuotas de práctica y sin tarjeta." : "Create an account or sign in. After 2 practices without email, your 7 days begin when you confirm your email, with no practice quotas or payment card.") : expired ? (es ? "Para continuar con entrevistas, transcripción y comentarios de IA necesitas suscripción. No hubo ningún cobro automático al terminar la prueba." : "A subscription is required for interviews, transcription and AI feedback. No automatic charge occurred when your trial ended.") : (es ? "Inténtalo de nuevo cuando el servicio esté disponible. El estudio gratuito sigue abierto." : "Try again when the service is available. Free study remains open.")}</p>
      {accountRequired && <button type="button" className={button} onClick={() => { onClose(); window.location.hash = "/account"; }}>{es ? "Crear cuenta o iniciar sesión" : "Create account or sign in"}</button>}
      {expired && billing?.enabled && !Capacitor.isNativePlatform() && <button type="button" className={button} disabled={opening} onClick={purchase}>{opening ? (es ? "Abriendo…" : "Opening…") : (es ? "Ver suscripción mensual" : "View monthly subscription")}</button>}
      {expired && (!billing?.enabled || Capacitor.isNativePlatform()) && <p className="">{es ? "Las compras no están disponibles ahora. Puedes seguir estudiando gratis." : "Purchases are currently unavailable. You can keep studying for free."}</p>}
      {error && <p role="alert" className="my-3 text-red-300!">{es ? "No pudimos abrir el pago seguro. Inténtalo nuevamente." : "We could not open secure checkout. Please try again."}</p>}
      <p className="">{es ? "Civismo, tarjetas, cuestionarios locales, podcasts, vocabulario, guía y recursos educativos siguen gratis. Las grabaciones conservan límites técnicos y protección frente a uso automatizado." : "Civics, flashcards, local quizzes, podcasts, vocabulary, the guide and educational resources remain free. Recording limits and protection against automated use still apply."}</p>
    </section>
  </div>;
}
