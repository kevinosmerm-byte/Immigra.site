import { apiFetch } from "./api";
import { createVoiceTurn } from "./voiceTurn.js";

const preferredMimeTypes = ["audio/webm", "audio/mp4"];
export const MAX_RECORDING_DURATION_MS = 45_000;

function selectMimeType() {
  return preferredMimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
}

export async function startAudioRecording({ onAutoStop, detectSilence = false } = {}) {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    throw new Error("Microphone recording is not supported on this device.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  let preferredMimeType;
  let recorder;
  try {
    preferredMimeType = selectMimeType();
    recorder = preferredMimeType
      ? new MediaRecorder(stream, { mimeType: preferredMimeType })
      : new MediaRecorder(stream);
  } catch (error) {
    stream.getTracks().forEach(track => track.stop());
    throw error;
  }
  const chunks = [];
  let automaticStopTimer;
  let analysisTimer;
  let audioContext;
  let cancelled = false;
  let stopReason = "manual";
  const releaseStream = () => {
    clearTimeout(automaticStopTimer);
    clearInterval(analysisTimer);
    stream.getTracks().forEach((track) => track.stop());
    audioContext?.close().catch(() => {});
  };
  const automaticStop = reason => {
    if (recorder.state === "inactive" || cancelled) return;
    stopReason = reason;
    recorder.stop();
    onAutoStop?.(reason);
  };

  const recording = new Promise((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    recorder.onerror = () => {
      releaseStream();
      reject(new Error("The microphone recording could not be completed."));
      onAutoStop?.("error");
    };

    recorder.onstop = () => {
      releaseStream();
      const mimeType = recorder.mimeType || preferredMimeType || "audio/webm";
      const extension = mimeType.includes("mp4") ? "mp4" : "webm";
      resolve({
        blob: new Blob(chunks, { type: mimeType }),
        fileName: `recording.${extension}`,
        stopReason,
      });
    };
  });
  // A recorder may fail before its consumer calls stop. Attach a rejection
  // handler now; stop() still returns the original rejected promise.
  recording.catch(() => {});

  // Some browsers reject Web Audio; recording and manual stop still work.
  if (detectSilence) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContext();
      audioContext.resume().catch(() => {});
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      audioContext.createMediaStreamSource(stream).connect(analyser);
      const samples = new Float32Array(analyser.fftSize);
      const turn = createVoiceTurn();
      analysisTimer = window.setInterval(() => {
        analyser.getFloatTimeDomainData(samples);
        const rms = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
        const reason = turn.sample(rms, performance.now());
        if (reason) automaticStop(reason);
      }, 50);
    } catch { audioContext?.close().catch(() => {}); audioContext = null; }
  }
  try { recorder.start(); }
  catch (error) { releaseStream(); throw error; }
  automaticStopTimer = window.setTimeout(() => {
    automaticStop("limit");
  }, MAX_RECORDING_DURATION_MS);

  return {
    stop: () => {
      if (recorder.state !== "inactive") recorder.stop();
      return recording;
    },
    cancel: () => {
      cancelled = true;
      if (recorder.state !== "inactive") recorder.stop();
      releaseStream();
    },
  };
}

export async function transcribeRecording(recording, { signal, language = "en" } = {}) {
  const formData = new FormData();
  formData.append("audio", recording.blob, recording.fileName);
  formData.append("language", language === "es" ? "es" : "en");

  const response = await apiFetch("/transcribe", {
    method: "POST",
    body: formData,
    signal,
  });

  if (!response.ok) {
    throw new Error("Transcription failed.");
  }

  const { transcript = "" } = await response.json();
  return transcript.trim();
}
