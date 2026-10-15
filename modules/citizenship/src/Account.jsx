import {billingErrorMessage} from "./billingMessages.mjs";
import {authCallbackKind} from '../../../shared/authentication/callback.mjs';
import {checkoutReturnUrl,readCheckoutIntent,clearCheckoutIntent} from "./checkoutIntent.mjs";
import {App as NativeApp} from '@capacitor/app';
import {accountStorage,clearLegacyBrowserSession,lastAccountEmail,rememberAccountEmail} from "./accountStorage.js";
import EmailTrialAccount from "./EmailTrialAccount.jsx";
import { createPortal } from "react-dom";
import {TEMPORARY_PUBLIC_INTERVIEWS} from '../../../shared/interview-ui/access-policy.mjs';
import {GlassCard,GlassSection,GlassProgress,GlassIcon} from '../../../shared/design-system/Glass.jsx';
import { useModalFocus } from "./useModalFocus.js";
import { createClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { useEffect, useMemo, useState } from "react";
import { PRO_PLAN } from "../shared/featureAccessConfig.js";
import { AccountContext, useAccount } from "./accountContext.js";

const NATIVE_TRIAL_KEY='immigra.native-trial.v1';
const browserSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const browserSupabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

function createAccountClient(url, publishableKey) {
  return url && publishableKey
    ? createClient(url, publishableKey, {
      auth: { storage: accountStorage, persistSession: true, autoRefreshToken: Capacitor.isNativePlatform(), detectSessionInUrl: true, flowType: Capacitor.isNativePlatform()?'pkce':'implicit' },
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
    usageTitle: "AI PRACTICE", used: "used", available: "available", requests: "provider requests", pricing: "PRO PRICING", launchPrice: "Launch offer", regularPrice: "Regular $5.99/month", annualPrice: "$49.99/year", pricingStatus: "Purchases are not active yet.", monthly: "MONTHLY", yearly: "ANNUAL · SAVE 30%", manageSubscription: "MANAGE SUBSCRIPTION", secureCheckout: "Secure checkout by Stripe", billingError: "We could not open secure billing. Please try again.", openingCheckout: "OPENING…", exportData: "DOWNLOAD MY DATA", exporting: "PREPARING…", exportError: "We could not prepare your account data. Please try again.", deleteAccount: "DELETE ACCOUNT", deleteTitle: "Permanently delete account?", deleteBody: "This removes your cloud account and associated personal data. Local study progress on this device is not removed. We stop future renewal of a linked web Stripe subscription before deleting. Apple or Google subscriptions must also be canceled through that store.", deletePrompt: "Type DELETE to confirm", deleting: "DELETING…", cancel: "CANCEL", deleteError: "We could not delete your account. Please try again.", deleteActiveSubscription: "Cancel your active web subscription from Manage Subscription before deleting the account.",
  },
  es: {
    account: "Cuenta", title: "Tu cuenta de Immigra", intro: "Inicia sesión para conservar las mismas fechas de prueba de 7 días de entrevistas e IA entre tus dispositivos. El estudio gratuito no requiere cuenta.",
    email: "Correo electrónico", placeholder: "tu@correo.com", send: "ENVIAR ENLACE SEGURO", sending: "ENVIANDO…",
    sent: "Revisa tu correo. Te enviamos un enlace seguro para iniciar sesión.", signedIn: "SESIÓN INICIADA", signOut: "CERRAR SESIÓN", close: "Cerrar panel de cuenta",
    optional: "El estudio gratuito no requiere cuenta. Inicia sesión para probar entrevistas e IA durante 7 días desde tu primer uso. No necesitas tarjeta.", unavailable: "Las cuentas no están disponibles. El estudio gratuito sigue abierto; no podemos verificar el acceso a entrevistas e IA.",
    error: "No pudimos enviar el enlace. Inténtalo nuevamente.", usage: "ACCESO A IA", promotion: "Promoción de lanzamiento activa", free: "Cuenta gratuita",
    usageTitle: "PRÁCTICA CON IA", used: "usadas", available: "disponibles", requests: "solicitudes al proveedor", pricing: "PRECIO PRO", launchPrice: "Oferta de lanzamiento", regularPrice: "Regular $5.99/mes", annualPrice: "$49.99/año", pricingStatus: "Las compras aún no están activas.", monthly: "MENSUAL", yearly: "ANUAL · AHORRA 30%", manageSubscription: "ADMINISTRAR SUSCRIPCIÓN", secureCheckout: "Pago seguro por Stripe", billingError: "No pudimos abrir el pago seguro. Inténtalo nuevamente.", openingCheckout: "ABRIENDO…", exportData: "DESCARGAR MIS DATOS", exporting: "PREPARANDO…", exportError: "No pudimos preparar los datos de tu cuenta. Inténtalo nuevamente.", deleteAccount: "ELIMINAR CUENTA", deleteTitle: "¿Eliminar la cuenta permanentemente?", deleteBody: "Esto elimina tu cuenta en la nube y sus datos personales asociados. El progreso local de este dispositivo no se elimina. Antes de borrar detenemos futuras renovaciones de una suscripción web vinculada de Stripe. Las compras de Apple o Google también deben cancelarse desde esa tienda.", deletePrompt: "Escribe DELETE para confirmar", deleting: "ELIMINANDO…", cancel: "CANCELAR", deleteError: "No pudimos eliminar tu cuenta. Inténtalo nuevamente.", deleteActiveSubscription: "Cancela tu suscripción web activa desde Administrar suscripción antes de eliminar la cuenta.",
  },
};

const FEATURE_LABELS = {
  en: { coach: "English Coach", classicInterview: "Civics Interview", writing: "Writing", speaking: "Speaking", realInterview: "Real Interview" },
  es: { coach: "Coach de inglés", classicInterview: "Entrevista cívica", writing: "Escritura", speaking: "Conversación", realInterview: "Entrevista real" },
};

async function registerEmailAccess(email) {
  const response = await fetch('/api/account/email-trial', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }), signal: AbortSignal.timeout(30000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.session) throw Object.assign(new Error(data.error || 'Access unavailable'), { code: data.code });
  if (Capacitor.isNativePlatform()) await accountStorage.setItem(NATIVE_TRIAL_KEY, data.session.access_token);
  rememberAccountEmail(email);
  return data.session;
}

export function AccountProvider({ children }) {
  const [authCallback] = useState(() => authCallbackKind(window.location));
  const [signInError,setSignInError] = useState(authCallback==='error');
  useEffect(() => { if (signInError) window.location.hash = '/account'; }, [signInError]);
  const [client, setClient] = useState(() => createAccountClient(browserSupabaseUrl, browserSupabaseKey));
  const [verifiedSession, setSession] = useState(null);
  const [guestSession,setGuestSession]=useState(null);
  const [restoringDevice,setRestoringDevice]=useState(true);
  const session=verifiedSession||guestSession;
  const [loading, setLoading] = useState(true);
  const [sessionRecoveryError,setSessionRecoveryError]=useState(false);
  const [usage, setUsage] = useState(null);
  const [promotionAccess, setPromotionAccess] = useState(false);
  const [aiFeatureAvailability, setAiFeatureAvailability] = useState({});
  const [billing, setBilling] = useState({ enabled: false });

  useEffect(()=>{
    let active=true;
    const restore=async()=>{try{
      const token=Capacitor.isNativePlatform()?await accountStorage.getItem(NATIVE_TRIAL_KEY):null;
      const response=await fetch('/api/account/email-trial/session',{cache:'no-store',headers:token?{Authorization:'Bearer '+token}:{},signal:AbortSignal.timeout(10000)});
      const data=response.ok?await response.json():null;if(active)setGuestSession(data?.session||null);
      if(Capacitor.isNativePlatform()&&((response.ok&&!data?.session)||response.status===401||response.status===403))await accountStorage.removeItem(NATIVE_TRIAL_KEY);
    }catch{}finally{if(active)setRestoringDevice(false);}};
    void restore();return()=>{active=false;};
  },[]);
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
    fetch("/api/account/public-config", { cache: "no-store", signal: AbortSignal.timeout(10000) })
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
    const adopt=async nextSession=>{
      if(!nextSession)return null;
      if(Capacitor.isNativePlatform()){
        const {data,error}=await client.auth.getUser();
        if(error&&(Number(error.status)>=500||error.name==='AuthRetryableFetchError'))throw error;
        if(error||!data?.user)return null;
        return nextSession;
      }
      const response=await fetch('/api/account/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({access_token:nextSession.access_token,refresh_token:nextSession.refresh_token}),signal:AbortSignal.timeout(10000)});
      if(!response.ok)throw new Error('Session verification unavailable');
      const session=(await response.json()).session;clearLegacyBrowserSession();return session;
    };
    const restore=async()=>{
      try{
        const {data}=await client.auth.getSession();
        let next=await adopt(data.session);
        if(!next&&!Capacitor.isNativePlatform()){
          const response=await fetch('/api/account/session',{cache:'no-store',signal:AbortSignal.timeout(10000)});
          if(!response.ok)throw new Error('Session temporarily unavailable');
          next=(await response.json()).session;
        }
        if(active){
          setSession(next||null);
          if(next){setGuestSession(null);rememberAccountEmail(next.user.email);}
          if(authCallback||(next&&(!window.location.hash||window.location.hash==='#/')))window.location.hash='/account';
          if(authCallback&&!next)setSignInError(true);
        }
      }catch{if(active)setSessionRecoveryError(true);}
      finally{if(active)setLoading(false);}
    };
    restore();
    const {data}=client.auth.onAuthStateChange((event,nextSession)=>{
      if(event==='INITIAL_SESSION')return;
      queueMicrotask(async()=>{
        if(!active)return;
        if(!nextSession){setSession(null);setUsage(null);return;}
        try{
          const next=await adopt(nextSession);if(!active)return;
          setSession(next);setGuestSession(null);rememberAccountEmail(next?.user?.email);
          if(event==='SIGNED_IN')window.location.hash='/account';
        }catch{if(active)setLoading(false);}
      });
    });
    const revalidate=async()=>{
      if(Capacitor.isNativePlatform()||document.hidden)return;
      try{const response=await fetch('/api/account/session',{cache:'no-store',signal:AbortSignal.timeout(10000)});if(response.ok){const next=(await response.json()).session;if(active)setSession(current=>{if(current&&!next)window.location.hash='/account';return next;});}}catch{}
    };
    const timer=setInterval(revalidate,60000);document.addEventListener('visibilitychange',revalidate);
    return()=>{active=false;clearInterval(timer);document.removeEventListener('visibilitychange',revalidate);data.subscription.unsubscribe();};
  },[client,authCallback]);

  useEffect(() => {
    const accessToken = session?.access_token;
    if (!accessToken) return undefined;
    let active = true, timer, attempts = 0;
    const controller = new AbortController();
    const returningFromCheckout = new URLSearchParams(window.location.search).get('billing') === 'success';
    const refresh = async () => {
      let nextUsage = null;
      try {
        const response = await fetch('/api/account/usage', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store', signal: typeof AbortSignal.any === 'function' ? AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) : controller.signal });
        if (response.ok) nextUsage = await response.json();
      } catch { /* A bounded retry handles a delayed payment webhook. */ }
      if (!active) return;
      setUsage(nextUsage);
      attempts += 1;
      if (returningFromCheckout && nextUsage?.tier !== 'pro' && attempts < 10) timer = setTimeout(refresh, 3000);
    };
    void refresh();
    return () => { active = false; controller.abort(); clearTimeout(timer); };
  }, [session?.access_token]);

  useEffect(()=>{
    if(!client||!Capacitor.isNativePlatform())return;
    let active=true,listener;
    const handle=async({url}={})=>{
      if(!url||!active)return;
      try{
        const callback=new URL(url);if(callback.protocol!=='us.citizenshipai.app:'||callback.hostname!=='auth-callback')return;
        const code=callback.searchParams.get('code');if(!code)throw Error('Verification code required');
        const result=await client.auth.exchangeCodeForSession(code);
        if(result.error)throw Error('Verification failed');
        await accountStorage.removeItem(NATIVE_TRIAL_KEY);
      }catch{if(active){setSignInError(true);window.location.hash='/account';}}
    };
    NativeApp.addListener('appUrlOpen',handle).then(value=>{if(active)listener=value;else value.remove();}).catch(()=>{});
    NativeApp.getLaunchUrl().then(value=>handle(value)).catch(()=>{});
    return()=>{active=false;listener?.remove();};
  },[client]);

  const value = useMemo(() => ({
    configured: Boolean(client), session, sessionRecoveryError, dismissSessionRecoveryError:()=>setSessionRecoveryError(false), loading: loading || (restoringDevice&&!verifiedSession), verifyingEmail: Boolean(authCallback&&authCallback!=='error'&&(loading||(restoringDevice&&!verifiedSession))),
    startEmailTrial:async email=>{
      const access = await registerEmailAccess(email);
      setGuestSession(access);
      return access;
    }, usage, promotionAccess, aiFeatureAvailability, billing, signInError,
    sendMagicLink: (email) => {rememberAccountEmail(email);return TEMPORARY_PUBLIC_INTERVIEWS ? Promise.resolve({error: new Error("Account links temporarily disabled")}) : client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: Capacitor.isNativePlatform()?'us.citizenshipai.app://auth-callback':checkoutReturnUrl(email) },
    });},
    signOut:async()=>{const responses=await Promise.all([fetch('/api/account/session',{method:'DELETE'}),fetch('/api/account/email-trial/session',{method:'DELETE'})]);if(responses.some(response=>!response.ok))throw new Error('Could not sign out securely');await client?.auth.signOut({scope:'local'});await accountStorage.removeItem(NATIVE_TRIAL_KEY);setGuestSession(null);setSession(null);setUsage(null);window.location.hash='/account';},
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
      await Promise.all([fetch('/api/account/session',{method:'DELETE'}),fetch('/api/account/email-trial/session',{method:'DELETE'})]);
      await client.auth.signOut({ scope: "local" });await accountStorage.removeItem(NATIVE_TRIAL_KEY);setSession(null);setGuestSession(null);rememberAccountEmail('');
      return true;
    },
    openCheckout: async (interval, checkoutEmail) => {
      if (Capacitor.isNativePlatform()) throw Object.assign(new Error("Web checkout is unavailable in native apps."), { code: "checkout_unavailable" });
      if (!["monthly", "annual"].includes(interval)) throw Object.assign(new Error("Choose a plan."), { code: "invalid_billing_interval" });
      const checkoutSession = session?.access_token ? session : await registerEmailAccess(checkoutEmail);
      const response = await fetch("/api/billing/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${checkoutSession.access_token}` },
        body: JSON.stringify({ interval }), signal:AbortSignal.timeout(30000),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.url) throw Object.assign(new Error(result.error || "Checkout unavailable"),{code:result.code||"checkout_unavailable",reference:result.reference});
      clearCheckoutIntent();
      window.location.assign(result.url);
      return true;
    },
    openBillingPortal: async () => {
      if (session?.isEmailTrial) throw new Error("Verify your email before managing billing.");
      if (!session?.access_token) return false;
      const response = await fetch("/api/billing/portal-session", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.url) throw Object.assign(new Error(result.error || "Subscription management unavailable"),{code:result.code||"portal_unavailable",reference:result.reference});
      window.location.assign(result.url);
      return true;
    },
  }), [client, session, verifiedSession, loading, restoringDevice, sessionRecoveryError, usage, promotionAccess, aiFeatureAvailability, billing, signInError, authCallback]);

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
  const { configured, session, loading, usage, billing, promotionAccess, startEmailTrial, sendMagicLink, signOut, exportAccountData, deleteAccount, openCheckout, openBillingPortal, signInError } = useAccount();
  const copy = COPY[language === "es" ? "es" : "en"];
  const [email, setEmail] = useState(lastAccountEmail);
  const [logoutError,setLogoutError]=useState(false),[loggingOut,setLoggingOut]=useState(false);
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
    } catch (error) {
      setBillingError({code:error.name==='TimeoutError'?'checkout_timeout':typeof error.code==='string'?error.code:'checkout_unavailable',reference:error.reference});
      setBillingAction("");
    }
  };

  useEffect(()=>{
    if(!session||session.isEmailTrial||!webBillingEnabled)return;
    const interval=readCheckoutIntent(session.user.email);
    if(interval){clearCheckoutIntent();startBillingAction(interval);}
  },[session?.user?.id,session?.isEmailTrial,webBillingEnabled]);
  if(configured&&!loading&&(!session||session.isEmailTrial)){
    const trial=<EmailTrialAccount signInError={signInError} language={language} session={session} usage={usage} billing={billing} webBillingEnabled={webBillingEnabled} openCheckout={openCheckout} startEmailTrial={startEmailTrial} sendMagicLink={sendMagicLink} signOut={signOut} onContinue={()=>{onClose?.();if(embedded)window.location.hash='/';}} modalRef={modalRef} embedded={embedded} onClose={onClose}/>;
    return embedded?trial:createPortal(trial,document.body);
  }
  const content = (
    <div className={embedded ? "account-page" : "account-backdrop citizenship-surface"} role="presentation" onClick={(event) => { if (!embedded && event.target === event.currentTarget) onClose(); }}>
      <section ref={modalRef} className="account-sheet" role={embedded ? "region" : "dialog"} aria-modal={embedded ? undefined : "true"} aria-labelledby="account-title">
        {!embedded&&<button className="account-close" onClick={onClose} type="button" aria-label={copy.close}>×</button>}
        <div className="liquid-page-heading"><span className="text-slate-600!">{language==='es'?'TU CUENTA':'YOUR ACCOUNT'}</span><h1 id="account-title" className="text-slate-950!">{language==='es'?'Tu cuenta de Immigra':'Your Immigra account'}</h1><p className="text-slate-700!">{TEMPORARY_PUBLIC_INTERVIEWS&&!session?(language==='es'?'Las entrevistas están abiertas temporalmente para pruebas.':'Interviews are temporarily open for testing.'):(language==='es'?'Gestiona tu suscripción, revisa tus límites y administra tu cuenta.':'Manage your subscription, review your limits and manage your account.')}</p></div>
        {signInError&&!session&&!status&&<p role="alert">{language==='es'?'El enlace de acceso no es válido o ha caducado. Solicita uno nuevo y abre únicamente el correo más reciente.':'The sign-in link is invalid or expired. Request a new link and open only the latest email.'}</p>}
        {TEMPORARY_PUBLIC_INTERVIEWS&&!session ? null : !configured ? <div className="account-message">{copy.unavailable}</div> : loading ? <div className="account-loading" role="status">{language==='es'?'Recuperando tu sesión…':'Restoring your session…'}</div> : session ? (
          <>
            <GlassCard className="account-overview"><span className="glass-icon" aria-hidden="true"><GlassIcon name="◎"/></span><div className="account-identity"><span>{copy.signedIn}</span><strong>{session.user.email}</strong></div>
            <div className="account-access"><span>{copy.usage}</span><strong>{usage?.tier === "pro" ? "PRO" : copy.free}</strong><small>{usage?.access?.status==="trial_active"?(language==="es"?"Prueba activa · sin cuota personal":"Trial active · no personal quota"):usage?.access?.status==="trial_expired"?(language==="es"?"Prueba finalizada":"Trial ended"):copy.optional}</small></div>
            {usage?.access?.trialEndsAt && <p>{language==="es"?"Fin de la prueba: ":"Trial ends: "}{new Date(usage.access.trialEndsAt).toLocaleString(language==="es"?"es-US":"en-US")}</p>}
            {usage?.metering?.total && (
              <p className="account-metering-note">
                <strong>{Number(usage.metering.total.requests) || 0}</strong> {copy.requests}
              </p>
            )}
            </GlassCard>
            {usageFeatures.length > 0 && (
              <GlassSection className="account-usage-summary" icon="▥" title={language==='es'?'Tu uso de IA':'Your AI usage'} description={language==='es'?'Acceso por tiempo: siete días desde el primer uso o suscripción activa.':'Time-based access: seven days from first use or an active subscription.'}><div className="account-usage-grid">
                <span className="account-usage-title">{copy.usageTitle}</span>
                {usageFeatures.map(([feature, item]) => {
                  const pro=usage?.tier==="pro";
                  const limit = Math.max(0, Number(pro?item.proMonthlyLimit:item.freeLimit) || 0);
                  const used = Math.min(limit, Math.max(0, Number(item.freeUsed) || 0));
                  return (
                    <GlassCard className="account-usage-row" key={feature}><span className="glass-icon" aria-hidden="true"><GlassIcon name={({writing:"✎",speaking:"♬",realInterview:"◎",classicInterview:"▤"})[feature]}/></span>
                      <span>{FEATURE_LABELS[language === "es" ? "es" : "en"][feature] || feature}</span>
                      <strong>{usage?.access?.allowed ? (language==="es"?"Sin cuotas personales":"No personal quota") : (language==="es"?"Requiere acceso":"Access required")}</strong>
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
        {(!TEMPORARY_PUBLIC_INTERVIEWS||session)?<GlassSection className="account-pricing" icon="♔" title="Plan PRO" description={language==='es'?'Descubre las herramientas y beneficios de Immigra PRO.':'Explore Immigra PRO tools and benefits.'}>
          <h2>{language === "es" ? "Qué incluye PRO" : "What PRO includes"}</h2>
          <ul className="pro-plan-benefits">
            <li>{language === "es" ? "Entrevistas y conversaciones con Sahara, Kevin y William" : "Interviews and conversations with Sahara, Kevin and William"}</li>
            <li>{language === "es" ? "Transcripción y comentarios de IA sin cuotas de práctica" : "Transcription and AI feedback without practice quotas"}</li>
            <li>{language === "es" ? "Práctica de lectura y escritura con IA" : "AI-supported reading and writing practice"}</li>
            <li>{language === "es" ? "El estudio básico sigue gratis sin suscripción" : "Basic study remains free without a subscription"}</li>
          </ul>
          <p>{language === "es" ? "Consulta tus límites disponibles en esta cuenta. Se aplican límites diarios de uso." : "Check your available allowances in this account. Daily usage limits apply."}</p>
          {webBillingEnabled && session ? (
            usage?.tier === "pro" ? (
              <button className="account-billing-manage" type="button" onClick={() => startBillingAction("portal")} disabled={Boolean(billingAction)}>{billingAction ? copy.openingCheckout : copy.manageSubscription}</button>
            ) : (
              <div className="account-billing-actions">
                <button type="button" onClick={() => startBillingAction("monthly")} disabled={Boolean(billingAction)}><b>{billingAction==='monthly'?copy.openingCheckout:copy.monthly}</b><small>${(Number(billing.introductoryOfferEnabled ? billing.introductoryMonthlyPriceCents : billing.monthlyPriceCents) / 100).toFixed(2)}/mo</small></button>
                <button type="button" onClick={() => startBillingAction("annual")} disabled={Boolean(billingAction)}><b>{billingAction==='annual'?copy.openingCheckout:language==='es'?'ANUAL':'ANNUAL'}</b><small>${(Number(billing.annualPriceCents || PRO_PLAN.annualPriceCents) / 100).toFixed(2)}/yr</small></button>
                {billingAction&&<p role="status" aria-live="polite">{language==='es'?'Abriendo el pago seguro de Stripe…':'Opening secure Stripe checkout…'}</p>}<p>{language === "es" ? "La prueba gratuita de la app se activa sin tarjeta. Si contratas una suscripción, Stripe cobra el plan elegido con renovación automática; no comienza otra prueba de siete días. Revisa las condiciones antes de confirmar y administra la suscripción en Mi cuenta." : "The app trial needs no card. Purchasing a subscription charges the selected plan in Stripe with automatic renewal; it does not start another seven-day trial. Review the terms before confirming and manage the subscription in My account."}</p><em>{copy.secureCheckout}</em>
              </div>
            )
          ) : <><button className="account-billing-manage" type="button" disabled>{language==='es'?'Actualizar a PRO →':'Upgrade to PRO →'}</button><em>{webBillingEnabled ? (language === 'es' ? 'Inicia sesión con tu correo para comenzar los 7 días gratis de PRO.' : 'Sign in with your email to start your 7-day PRO trial.') : copy.pricingStatus}</em></>}
          {billingError && <div role="alert" className="account-status error account-billing-error"><p>{billingErrorMessage(billingError,language)}</p><small>{language==='es'?'Referencia de soporte: ':'Support reference: '}{billingError.reference||billingError.code}</small>{billingError.code==='subscription_already_active'&&<button type="button" onClick={()=>startBillingAction('portal')}>{copy.manageSubscription}</button>}</div>}
          {Capacitor.isNativePlatform() && <><button type="button" disabled>{language === "es" ? "Restaurar compra" : "Restore Purchase"}</button><small>{language === "es" ? "Las compras y la restauración en la tienda todavía no están disponibles." : "Store purchases and restoration are not available yet."}</small></>}
        </GlassSection>:<p role="status">{language==='es'?'Acceso temporal de pruebas: no necesitas contratar PRO ni iniciar sesión para practicar entrevistas. Se mantienen límites globales del servicio.':'Temporary testing access: no PRO subscription or sign-in is needed to practice interviews. Global service limits still apply.'}</p>}
        {session&&<GlassSection className="account-management" icon="⚙" title={language==='es'?'Administración de la cuenta':'Account management'} description={language==='es'?'Gestiona y protege tu información.':'Manage and protect your information.'}><div className="account-management-grid">            <button className="account-primary account-export" onClick={downloadAccountData} disabled={exporting} type="button">
              <span>{exporting ? copy.exporting : copy.exportData}</span><b>↓</b>
            </button>
            {exportError && <p className="account-status error">{copy.exportError}</p>}
            {logoutError&&<p role="alert">{language==='es'?'No pudimos cerrar sesión. Revisa la conexión y reintenta.':'Could not sign out. Check your connection and retry.'}</p>}<button className="account-primary secondary" disabled={loggingOut} onClick={async()=>{setLoggingOut(true);setLogoutError(false);try{await signOut();}catch{setLogoutError(true);}finally{setLoggingOut(false);}}} type="button">{copy.signOut}<b>→</b></button>
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
  return embedded ? content : createPortal(content, document.body);
}
