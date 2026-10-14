import { useCallback, useEffect, useRef, useState } from "react";
import { openContinuousVoice } from "./continuousVoice.js";
import { transcribeRecording } from "./audio.js";

export function useContinuousVoice(options) {
  const [connected, setConnected] = useState(false);
  const [phase, setPhase] = useState("off");
  const [reason, setReason] = useState("");
  const callbacks = useRef(options);
  const mounted = useRef(false), generation = useRef(0), permission = useRef(0);
  const session = useRef(null), opening = useRef(false), controller = useRef(null), acquisition = useRef(null);
  useEffect(() => { callbacks.current = options; });
  const cancelTurn = useCallback((interruptReply = true) => {
    generation.current += 1; controller.current?.abort();
    if (interruptReply) callbacks.current.onInterrupt?.();
  }, []);
  const pause = useCallback((why = "paused", { interruptReply = true } = {}) => {
    permission.current += 1; opening.current = false;
    cancelTurn(interruptReply); acquisition.current?.abort(); session.current?.stop(); session.current = null;
    if (mounted.current) { setConnected(false); setPhase("off"); setReason(why); }
  }, [cancelTurn]);
  useEffect(() => {
    mounted.current = true;
    const pauseHidden = () => { if (document.hidden) pause("background"); };
    const pauseOffline = () => pause("offline");
    const pauseLeaving = () => pause("background");
    const pauseReport = () => pause("paused");
    document.addEventListener("visibilitychange", pauseHidden);
    window.addEventListener("pagehide", pauseLeaving);
    window.addEventListener("offline", pauseOffline);
    window.addEventListener("immigra:practice-pause", pauseReport);
    return () => {
      mounted.current = false; permission.current += 1; generation.current += 1;
      controller.current?.abort(); acquisition.current?.abort(); session.current?.stop();
      document.removeEventListener("visibilitychange", pauseHidden);
      window.removeEventListener("pagehide", pauseLeaving);
      window.removeEventListener("offline", pauseOffline);
      window.removeEventListener("immigra:practice-pause", pauseReport);
    };
  }, [pause]);
  const start = async () => {
    if (opening.current || session.current || !mounted.current) return;
    const attempt = ++permission.current;
    opening.current = true;
    const abort = new AbortController(); acquisition.current = abort;
    setReason(""); setPhase("requesting");
    try {
      const capture = await openContinuousVoice({
        signal: abort.signal, interruptions: callbacks.current.interruptions,
        isPlaying: () => callbacks.current.speaking,
        onSpeechStart: () => {
          if (!mounted.current || attempt !== permission.current) return;
          cancelTurn(); setPhase("listening");
        },
        onClose: why => {
          if (!mounted.current || attempt !== permission.current) return;
          session.current = null;
          setConnected(false); setReason(why); setPhase("off");
          // The final bounded recording is delivered immediately after closing.
          if (!["turn-limit", "turn-budget"].includes(why)) cancelTurn();
        },
        onTurn: async (recording, event) => {
          if (!mounted.current || attempt !== permission.current) return;
          const current = generation.current;
          const task = new AbortController(); controller.current = task;
          const timeout = setTimeout(() => task.abort(), 35000);
          setPhase("transcribing");
          try {
            const transcript = await transcribeRecording(recording, { signal: task.signal, language: callbacks.current.language });
            if (!mounted.current || current !== generation.current || attempt !== permission.current) return;
            if (!transcript) { pause("empty"); return; }
            if (event.reason === "turn-limit") callbacks.current.onDraft?.(transcript);
            else {
              const accepted = await callbacks.current.onTranscript(transcript);
              if (accepted === false && mounted.current && current === generation.current && attempt === permission.current) pause("feedback");
            }
          } catch {
            if (mounted.current && current === generation.current && attempt === permission.current) pause("transcription");
          } finally {
            clearTimeout(timeout);
            if (mounted.current && current === generation.current && attempt === permission.current) setPhase(session.current ? "waiting" : "off");
          }
        },
      });
      if (!mounted.current || attempt !== permission.current) { capture.stop(); return; }
      session.current = capture; setConnected(true); setPhase("waiting");
    } catch {
      if (mounted.current && attempt === permission.current) { setPhase("off"); setReason("unavailable"); }
    } finally { if (attempt === permission.current) opening.current = false; }
  };
  return {
    connected, phase, reason, start, pause,
    finishTurn: () => session.current?.finishTurn(),
    discardTurn: () => session.current?.discardTurn(),
  };
}
