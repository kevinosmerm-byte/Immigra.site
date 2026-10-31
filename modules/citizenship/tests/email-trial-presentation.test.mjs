import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../src/EmailTrialAccount.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/EmailTrialAccount.css',import.meta.url),'utf8');

test('account access choices precede plans and use existing verification state',()=>{
 assert.ok(source.indexOf('trial-access-choices')<source.indexOf('trial-plans space'));
 assert.match(source,/aria-pressed=\{!signingIn\} onClick=\{\(\)=>setVerify\(false\)\}/);
 assert.match(source,/aria-pressed=\{signingIn\} onClick=\{\(\)=>setVerify\(true\)\}/);
 assert.match(source,/if\(signingIn\).*sendMagicLink\(email.trim\(\)\)/);
 assert.match(source,/else\{await startEmailTrial\(email.trim\(\)\);onContinue\(\);\}/);
 assert.match(source,/session&&!signingIn&&<button/);
});

test('pricing keeps server values, billing interval disclosures and checkout gates',()=>{
 assert.match(source,/webBillingEnabled&&usage\?\.tier!=='pro'&&<section/);
 assert.match(source,/billing.introductoryOfferEnabled\?billing.introductoryMonthlyPriceCents:billing.monthlyPriceCents/);
 assert.match(source,/billing.annualPriceCents\?\?PRO_PLAN.annualPriceCents/);
 assert.match(source,/onClick=\{\(\)=>subscribe\(interval\)\}/);
 assert.match(source,/Un cobro por el año completo/);
 assert.match(source,/Renovación automática del plan contratado/);
 assert.match(source,/Las compras no están disponibles en esta versión de la app/);
 const plans=source.slice(source.indexOf('trial-plans space'));
 assert.doesNotMatch(plans,/<details/);
});

test('glass comparison has bounded motion, keyboard focus, responsive columns and theme pairs',()=>{
 assert.match(css,/prefers-reduced-motion: reduce/);
 assert.match(css,/animation: none !important/);
 assert.doesNotMatch(css,/infinite/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/min-height: 48px/);
 assert.match(css,/minmax\(0,1.1fr\) minmax\(0,1fr\)/);
 assert.match(css,/html\[data-theme="dark"\]/);
 assert.match(css,/background: var\(--readable-panel/);
});
