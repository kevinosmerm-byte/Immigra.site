import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {initialShellHtml, injectInitialShell} from '../scripts/initial-shell.mjs';
import {seoPages} from '../shared/seo-pages.mjs';

const page = '<!doctype html><html><head><meta charset="UTF-8"/><script type="module" src="/assets/app.js"></script><link rel="stylesheet" href="/assets/app.css"></head><body><div id="root" class="min-h-dvh"></div></body></html>';

test('critical first-paint styling precedes application assets and preserves one root', () => {
  const html = injectInitialShell(page);
  assert.ok(html.indexOf('charset="UTF-8"') < html.indexOf('id="immigra-boot-styles"'));
  assert.ok(html.indexOf('id="immigra-boot-styles"') < html.indexOf('src="/assets/app.js"'));
  assert.ok(html.indexOf('src="/app-boot.js"') < html.indexOf('src="/assets/app.js"'));
  assert.equal((html.match(/id="root"/g) || []).length, 1);
  assert.equal((html.match(/id="immigra-boot"/g) || []).length, 1);
  assert.match(html, /min-height:100vh;min-height:100svh/);
  assert.match(html, /background:#fff/);
  assert.doesNotMatch(html, /<script>\s*[^<]/); // CSP does not allow inline JS.
  assert.throws(() => injectInitialShell(html), /empty application root/);
});

test('guides remain real, visible links below the branded intro, including without JS', () => {
  const html = initialShellHtml();
  assert.match(html, /<h1[^>]*>IMMIGRA.site<\/h1>/);
  assert.match(html, /<noscript>/);
  assert.match(html, /href="\/fuentes"/);
  assert.doesNotMatch(html, /href="#/); // Do not overwrite an incoming application hash route.
  for (const {path} of seoPages) assert.ok(html.includes(`href="/${path}"`), path);
  for (const path of ['fuentes', 'privacidad', 'soporte']) assert.ok(html.includes(`href="/${path}"`));
  assert.ok(html.indexOf('class="immigra-boot-intro"') < html.indexOf('id="immigra-boot-guides"'));
  assert.doesNotMatch(html, /<section[^>]*hidden|userAgent|googlebot|noindex/);
});

async function boot({mounted = false} = {}) {
  let callback, observation, timeout, cleared = false, disconnected = false, reloads = 0;
  const shell = {isConnected: true};
  const status = {textContent: ''};
  const handlers = new Map();
  const retry = {hidden: true, addEventListener: (type, fn) => handlers.set(type, fn), removeEventListener: type => handlers.delete(type)};
  const root = {};
  vm.runInNewContext(await readFile(new URL('../public/app-boot.js', import.meta.url), 'utf8'), {
    document: {getElementById: id => ({'immigra-boot': mounted ? null : shell, 'immigra-boot-status': status, 'immigra-boot-retry': retry, root})[id]},
    window: {setTimeout: (fn, delay) => {timeout = {fn, delay}; return 42;}, clearTimeout: id => {assert.equal(id, 42); cleared = true;}, location: {reload: () => reloads++}},
    MutationObserver: class {constructor(fn) {callback = fn;} observe(node, options) {observation = {node, options};} disconnect() {disconnected = true;}}
  });
  return {shell, status, retry, handlers, root, get timeout() {return timeout;}, get observation() {return observation;}, mutate: () => callback(), get cleared() {return cleared;}, get disconnected() {return disconnected;}, get reloads() {return reloads;}};
}

test('slow or failed application loading offers manual recovery without redirecting', async () => {
  const state = await boot();
  assert.match(state.status.textContent, /Cargando IMMIGRA.site/);
  assert.equal(state.timeout.delay, 12000);
  assert.equal(state.retry.hidden, true);
  state.timeout.fn();
  assert.equal(state.retry.hidden, false);
  assert.match(state.status.textContent, /reintentar o consultar las guías/);
  assert.equal(state.reloads, 0);
  state.handlers.get('click')();
  assert.equal(state.reloads, 1);
});

test('React replacement cancels pending recovery and releases the observer', async () => {
  const state = await boot();
  assert.equal(state.observation.node, state.root);
  state.mutate();
  assert.equal(state.cleared, false);
  state.shell.isConnected = false;
  state.mutate();
  assert.equal(state.cleared, true);
  assert.equal(state.disconnected, true);
  assert.equal(state.handlers.size, 0);
  state.timeout.fn();
  assert.equal(state.retry.hidden, true);
});

test('controller is harmless if the application already replaced the fallback', async () => {
  const state = await boot({mounted: true});
  assert.equal(state.timeout, undefined);
  assert.equal(state.observation, undefined);
});
