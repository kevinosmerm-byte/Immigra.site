import test from 'node:test';
import assert from 'node:assert/strict';
import { appRouteHash, readAppRoute } from '../src/appRoutes.js';

test('direct interview links preserve the requested preparation mode after reload', () => {
  for (const mode of ['n400', 'civics', 'full']) {
    assert.deepEqual(readAppRoute(appRouteHash('interview', mode)), { screen: 'interview', interviewMode: mode });
  }
  assert.deepEqual(readAppRoute('#interview?mode=unsupported'), { screen: 'interview', interviewMode: 'full' });
});

test('unknown or external route input returns to the local home destination', () => {
  for (const hash of ['#missing', '#https://example.com', '#javascript:alert(1)', '#../profile', '']) {
    assert.equal(readAppRoute(hash).screen, 'home');
  }
  assert.equal(appRouteHash('https://example.com'), '#home');
  assert.equal(appRouteHash('profile', 'n400'), '#profile');
});

test('existing privacy links continue to reach settings', () => {
  assert.equal(readAppRoute('#privacy').screen, 'settings');
  assert.equal(readAppRoute('#uscisSandbox').screen, 'uscisSandbox');
  assert.equal(readAppRoute('#uscisTracker').screen, 'uscisTracker');
});
