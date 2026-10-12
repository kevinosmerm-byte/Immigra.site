import { TextToSpeech, QueueStrategy } from "@capacitor-community/text-to-speech";
import { selectVoiceIndex, voiceProfileDefaults } from "./voiceProfiles";

let speechRequest = 0;
let cachedVoices = null;

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const loadSupportedVoices = async () => {
  if (cachedVoices?.length) return cachedVoices;

  // Browser voices often arrive shortly after the first page render. An empty
  // result must not be cached or every later request will use the same default.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const voices = (await TextToSpeech.getSupportedVoices()).voices || [];
    if (voices.length) {
      cachedVoices = voices;
      return voices;
    }
    if (attempt < 3) await wait(120);
  }

  return [];
};

const findVoice = async (profile, language) => {
  try {
    return selectVoiceIndex(await loadSupportedVoices(), profile, language);
  } catch {
    return undefined;
  }
};

export const stopAppSpeech = async () => {
  speechRequest += 1;
  speechActive = false;
  try {
    await TextToSpeech.stop();
  } catch {
    window.speechSynthesis?.cancel?.();
  }
};

export const speakAppText = async (text, options = {}) => {
  if (!text?.trim()) return false;
  const requestId = ++speechRequest;
  const {
    profile = "female",
    lang = "en-US",
    rate = voiceProfileDefaults(profile).rate,
    pitch = voiceProfileDefaults(profile).pitch,
    onStart,
    onEnd,
  } = options;

  try {
    await TextToSpeech.stop();
    if (requestId !== speechRequest) return false;
    speechActive = true;
    onStart?.();
    const voice = await findVoice(profile, lang);
    if (requestId !== speechRequest) return false;
    await TextToSpeech.speak({
      text: text.trim(),
      lang,
      rate,
      pitch,
      volume: 1,
      voice,
      queueStrategy: QueueStrategy.Flush,
    });
    if (requestId === speechRequest) { speechActive = false; onEnd?.(); }
    return true;
  } catch (error) {
    if (requestId === speechRequest) { speechActive = false; onEnd?.(); }
    console.error("Text-to-speech error:", error);
    return false;
  }
};

let speechActive = false;
export const isAppSpeechActive = () => speechActive;
