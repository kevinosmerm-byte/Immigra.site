import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import postcss from 'postcss';
import config from '../vite.config.js';

test('shared account CSS survives actual domain boundary plugin unchanged',async()=>{
 const from=fileURLToPath(new URL('../shared/design-system/email-trial-account.css',import.meta.url));
 const original=readFileSync(from,'utf8');
 const result=await postcss(config.css.postcss.plugins).process(original,{from});
 assert.equal(result.css,original);
 assert.match(result.css,/html body #root \.email-trial-account \.trial-plan \{ display: grid !important/);
 assert.match(result.css,/\.trial-glass-button\[aria-pressed="true"\]/);
 assert.doesNotMatch(result.css,/#citizenship-root|\.citizenship-surface/);
 const jsx=readFileSync(new URL('../modules/citizenship/src/EmailTrialAccount.jsx',import.meta.url),'utf8');
 assert.doesNotMatch(jsx,/trial-access-panel/);
 assert.match(jsx,/account-access-panel/);
 const button=jsx.match(/const button=`([^`]+)`/)?.[1];
 assert.ok(button);
 assert.doesNotMatch(button,/bg-blue|text-white|border-blue|rounded-xl|px-5|py-3/);
 assert.match(button,/trial-glass-button/);
 assert.doesNotMatch(jsx,/max-w-3xl!|bg-white\/95!|text-slate-900!|bg-slate-50!/);
 assert.match(jsx,/import '\.\.\/\.\.\/\.\.\/shared\/design-system\/email-trial-account.css'/);
});

test('account companion flow is web-route scoped and cleans up automatically on navigation',()=>{
 const css=readFileSync(new URL('../shared/design-system/email-trial-account.css',import.meta.url),'utf8');
 assert.match(css,/html\[data-experience="web"\] #root:has\(#main \.platform-account\) citizenship-companion\.platform-study-companion \{ position: relative; display: block; inset: auto; z-index: auto;/);
 const main=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
 assert.match(main,/page==='account'\?<div className="citizenship-surface platform-account/);
 const global=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
 assert.match(global,/citizenship-companion\.platform-study-companion \{\s*position: fixed;/);
 assert.match(global,/citizenship-companion\.platform-study-companion\[hidden\] \{ display: none !important; \}/);
 assert.match(global,/html\[data-experience="native"\] citizenship-companion\.platform-study-companion/);
});

test("account access wrapper stays unboxed without removing sign-in choices",()=>{
 const css=readFileSync(new URL("../shared/design-system/email-trial-account.css",import.meta.url),"utf8");
 assert.match(css,/\.account-access-panel \{ min-width: 0; border: 0 !important; background: transparent !important; box-shadow: none !important; padding: 0 !important;/);
 const jsx=readFileSync(new URL("../modules/citizenship/src/EmailTrialAccount.jsx",import.meta.url),"utf8");
 assert.match(jsx,/<GoogleSignInButton/); assert.match(jsx,/<PasswordSignIn/); assert.match(jsx,/id="email-trial-email"/);
});
