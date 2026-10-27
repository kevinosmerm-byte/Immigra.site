import { createClient } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AccountContext = createContext(null);

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
    account: "Account", title: "Your Immigra.site account", intro: "Sign in to securely connect future AI allowances and subscriptions across your devices.",
    email: "Email address", placeholder: "you@example.com", send: "SEND SECURE SIGN-IN LINK", sending: "SENDING…",
    sent: "Check your email. We sent you a secure sign-in link.", signedIn: "SIGNED IN", signOut: "SIGN OUT", close: "Close account panel",
    optional: "Optional during the launch promotion. You can continue using the app without signing in.", unavailable: "Accounts are being prepared. You can continue using the app normally.",
    error: "We could not send the sign-in link. Please try again.", usage: "AI ACCESS", promotion: "Launch promotion active", free: "Free account",
    usageTitle: "AI PRACTICE", used: "used", available: "available", requests: "provider requests", exportData: "DOWNLOAD MY DATA", exporting: "PREPARING…", exportError: "We could not prepare your account data. Please try again.", deleteAccount: "DELETE ACCOUNT", deleteTitle: "Permanently delete account?", deleteBody: "This removes your cloud account, AI allowances, and usage records. Local study progress on this device is not removed.", deletePrompt: "Type DELETE to confirm", deleting: "DELETING…", cancel: "CANCEL", deleteError: "We could not delete your account. Please try again.",
  },
  es: {
    account: "Cuenta", title: "Tu cuenta de Immigra.site", intro: "Inicia sesión para conectar de forma segura los futuros límites de IA y suscripciones entre tus dispositivos.",
    email: "Correo electrónico", placeholder: "tu@correo.com", send: "ENVIAR ENLACE SEGURO", sending: "ENVIANDO…",
    sent: "Revisa tu correo. Te enviamos un enlace seguro para iniciar sesión.", signedIn: "SESIÓN INICIADA", signOut: "CERRAR SESIÓN", close: "Cerrar panel de cuenta",
    optional: "Es opcional durante la promoción de lanzamiento. Puedes continuar usando la aplicación sin iniciar sesión.", unavailable: "Las cuentas se están preparando. Puedes continuar usando la aplicación normalmente.",
    error: "No pudimos enviar el enlace. Inténtalo nuevamente.", usage: "ACCESO A IA", promotion: "Promoción de lanzamiento activa", free: "Cuenta gratuita",
    usageTitle: "PRÁCTICA CON IA", used: "usadas", available: "disponibles", requests: "solicitudes al proveedor", exportData: "DESCARGAR MIS DATOS", exporting: "PREPARANDO…", exportError: "No pudimos preparar los datos de tu cuenta. Inténtalo nuevamente.", deleteAccount: "ELIMINAR CUENTA", deleteTitle: "¿Eliminar la cuenta permanentemente?", deleteBody: "Esto elimina tu cuenta en la nube, límites de IA y registros de uso. El progreso local de estudio en este dispositivo no se elimina.", deletePrompt: "Escribe DELETE para confirmar", deleting: "ELIMINANDO…", cancel: "CANCELAR", deleteError: "No pudimos eliminar tu cuenta. Inténtalo nuevamente.",
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
      setLoading(false);
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [client]);

  useEffect(() => {
    if (!session?.access_token) { setUsage(null); return; }
    loadUsage(session.access_token);
  }, [session?.access_token]);

  const value = useMemo(() => ({
    configured: Boolean(client), session, loading, usage, promotionAccess, aiFeatureAvailability,
    sendMagicLink: (email) => client.auth.signInWithOtp({
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
      if (!response.ok) throw new Error("Account deletion unavailable");
      await client.auth.signOut({ scope: "local" });
      return true;
    },
  }), [client, session, loading, usage, promotionAccess, aiFeatureAvailability]);

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error("useAccount must be used inside AccountProvider");
  return value;
}

export function AccountButton({ language = "en", onClick }) {
  const { session } = useAccount();
  const copy = COPY[language === "es" ? "es" : "en"];
  return (
    <button className={`home-account-button${session ? " signed-in" : ""}`} onClick={onClick} type="button" aria-label={copy.account}>
      <span aria-hidden="true">{session ? "✓" : "○"}</span>
    </button>
  );
}

export function AccountSheet({ language = "en", onClose }) {
  const { configured, session, loading, usage, sendMagicLink, signOut, exportAccountData, deleteAccount } = useAccount();
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
  const usageFeatures = usage?.features
    ? Object.entries(usage.features).filter(([, item]) => item?.enabled)
    : [];

  const submit = async (event) => {
    event.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true); setStatus("");
    const { error } = await sendMagicLink(email.trim());
    setStatus(error ? "error" : "sent");
    setSubmitting(false);
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
      link.download = `immigra-site-account-${new Date().toISOString().slice(0, 10)}.json`;
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
    } catch {
      setDeleteError(true);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="account-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="account-sheet" role="dialog" aria-modal="true" aria-labelledby="account-title">
        <button className="account-close" onClick={onClose} type="button" aria-label={copy.close}>×</button>
        <div className="account-mark" aria-hidden="true">◎</div>
        <p className="account-eyebrow">IMMIGRA.SITE · {copy.account.toUpperCase()}</p>
        <h2 id="account-title">{copy.title}</h2>
        <p className="account-intro">{copy.intro}</p>
        {!configured ? <div className="account-message">{copy.unavailable}</div> : loading ? <div className="account-loading" /> : session ? (
          <>
            <div className="account-identity"><span>{copy.signedIn}</span><strong>{session.user.email}</strong></div>
            <div className="account-access"><span>{copy.usage}</span><strong>{usage?.tier === "pro" ? "PRO" : copy.free}</strong><small>{copy.promotion}</small></div>
            {usage?.metering?.total && (
              <p className="account-metering-note">
                <strong>{Number(usage.metering.total.requests) || 0}</strong> {copy.requests}
              </p>
            )}
            {usageFeatures.length > 0 && (
              <div className="account-usage-summary" aria-label={copy.usageTitle}>
                <span className="account-usage-title">{copy.usageTitle}</span>
                {usageFeatures.map(([feature, item]) => {
                  const limit = Math.max(0, Number(item.freeLimit) || 0);
                  const used = Math.min(limit, Math.max(0, Number(item.freeUsed) || 0));
                  return (
                    <div className="account-usage-row" key={feature}>
                      <span>{FEATURE_LABELS[language === "es" ? "es" : "en"][feature] || feature}</span>
                      <strong>{used}/{limit}</strong>
                      <small>{Math.max(0, limit - used)} {copy.available}</small>
                    </div>
                  );
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
                {deleteError && <p className="account-status error">{copy.deleteError}</p>}
              </div>
            )}
          </>
        ) : (
          <form onSubmit={submit}>
            <label className="account-label" htmlFor="account-email">{copy.email}</label>
            <input id="account-email" className="account-input" type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={copy.placeholder} required />
            <button className="account-primary" disabled={submitting} type="submit"><span>{submitting ? copy.sending : copy.send}</span><b>→</b></button>
            {status && <p className={`account-status ${status}`}>{status === "sent" ? copy.sent : copy.error}</p>}
          </form>
        )}
        <p className="account-note">{copy.optional}</p>
      </section>
    </div>
  );
}
