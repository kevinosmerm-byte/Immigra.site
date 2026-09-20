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
    account: "Account", title: "Your Citizenship AI account", intro: "Sign in to securely connect future AI allowances and subscriptions across your devices.",
    email: "Email address", placeholder: "you@example.com", send: "SEND SECURE SIGN-IN LINK", sending: "SENDING…",
    sent: "Check your email. We sent you a secure sign-in link.", signedIn: "SIGNED IN", signOut: "SIGN OUT", close: "Close account panel",
    optional: "Optional during the launch promotion. You can continue using the app without signing in.", unavailable: "Accounts are being prepared. You can continue using the app normally.",
    error: "We could not send the sign-in link. Please try again.", usage: "AI ACCESS", promotion: "Launch promotion active", free: "Free account",
  },
  es: {
    account: "Cuenta", title: "Tu cuenta de Citizenship AI", intro: "Inicia sesión para conectar de forma segura los futuros límites de IA y suscripciones entre tus dispositivos.",
    email: "Correo electrónico", placeholder: "tu@correo.com", send: "ENVIAR ENLACE SEGURO", sending: "ENVIANDO…",
    sent: "Revisa tu correo. Te enviamos un enlace seguro para iniciar sesión.", signedIn: "SESIÓN INICIADA", signOut: "CERRAR SESIÓN", close: "Cerrar panel de cuenta",
    optional: "Es opcional durante la promoción de lanzamiento. Puedes continuar usando la aplicación sin iniciar sesión.", unavailable: "Las cuentas se están preparando. Puedes continuar usando la aplicación normalmente.",
    error: "No pudimos enviar el enlace. Inténtalo nuevamente.", usage: "ACCESO A IA", promotion: "Promoción de lanzamiento activa", free: "Cuenta gratuita",
  },
};

export function AccountProvider({ children }) {
  const [client, setClient] = useState(() => createAccountClient(browserSupabaseUrl, browserSupabaseKey));
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    if (client || (browserSupabaseUrl && browserSupabaseKey)) return;
    let active = true;
    fetch("/api/account/public-config", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((config) => {
        if (!active) return;
        setClient(createAccountClient(config?.url, config?.publishableKey));
        if (!config?.configured) setLoading(false);
      })
      .catch(() => { if (active) setLoading(false); });
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
    fetch("/api/account/usage", { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((response) => response.ok ? response.json() : null)
      .then(setUsage)
      .catch(() => setUsage(null));
  }, [session?.access_token]);

  const value = useMemo(() => ({
    configured: Boolean(client), session, loading, usage,
    sendMagicLink: (email) => client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` },
    }),
    signOut: () => client?.auth.signOut(),
  }), [client, session, loading, usage]);

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
  const { configured, session, loading, usage, sendMagicLink, signOut } = useAccount();
  const copy = COPY[language === "es" ? "es" : "en"];
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true); setStatus("");
    const { error } = await sendMagicLink(email.trim());
    setStatus(error ? "error" : "sent");
    setSubmitting(false);
  };

  return (
    <div className="account-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="account-sheet" role="dialog" aria-modal="true" aria-labelledby="account-title">
        <button className="account-close" onClick={onClose} type="button" aria-label={copy.close}>×</button>
        <div className="account-mark" aria-hidden="true">◎</div>
        <p className="account-eyebrow">CITIZENSHIP AI · {copy.account.toUpperCase()}</p>
        <h2 id="account-title">{copy.title}</h2>
        <p className="account-intro">{copy.intro}</p>
        {!configured ? <div className="account-message">{copy.unavailable}</div> : loading ? <div className="account-loading" /> : session ? (
          <>
            <div className="account-identity"><span>{copy.signedIn}</span><strong>{session.user.email}</strong></div>
            <div className="account-access"><span>{copy.usage}</span><strong>{usage?.tier === "pro" ? "PRO" : copy.free}</strong><small>{copy.promotion}</small></div>
            <button className="account-primary secondary" onClick={signOut} type="button">{copy.signOut}<b>→</b></button>
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
