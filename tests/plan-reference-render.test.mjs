import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
const output=await build({stdin:{contents:`import React from 'react';import Account from './modules/citizenship/src/EmailTrialAccount.jsx';import {AccountContext} from './modules/citizenship/src/accountContext.js';export default function Fixture(props){return <AccountContext.Provider value={{}}><Account {...props}/></AccountContext.Provider>}`,resolveDir:fileURLToPath(new URL('..',import.meta.url)),loader:'jsx'},bundle:true,write:false,jsx:'automatic',platform:'node',format:'cjs',external:['react','react-dom','react/jsx-runtime'],loader:{'.css':'empty'},define:{'import.meta.env':'{}'}});
const module={exports:{}};new Function('require','module','exports',output.outputFiles[0].text)(require,module,module.exports);
const Account=module.exports.default;
function render(props={}){
 const old=globalThis.window;globalThis.window={location:{search:'',href:'https://example.invalid/'}};
 try{return renderToStaticMarkup(React.createElement(Account,{embedded:true,webBillingEnabled:true,usage:{tier:'free'},billing:{monthlyPriceCents:599,annualPriceCents:4999},...props}));}finally{globalThis.window=old;}
}
test('reference cards render truthful ES/EN prices, decorative art and existing access',()=>{
 for(const language of ['es','en']){
  const html=render({language});
  assert.match(html,/\$0/);assert.match(html,/\$5\.99/);assert.match(html,/\$49\.99/);
  assert.match(html,/30%/);assert.match(html,/data-plan="free"/);assert.match(html,/data-plan="monthly"/);assert.match(html,/data-plan="annual"/);
  assert.match(html,/id="email-trial-email"/);assert.match(html,/aria-labelledby="trial-plans-title"/);
  assert.equal((html.match(/class="trial-plan-art"/g)||[]).length,3);
  assert.doesNotMatch(html,/50,000|50\.000|Miles de usuarios|Más popular|MÁS POPULAR|unlimited|ilimitadas|priority support/i);
  assert(html.indexOf('id="trial-plans-title"')<html.indexOf('id="email-trial-email"'));
 }
});
test('billing-disabled and existing subscribers retain their gates',()=>{
 assert.doesNotMatch(render({webBillingEnabled:false}),/data-plan=/);
 assert.doesNotMatch(render({usage:{tier:'pro'}}),/data-plan=/);
 assert.doesNotMatch(render({session:{user:{email:'synthetic@example.invalid'}}}),/data-plan="free"/);
});
test('annual savings follows server prices and never invents a discount',()=>{
 assert.doesNotMatch(render({billing:{monthlyPriceCents:400,annualPriceCents:4999}}),/Ahorra|Save /);
 assert.match(render({billing:{monthlyPriceCents:1000,annualPriceCents:6000}}),/50%/);
});
