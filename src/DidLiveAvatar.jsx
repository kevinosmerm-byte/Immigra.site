import { useEffect, useRef, useState } from "react";
import { apiJson } from "./api";
import sarahImage from "./assets/sarah.png";

const DID_AGENT_SCRIPT = "https://agent.d-id.com/v2/index.js";
const DID_CONSENT_KEY = "citizenshipai.did-avatar-consent.v1";
const DID_TARGET_ID = "did-live-agent-container";

function hasSavedDidConsent() {
  try {
    return localStorage.getItem(DID_CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

export function DidLiveAvatar({ autoStart = false }) {
  const scriptRef = useRef(null);
  const widgetRef = useRef(null);
  const observerRef = useRef(null);
  const [state, setState] = useState("idle");
  const [message, setMessage] = useState("");
  const [showNotice, setShowNotice] = useState(() => autoStart && !hasSavedDidConsent());

  const clearEmbed = () => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    scriptRef.current?.remove();
    scriptRef.current = null;
    widgetRef.current?.remove();
    widgetRef.current = null;
    document.getElementById(DID_TARGET_ID)?.replaceChildren();
  };

  const reset = () => {
    clearEmbed();
    setState("idle");
    setMessage("");
  };

  useEffect(() => reset, []);

  const connect = async () => {
    clearEmbed();
    setShowNotice(false);
    setState("connecting");
    setMessage("Requesting Sarah's secure live session…");

    try {
      const session = await apiJson("/avatar/session", { method: "POST" });
      if (!session.agentId || !session.clientKey) {
        throw new Error("The live avatar service did not return a secure session.");
      }

      const knownWidgets = new Set(document.querySelectorAll(".didagent_target"));
      const rememberWidget = () => {
        const widget = [...document.querySelectorAll(".didagent_target")]
          .find((candidate) => !knownWidgets.has(candidate));
        if (!widget) return false;
        widgetRef.current = widget;
        observerRef.current?.disconnect();
        observerRef.current = null;
        return true;
      };

      observerRef.current = new MutationObserver(rememberWidget);
      observerRef.current.observe(document.body, { childList: true, subtree: true });

      const script = document.createElement("script");
      script.type = "module";
      script.src = DID_AGENT_SCRIPT;
      script.dataset.name = "did-agent";
      script.dataset.mode = "full";
      script.dataset.targetId = DID_TARGET_ID;
      script.dataset.orientation = "vertical";
      script.dataset.openMode = "expanded";
      script.dataset.autoConnect = "true";
      script.dataset.track = "false";
      script.dataset.clientKey = session.clientKey;
      script.dataset.agentId = session.agentId;
      script.dataset.showRestartButton = "false";
      script.dataset.showAgentName = "false";
      script.addEventListener("load", () => {
        rememberWidget();
        setState("active");
        setMessage("Sarah's live panel is ready. If D-ID is busy or the video stays blank, retry the connection below.");
      });
      script.addEventListener("error", () => {
        clearEmbed();
        setState("error");
        setMessage("D-ID could not load Sarah's live video. Please retry, or continue with the standard interview.");
      });
      document.body.append(script);
      scriptRef.current = script;
    } catch (error) {
      clearEmbed();
      setState("error");
      setMessage(error.message || "Sarah's live video could not start. Please try again later.");
    }
  };

  useEffect(() => {
    if (!autoStart || !hasSavedDidConsent()) return undefined;
    const timer = setTimeout(() => connect(), 0);
    return () => clearTimeout(timer);
  }, [autoStart]);

  const acceptAndConnect = () => {
    try {
      localStorage.setItem(DID_CONSENT_KEY, "accepted");
    } catch {
      // Continue for this session when browser storage is unavailable.
    }
    connect();
  };

  return (
    <section className="did-live-avatar" aria-label="Optional live Sarah avatar">
      {state !== "active" && (
        <div className="did-live-avatar-intro">
          <span>LIVE AVATAR BETA</span>
          <strong>Meet Sarah in live video</strong>
          <p>Optional animated video practice powered by D-ID. Your standard interview remains available at all times.</p>
          {!autoStart && (
            <button type="button" onClick={() => setShowNotice(true)} disabled={state === "connecting"}>
              {state === "connecting" ? "CONNECTING…" : "CONNECT LIVE AVATAR"}
            </button>
          )}
          {autoStart && state === "connecting" && <p>CONNECTING SARAH…</p>}
        </div>
      )}

      {showNotice && (
        <div className="did-live-avatar-notice" role="dialog" aria-modal="true" aria-label="Live avatar privacy notice">
          <strong>Before you connect</strong>
          <p>Sarah's live video is provided by D-ID. Connecting requests a temporary, domain-restricted session key. D-ID will process the live conversation content and any microphone or camera input that you choose to provide in its panel. This feature is optional and is not legal advice.</p>
          <div>
            <button type="button" onClick={() => setShowNotice(false)}>NOT NOW</button>
            <button type="button" onClick={acceptAndConnect}>I UNDERSTAND & CONNECT</button>
          </div>
        </div>
      )}

      <div className={`did-live-stage ${state}`}>
        <img
          className="did-live-fallback"
          src={sarahImage}
          alt="Sarah, AI practice interviewer"
        />
        <div className="did-live-fallback-label">
          <span>● SARAH AI</span>
          <strong>{state === "connecting" ? "Connecting live video…" : "Live interview standby"}</strong>
        </div>
        <div
          id={DID_TARGET_ID}
          className="did-live-agent-container"
          aria-label="Sarah live video interview"
        ></div>
      </div>

      <div className={state === "error" ? "did-live-avatar-recovery error" : "did-live-avatar-recovery"} role="status">
        {message && <p>{message}</p>}
        {(state === "active" || state === "error") && (
          <button type="button" className="premium-action-button did-live-avatar-retry" onClick={connect}>
            <span className="premium-action-icon" aria-hidden="true">↻</span>
            <span className="premium-action-copy">
              <small>LIVE VIDEO</small>
              <strong>Retry live video</strong>
            </span>
            <span className="premium-action-arrow" aria-hidden="true">→</span>
          </button>
        )}
      </div>

      {(state === "active" || state === "error") && (
        <button type="button" className="premium-action-button did-live-avatar-close" onClick={reset}>
          <span className="premium-action-icon" aria-hidden="true">◎</span>
          <span className="premium-action-copy">
            <small>INTERVIEW MODE</small>
            <strong>Use standard interview</strong>
          </span>
          <span className="premium-action-arrow" aria-hidden="true">→</span>
        </button>
      )}
    </section>
  );
}
