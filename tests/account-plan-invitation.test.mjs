import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../shared/design-system/email-trial-account.css',import.meta.url),'utf8');
const jsx=readFileSync(new URL('../modules/citizenship/src/EmailTrialAccount.jsx',import.meta.url),'utf8');
test('Free invites guests into the existing registration without submitting or opening checkout',()=>{
 const free=jsx.slice(jsx.indexOf('{!session&&<button type="button" className={`${button} trial-plan`}'),jsx.indexOf("{[['monthly'"));
 assert.match(free,/data-plan="free" disabled=\{busy\}/);
 assert.match(free,/clearCheckoutIntent\(\);setSelectedPlan\(null\);setVerify\(false\)/);
 assert.match(free,/getElementById\('email-trial-email'\)\?\.focus\(\)/);
 assert.match(free,/prueba de 7 días/);
 assert.match(free,/Sin cobros automáticos/);
 assert.doesNotMatch(free,/subscribe\(|openCheckout\(|startEmailTrial\(/);
});
test('paid plan color keys are semantic and attention motion is finite and optional',()=>{
 assert.match(jsx,/data-plan=\{interval\}/);
 assert.match(css,/trial-plan-invite \.65s ease-in-out 1s 1/);
 assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
 assert.doesNotMatch(css,/infinite/);
 assert.match(css,/html:not\(\[data-theme="dark"\]\).*trial-plan/);
 assert.match(css,/\.trial-plan:disabled \{\s*animation: none !important/);
});
