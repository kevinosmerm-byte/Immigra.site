import { Capacitor } from "@capacitor/core";
import { TextToSpeech, QueueStrategy } from "@capacitor-community/text-to-speech";
import { createBrowserSpeech, selectVoice } from "./browserSpeech.js";

let speechRequest = 0;
let browserSpeech;
const getBrowserSpeech = () => browserSpeech ??= createBrowserSpeech(
  globalThis.speechSynthesis, globalThis.SpeechSynthesisUtterance,
);

export const stopAppSpeech = async () => {
  speechRequest += 1;
  if (!Capacitor.isNativePlatform()) {
    getBrowserSpeech().stop();
    return;
  }
  try {
    await TextToSpeech.stop();
  } catch (error) {
    console.error("Unable to stop text-to-speech:", error);
  }
};

export const speakAppText = async (text, options = {}) => {
  if (!text?.trim()) return false;
  if (!Capacitor.isNativePlatform()) return getBrowserSpeech().speak(text, options);
  const requestId = ++speechRequest;
  const {
    profile = "female",
    rate = profile === "male" ? 0.88 : 0.92,
    pitch = 1,
    onStart,
    onEnd,
    onError,
  } = options;

  try {
    await TextToSpeech.stop();
    if (requestId !== speechRequest) return false;
    const { voices = [] } = await TextToSpeech.getSupportedVoices();
    if (requestId !== speechRequest) return false;
    const selected = selectVoice(voices, profile, options.requireProfile);
    if (!selected && options.requireProfile) {
      onError?.("voice-unavailable");
      onEnd?.();
      return false;
    }
    onStart?.();
    await TextToSpeech.speak({
      text: text.trim(),
      lang: selected?.lang || "en-US",
      rate,
      pitch,
      volume: 1,
      ...(selected ? { voice: voices.indexOf(selected) } : {}),
      queueStrategy: QueueStrategy.Flush,
    });
    if (requestId === speechRequest) onEnd?.();
    return true;
  } catch (error) {
    if (requestId === speechRequest) {
      onError?.("audio-error");
      onEnd?.();
    }
    console.error("Text-to-speech error:", error);
    return false;
  }
};
