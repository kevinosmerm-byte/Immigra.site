import { apiFetch } from "./api";

const preferredMimeTypes = ["audio/webm", "audio/mp4"];
export const MAX_RECORDING_DURATION_MS = 45_000;

function selectMimeType() {
  return preferredMimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
}

// Owned by one interview component; never shared across users or modules.
// Disabled between answers, released when the interview ends or unmounts.
export function createRecordingSession() {
  let stream = null, generation = 0;
  return {
    async acquire() {
      if (!stream || stream.getAudioTracks().some(track => track.readyState === "ended")) {
        const token = generation;
        const acquired = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (token !== generation) { acquired.getTracks().forEach(track => track.stop()); throw new Error("Recording session closed."); }
        stream = acquired;
      }
      stream.getAudioTracks().forEach(track => { track.enabled = true; });
      return stream;
    },
    release(acquired) { acquired.getAudioTracks().forEach(track => { track.enabled = false; }); },
    close() { generation++; stream?.getTracks().forEach(track => track.stop()); stream = null; },
  };
}

export async function startAudioRecording({ session, onComplete, silenceMs = 0 } = {}) {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    throw new Error("Microphone recording is not supported on this device.");
  }

  const stream = session ? await session.acquire() : await navigator.mediaDevices.getUserMedia({ audio: true });
  const preferredMimeType = selectMimeType();
  const recorder = preferredMimeType
    ? new MediaRecorder(stream, { mimeType: preferredMimeType })
    : new MediaRecorder(stream);
  const chunks = [];
  let automaticStopTimer, silenceTimer, audioContext, cancelled = false;
  const cleanupMonitor = () => { clearInterval(silenceTimer); audioContext?.close().catch(() => {}); };

  const recording = new Promise((resolve, reject) => {
    const releaseStream = () => {
      clearTimeout(automaticStopTimer);
      cleanupMonitor();
      if (session) session.release(stream);
      else stream.getTracks().forEach((track) => track.stop());
    };

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    recorder.onerror = () => {
      releaseStream();
      reject(new Error("The microphone recording could not be completed."));
    };

    recorder.onstop = () => {
      releaseStream();
      const mimeType = recorder.mimeType || preferredMimeType || "audio/webm";
      const extension = mimeType.includes("mp4") ? "mp4" : "webm";
      resolve({
        blob: new Blob(chunks, { type: mimeType }),
        fileName: `recording.${extension}`,
      });
    };
  });

  // Register completion immediately, including errors and automatic recorder stops.
  if (onComplete) recording.then(() => { if (!cancelled) onComplete(); }, () => { if (!cancelled) onComplete(); });
  recorder.start();
  if (silenceMs && (window.AudioContext || window.webkitAudioContext)) {
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      audioContext = new Context();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      audioContext.createMediaStreamSource(stream).connect(analyser);
      const samples = new Float32Array(analyser.fftSize);
      let heardSpeech = false, lastSpeech = performance.now();
      audioContext.resume().catch(() => {});
      silenceTimer = window.setInterval(() => {
        analyser.getFloatTimeDomainData(samples);
        const rms = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
        if (rms > 0.015) { heardSpeech = true; lastSpeech = performance.now(); }
        if (heardSpeech && performance.now() - lastSpeech >= silenceMs && recorder.state !== "inactive") recorder.stop();
      }, 100);
    } catch { cleanupMonitor(); } // Manual stop and the duration limit remain available.
  }
  automaticStopTimer = window.setTimeout(() => {
    if (recorder.state !== "inactive") recorder.stop();
  }, MAX_RECORDING_DURATION_MS);

  return {
    stop: () => {
      if (recorder.state !== "inactive") recorder.stop();
      return recording;
    },
    cancel: () => {
      cancelled = true;
      cleanupMonitor();
      if (recorder.state !== "inactive") recorder.stop();
      if (session) session.release(stream);
      else stream.getTracks().forEach((track) => track.stop());
    },
  };
}

export async function transcribeRecording(recording, { publicInterview = false, language = "en" } = {}) {
  const formData = new FormData();
  formData.append("audio", recording.blob, recording.fileName);

  if(publicInterview)formData.append("language", language === "es" ? "es" : "en");
  const response = await (publicInterview ? apiFetch("/interview/transcribe", {method:"POST",headers:{"x-audio-consent":"interview-audio-v1"},body:formData}) : apiFetch("/transcribe", {
    method: "POST",
    body: formData,
  }));

  if (!response.ok) {
    const error = new Error("Transcription failed.");
    error.status = response.status;
    throw error;
  }

  const { transcript = "" } = await response.json();
  return transcript.trim();
}

export function audioErrorMessage(error,language="es") {
 const es=language==='es';
 if(error?.name==='NotAllowedError')return es?'Permite el acceso al micrófono en tu navegador y vuelve a intentarlo.':'Allow microphone access in your browser and retry.';
 if(error?.status===401)return es?'Inicia sesión en Mi cuenta para transcribir tu respuesta.':'Sign in to transcribe your answer.';
 if(error?.status===403)return es?'Tu sesión no autoriza la transcripción. Revisa el acceso en Mi cuenta.':'Your session does not authorize transcription. Check your account access.';
 if(error?.status===429)return es?'Se alcanzó el límite de transcripción. Puedes continuar escribiendo.':'The transcription limit was reached. You can continue typing.';
 if(error?.status>=500)return es?'El servicio de transcripción no está disponible. Tu micrófono no es el problema; reintenta o escribe.':'The transcription service is unavailable. Retry or type your answer.';
 return es?'No se pudo obtener audio. Revisa el micrófono o responde escribiendo.':'Could not obtain audio. Check the microphone or type your answer.';
}
