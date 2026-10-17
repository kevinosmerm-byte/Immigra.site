import { useEffect, useRef, useState } from "react";
import { getAiFeatureConfig } from "../shared/featureAccessConfig.js";
import { isVerifiedPracticeAccess } from "../shared/trialPolicy.js";
import { getAiUsageSummary, recordAiSessionStart } from "./access.js";
import { useAccount } from "./accountContext.js";
import { setAiRequestContext } from "./api.js";
import { PromotionAccessContext } from "./promotionAccessContext.js";
import { TrialAccessDialog } from "./TrialAccessDialog.jsx";

export function PromotionAccessProvider({ children }) {
  const account = useAccount();
  return <SessionAccessProvider key={account.session?.user?.id || "guest"} account={account}>{children}</SessionAccessProvider>;
}

function SessionAccessProvider({ children, account }) {
  const { session, loading, aiFeatureAvailability, startAiSession, finishAiSession, billing, openCheckout, recordAccountEvent } = account;
  const [pending, setPending] = useState(null);
  const [activeAccess, setActiveAccess] = useState(null);
  const active = useRef(null);
  const request = useRef(0);
  const alive = useRef(true);
  const reservingDemo = useRef(false);
  const finishRef = useRef(finishAiSession);
  useEffect(() => { finishRef.current = finishAiSession; }, [finishAiSession]);
  const finishActiveAiSession = async (outcome = "auto", options = {}) => {
    if (!options.preserveReservation) request.current += 1;
    const current = active.current;
    active.current = null;
    setActiveAccess(null);
    setAiRequestContext(null);
    if (current?.sessionId && !current.demo) await finishAiSession(current.sessionId, outcome, options).catch(() => {});
  };
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      // StrictMode immediately replays setup; real unmounts invalidate requests.
      queueMicrotask(() => {
        if (alive.current) return;
        request.current += 1;
        const current = active.current;
        active.current = null;
        setAiRequestContext(null);
        if (current?.sessionId && !current.demo) finishRef.current(current.sessionId, "auto", { keepalive: true }).catch(() => {});
      });
    };
  }, []);
  useEffect(() => {
    const current = active.current;
    if (current?.userId === session?.user?.id && session?.access_token) {
      setAiRequestContext({ sessionId: current.sessionId, accessToken: session.access_token, feature: current.feature });
    }
  }, [session?.access_token, session?.user?.id, activeAccess?.sessionId]);
  useEffect(() => { if (pending && session?.access_token) recordAccountEvent("paywall_viewed", pending.feature).catch(() => {}); }, [pending, session?.access_token, recordAccountEvent]);
  useEffect(() => {
    const leave = () => {
      request.current += 1;
      const current = active.current;
      active.current = null;
      setAiRequestContext(null);
      if (current?.sessionId && !current.demo) finishAiSession(current.sessionId, "auto", { keepalive: true }).catch(() => {});
    };
    window.addEventListener("pagehide", leave);
    return () => window.removeEventListener("pagehide", leave);
  }, [finishAiSession]);
  const requestAiSession = async (feature, continuation, language = "en", { allowLocal = false } = {}) => {
    if (allowLocal) return continuation();
    if (!getAiFeatureConfig(feature)) return;
    const deny = reason => setPending({ feature, reason, language });
    if (loading) return deny("access_loading");
    if (!session?.access_token) {
      const current = active.current;
      if (current?.demo && current.feature === feature && Date.parse(current.access.accessEndsAt) > Date.now()) return continuation(current);
      if (reservingDemo.current) return;
      reservingDemo.current = true;
      const id = ++request.current;
      try {
        const response = await fetch('/api/demo/start', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({feature,requestId:crypto.randomUUID()})});
        const result = await response.json();
        if (!alive.current || id !== request.current) return;
        if (!response.ok) return deny(result.code === 'account_required' ? 'account_required' : 'access_unavailable');
        if (!result.demo || !result.sessionId || !isVerifiedPracticeAccess(result.access)) return deny('access_unavailable');
        const approved = {...result,feature};
        active.current=approved;setActiveAccess(approved);
        setAiRequestContext({sessionId:result.sessionId,feature});
        setPending(null);continuation(approved);
      } catch { if(alive.current)deny('access_unavailable'); }
      finally { reservingDemo.current=false; }
      return;
    }
    if (aiFeatureAvailability?.[feature] === false) return deny("feature_unavailable");
    const current = active.current;
    if (current?.feature === feature && isVerifiedPracticeAccess(current.access)
      && (!current.access.accessEndsAt || Date.parse(current.access.accessEndsAt) > Date.now())) return continuation(current);
    const id = ++request.current;
    await finishActiveAiSession("auto", { preserveReservation: true });
    try {
      const result = await startAiSession(feature);
      if (!alive.current || id !== request.current) return;
      if (!result?.sessionId || !isVerifiedPracticeAccess(result.access)) return deny("access_unavailable");
      const approved = { ...result, feature, userId: session.user.id };
      active.current = approved;
      setActiveAccess(approved);
      setAiRequestContext({ sessionId: result.sessionId, accessToken: session.access_token, feature });
      recordAiSessionStart(feature);
      setPending(null);
      continuation(approved);
    } catch (error) {
      if (alive.current && id === request.current) deny(error?.decision?.reason || "access_unavailable");
    }
  };
  return <PromotionAccessContext.Provider value={{ requestAiSession, finishActiveAiSession, getAiUsageSummary, activeAccess, loading }}>
    {children}
    {pending && <TrialAccessDialog pending={pending} billing={billing} openCheckout={openCheckout} onClose={() => setPending(null)} />}
  </PromotionAccessContext.Provider>;
}
