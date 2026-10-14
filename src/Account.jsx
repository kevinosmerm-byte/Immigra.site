import { useModalFocus } from "./useModalFocus.js";
import { createClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "./api.js";
import { APP_IDENTITY } from "../shared/appIdentity.js";
import { NativeSubscriptionPanel } from "./NativeSubscriptionPanel.jsx";
import { PRO_PLAN } from "../shared/featureAccessConfig.js";
import { AccountContext, useAccount } from "./accountContext.js";

const browserSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const browserSupabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

function createAccountClient(url, publishableKey) {
  return url && publishableKey
    ? createClient(url, publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: !Capacitor.isNativePlatform() },
    })
    : null;
}

const COPY = {
  en: {
    account: "Account", title: "Your Immigra account", intro: "Sign in to keep the same 7-day interview and AI trial dates across your devices. Free study does not require an account.",
    email: "Email address", placeholder: "you@example.com", send: "SEND SECURE SIGN-IN LINK", sending: "SENDING…",
    sent: "Check your email. We sent you a secure sign-in link.", signedIn: "SIGNED IN", signOut: "SIGN OUT", close: "Close account panel",
    optional: "Free study needs no account. Sign in for your 7-day interview and AI trial, starting with your first use. No card is required.", unavailable: "Accounts are unavailable. Free study remains available; interview and AI access cannot be verified.",
    error: "We could not send the sign-in link. Please try again.", usage: "AI ACCESS", promotion: "Launch promotion active", free: "Free account",
    usageTitle: "AI PRACTICE", used: "used", available: "available", requests: "provider requests", pricing: "PRO PRICING", launchPrice: "Launch offer", regularPrice: "Regular $5.99/month", annualPrice: "$49.99/year", pricingStatus: "Purchases are not active yet.", monthly: "MONTHLY", yearly: "ANNUAL · SAVE 30%", manageSubscription: "MANAGE SUBSCRIPTION", secureCheckout: "Secure checkout by Stripe", billingError: "We could not open secure billing. Please try again.", openingCheckout: "OPENING…", exportData: "DOWNLOAD MY DATA", exporting: "PREPARING…", exportError: "We could not prepare your account data. Please try again.", deleteAccount: "DELETE ACCOUNT", deleteTitle: "Permanently delete account?", deleteBody: "This removes your cloud account and associated data. Cancel any subscription separately with the payment provider to stop future renewals. Deleting your account does not cancel billing. Local study data remains on this device until you clear it in Settings.", deletePrompt: "Type DELETE to confirm", deleting: "DELETING…", cancel: "CANCEL", deleteError: "We could not delete your account. Please try again.", deleteActiveSubscription: "Cancel your active web subscription from Manage Subscription before deleting the account.",
  },
  es: {
    account: "Cuenta", title: "Tu cuenta de Immigra", intro: "Inicia sesión para conservar las mismas fechas de prueba de 7 días de entrevistas e IA entre tus dispositivos. El estudio gratuito no requiere cuenta.",
    email: "Correo electrónico", placeholder: "tu@correo.com", send: "ENVIAR ENLACE SEGURO", sending: "ENVIANDO…",
    sent: "Revisa tu correo. Te enviamos un enlace seguro para iniciar sesión.", signedIn: "SESIÓN INICIADA", signOut: "CERRAR SESIÓN", close: "Cerrar panel de cuenta",
    optional: "El estudio gratuito no requiere cuenta. Inicia sesión para probar entrevistas e IA durante 7 días desde tu primer uso. No necesitas tarjeta.", unavailable: "Las cuentas no están disponibles. El estudio gratuito sigue abierto; no podemos verificar el acceso a entrevistas e IA.",
    error: "No pudimos enviar el enlace. Inténtalo nuevamente.", usage: "ACCESO A IA", promotion: "Promoción de lanzamiento activa", free: "Cuenta gratuita",
    usageTitle: "PRÁCTICA CON IA", used: "usadas", available: "disponibles", requests: "solicitudes al proveedor", pricing: "PRECIO PRO", launchPrice: "Oferta de lanzamiento", regularPrice: "Regular $5.99/mes", annualPrice: "$49.99/año", pricingStatus: "Las compras aún no están activas.", monthly: "MENSUAL", yearly: "ANUAL · AHORRA 30%", manageSubscription: "ADMINISTRAR SUSCRIPCIÓN", secureCheckout: "Pago seguro por Stripe", billingError: "No pudimos abrir el pago seguro. Inténtalo nuevamente.", openingCheckout: "ABRIENDO…", exportData: "DESCARGAR MIS DATOS", exporting: "PREPARANDO…", exportError: "No pudimos preparar los datos de tu cuenta. Inténtalo nuevamente.", deleteAccount: "ELIMINAR CUENTA", deleteTitle: "¿Eliminar la cuenta permanentemente?", deleteBody: "Esto elimina tu cuenta en la nube y sus datos. Cancela por separado cualquier suscripción con el proveedor para detener renovaciones. Eliminar la cuenta no cancela los cobros. Los datos locales permanecen hasta que los borres en Ajustes.", deletePrompt: "Escribe DELETE para confirmar", deleting: "ELIMINANDO…", cancel: "CANCELAR", deleteError: "No pudimos eliminar tu cuenta. Inténtalo nuevamente.", deleteActiveSubscription: "Cancela tu suscripción web activa desde Administrar suscripción antes de eliminar la cuenta.",
  },
};

const FEATURE_LABELS = {
  en: { coach: "English Coach", classicInterview: "Civics Interview", writing: "Writing", speaking: "Speaking", realInterview: "Real Interview" },
  es: { coach: "Coach de inglés", classicInterview: "Entrevista cívica", writing: "Escritura", speaking: "Conversación", realInterview: "Entrevista real" },
};

export function AccountProvider({ children }) {
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
      const response = await fetch(apiUrl("/account/usage"), { headers: { Authorization: `Bearer ${accessToken}` } });
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
    fetch(apiUrl("/account/public-config"), { cache: "no-store" })
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
    fetch(apiUrl("/account/usage"), { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((response) => response.ok ? response.json() : null)
      .then((nextUsage) => { if (active) setUsage(nextUsage); })
      .catch(() => { if (active) setUsage(null); });
    return () => { active = false; };
  }, [session?.access_token]);

  const value = useMemo(() => ({
    configured: Boolean(client), session, loading, usage, promotionAccess, aiFeatureAvailability, billing,
    refreshUsage: () => loadUsage(session?.access_token),
    verifyEmailCode: (email, token) => client.auth.verifyOtp({ email, token, type: "email" }),
    sendMagicLink: (email) => client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: Capacitor.isNativePlatform() ? APP_IDENTITY.origin : `${window.location.origin}${window.location.pathname}` },
    }),
    signOut: () => client?.auth.signOut(),
    startAiSession: async (feature) => {
      if (!session?.access_token) return null;
      const response = await fetch(apiUrl("/account/sessions"), {
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
      const response = await fetch(apiUrl(`/account/sessions/${encodeURIComponent(sessionId)}/finish`), {
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
      const response = await fetch(apiUrl("/account/events"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ eventName, feature }),
        keepalive: true,
      });
      return response.ok;
    },
    exportAccountData: async () => {
      if (!session?.access_token) return null;
      const response = await fetch(apiUrl("/account/export"), {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error("Account export unavailable");
      return response.blob();
    },
    deleteAccount: async () => {
      if (!session?.access_token) return null;
      const response = await fetch(apiUrl("/account"), {
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
      const response = await fetch(apiUrl("/billing/checkout-session"), {
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
      const response = await fetch(apiUrl("/billing/portal-session"), {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.url) throw new Error(result.error || "Subscription management unavailable");
      window.location.assign(result.url);
      return true;
    },
  }), [client, session, loading, usage, promotionAccess, aiFeatureAvailability, billing]);

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function AccountButton({ language = "en", onClick }) {
  const { session } = useAccount();
  const copy = COPY[language === "es" ? "es" : "en"];
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
  const { configured, session, loading, usage, billing, sendMagicLink, verifyEmailCode, signOut, exportAccountData, deleteAccount, openCheckout, openBillingPortal } = useAccount();
  const copy = COPY[language === "es" ? "es" : "en"];
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [codeError, setCodeError] = useState(false);
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
    ? Object.entries(usage.features).filter(([, item]) => item?.enabled)
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

  const verifyCode = async () => {
    if (!/^\d{6,8}$/.test(emailCode) || submitting) return;
    setSubmitting(true); setCodeError(false);
    try {
      const { error } = await verifyEmailCode(email.trim(), emailCode);
      if (error) setCodeError(true);
    } catch { setCodeError(true); }
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
        <button className="account-close" onClick={onClose} type="button" aria-label={copy.close}>×</button>
        <div className="account-mark" aria-hidden="true">◎</div>
        <p className="account-eyebrow">IMMIGRA · {copy.account.toUpperCase()}</p>
        <h2 id="account-title">{copy.title}</h2>
        <p className="account-intro">{copy.intro}</p>
        {!configured ? <div className="account-message">{copy.unavailable}</div> : loading ? <div className="account-loading" /> : session ? (
          <>
            <div className="account-identity"><span>{copy.signedIn}</span><strong>{session.user.email}</strong></div>
            <div className="account-access"><span>{copy.usage}</span><strong>{usage?.tier === "pro" ? "PRO" : copy.free}</strong><small>{usage?.access?.status === "trial_active" ? (language === "es" ? "Prueba activa · sin cuotas de práctica" : "Trial active · no practice quotas") : usage?.access?.status === "trial_expired" ? (language === "es" ? "Prueba finalizada · suscripción necesaria" : "Trial ended · subscription required") : usage?.access?.status === "subscribed" ? (language === "es" ? "Suscripción activa" : "Subscription active") : (language === "es" ? "7 días gratis desde tu primera entrevista o uso de IA" : "7 days free from your first interview or AI use")}</small></div>
            {usage?.access?.trialEndsAt && <p className="account-metering-note">{language === "es" ? "Tu prueba termina:" : "Your trial ends:"} {new Date(usage.access.trialEndsAt).toLocaleString(language === "es" ? "es-US" : "en-US")}</p>}
            {usage?.metering?.total && (
              <p className="account-metering-note">
                <strong>{Number(usage.metering.total.requests) || 0}</strong> {copy.requests}
              </p>
            )}
            {usageFeatures.length > 0 && (
              <div className="account-usage-summary" aria-label={copy.usageTitle}>
                <span className="account-usage-title">{copy.usageTitle}</span>
                {usageFeatures.map(([feature]) => {
                  return <div className="account-usage-row" key={feature}><span>{FEATURE_LABELS[language === "es" ? "es" : "en"][feature] || feature}</span><strong>{usage?.access?.allowed ? (language === "es" ? "Sin cuotas" : "No quotas") : (language === "es" ? "Suscripción / prueba" : "Subscription / trial")}</strong></div>;
                })}
              </div>
            )}
            <button className="account-primary account-export" onClick={downloadAccountData} disabled={exporting} type="button">
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
          </>
        ) : (
          <form onSubmit={submit}>
            <label className="account-label" htmlFor="account-email">{copy.email}</label>
            <input id="account-email" className="account-input" type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={copy.placeholder} required />
            <button className="account-primary" disabled={submitting} type="submit"><span>{submitting ? copy.sending : Capacitor.isNativePlatform() ? (language === "es" ? "ENVIAR CÓDIGO DE ACCESO" : "SEND SIGN-IN CODE") : copy.send}</span><b>→</b></button>
            {status && <p className={`account-status ${status}`}>{status === "sent" ? (Capacitor.isNativePlatform() ? (language === "es" ? "Revisa tu correo e introduce el código de acceso." : "Check your email and enter the sign-in code.") : copy.sent) : copy.error}</p>}
            {status === "sent" && <div className="mt-4 rounded-xl border border-white/10 bg-[#030305] p-4 text-slate-100"><label htmlFor="account-email-code">{language === "es" ? "Código del correo" : "Email verification code"}</label><input id="account-email-code" className="account-input" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={emailCode} onChange={event => setEmailCode(event.target.value.replace(/\D/g, ""))} /><button className="account-primary" type="button" disabled={submitting || !/^\d{6,8}$/.test(emailCode)} onClick={verifyCode}>{language === "es" ? "Verificar e iniciar sesión" : "Verify and sign in"}</button>{codeError && <p role="alert">{language === "es" ? "El código no es válido o venció. Solicita uno nuevo." : "The code is invalid or expired. Request a new one."}</p>}</div>}
          </form>
        )}
        <div className="account-pricing" aria-label={copy.pricing}>
          <h2>{language === "es" ? "Qué incluye PRO" : "What PRO includes"}</h2>
          <ul className="pro-plan-benefits">
            <li>{language === "es" ? "Entrevistas y conversaciones con Sarah o Kevin" : "Interviews and conversations with Sarah or Kevin"}</li>
            <li>{language === "es" ? "Transcripción y comentarios de IA sin cuotas de práctica" : "Transcription and AI feedback without practice quotas"}</li>
            <li>{language === "es" ? "Práctica de lectura y escritura con IA" : "AI-supported reading and writing practice"}</li>
            <li>{language === "es" ? "El estudio básico sigue gratis sin suscripción" : "Basic study remains free without a subscription"}</li>
          </ul>
          <p>{language === "es" ? "Siete días sin cuotas desde tu primer uso. Después necesitas suscripción para entrevistas e IA." : "Seven days without quotas from your first use. A subscription is required for interviews and AI afterward."}</p>
          <span>{copy.pricing}</span>
          <div hidden={Capacitor.isNativePlatform()}>
            <strong>{!Capacitor.isNativePlatform() && billing?.monthlyTrialDays === 7 ? (language === "es" ? "7 días gratis, luego US$5.99/mes" : "7 days free, then US$5.99/month") : copy.regularPrice}</strong>
            <small>{copy.annualPrice}</small>
          </div>
          {webBillingEnabled && session ? (
            usage?.tier === "pro" ? (
              <button className="account-billing-manage" type="button" onClick={() => startBillingAction("portal")} disabled={Boolean(billingAction)}>{billingAction ? copy.openingCheckout : copy.manageSubscription}</button>
            ) : (
              <div className="account-billing-actions">
                <button type="button" onClick={() => startBillingAction("monthly")} disabled={Boolean(billingAction)}><b>{billing.monthlyTrialDays === 7 ? (language === "es" ? "PROBAR 7 DÍAS GRATIS" : "START 7-DAY FREE TRIAL") : copy.monthly}</b><small>US${(Number(billing.monthlyPriceCents || PRO_PLAN.regularMonthlyPriceCents) / 100).toFixed(2)}/{language === "es" ? "mes" : "month"}</small></button>
                <button type="button" onClick={() => startBillingAction("annual")} disabled={Boolean(billingAction)}><b>{copy.yearly}</b><small>${(Number(billing.annualPriceCents || PRO_PLAN.annualPriceCents) / 100).toFixed(2)}/yr</small></button>
                <em>{copy.secureCheckout}</em>
                {<p>{language === "es" ? "La prueba gratuita dura 7 días desde el primer uso y no requiere tarjeta ni genera cobros automáticos. Suscribirte inicia el pago y la renovación automática al precio e intervalo mostrados, más impuestos aplicables. No se añade otra prueba de 7 días al comprar. Puedes administrar o cancelar desde tu cuenta." : "The free trial lasts 7 days from your first use, requires no card and causes no automatic charge. Subscribing starts payment and automatic renewal at the shown price and interval, plus applicable taxes. Purchasing does not add another 7-day trial. Manage or cancel from your account."}</p>}
              </div>
            )
          ) : <em>{copy.pricingStatus}</em>}
          {billingError && <p className="account-status error account-billing-error">{copy.billingError}</p>}
          {Capacitor.isNativePlatform() && <NativeSubscriptionPanel language={language} />}
        </div>
        <p className="account-note">{copy.optional}</p>
      </section>
    </div>
  );
}
