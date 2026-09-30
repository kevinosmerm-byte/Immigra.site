import { useEffect, useRef, useState } from "react";
import { useAccount } from "./accountContext.js";
import { AccountSheet } from "./Account.jsx";
import { learningEntitlements, shouldOfferProgressGate } from "../shared/learningAccess.js";
import { ProgressGateContext } from "./progressGateContext.js";
import { isAppSpeechActive } from "./speech.js";

export function ProgressGate({ children }) {
  const { usage, session, recordAccountEvent } = useAccount();
  const [pending, setPending] = useState(null);
  const [showPro, setShowPro] = useState(false);
  const dialog = useRef(null);
  const continueButton = useRef(null);
  const continuation = useRef(null);
  const seen = useRef(new Set());
  useEffect(() => {
    if (pending && !showPro) { dialog.current?.showModal(); continueButton.current?.focus(); }
  }, [pending, showPro]);
  const resume = () => {
    const proceed = continuation.current;
    continuation.current = null;
    setPending(null); setShowPro(false);
    proceed?.();
  };
  const runTransition = (progress, proceed) => {
    if (continuation.current) return;
    const key = `citizenshipai.gate.v1:${session?.user?.id || "guest"}:${progress.module}`;
    let shown = seen.current.has(key);
    try { shown ||= sessionStorage.getItem(key) === "shown"; } catch { /* Memory fallback. */ }
    if (!shouldOfferProgressGate({ ...progress, ...learningEntitlements(usage), busy: progress.busy || isAppSpeechActive() || Boolean(session && !usage), shown })) { proceed(); return; }
    seen.current.add(key);
    try { sessionStorage.setItem(key, "shown"); } catch { /* Memory fallback. */ }
    continuation.current = proceed;
    let language = "en";
    try { language = localStorage.getItem("citizenshipai.language") || "en"; } catch { /* Default language. */ }
    setPending({ ...progress, language });
    recordAccountEvent?.("progress_70_reached", progress.module).catch(() => {});
    recordAccountEvent?.("paywall_viewed", progress.module).catch(() => {});
  };
  return <ProgressGateContext.Provider value={{ runTransition }}>
    {children}
    {pending && !showPro && <dialog ref={dialog} className="progress-gate" onCancel={event => { event.preventDefault(); resume(); }} aria-labelledby="progress-gate-title">
      <h2 id="progress-gate-title">{pending.language === "es" ? "¡Vas muy bien!" : "You're doing great!"}</h2>
      <p>{pending.language === "es" ? "Completaste" : "You've completed"} {Math.min(100, Math.round(pending.completed / pending.total * 100))}% {pending.language === "es" ? "de esta práctica." : "of this practice."}</p>
      <p>{pending.language === "es" ? "Explora Pro para más práctica con IA y entrevistas avanzadas." : "Explore Pro for expanded AI practice and advanced interview tools."}</p>
      <button onClick={() => { recordAccountEvent?.("pro_selected", pending.module).catch(() => {}); setShowPro(true); }}>{pending.language === "es" ? "Explorar Pro" : "Explore Pro"}</button>
      <button ref={continueButton} onClick={resume}>{pending.language === "es" ? "Continuar gratis" : "Continue Free"}</button>
      <small>{pending.language === "es" ? "Tu progreso está guardado. No se requiere un anuncio." : "Your progress is saved. No ad is required."}</small>
    </dialog>}
    {showPro && <AccountSheet language={pending?.language} onClose={() => setShowPro(false)} />}
  </ProgressGateContext.Provider>;
}
