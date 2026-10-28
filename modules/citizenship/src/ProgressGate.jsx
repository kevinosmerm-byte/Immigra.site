import {TEMPORARY_INTERVIEW_TESTING} from '../../../shared/interview-ui/access-policy.mjs';
import { useEffect, useRef, useState } from "react";
import { useAccount } from "./accountContext.js";
import { AccountSheet } from "./Account.jsx";
import { learningEntitlements, shouldOfferProgressGate } from "../shared/learningAccess.js";
import { ProgressGateContext } from "./progressGateContext.js";
import { isAppSpeechActive } from "./speech.js";

import { claimProNotice } from "./proNoticePolicy.js";
export function ProgressGate({ children }) {
  const { usage, session, billing, recordAccountEvent } = useAccount();
  const [notice, setNotice] = useState(null);
  const [showPro, setShowPro] = useState(false);
  const seen = useRef(new Set());
  const offer = (module, preferredLanguage) => {
    if (TEMPORARY_INTERVIEW_TESTING || usage?.tier === "pro" || usage?.access?.status === "trial_active") return;
    const key = `citizenshipai.pro-notice.v2:${session?.user?.id || "guest"}`;
    if (seen.current.has(key)) return;
    try { if (!claimProNotice(localStorage, session?.user?.id)) return; } catch { /* Memory fallback. */ }
    seen.current.add(key);
    let language = preferredLanguage || "en";
    try { language = preferredLanguage || localStorage.getItem("citizenshipai.language") || "en"; } catch { /* Default. */ }
    setNotice({ module, language, userId: session?.user?.id || "guest" });
    recordAccountEvent?.("paywall_viewed", module).catch(() => {});
  };
  const offerRef = useRef(offer);
  useEffect(() => { offerRef.current = offer; });
  useEffect(() => {
    const listener = event => offerRef.current(event.detail?.feature, event.detail?.language);
    window.addEventListener("citizenshipai:pro-benefits", listener);
    return () => window.removeEventListener("citizenshipai:pro-benefits", listener);
  }, []);

  const runTransition = (progress, proceed) => {
    if (shouldOfferProgressGate({ ...progress, ...learningEntitlements(usage), busy: progress.busy || isAppSpeechActive() || Boolean(session && !usage) })) offer(progress.module);
    proceed();
  };
  const es = notice?.language === "es";
  return <ProgressGateContext.Provider value={{ runTransition }}>
    {notice && notice.userId === (session?.user?.id || "guest") && usage?.tier !== "pro" && !showPro && <aside className="pro-benefits-notice" aria-label={es ? "Beneficios de PRO" : "PRO benefits"}>
      <span className="pro-benefits-badge">PRO</span>
      <div><strong>{es ? "Más práctica para tu entrevista" : "More practice for your interview"}</strong><p>{es ? "Entrevistas y práctica de IA después de tus 7 días gratuitos." : "Interviews and AI practice after your 7 free days."}</p><small>{billing?.enabled ? (es ? "Consulta lo que incluye cada plan." : "See what each plan includes.") : (es ? "Conoce el plan. Las compras aún no están activas." : "Preview the plan. Purchases are not active yet.")}</small></div>
      <button className="pro-benefits-action" onClick={() => { recordAccountEvent?.("pro_selected", notice.module).catch(() => {}); setShowPro(true); }}>{es ? "Ver beneficios de PRO" : "View PRO benefits"}</button>
      <button className="pro-benefits-dismiss" onClick={() => setNotice(null)} aria-label={es ? "Cerrar aviso de PRO" : "Dismiss PRO notice"}>×</button>
    </aside>}
    {children}
    {showPro && notice?.userId === (session?.user?.id || "guest") && <AccountSheet language={notice?.language} onClose={() => { setShowPro(false); setNotice(null); }} />}
  </ProgressGateContext.Provider>;
}
