import test from 'node:test';
import assert from 'node:assert/strict';
import {createEmailLinkDelivery} from '../shared/email-link-delivery.mjs';

test('double clicks and repeated sends wait for a full minute without automatic mail', async () => {
  let now = 1000, calls = 0, resolve;
  const delivery = createEmailLinkDelivery(() => now);
  const first = delivery.send(() => { calls++; return new Promise(r => { resolve = r; }); });
  assert.equal((await delivery.send(() => { calls++; })).status, 'waiting');
  resolve({});
  assert.equal((await first).status, 'sent');
  assert.equal(delivery.remaining(), 60);
  now += 59999;
  assert.equal((await delivery.send(() => { calls++; })).status, 'waiting');
  now++;
  assert.equal(delivery.remaining(), 0);
  assert.equal(calls, 1, 'timer never sends mail');
  assert.equal((await delivery.send(() => { calls++; return {}; })).status, 'sent');
  assert.equal(calls, 2);
});
test('server limits keep the cooldown; connection errors remain recoverable', async () => {
  let now = 0;
  const delivery = createEmailLinkDelivery(() => now);
  assert.equal((await delivery.send(() => ({error: {status: 429}}))).status, 'limited');
  assert.equal(delivery.remaining(), 60);
  now = 60000;
  assert.equal((await delivery.send(() => { throw Error('offline'); })).status, 'error');
  assert.equal(delivery.remaining(), 0);
  assert.equal((await delivery.send(() => ({error: {code: 'over_email_send_rate_limit'}}))).status, 'limited');
});
