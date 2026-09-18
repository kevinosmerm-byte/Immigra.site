import { useEffect, useRef, useState } from "react";
import { apiJson } from "./api";

const DID_AGENT_SCRIPT = "https://agent.d-id.com/v2/index.js";

export function DidLiveAvatar() {
  const scriptRef = useRef(null);
  const widgetRef = useRef(null);
  const observerRef = useRef(null);
  const [state, setState] = useState("idle");
  const [message, setMessage] = useState("");
  const [showNotice, setShowNotice] = useState(false);

  const reset = () => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    scriptRef.current?.remove();
    scriptRef.current = null;
    widgetRef.current?.remove();
    widgetRef.current = null;
    setState("idle");
    setMessage("");
  };

  useEffect(() => reset, []);

  const connect = async () => {
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
      script.dataset.mode = "fabio";
      script.dataset.position = "right";
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
        setMessage("Sarah is connected. Use the live video panel to practice your conversation.");
      });
      script.addEventListener("error", () => {
        reset();
        setState("error");
        setMessage("Sarah's live video could not load. Your regular practice interview is still available.");
      });
      document.body.append(script);
      scriptRef.current = script;
    } catch (error) {
      observerRef.current?.disconnect();
      observerRef.current = null;
      setState("error");
      setMessage(error.message || "Sarah's live video could not start. Please try again later.");
    }
  };

  return (
    <section className="did-live-avatar" aria-label="Optional live Sarah avatar">
      {state !== "active" && (
        <div className="did-live-avatar-intro">
          <span>LIVE AVATAR BETA</span>
          <strong>Meet Sarah in live video</strong>
          <p>Optional animated video practice powered by D-ID. Your standard interview remains available at all times.</p>
          <button type="button" onClick={() => setShowNotice(true)} disabled={state === "connecting"}>
            {state === "connecting" ? "CONNECTING…" : "CONNECT LIVE AVATAR"}
          </button>
        </div>
      )}

      {showNotice && (
        <div className="did-live-avatar-notice" role="dialog" aria-modal="true" aria-label="Live avatar privacy notice">
          <strong>Before you connect</strong>
          <p>Sarah's live video is provided by D-ID. Connecting requests a temporary, domain-restricted session key. D-ID will process the live conversation content and any microphone or camera input that you choose to provide in its panel. This feature is optional and is not legal advice.</p>
          <div>
            <button type="button" onClick={() => setShowNotice(false)}>NOT NOW</button>
            <button type="button" onClick={connect}>I UNDERSTAND & CONNECT</button>
          </div>
        </div>
      )}

      <p className={state === "error" ? "did-live-avatar-status error" : "did-live-avatar-status"} role="status">{message}</p>
      {state === "active" && <button type="button" className="did-live-avatar-close" onClick={reset}>RETURN TO STANDARD INTERVIEW</button>}
    </section>
  );
}
