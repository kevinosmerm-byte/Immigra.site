import {TEMPORARY_PUBLIC_INTERVIEWS} from '../../../shared/interview-ui/access-policy.mjs';
import {GlassCard,GlassSection,GlassProgress,GlassIcon} from '../../../shared/design-system/Glass.jsx';
import { useModalFocus } from "./useModalFocus.js";
import { createClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { useEffect, useMemo, useState } from "react";
import { AI_FEATURE_ACCESS, PRO_PLAN } from "../shared/featureAccessConfig.js";
import { AccountContext, useAccount } from "./accountContext.js";

const browserSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const browserSupabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

function createAccountClient(url, publishableKey) {
  return url && publishableKey
    ? createClient(url, publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
    : null;
}

const COPY = {
  en: {
    account: "Account", title: "Your Immigration AI account", intro: "Sign in to securely connect future AI allowances and subscriptions across your devices.",
    email: "Email address", placeholder: "you@example.com", send: "SEND SECURE SIGN-IN LINK", sending: "SENDING…",
    sent: "Check your email. We sent you a secure sign-in link.", signedIn: "SIGNED IN", signOut: "SIGN OUT", close: "Close account panel",
    optional: "Optional during the launch promotion. You can continue using the app without signing in.", unavailable: "Accounts are being prepared. You can continue using the app normally.",
    error: "We could not send the sign-in link. Please try again.", usage: "AI ACCESS", promotion: "Launch promotion active", free: "Free account",
    usageTitle: "AI PRACTICE", used: "used", available: "available", requests: "provider requests", pricing: "PRO PRICING", launchPrice: "Launch offer", regularPrice: "Regular $5.99/month", annualPrice: "$49.99/year", pricingStatus: "Purchases are not active yet.", monthly: "MONTHLY", yearly: "ANNUAL · SAVE 30%", manageSubscription: "MANAGE SUBSCRIPTION", secureCheckout: "Secure checkout by Stripe", billingError: "We could not open secure billing. Please try again.", openingCheckout: "OPENING…", exportData: "DOWNLOAD MY DATA", exporting: "PREPARING…", exportError: "We could not prepare your account data. Please try again.", deleteAccount: "DELETE ACCOUNT", deleteTitle: "Permanently delete account?", deleteBody: "This removes your cloud account, AI allowances, and usage records. Local study progress on this device is not removed.", deletePrompt: "Type DELETE to confirm", deleting: "DELETING…", cancel: "CANCEL", deleteError: "We could not delete your account. Please try again.", deleteActiveSubscription: "Cancel your active web subscription from Manage Subscription before deleting the account.",
  },
  es: {
    account: "Cuenta", title: "Tu cuenta de Immigration AI", intro: "Inicia sesión para conectar de forma segura los futuros límites de IA y suscripciones entre tus dispositivos.",
    email: "Correo electrónico", placeholder: "tu@correo.com", send: "ENVIAR ENLACE SEGURO", sending: "ENVIANDO…",
    sent: "Revisa tu correo. Te enviamos un enlace seguro para iniciar sesión.", signedIn: "SESIÓN INICIADA", signOut: "CERRAR SESIÓN", close: "Cerrar panel de cuenta",
    optional: "Es opcional durante la promoción de lanzamiento. Puedes continuar usando la aplicación sin iniciar sesión.", unavailable: "Las cuentas se están preparando. Puedes continuar usando la aplicación normalmente.",
    error: "No pudimos enviar el enlace. Inténtalo nuevamente.", usage: "ACCESO A IA", promotion: "Promoción de lanzamiento activa", free: "Cuenta gratuita",
    usageTitle: "PRÁCTICA CON IA", used: "usadas", available: "disponibles", requests: "solicitudes al proveedor", pricing: "PRECIO PRO", launchPrice: "Oferta de lanzamiento", regularPrice: "Regular $5.99/mes", annualPrice: "$49.99/año", pricingStatus: "Las compras aún no están activas.", monthly: "MENSUAL", yearly: "ANUAL · AHORRA 30%", manageSubscription: "ADMINISTRAR SUSCRIPCIÓN", secureCheckout: "Pago seguro por Stripe", billingError: "No pudimos abrir el pago seguro. Inténtalo nuevamente.", openingCheckout: "ABRIENDO…", exportData: "DESCARGAR MIS DATOS", exporting: "PREPARANDO…", exportError: "No pudimos preparar los datos de tu cuenta. Inténtalo nuevamente.", deleteAccount: "ELIMINAR CUENTA", deleteTitle: "¿Eliminar la cuenta permanentemente?", deleteBody: "Esto elimina tu cuenta en la nube, límites de IA y registros de uso. El progreso local de estudio en este dispositivo no se elimina.", deletePrompt: "Escribe DELETE para confirmar", deleting: "ELIMINANDO…", cancel: "CANCELAR", deleteError: "No pudimos eliminar tu cuenta. Inténtalo nuevamente.", deleteActiveSubscription: "Cancela tu suscripción web activa desde Administrar suscripción antes de eliminar la cuenta.",
  },
};

const FEATURE_LABELS = {
  en: { coach: "English Coach", classicInterview: "Civics Interview", writing: "Writing", speaking: "Speaking", realInterview: "Real Interview" },
  es: { coach: "Coach de inglés", classicInterview: "Entrevista cívica", writing: "Escritura", speaking: "Conversación", realInterview: "Entrevista real" },
};

export function AccountProvider({ children }) {
  const [signInError] = useState(() => new URLSearchParams(window.location.hash.slice(1)).has('error'));
  useEffect(() => { if (signInError) window.location.hash = '/account'; }, [signInError]);
  const [client, setClient] = useState(() => createAccountClient(browserSupabaseUrl, browserSupabaseKey));
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState(null);
  const [promotionAccess, setPromotionAccess] = useState(true);
  const [aiFeatureAvailability, setAiFeatureAvailability] = useState({});
  const [billing, setBilling] = useState({ enabled: false });

  const loadUsage = async (accessToken) => {
    if (!accessToken) { setUsage(null); return null; }
    try {
      const response = await fetch("/api/account/usage", { headers: { Authorization: `Bearer ${accessToken}` } });
      const nextUsage = response.ok ? await response.json() : null;
      setUsage(nextUsage);
      return nextUsage;
    } catch {
      setUsage(null);
      return null;
    }
  };

  useEffect(() => {
    let active = true;
    fetch("/api/account/public-config", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((config) => {
        if (!active) return;
        setPromotionAccess(config?.promotionAccess !== false);
        setAiFeatureAvailability(config?.aiFeatures && typeof config.aiFeatures === "object" ? config.aiFeatures : {});
        setBilling(config?.billing && typeof config.billing === "object" ? config.billing : { enabled: false });
        if (!client) setClient(createAccountClient(config?.url, config?.publishableKey));
        if (!client && !config?.configured) setLoading(false);
      })
      .catch(() => { if (active && !client) setLoading(false); });
    return () => { active = false; };
  }, [client]);

  useEffect(() => {
    if (!client) return;
    let active = true;
    client.auth.getSession().then(({ data }) => {
      if (active) { setSession(data.session || null); setLoading(false); }
    });
    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      if (!nextSession) setUsage(null);
      setLoading(false);
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [client]);

  useEffect(() => {
    const accessToken = session?.access_token;
    if (!accessToken) return undefined;
    let active = true;
    fetch("/api/account/usage", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((response) => response.ok ? response.json() : null)
      .then((nextUsage) => { if (active) setUsage(nextUsage); })
      .catch(() => { if (active) setUsage(null); });
    return () => { active = false; };
  }, [session?.access_token]);

  const value = useMemo(() => ({
    configured: Boolean(client), session, loading, usage, promotionAccess, aiFeatureAvailability, billing, signInError,
    sendMagicLink: (email) => TEMPORARY_PUBLIC_INTERVIEWS ? Promise.resolve({error: new Error("Account links temporarily disabled")}) : client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` },
    }),
    signOut: () => client?.auth.signOut(),
    startAiSession: async (feature) => {
      if (!session?.access_token) return null;
      const response = await fetch("/api/account/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ feature, idempotencyKey: crypto.randomUUID() }),
      });
      const decision = await response.json().catch(() => ({}));
      if (response.status === 403 && decision.allowed === false) {
        const accessError = new Error(decision.reason || "AI session unavailable");
        accessError.decision = decision;
        throw accessError;
      }
      if (!response.ok || !decision.allowed) throw new Error(decision.error || decision.reason || "AI session unavailable");
      loadUsage(session.access_token);
      return decision;
    },
    finishAiSession: async (sessionId, outcome = "completed", options = {}) => {
      if (!session?.access_token || !sessionId) return null;
      const response = await fetch(`/api/account/sessions/${encodeURIComponent(sessionId)}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ outcome }),
        keepalive: Boolean(options.keepalive),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "AI session result unavailable");
      loadUsage(session.access_token);
      return result;
    },
    recordAccountEvent: async (eventName, feature) => {
      if (!session?.access_token) return false;
      const response = await fetch("/api/account/events", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ eventName, feature }),
        keepalive: true,
      });
      return response.ok;
    },
    exportAccountData: async () => {
      if (!session?.access_token) return null;
      const response = await fetch("/api/account/export", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error("Account export unavailable");
      return response.blob();
    },
    deleteAccount: async () => {
      if (!session?.access_token) return null;
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ confirmation: "DELETE" }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        const error = new Error(result.error || "Account deletion unavailable");
        error.code = result.code || "deletion_unavailable";
        throw error;
      }
      await client.auth.signOut({ scope: "local" });
      return true;
    },
    openCheckout: async (interval) => {
      if (!session?.access_token) return false;
      const response = await fetch("/api/billing/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ interval }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.url) throw new Error(result.error || "Checkout unavailable");
      window.location.assign(result.url);
      return true;
    },
    openBillingPortal: async () => {
      if (!session?.access_token) return false;
      const response = await fetch("/api/billing/portal-session", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.url) throw new Error(result.error || "Subscription management unavailable");
      window.location.assign(result.url);
      return true;
    },
  }), [client, session, loading, usage, promotionAccess, aiFeatureAvailability, billing, signInError]);

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function AccountButton({ language = "en", onClick }) {
  const { session } = useAccount();
  const copy = COPY[language === "es" ? "es" : "en"];
  if (TEMPORARY_PUBLIC_INTERVIEWS && !session) return null;
  return (
    <button className={`home-account-button${session ? " signed-in" : ""}`} onClick={onClick} type="button" aria-label={copy.account}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="3.25" />
        <path d="M5.75 19c.45-3.55 2.55-5.5 6.25-5.5s5.8 1.95 6.25 5.5" />
        {session && <path className="account-status-check" d="m16.5 11.2 1.45 1.45 2.8-3.1" />}
      </svg>
    </button>
  );
}

export function AccountSheet({ language = "en", onClose, embedded = false }) {
  const modalRef = useModalFocus(!embedded, onClose);
  const { configured, session, loading, usage, billing, promotionAccess, sendMagicLink, signOut, exportAccountData, deleteAccount, openCheckout, openBillingPortal, signInError } = useAccount();
  const copy = COPY[language === "es" ? "es" : "en"];
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [billingAction, setBillingAction] = useState("");
  const [billingError, setBillingError] = useState(false);
  const usageFeatures = usage?.features
    ? Object.entries(usage.features).filter(([feature, item]) => feature !== "coach" && item?.enabled)
    : [];
  const webBillingEnabled = billing?.enabled && !Capacitor.isNativePlatform();

  const submit = async (event) => {
    event.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true); setStatus("");
    try {
      const { error } = await sendMagicLink(email.trim());
      setStatus(error ? "error" : "sent");
    } catch { setStatus("error"); }
    finally { setSubmitting(false); }
  };

  const downloadAccountData = async () => {
    if (exporting) return;
    setExporting(true); setExportError(false);
    try {
      const blob = await exportAccountData();
      if (!blob) throw new Error("Account export unavailable");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `citizenship-ai-account-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  };

  const permanentlyDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE" || deleting) return;
    setDeleting(true); setDeleteError(false);
    try {
      await deleteAccount();
      onClose();
    } catch (error) {
      setDeleteError(error.code || "deletion_unavailable");
    } finally {
      setDeleting(false);
    }
  };

  const startBillingAction = async (action) => {
    if (billingAction) return;
    setBillingAction(action); setBillingError(false);
    try {
      if (action === "portal") await openBillingPortal();
      else await openCheckout(action);
    } catch {
      setBillingError(true);
      setBillingAction("");
    }
  };

  return (
    <div className={embedded ? "account-page" : "account-backdrop"} role="presentation" onMouseDown={(event) => { if (!embedded && event.target === event.currentTarget) onClose(); }}>
      <section ref={modalRef} className="account-sheet" role={embedded ? "region" : "dialog"} aria-modal={embedded ? undefined : "true"} aria-labelledby="account-title">
        {!embedded&&<button className="account-close" onClick={onClose} type="button" aria-label={copy.close}>×</button>}
        <div className="liquid-page-heading"><span>{language==='es'?'TU CUENTA':'YOUR ACCOUNT'}</span><h1 id="account-title">{language==='es'?'Tu cuenta de Immigration AI':'Your Immigration AI account'}</h1><p>{language==='es'?'Gestiona tu suscripción, revisa tus límites y administra tu cuenta.':'Manage your subscription, review your limits and manage your account.'}</p></div>
        {signInError&&!session&&!status&&<p role="alert">{language==='es'?'El enlace de acceso no es válido o ha caducado. Solicita uno nuevo y abre únicamente el correo más reciente.':'The sign-in link is invalid or expired. Request a new link and open only the latest email.'}</p>}
        {!configured ? <div className="account-message">{copy.unavailable}</div> : loading ? <div className="account-loading" /> : session ? (
          <>
            <GlassCard className="account-overview"><span className="glass-icon" aria-hidden="true"><GlassIcon name="◎"/></span><div className="account-identity"><span>{copy.signedIn}</span><strong>{session.user.email}</strong></div>
            <div className="account-access"><span>{copy.usage}</span><strong>{usage?.tier === "pro" ? "PRO" : copy.free}</strong>{promotionAccess&&<small>{copy.promotion}</small>}</div>
            {usage?.metering?.total && (
              <p className="account-metering-note">
                <strong>{Number(usage.metering.total.requests) || 0}</strong> {copy.requests}
              </p>
            )}
            </GlassCard>
            {usageFeatures.length > 0 && (
              <GlassSection className="account-usage-summary" icon="▥" title={language==='es'?'Tu uso de IA':'Your AI usage'} description={language==='es'?'Consulta tus límites disponibles. También se aplican límites diarios.':'Review your allowances. Daily limits also apply.'}><div className="account-usage-grid">
                <span className="account-usage-title">{copy.usageTitle}</span>
                {usageFeatures.map(([feature, item]) => {
                  const pro=usage?.tier==="pro";
                  const limit = Math.max(0, Number(pro?item.proMonthlyLimit:item.freeLimit) || 0);
                  const used = Math.min(limit, Math.max(0, Number(item.freeUsed) || 0));
                  return (
                    <GlassCard className="account-usage-row" key={feature}><span className="glass-icon" aria-hidden="true"><GlassIcon name={({writing:"✎",speaking:"♬",realInterview:"◎",classicInterview:"▤"})[feature]}/></span>
                      <span>{FEATURE_LABELS[language === "es" ? "es" : "en"][feature] || feature}</span>
                      {pro?<><strong>{limit} {language==='es'?'sesiones al mes':'sessions per month'}</strong><small>{language==='es'?'Consumo mensual no disponible en este resumen.':'Monthly consumption unavailable in this summary.'}</small></>:<><strong>{used} {copy.used} / {limit}</strong><small>{Math.max(0, limit - used)} {copy.available} · {language==='es'?'Prueba gratuita':'Free trial'}</small><GlassProgress value={used} max={limit||1} label={`${used} / ${limit}`}/></>}
                    </GlassCard>
                  );
                })}
              </div></GlassSection>
            )}
          </>
        ) : TEMPORARY_PUBLIC_INTERVIEWS ? <p role="status">{copy.optional}</p> : (
          <form onSubmit={submit}>
            <label className="account-label" htmlFor="account-email">{copy.email}</label>
            <input id="account-email" className="account-input" type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={copy.placeholder} required />
            <button className="account-primary" disabled={submitting} type="submit"><span>{submitting ? copy.sending : copy.send}</span><b>→</b></button>
            {status && <p className={`account-status ${status}`}>{status === "sent" ? copy.sent : copy.error}</p>}
          </form>
        )}
        <GlassSection className="account-pricing" icon="♔" title="Plan PRO" description={language==='es'?'Descubre las herramientas y beneficios de Immigration AI PRO.':'Explore Immigration AI PRO tools and benefits.'}>
          <h2>{language === "es" ? "Qué incluye PRO" : "What PRO includes"}</h2>
          <ul className="pro-plan-benefits">
            <li>{AI_FEATURE_ACCESS.speaking.proMonthlyLimit} {language === "es" ? "sesiones de lectura al mes" : "reading sessions per month"}</li>
            <li>{AI_FEATURE_ACCESS.writing.proMonthlyLimit} {language === "es" ? "sesiones de escritura al mes" : "writing sessions per month"}</li>
            <li>{AI_FEATURE_ACCESS.classicInterview.proMonthlyLimit} {language === "es" ? "sesiones de entrevista clásica al mes" : "classic interview sessions per month"}</li>
            <li>{PRO_PLAN.liveAvatarMonthlySessions} {language === "es" ? "sesión de Real Interview al mes" : "Real Interview session per month"}</li>
          </ul>
          <p>{language === "es" ? "Consulta tus límites disponibles en esta cuenta. Se aplican límites diarios de uso." : "Check your available allowances in this account. Daily usage limits apply."}</p>
          {webBillingEnabled && session ? (
            usage?.tier === "pro" ? (
              <button className="account-billing-manage" type="button" onClick={() => startBillingAction("portal")} disabled={Boolean(billingAction)}>{billingAction ? copy.openingCheckout : copy.manageSubscription}</button>
            ) : (
              <div className="account-billing-actions">
                <button type="button" onClick={() => startBillingAction("monthly")} disabled={Boolean(billingAction)}><b>{copy.monthly}</b><small>${(Number(billing.introductoryOfferEnabled ? billing.introductoryMonthlyPriceCents : billing.monthlyPriceCents) / 100).toFixed(2)}/mo</small></button>
                <button type="button" onClick={() => startBillingAction("annual")} disabled={Boolean(billingAction)}><b>{language==='es'?'ANUAL':'ANNUAL'}</b><small>${(Number(billing.annualPriceCents || PRO_PLAN.annualPriceCents) / 100).toFixed(2)}/yr</small></button>
                <p>{language === "es" ? "7 días gratis. Después se cobra el precio del plan elegido con renovación automática. Se requiere un método de pago. Cancela antes de que termine la prueba para evitar el cobro; gestiona tu suscripción en Mi cuenta." : "7 days free. Then the selected plan price is charged with automatic renewal. A payment method is required. Cancel before the trial ends to avoid a charge; manage your subscription in My account."}</p><em>{copy.secureCheckout}</em>
              </div>
            )
          ) : <><button className="account-billing-manage" type="button" disabled>{language==='es'?'Actualizar a PRO →':'Upgrade to PRO →'}</button><em>{webBillingEnabled ? (language === 'es' ? 'Inicia sesión con tu correo para comenzar los 7 días gratis de PRO.' : 'Sign in with your email to start your 7-day PRO trial.') : copy.pricingStatus}</em></>}
          {billingError && <p className="account-status error account-billing-error">{copy.billingError}</p>}
          {Capacitor.isNativePlatform() && <><button type="button" disabled>{language === "es" ? "Restaurar compra" : "Restore Purchase"}</button><small>{language === "es" ? "Las compras y la restauración en la tienda todavía no están disponibles." : "Store purchases and restoration are not available yet."}</small></>}
        </GlassSection>
        {session&&<GlassSection className="account-management" icon="⚙" title={language==='es'?'Administración de la cuenta':'Account management'} description={language==='es'?'Gestiona y protege tu información.':'Manage and protect your information.'}><div className="account-management-grid">            <button className="account-primary account-export" onClick={downloadAccountData} disabled={exporting} type="button">
              <span>{exporting ? copy.exporting : copy.exportData}</span><b>↓</b>
            </button>
            {exportError && <p className="account-status error">{copy.exportError}</p>}
            <button className="account-primary secondary" onClick={signOut} type="button">{copy.signOut}<b>→</b></button>
            {!deleteArmed ? (
              <button className="account-delete-link" onClick={() => setDeleteArmed(true)} type="button">{copy.deleteAccount}</button>
            ) : (
              <div className="account-delete-panel">
                <strong>{copy.deleteTitle}</strong>
                <p>{copy.deleteBody}</p>
                <label htmlFor="account-delete-confirmation">{copy.deletePrompt}</label>
                <input id="account-delete-confirmation" className="account-input" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} autoComplete="off" />
                <div className="account-delete-actions">
                  <button type="button" onClick={() => { setDeleteArmed(false); setDeleteConfirmation(""); setDeleteError(false); }}>{copy.cancel}</button>
                  <button type="button" onClick={permanentlyDeleteAccount} disabled={deleteConfirmation !== "DELETE" || deleting}>{deleting ? copy.deleting : copy.deleteAccount}</button>
                </div>
                {deleteError && <p className="account-status error">{deleteError === "active_subscription_requires_cancellation" ? copy.deleteActiveSubscription : copy.deleteError}</p>}
              </div>
            )}
</div></GlassSection>}
        <p className="account-note">{copy.optional}</p>
      </section>
    </div>
  );
}
