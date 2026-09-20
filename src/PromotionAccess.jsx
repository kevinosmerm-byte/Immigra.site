import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getAiFeatureConfig, PROMOTION_ACCESS_CONFIG } from "../shared/featureAccessConfig.js";
import { getAiUsageSummary, recordAiSessionStart, shouldShowPromotionNotice } from "./access.js";
import { useAccount } from "./Account.jsx";
import { setAiRequestContext } from "./api.js";

const PromotionAccessContext = createContext(null);

const COPY = {
  en: {
    eyebrow: "LAUNCH PROMOTION",
    title: "You've completed your free AI practices",
    body: "Keep preparing for your citizenship interview. Expanded AI practice will become part of Citizenship AI Pro in the future.",
    pro: "GO PRO · COMING SOON",
    proDetail: "More AI practice · No ads · Advanced interview training",
    continue: "CONTINUE FREE DURING PROMOTION",
    note: "Your Civics study tools, podcasts and educational resources remain free.",
    close: "Not now",
  },
  es: {
    eyebrow: "PROMOCIÓN DE LANZAMIENTO",
    title: "Completaste tus prácticas gratuitas con IA",
    body: "Continúa preparándote para tu entrevista de ciudadanía. En el futuro, la práctica ampliada con IA formará parte de Citizenship AI Pro.",
    pro: "OBTENER PRO · PRÓXIMAMENTE",
    proDetail: "Más práctica con IA · Sin anuncios · Entrenamiento avanzado",
    continue: "CONTINUAR GRATIS DURANTE LA PROMOCIÓN",
    note: "Las preguntas cívicas, podcasts y recursos educativos permanecen gratis.",
    close: "Ahora no",
  },
};

export function PromotionAccessProvider({ children }) {
  const { session, usage: accountUsage, startAiSession, finishAiSession, recordAccountEvent } = useAccount();
  const [pending, setPending] = useState(null);
  const continuationRef = useRef(null);
  const activeSessionRef = useRef(null);
  const lastNoticeRef = useRef("");

  useEffect(() => {
    if (!pending || !session?.access_token) return;
    const noticeKey = `${pending.feature}:${session.user?.id || "account"}`;
    if (lastNoticeRef.current === noticeKey) return;
    lastNoticeRef.current = noticeKey;
    recordAccountEvent("paywall_viewed", pending.feature).catch(() => {});
  }, [pending, recordAccountEvent, session?.access_token, session?.user?.id]);

  const finishActiveAiSession = async (outcome = "completed", options = {}) => {
    const active = activeSessionRef.current;
    activeSessionRef.current = null;
    setAiRequestContext(null);
    if (!active?.sessionId) return;
    try {
      await finishAiSession(active.sessionId, outcome, options);
    } catch (error) {
      console.warn("Account session result could not be saved.", error?.message);
    }
  };

  useEffect(() => {
    const finishBeforeLeaving = () => {
      const active = activeSessionRef.current;
      activeSessionRef.current = null;
      setAiRequestContext(null);
      if (active?.sessionId) {
        finishAiSession(active.sessionId, "completed", { keepalive: true }).catch(() => {});
      }
    };
    window.addEventListener("pagehide", finishBeforeLeaving);
    return () => window.removeEventListener("pagehide", finishBeforeLeaving);
  }, [finishAiSession]);

  const beginSession = async (feature, continuation) => {
    await finishActiveAiSession("completed");
    let serverSession = null;
    if (session) {
      try {
        serverSession = await startAiSession(feature);
        setAiRequestContext({
          sessionId: serverSession?.sessionId,
          accessToken: session.access_token,
          feature,
        });
        activeSessionRef.current = { sessionId: serverSession?.sessionId, feature };
      } catch (error) {
        setAiRequestContext(null);
        console.warn("Account usage could not be recorded; promotional access continues.", error?.message);
      }
    } else {
      setAiRequestContext(null);
    }
    recordAiSessionStart(feature);
    continuation(serverSession);
  };

  const requestAiSession = (feature, continuation, language = "en") => {
    const config = getAiFeatureConfig(feature);
    if (!config) {
      continuation();
      return;
    }
    if (PROMOTION_ACCESS_CONFIG.promotionActive && shouldShowPromotionNotice(feature)) {
      continuationRef.current = () => beginSession(feature, continuation);
      setPending({ feature, language: language === "es" ? "es" : "en" });
      return;
    }
    beginSession(feature, continuation);
  };

  const close = () => {
    continuationRef.current = null;
    setPending(null);
  };

  const continuePromotion = () => {
    const continuation = continuationRef.current;
    continuationRef.current = null;
    setPending(null);
    continuation?.();
  };

  const copy = pending ? COPY[pending.language] : COPY.en;
  const feature = pending ? getAiFeatureConfig(pending.feature) : null;
  const localUsage = pending ? getAiUsageSummary().features[pending.feature] : null;
  const remoteUsage = pending ? accountUsage?.features?.[pending.feature] : null;
  const usage = remoteUsage ? {
    limit: remoteUsage.freeLimit,
    used: remoteUsage.freeUsed,
    remaining: Math.max(0, (remoteUsage.freeLimit || 0) - (remoteUsage.freeUsed || 0)),
  } : localUsage;

  return (
    <PromotionAccessContext.Provider value={{ requestAiSession, finishActiveAiSession, getAiUsageSummary }}>
      {children}
      {pending && feature && (
        <div className="promotion-access-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
          <section className="promotion-access-sheet" role="dialog" aria-modal="true" aria-labelledby="promotion-access-title">
            <button className="promotion-access-close" onClick={close} type="button" aria-label={copy.close}>×</button>
            <div className="promotion-access-orb" aria-hidden="true">✦</div>
            <p className="promotion-access-eyebrow">{copy.eyebrow}</p>
            <h2 id="promotion-access-title">{copy.title}</h2>
            <div className="promotion-access-feature"><span>{feature.label}</span><strong>{usage?.limit || 2} / {usage?.limit || 2}</strong></div>
            <p className="promotion-access-body">{copy.body}</p>
            <div className="promotion-access-pro" aria-label={copy.pro}>
              <span>PRO</span><div><strong>{copy.pro}</strong><small>{copy.proDetail}</small></div>
            </div>
            <div className="promotion-access-divider"><span></span><small>LAUNCH ACCESS</small><span></span></div>
            <button className="promotion-access-continue" onClick={continuePromotion} type="button"><span>{copy.continue}</span><b>→</b></button>
            <p className="promotion-access-note">{copy.note}</p>
          </section>
        </div>
      )}
    </PromotionAccessContext.Provider>
  );
}

export function usePromotionAccess() {
  const value = useContext(PromotionAccessContext);
  if (!value) throw new Error("usePromotionAccess must be used inside PromotionAccessProvider");
  return value;
}
