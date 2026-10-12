export const CONTINUOUS_VOICE_LIMITS = Object.freeze({
  silenceMs: 2200, preRollMs: 400, confirmationMs: 180,
  interruptionMs: 350, playbackGuardMs: 700, tailMs: 250,
  turnMs: 45000, idleMs: 60000, sessionMs: 480000, turns: 10,
});

// Original local PCM segmentation. There is no model or paid connection here.
// Retain a small lead-in so voice confirmation does not drop the first word.
export function createContinuousTurn({ sampleRate, interruptions = true, limits = CONTINUOUS_VOICE_LIMITS }) {
  let elapsed = 0, activity = 0, playingSince = 0, tailUntil = 0;
  let wasPlaying = false, active = false, voiced = 0, lastVoice = 0, turns = 0;
  let lead = [], leadMs = 0, chunks = [], duration = 0;
  const reset = () => { active = false; voiced = 0; chunks = []; duration = 0; lead = []; leadMs = 0; };
  const finish = reason => {
    if (!active) { reset(); return null; }
    const result = { type: "turn", chunks, sampleRate, reason, number: ++turns };
    reset();
    return result;
  };
  return {
    push(samples, playing = false) {
      const milliseconds = samples.length / sampleRate * 1000;
      elapsed += milliseconds;
      if (elapsed >= limits.sessionMs) { reset(); return [{ type: "close", reason: "session-limit" }]; }
      if (playing && !wasPlaying) playingSince = elapsed;
      if (!playing && wasPlaying && !active) tailUntil = elapsed + limits.tailMs;
      wasPlaying = playing;
      if (playing) activity = elapsed;
      if (turns >= limits.turns) return [{ type: "close", reason: "turn-budget" }];
      if (!active && elapsed - activity >= limits.idleMs) { reset(); return [{ type: "close", reason: "idle" }]; }
      if (!active && ((playing && (!interruptions || elapsed - playingSince < limits.playbackGuardMs)) || elapsed < tailUntil)) {
        reset(); return [];
      }
      const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
      const audible = rms >= (playing && !active ? .05 : .025);
      if (active) {
        chunks.push(samples);
        duration += milliseconds;
        if (audible) { lastVoice = elapsed; activity = elapsed; }
        if (duration >= limits.turnMs) return [finish("turn-limit")];
        if (elapsed - lastVoice >= limits.silenceMs) return [finish("silence")];
        return [];
      }
      lead.push(samples); leadMs += milliseconds;
      while (lead.length > 1 && leadMs > limits.preRollMs) leadMs -= lead.shift().length / sampleRate * 1000;
      // Require sustained activity, not one click or a cough.
      voiced = audible ? voiced + milliseconds : 0;
      if (voiced < (playing ? limits.interruptionMs : limits.confirmationMs)) return [];
      active = true; chunks = lead; duration = leadMs; lead = []; leadMs = 0;
      lastVoice = elapsed; activity = elapsed;
      return [{ type: "start", interrupted: playing }];
    },
    finish() { return finish("manual"); },
    discard() { reset(); },
  };
}

export function encodeVoiceWav(chunks, inputRate, outputRate = 16000) {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const input = new Float32Array(length);
  let offset = 0;
  for (const chunk of chunks) { input.set(chunk, offset); offset += chunk.length; }
  const count = Math.floor(length * outputRate / inputRate);
  const buffer = new ArrayBuffer(44 + count * 2);
  const view = new DataView(buffer);
  const text = (position, value) => [...value].forEach((letter, i) => view.setUint8(position + i, letter.charCodeAt(0)));
  text(0, "RIFF"); view.setUint32(4, buffer.byteLength - 8, true); text(8, "WAVE");
  text(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, outputRate, true);
  view.setUint32(28, outputRate * 2, true); view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); text(36, "data"); view.setUint32(40, count * 2, true);
  for (let i = 0; i < count; i++) {
    const position = i * inputRate / outputRate;
    const start = Math.floor(position), mix = position - start;
    const value = Math.max(-1, Math.min(1, input[start] * (1 - mix) + (input[start + 1] ?? input[start]) * mix));
    view.setInt16(44 + i * 2, Math.round(value * (value < 0 ? 32768 : 32767)), true);
  }
  return { blob: new Blob([buffer], { type: "audio/wav" }), fileName: "voice-turn.wav" };
}
