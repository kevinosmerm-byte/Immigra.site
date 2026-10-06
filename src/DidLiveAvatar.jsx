import { useCallback, useEffect, useRef, useState } from "react";
import { apiJson } from "./api";
import sarahImage from "./assets/sarah.png";

const DID_AGENT_SCRIPT = "https://agent.d-id.com/v2/index.js";
const DID_TARGET_ID = "did-live-agent-container";
const COPY = {
  en: {
    label: "Optional live Sarah avatar", beta: "Live video practice", title: "Meet Sarah in live video",
    intro: "Optional video conversation provided by D-ID. You can also practice with the standard interview.",
    connect: "Connect live video", connecting: "Connecting Sarah…", loading: "Preparing Sarah's live session…",
    ready: "Sarah's live panel is ready. If the video remains blank, retry or use the standard interview.",
    unavailable: "We couldn't start the live video right now. Try again or practice with the standard interview.",
    notice: "Live video privacy notice", noticeTitle: "Before you connect",
    noticeText: "Sarah's live video is provided by D-ID. Connecting requests a temporary, domain-restricted session key. D-ID processes the conversation and any microphone or camera input you choose to provide in its panel. This feature is optional and does not provide legal advice.",
    cancel: "Not now", accept: "I understand and connect", portrait: "Sarah, practice interviewer",
    standby: "Live interview standby", panel: "Sarah live video interview", retry: "Retry live video", standard: "Practice the standard interview",
    liveStandby: "LIVE · Standby", liveConnecting: "Connecting", liveUnavailable: "Offline",
  },
  es: {
    label: "Video en vivo opcional con Sarah", beta: "Práctica con video en vivo", title: "Practica con Sarah en video en vivo",
    intro: "Conversación opcional en video proporcionada por D-ID. También puedes practicar con la entrevista estándar.",
    connect: "Conectar video en vivo", connecting: "Conectando con Sarah…", loading: "Preparando la sesión en vivo con Sarah…",
    ready: "El panel de Sarah está listo. Si el video no aparece, vuelve a intentarlo o usa la entrevista estándar.",
    unavailable: "No pudimos iniciar el video en vivo ahora. Inténtalo otra vez o practica con la entrevista estándar.",
    notice: "Aviso de privacidad del video en vivo", noticeTitle: "Antes de conectar",
    noticeText: "D-ID proporciona el video en vivo de Sarah. Al conectar, se solicita una clave de sesión temporal restringida al dominio. D-ID procesa la conversación y cualquier entrada de micrófono o cámara que elijas proporcionar en su panel. Esta función es opcional y no proporciona asesoría legal.",
    cancel: "Ahora no", accept: "Entiendo y quiero conectar", portrait: "Sarah, entrevistadora de práctica",
    standby: "Entrevista en vivo en espera", panel: "Entrevista por video en vivo con Sarah", retry: "Volver a intentar el video", standard: "Practicar la entrevista estándar",
    liveStandby: "LIVE · En espera", liveConnecting: "Conectando", liveUnavailable: "Sin conexión",
  },
};

export function DidLiveAvatar({ language = "en", onStandardInterview }) {
  const copy = COPY[language === "es" ? "es" : "en"];
  const scriptRef = useRef(null);
  const widgetRef = useRef(null);
  const observerRef = useRef(null);
  const mountedRef = useRef(false);
  const requestRef = useRef(0);
  const [state, setState] = useState("idle");
  const [messageKey, setMessageKey] = useState("");
  const clearEmbed = useCallback(() => {
    observerRef.current?.disconnect(); observerRef.current = null;
    scriptRef.current?.remove(); scriptRef.current = null;
    widgetRef.current?.remove(); widgetRef.current = null;
    document.getElementById(DID_TARGET_ID)?.replaceChildren();
  }, []);
  const reset = () => {
    requestRef.current += 1;
    clearEmbed(); setState("idle"); setMessageKey("");
  };
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; requestRef.current += 1; clearEmbed(); };
  }, [clearEmbed]);
  const connect = useCallback(async () => {
    const requestId = ++requestRef.current;
    clearEmbed(); setState("connecting"); setMessageKey("loading");
    try {
      const session = await apiJson("/avatar/session", { method: "POST" });
      if (!mountedRef.current || requestRef.current !== requestId) return;
      if (!session.agentId || !session.clientKey) throw new Error("Avatar session unavailable");
      const knownWidgets = new Set(document.querySelectorAll(".didagent_target"));
      const rememberWidget = () => {
        if (!mountedRef.current || requestRef.current !== requestId) return false;
        const widget = [...document.querySelectorAll(".didagent_target")].find(candidate => !knownWidgets.has(candidate));
        if (!widget) return false;
        widgetRef.current = widget;
        observerRef.current?.disconnect(); observerRef.current = null;
        return true;
      };
      observerRef.current = new MutationObserver(rememberWidget);
      observerRef.current.observe(document.body, { childList: true, subtree: true });
      const script = document.createElement("script");
      script.type = "module"; script.src = DID_AGENT_SCRIPT;
      script.dataset.name = "did-agent"; script.dataset.mode = "full"; script.dataset.targetId = DID_TARGET_ID;
      script.dataset.orientation = "vertical"; script.dataset.openMode = "expanded"; script.dataset.autoConnect = "true"; script.dataset.track = "false";
      script.dataset.clientKey = session.clientKey; script.dataset.agentId = session.agentId;
      script.dataset.showRestartButton = "false"; script.dataset.showAgentName = "false";
      script.addEventListener("load", () => {
        if (!mountedRef.current || requestRef.current !== requestId) return;
        rememberWidget(); setState("active"); setMessageKey("ready");
      });
      script.addEventListener("error", () => {
        if (!mountedRef.current || requestRef.current !== requestId) return;
        clearEmbed(); setState("error"); setMessageKey("unavailable");
      });
      document.body.append(script); scriptRef.current = script;
    } catch {
      if (!mountedRef.current || requestRef.current !== requestId) return;
      clearEmbed(); setState("error"); setMessageKey("unavailable");
    }
  }, [clearEmbed]);
  const useStandard = () => { reset(); onStandardInterview?.(); };
  return (
    <section className="did-live-avatar" aria-label={copy.label}>
      <div className={`did-live-stage ${state}`}>
        <img className="did-live-fallback" src={sarahImage} alt={copy.portrait} />
        <div className="did-live-stage-header">
          <span className="did-live-badge">
            <span className="did-live-indicator" aria-hidden="true" />
            {state === "connecting" ? copy.liveConnecting : state === "error" ? copy.liveUnavailable : state === "active" ? "LIVE" : copy.liveStandby}
          </span>
          {state !== "active" && <div className="did-live-avatar-intro">
            <h2>{language === "es" ? "Práctica en vivo" : "Live practice"}</h2>
            {state === "idle" && <button type="button" className="button-primary did-live-connect" onClick={connect}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" focusable="false">
                <rect x="3" y="6" width="12" height="12" rx="3" />
                <path d="m15 10 6-3v10l-6-3" strokeLinejoin="round" />
              </svg>
              <span>{copy.connect}</span>
            </button>}
            {state === "connecting" && <p role="status">{copy.connecting}</p>}
          </div>}
        </div>
        <div className="did-live-fallback-label"><span>Sarah</span><strong>{state === "connecting" ? copy.connecting : copy.standby}</strong></div>
        <div id={DID_TARGET_ID} className="did-live-agent-container" role="region" aria-label={copy.panel}></div>
      </div>
      <div className={state === "error" ? "did-live-avatar-recovery error" : "did-live-avatar-recovery"} role="status">
        {messageKey && <p>{copy[messageKey]}</p>}
        {(state === "active" || state === "error") && <button type="button" className="button-secondary did-live-avatar-retry" onClick={connect}>{copy.retry}</button>}
      </div>
      {onStandardInterview && <button type="button" className={`${state === "error" ? "button-primary" : "button-secondary"} did-live-avatar-close`} onClick={useStandard}>{copy.standard}</button>}
    </section>
  );
}
