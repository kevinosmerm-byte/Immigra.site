import { useEffect, useRef, useState } from "react";
import { usePromotionAccess } from "./promotionAccessContext.js";
import { useAccount } from './accountContext.js';
export function PremiumPracticeBoundary({ feature, language, onBack, children }) {
  const { requestAiSession, activeAccess, loading } = usePromotionAccess();
  const {session} = useAccount();
  const requested = useRef(false);
  const mounted = useRef(false);
  const [expired, setExpired] = useState(false);
  const approved = !expired && activeAccess?.feature === feature;
  useEffect(() => {
    mounted.current = true;
    if (session?.access_token && !approved && !requested.current && !loading) {
      requested.current = true;
      requestAiSession(feature, () => { if (mounted.current) setExpired(false); }, language);
    }
    return () => { mounted.current = false; };
  }, [approved, loading, requestAiSession, feature, language, session?.access_token]);
  useEffect(() => {
    const deadline = Date.parse(activeAccess?.access?.accessEndsAt);
    if (!approved || !Number.isFinite(deadline)) return;
    let timer;
    let active = true;
    const expire = () => {
      clearTimeout(timer);
      if (!active) return;
      if (Date.now() >= deadline) { requested.current = false; setExpired(true); }
      else timer = setTimeout(expire, Math.min(2147483647, deadline - Date.now()));
    };
    expire();
    window.addEventListener("focus", expire);
    return () => { active = false; clearTimeout(timer); window.removeEventListener("focus", expire); };
  }, [approved, activeAccess?.access?.accessEndsAt]);
  if (approved) return children;
  return <main className="premium-access-panel">
    <h1 className="">{language === "es" ? "Entrevistas e IA" : "Interviews and AI"}</h1>
    <p className="">{language === "es" ? "Prueba 2 prácticas sin correo, de hasta 10 minutos cada una. Después confirma tu correo para comenzar 7 días gratis. Al terminar, PRO cuesta $5.99/mes si decides contratarlo; no hay cobro automático. El estudio básico sigue gratis." : "Try 2 practices without email, up to 10 minutes each. Then confirm your email to start 7 free days. Afterward, PRO costs $5.99/month if you subscribe; there is no automatic charge. Basic study stays free."}</p>
    <button type="button" disabled={loading} onClick={() => requestAiSession(feature, () => setExpired(false), language)} className="premium-access-primary">{session ? (language === "es" ? "Comprobar acceso" : "Check access") : (language === "es" ? "Probar sin correo" : "Try without email")}</button>
    <button type="button" onClick={onBack} className="">{language === "es" ? "Volver al estudio gratuito" : "Back to free study"}</button>
  </main>;
}
