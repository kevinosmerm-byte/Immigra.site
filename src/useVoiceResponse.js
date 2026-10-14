import { useEffect, useRef, useState } from "react";
import { startAudioRecording, transcribeRecording } from "./audio.js";
import { stopAppSpeech } from "./speech.js";

// One recording/transcription per turn. Navigation or a question change
// invalidates late microphone permissions and responses.
export function useVoiceResponse({ turnKey, onTranscript, beforeListen, requestVoiceAccess, detectSilence = true, language = "en" }) {
  const [phaseState, setPhaseState] = useState({ key: turnKey, value: "idle" });
  const [errorState, setErrorState] = useState({ key: turnKey, value: "" });
  const phase = phaseState.key === turnKey ? phaseState.value : "idle";
  const error = errorState.key === turnKey ? errorState.value : "";
  const setPhase = value => setPhaseState({ key: turnKey, value });
  const setError = value => setErrorState({ key: turnKey, value });
  const recorderRef = useRef(null);
  const generation = useRef(0);
  const busy = useRef(false);
  const active = useRef(false);
  const controller = useRef(null);
  const callbacks = useRef({});
  useEffect(() => { callbacks.current = { onTranscript, beforeListen }; });
  const cancel = () => {
    generation.current += 1;
    recorderRef.current?.cancel();
    recorderRef.current = null;
    controller.current?.abort();
    busy.current = false;
    if (active.current) setPhase("idle");
  };
  useEffect(() => {
    active.current = true;
    const pauseReport = () => cancel();
    window.addEventListener("immigra:practice-pause", pauseReport);
    return () => {
      window.removeEventListener("immigra:practice-pause", pauseReport);
      active.current = false;
      generation.current += 1;
      recorderRef.current?.cancel();
      recorderRef.current = null;
      controller.current?.abort();
      busy.current = false;
    };
  }, [turnKey]);

  const stopListening = async reason => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorderRef.current = null;
    const request = generation.current;
    setPhase("transcribing");
    const abort = new AbortController();
    controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), 35000);
    try {
      const recording = await recorder.stop();
      if (!active.current || request !== generation.current) return;
      if (reason === "no-speech" || !recording.blob.size) { setError("empty"); return; }
      const transcript = await transcribeRecording(recording, { signal: abort.signal, language });
      if (!active.current || request !== generation.current) return;
      if (!transcript) { setError("empty"); return; }
      await callbacks.current.onTranscript(transcript);
    } catch {
      if (active.current && request === generation.current) setError("transcription");
    } finally {
      clearTimeout(timeout);
      if (active.current && request === generation.current) { busy.current = false; setPhase("idle"); }
    }
  };
  const beginListening = async () => {
    if (!active.current || busy.current) return;
    busy.current = true;
    const request = generation.current;
    setError("");
    setPhase("requesting");
    callbacks.current.beforeListen?.();
    await stopAppSpeech();
    try {
      if (!active.current || request !== generation.current) return;
      const recorder = await startAudioRecording({ detectSilence, onAutoStop: stopListening });
      if (!active.current || request !== generation.current) { recorder.cancel(); return; }
      recorderRef.current = recorder;
      setPhase("listening");
    } catch {
      if (active.current && request === generation.current) { busy.current = false; setPhase("idle"); setError("microphone"); }
    }
  };
  const startListening = () => {
    const request = generation.current;
    const start = () => active.current && request === generation.current ? beginListening() : undefined;
    return requestVoiceAccess ? requestVoiceAccess(start) : start();
  };
  return { isListening: phase === "listening", isTranscribing: phase === "requesting" || phase === "transcribing", error, startListening, stopListening: () => stopListening("manual"), cancel, clearError: () => setError("") };
}
