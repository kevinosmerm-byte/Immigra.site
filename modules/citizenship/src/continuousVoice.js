import { createContinuousTurn, encodeVoiceWav, CONTINUOUS_VOICE_LIMITS } from "./continuousTurn.js";
import voiceCaptureUrl from "./voiceCapture.worklet.js?url&no-inline";

export async function openContinuousVoice({ signal, interruptions = true, isPlaying, onSpeechStart, onTurn, onClose }) {
  if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext || typeof AudioWorkletNode === "undefined") {
    throw new Error("continuous-unsupported");
  }
  const context = new window.AudioContext();
  let stream, source, capture, mute, timer, closed = false;
  const release = () => {
    clearTimeout(timer);
    if (capture) { capture.port.onmessage = null; capture.disconnect(); }
    source?.disconnect(); mute?.disconnect();
    stream?.getTracks().forEach(track => track.stop());
    context.close().catch(() => {});
  };
  const close = reason => {
    if (closed) return;
    closed = true; release(); onClose?.(reason);
  };
  signal?.addEventListener("abort", () => close("cancelled"), { once: true });
  try {
    if (signal?.aborted) throw new Error("cancelled");
    // Resume in the original button gesture before awaiting microphone permission.
    const resume = context.resume();
    resume.catch(() => {});
    await context.audioWorklet.addModule(voiceCaptureUrl);
    if (closed || signal?.aborted) throw new Error("cancelled");
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
    });
    if (closed || signal?.aborted) { release(); throw new Error("cancelled"); }
    await Promise.race([resume, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("audio-context")), 3000);
    })]);
    clearTimeout(timer);
    if (closed || context.state !== "running") throw new Error("audio-context");
    const turn = createContinuousTurn({ sampleRate: context.sampleRate, interruptions });
    const deliver = event => {
      if (!event || closed) return;
      if (event.type === "start") onSpeechStart?.(event);
      if (event.type === "close") close(event.reason);
      if (event.type === "turn") {
        const recording = encodeVoiceWav(event.chunks, event.sampleRate);
        // Close acquisition at the limit, but allow this last turn to be processed.
        if (event.reason === "turn-limit") close("turn-limit");
        else if (event.number >= CONTINUOUS_VOICE_LIMITS.turns) close("turn-budget");
        onTurn?.(recording, event);
      }
    };
    source = context.createMediaStreamSource(stream);
    capture = new AudioWorkletNode(context, "citizenship-voice-capture");
    mute = context.createGain(); mute.gain.value = 0;
    capture.port.onmessage = message => {
      if (!closed) turn.push(message.data, Boolean(isPlaying?.())).forEach(deliver);
    };
    source.connect(capture); capture.connect(mute); mute.connect(context.destination);
    context.addEventListener?.("statechange", () => {
      if (!closed && context.state !== "running") close("audio-suspended");
    });
    timer = setTimeout(() => close("session-limit"), CONTINUOUS_VOICE_LIMITS.sessionMs);
    stream.getTracks().forEach(track => { track.onended = () => close("device-ended"); });
    return {
      stop: () => close("paused"),
      finishTurn: () => deliver(turn.finish()),
      discardTurn: () => turn.discard(),
    };
  } catch (error) { closed = true; release(); throw error; }
}
