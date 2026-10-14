import { useEffect, useRef, useState } from "react";
import { usePromotionAccess } from "./promotionAccessContext.js";
import { AiResponseReport } from "./AiResponseReport.jsx";
export function PremiumPracticeBoundary({ feature, language, onBack, children }) {
  const { requestAiSession, activeAccess, loading } = usePromotionAccess();
  const requested = useRef(false);
  const mounted = useRef(false);
  const [expired, setExpired] = useState(false);
  const approved = !expired && activeAccess?.feature === feature;
  useEffect(() => {
    mounted.current = true;
    if (!approved && !requested.current && !loading) {
      requested.current = true;
      requestAiSession(feature, () => { if (mounted.current) setExpired(false); }, language);
    }
    return () => { mounted.current = false; };
  }, [approved, loading, requestAiSession, feature, language]);
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
  if (approved) return <>{children}<AiResponseReport language={language} feature={feature} /></>;
  return <main className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-[#030305] p-6 text-slate-100">
    <h1 className="mb-4 text-xl text-slate-100!">{language === "es" ? "Entrevistas e IA" : "Interviews and AI"}</h1>
    <p className="mb-4 text-slate-200!">{language === "es" ? "Prueba gratis 7 días desde tu primer uso. Después necesitas suscripción. El estudio sin servicios de pago sigue gratis." : "Try free for 7 days from your first use. A subscription is required afterward. Study tools without paid services remain free."}</p>
    <button type="button" disabled={loading} onClick={() => requestAiSession(feature, () => setExpired(false), language)} className="mr-3 min-h-11 rounded-xl bg-indigo-600 px-4 py-3 text-white!">{language === "es" ? "Comprobar acceso" : "Check access"}</button>
    <button type="button" onClick={onBack} className="min-h-11 rounded-xl border border-white/15 px-4 py-3 text-slate-100!">{language === "es" ? "Volver al estudio gratuito" : "Back to free study"}</button>
  </main>;
}
