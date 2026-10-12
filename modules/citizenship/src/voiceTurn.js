// Conservative energy endpointing, not semantic understanding. Short pauses
// and initial silence never count as an answer. Manual stop is always available.
export function createVoiceTurn({ silenceMs = 2800, idleMs = 15000, threshold = 0.025 } = {}) {
  let start;
  let previous;
  let voicedMs = 0;
  let lastVoice;
  return {
    sample(level, now) {
      start ??= now;
      const elapsed = previous === undefined ? 0 : Math.max(0, Math.min(100, now - previous));
      previous = now;
      if (level >= threshold) { voicedMs += elapsed; lastVoice = now; }
      if (voicedMs >= 300 && now - lastVoice >= silenceMs) return "silence";
      if (voicedMs < 300 && now - start >= idleMs) return "no-speech";
      return null;
    },
  };
}
