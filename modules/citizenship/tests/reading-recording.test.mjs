import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = (await readFile(new URL('../src/audio.js', import.meta.url), 'utf8')).replace('import { apiFetch } from "./api";', 'const apiFetch = () => {};');
const { startAudioRecording } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
test('automatic recording completion delivers audio once; cancelled recordings never evaluate', async () => {
  let timer, current, completed = 0;
  const track = { stop() {} };
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {mediaDevices:{getUserMedia:async()=>({getTracks:()=>[track]})}} });
  globalThis.window = { setTimeout: fn => { timer = fn; return 1; } };
  globalThis.MediaRecorder = class {
    static isTypeSupported() { return true; }
    constructor() { current = this; this.mimeType = 'audio/webm'; }
    start() { this.state = 'recording'; }
    stop() { this.state = 'inactive'; this.ondataavailable({data:new Blob(['audio'])}); this.onstop(); }
  };
  const recording = await startAudioRecording({onComplete:()=>completed++});
  timer();
  await Promise.resolve();
  assert.equal(completed, 1);
  assert.equal((await recording.stop()).blob.size, 5);
  assert.equal(current.state, 'inactive');
  const cancelled = await startAudioRecording({onComplete:()=>completed++});
  cancelled.cancel();
  await Promise.resolve();
  assert.equal(completed, 1);
});
