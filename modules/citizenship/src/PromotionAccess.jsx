import { useModalFocus } from "./useModalFocus.js";
import { useEffect, useRef, useState } from "react";
import { getAiFeatureConfig, PROMOTION_ACCESS_CONFIG } from "../shared/featureAccessConfig.js";
import { getAiUsageSummary, recordAiSessionStart, shouldShowPromotionNotice } from "./access.js";
import { useAccount } from "./accountContext.js";
import { setAiRequestContext } from "./api.js";
import { PromotionAccessContext } from "./promotionAccessContext.js";

const COPY = {
  en: {
    eyebrow: "LAUNCH PROMOTION",
    title: "You've completed your free AI practices",
    body: "Keep preparing for your citizenship interview. Expanded AI practice will become part of Immigration AI Pro in the future.",
    pro: "IMMIGRATION AI PRO",
    proDetail: "More AI practice · No ads · Advanced interview training",
    launchPrice: "Launch price",
    regularPrice: "then $5.99/month",
    annualPrice: "$49.99/year",
    billingSoon: "Pricing approved · Purchases are not active yet",
    continue: "CONTINUE FREE DURING PROMOTION",
    note: "Your Civics study tools, podcasts and educational resources remain free.",
    close: "Not now",
    unavailableTitle: "This AI practice is currently unavailable",
    unavailableBody: "New sessions are paused right now. Your free study tools remain available while access is restored.",
    quotaTitle: "You've completed your included AI practices",
    quotaBody: "Your included sessions have been used. You can continue with the free civics study tools.",
  },
  es: {
    eyebrow: "PROMOCIÓN DE LANZAMIENTO",
    title: "Completaste tus prácticas gratuitas con IA",
    body: "Continúa preparándote para tu entrevista de ciudadanía. En el futuro, la práctica ampliada con IA formará parte de Immigration AI Pro.",
    pro: "IMMIGRATION AI PRO",
    proDetail: "Más práctica con IA · Sin anuncios · Entrenamiento avanzado",
    launchPrice: "Precio de lanzamiento",
    regularPrice: "luego $5.99/mes",
    annualPrice: "$49.99/año",
    billingSoon: "Precio aprobado · Las compras aún no están activas",
    continue: "CONTINUAR GRATIS DURANTE LA PROMOCIÓN",
    note: "Las preguntas cívicas, podcasts y recursos educativos permanecen gratis.",
    close: "Ahora no",
    unavailableTitle: "Esta práctica con IA no está disponible ahora",
    unavailableBody: "Las sesiones nuevas están pausadas. Tus herramientas gratuitas de estudio siguen disponibles mientras restablecemos el acceso.",
    quotaTitle: "Completaste tus prácticas de IA incluidas",
    quotaBody: "Agotaste las sesiones incluidas. Puedes continuar con las herramientas gratuitas de estudio cívico.",
  },
};

export function PromotionAccessProvider({ children }) {
  const { session, usage: accountUsage, promotionAccess, aiFeatureAvailability, startAiSession, finishAiSession, recordAccountEvent } = useAccount();
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

  const finishActiveAiSession = async (outcome = "auto", options = {}) => {
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
        finishAiSession(active.sessionId, "auto", { keepalive: true }).catch(() => {});
      }
    };
    window.addEventListener("pagehide", finishBeforeLeaving);
    return () => window.removeEventListener("pagehide", finishBeforeLeaving);
  }, [finishAiSession]);

  const beginSession = async (feature, continuation, language = "en") => {
    await finishActiveAiSession("auto");
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
        if (error?.decision?.allowed === false) {
          continuationRef.current = null;
          setPending({
            feature,
            language: language === "es" ? "es" : "en",
            blocked: true,
            reason: error.decision.reason,
            canWatchAd: Boolean(error.decision.canWatchAd),
            canUpgrade: Boolean(error.decision.canUpgrade),
          });
          return;
        }
        console.warn("Account usage could not be recorded; promotional access continues.", error?.message);
      }
    } else {
      setAiRequestContext({ feature });
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
    if (aiFeatureAvailability?.[feature] === false) {
      continuationRef.current = null;
      setPending({ feature, language: language === "es" ? "es" : "en", blocked: true, reason: "feature_unavailable" });
      return;
    }
    if (!session && promotionAccess === false) {
      continuationRef.current = null;
      setPending({ feature, language: language === "es" ? "es" : "en", blocked: true, reason: "account_required" });
      return;
    }
    if (PROMOTION_ACCESS_CONFIG.promotionActive && promotionAccess !== false && shouldShowPromotionNotice(feature)) {
      window.dispatchEvent(new CustomEvent("citizenshipai:pro-benefits", { detail: { feature, language } }));
    }
    beginSession(feature, continuation, language);
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

  const modalRef = useModalFocus(Boolean(pending), close);
  const copy = pending ? COPY[pending.language] : COPY.en;
  const blockedTitle = pending?.reason === "quota_exhausted" ? copy.quotaTitle : copy.unavailableTitle;
  const blockedBody = pending?.reason === "quota_exhausted" ? copy.quotaBody : copy.unavailableBody;
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
          <section ref={modalRef} className="promotion-access-sheet" role="dialog" aria-modal="true" aria-labelledby="promotion-access-title">
            <button className="promotion-access-close" onClick={close} type="button" aria-label={copy.close}>×</button>
            <div className="promotion-access-orb" aria-hidden="true">✦</div>
            <p className="promotion-access-eyebrow">{copy.eyebrow}</p>
            <h2 id="promotion-access-title">{pending.blocked ? blockedTitle : copy.title}</h2>
            <div className="promotion-access-feature"><span>{feature.label}</span><strong>{usage?.limit || 2} / {usage?.limit || 2}</strong></div>
            <p className="promotion-access-body">{pending.blocked ? blockedBody : copy.body}</p>
            {!pending.blocked && <div className="promotion-access-divider"><span></span><small>LAUNCH ACCESS</small><span></span></div>}
            {!pending.blocked && <button className="promotion-access-continue" onClick={continuePromotion} type="button"><span>{copy.continue}</span><b>→</b></button>}
            <p className="promotion-access-note">{copy.note}</p>
          </section>
        </div>
      )}
    </PromotionAccessContext.Provider>
  );
}
