import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function setup(voices) {
  let releaseVoices;
  let speaks = 0;
  const source = fs.readFileSync(new URL('../src/speech.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '').replace(/export const /g, 'const ');
  const context = vm.createContext({
    TextToSpeech: { stop: async () => {}, getSupportedVoices: () => new Promise(resolve => { releaseVoices = () => resolve({ voices }); }), speak: async () => { speaks++; } },
    QueueStrategy: { Flush: 0 }, selectVoiceIndex: list => list.findIndex(v => v.lang === 'en-US'), voiceProfileDefaults: () => ({ rate: 1, pitch: 1 }), console, setTimeout, window: {},
  });
  vm.runInContext(source + '\nglobalThis.api = {speakAppText, stopAppSpeech, isAppSpeechActive};', context);
  return { api: context.api, release: () => releaseVoices(), speaks: () => speaks };
}
test('cancel during asynchronous voice lookup cannot restart speech', async () => {
  const harness = setup([{ lang: 'en-US' }]);
  const pending = harness.api.speakAppText('Study question', { requireLanguageVoice: true });
  await new Promise(resolve => setImmediate(resolve));
  await harness.api.stopAppSpeech();
  harness.release();
  assert.equal(await pending, false);
  assert.equal(harness.speaks(), 0);
});
test('study reader does not silently use a wrong-language voice', async () => {
  const harness = setup([{ lang: 'es-US' }]);
  const pending = harness.api.speakAppText('Study question', { requireLanguageVoice: true });
  await new Promise(resolve => setImmediate(resolve)); harness.release();
  assert.equal(await pending, false);
  assert.equal(harness.speaks(), 0);
  assert.equal(harness.api.isAppSpeechActive(), false);
});
test('English device reader can complete an explicitly requested reading', async () => {
  const harness = setup([{ lang: 'en-US' }]);
  const pending = harness.api.speakAppText('Study question', { requireLanguageVoice: true });
  await new Promise(resolve => setImmediate(resolve)); harness.release();
  assert.equal(await pending, true);
  assert.equal(harness.speaks(), 1);
  assert.equal(harness.api.isAppSpeechActive(), false);
});
