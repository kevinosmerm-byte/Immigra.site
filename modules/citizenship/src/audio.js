import { apiFetch } from "./api";

const preferredMimeTypes = ["audio/webm", "audio/mp4"];
export const MAX_RECORDING_DURATION_MS = 45_000;

function selectMimeType() {
  return preferredMimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
}

export async function startAudioRecording() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    throw new Error("Microphone recording is not supported on this device.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const preferredMimeType = selectMimeType();
  const recorder = preferredMimeType
    ? new MediaRecorder(stream, { mimeType: preferredMimeType })
    : new MediaRecorder(stream);
  const chunks = [];
  let automaticStopTimer;

  const recording = new Promise((resolve, reject) => {
    const releaseStream = () => {
      clearTimeout(automaticStopTimer);
      stream.getTracks().forEach((track) => track.stop());
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

  recorder.start();
  automaticStopTimer = window.setTimeout(() => {
    if (recorder.state !== "inactive") recorder.stop();
  }, MAX_RECORDING_DURATION_MS);

  return {
    stop: () => {
      if (recorder.state !== "inactive") recorder.stop();
      return recording;
    },
    cancel: () => {
      if (recorder.state !== "inactive") recorder.stop();
      stream.getTracks().forEach((track) => track.stop());
    },
  };
}

export async function transcribeRecording(recording) {
  const formData = new FormData();
  formData.append("audio", recording.blob, recording.fileName);

  const response = await apiFetch("/transcribe", {
    method: "POST",
    body: formData,
  });

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
