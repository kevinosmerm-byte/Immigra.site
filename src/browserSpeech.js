const maleNames = /\b(male|david|mark|guy|ryan|christopher|matthew|joey|fred|alex|daniel|james|george|aaron|tom|oliver|arthur|gordon|rishi)\b/i;
const femaleNames = /\b(female|zira|samantha|aria|jenny|susan|sara|sarah|karen|moira|tessa|victoria|ava|allison|salli|joanna|serena|fiona|catherine)\b/i;

export function selectVoice(voices, profile, requireProfile = false) {
  const english = voices.filter((voice) => /^en(?:[-_]|$)/i.test(voice.lang));
  const preferred = profile === "male" ? maleNames : femaleNames;
  const opposite = profile === "male" ? femaleNames : maleNames;
  const matching = english.filter((voice) => preferred.test(voice.name) && !opposite.test(voice.name));
  const american = (voice) => /^en[-_]US$/i.test(voice.lang);
  return matching.find(american) || matching[0]
    || (requireProfile ? undefined : english.find(american) || english[0]);
}

export function createBrowserSpeech(synth, Utterance, voiceWaitMs = 2000, startWaitMs = 8000) {
  let active;
  let generation = 0;

  function stop() {
    generation += 1;
    active?.finish(false, undefined, false);
    synth?.cancel();
  }

  function speak(text, options = {}) {
    stop();
    const id = generation;
    return new Promise((resolve) => {
      let voiceTimer;
      let startTimer;
      let settled = false;
      const finish = (success, error, notify = true) => {
        if (settled) return;
        settled = true;
        clearTimeout(voiceTimer);
        clearTimeout(startTimer);
        synth?.removeEventListener("voiceschanged", voicesChanged);
        if (active?.id === id) active = undefined;
        if (error) options.onError?.(error);
        if (notify) options.onEnd?.();
        resolve(success);
      };
      const play = () => {
        if (settled || id !== generation) return;
        clearTimeout(voiceTimer);
        synth.removeEventListener("voiceschanged", voicesChanged);
        const profile = options.profile || "female";
        const voice = selectVoice(synth.getVoices(), profile, options.requireProfile);
        if (!voice && options.requireProfile) {
          finish(false, "voice-unavailable");
          return;
        }
        const utterance = new Utterance(text.trim());
        // Retain the utterance until completion so callbacks are not lost.
        active.utterance = utterance;
        utterance.lang = voice?.lang || "en-US";
        if (voice) utterance.voice = voice;
        utterance.rate = options.rate ?? 0.9;
        utterance.pitch = options.pitch ?? 1;
        utterance.volume = 1;
        utterance.onstart = () => {
          if (settled) return;
          clearTimeout(startTimer);
          options.onStart?.();
        };
        utterance.onend = () => finish(true);
        utterance.onerror = (event) => finish(false, event.error || "audio-error");
        startTimer = setTimeout(() => {
          finish(false, "not-allowed");
          synth.cancel();
        }, startWaitMs);
        try {
          if (synth.paused) synth.resume();
          synth.speak(utterance);
        } catch {
          finish(false, "audio-error");
        }
      };
      function voicesChanged() {
        if (synth.getVoices().length) play();
      }
      active = { id, finish };
      if (!synth || !Utterance) {
        finish(false, "unsupported");
      } else if (!text?.trim()) {
        finish(false);
      } else if (synth.getVoices().length) {
        // Keep speech within the click handler when voices are already available.
        play();
      } else {
        synth.addEventListener("voiceschanged", voicesChanged);
        voiceTimer = setTimeout(play, voiceWaitMs);
        voicesChanged();
      }
    });
  }

  return { speak, stop };
}
