import { TextToSpeech, QueueStrategy } from "@capacitor-community/text-to-speech";

let speechRequest = 0;
let cachedVoices = null;

const findVoice = async (profile) => {
  try {
    if (!cachedVoices) {
      cachedVoices = (await TextToSpeech.getSupportedVoices()).voices || [];
    }
    const candidates = cachedVoices
      .map((voice, index) => ({ ...voice, index }))
      .filter((voice) => /^en-US$/i.test(voice.lang));
    const pattern = profile === "male"
      ? /david|mark|guy|ryan|christopher|matthew|joey|fred|alex/i
      : /female|zira|samantha|aria|jenny|susan/i;
    return candidates.find((voice) => pattern.test(voice.name))?.index
      ?? candidates[0]?.index;
  } catch {
    return undefined;
  }
};

export const stopAppSpeech = async () => {
  speechRequest += 1;
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
    rate = profile === "male" ? 0.88 : 0.92,
    pitch = profile === "male" ? 0.86 : 1.05,
    onStart,
    onEnd,
  } = options;

  try {
    await TextToSpeech.stop();
    if (requestId !== speechRequest) return false;
    onStart?.();
    const voice = await findVoice(profile);
    await TextToSpeech.speak({
      text: text.trim(),
      lang: "en-US",
      rate,
      pitch,
      volume: 1,
      voice,
      queueStrategy: QueueStrategy.Flush,
    });
    if (requestId === speechRequest) onEnd?.();
    return true;
  } catch (error) {
    if (requestId === speechRequest) onEnd?.();
    console.error("Text-to-speech error:", error);
    return false;
  }
};
