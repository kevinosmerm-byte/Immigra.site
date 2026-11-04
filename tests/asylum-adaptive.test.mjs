import test from 'node:test';
import assert from 'node:assert/strict';
import {adaptiveCards,offerAdaptive,adaptiveAction,finishAdaptive,adaptiveView} from '../modules/asylum/adaptive-session.mjs';
const adequate={status:'adequate'};
function fixture(answer='Synthetic personal context',transport='text'){
 const session={settings:{module:'asylum',locale:'es'},transport,history:[{role:'user',text:'Synthetic earlier account of the same matter'}],flow:{revision:1,question:{id:'next',kind:'concept',english:'Next base question'}}};
 offerAdaptive(session,{id:'source',kind:'concept'},answer,adequate);return session;
}
function confirm(s,c,extra={}){return {type:'confirm',cardId:c.id,offerId:s.adaptiveOffer?.id,quote:s.adaptiveOffer?.quote,sourceKind:'personal',contextConfirmed:true,confirmed:c.requirements.map(r=>r.id),impactConsent:true,priorQuoteId:s.adaptiveOffer?.priorQuotes[0]?.id,priorQuote:s.adaptiveOffer?.priorQuotes[0]?.quote,sameMatterConfirmed:true,scenarioConsent:true,scenarioVersion:c.scenario?.version,...extra};}
test('every one of 88 cards has individual bilingual prerequisites; referent/scenario cards have additional gates',()=>{
 assert.equal(adaptiveCards.length,88);assert.equal(adaptiveCards.filter(c=>c.enabled).length,88);
 const ids=new Set();for(const c of adaptiveCards){assert.ok(c.requirements.length);for(const r of c.requirements){assert.ok(r.es&&r.en);assert.ok(!ids.has(r.id));ids.add(r.id);}}
});
test('each enabled card requires explicit exact-context confirmation and restores just one pending base question',()=>{
 for(const c of adaptiveCards.filter(c=>c.enabled))for(const locale of ['es','en']){
  const s=fixture();s.settings.locale=locale;const resume=s.flow.question;
  for(const extra of [{contextConfirmed:false},{quote:'invented'},{sourceKind:'third_party'},{sourceKind:'hypothetical'},{confirmed:[]},{offerId:'old'}])assert.throws(()=>adaptiveAction(s,confirm(s,c,extra)),/CONTEXT_REQUIRED/);
  for(const requirement of c.requirements){assert.throws(()=>adaptiveAction(s,confirm(s,c,{confirmed:c.requirements.filter(r=>r.id!==requirement.id).map(r=>r.id)})),/CONTEXT_REQUIRED/,`${c.id} requires ${requirement.id}`);}
  adaptiveAction(s,confirm(s,c));assert.equal(s.flow.question.id,c.id);assert.ok(s.flow.question.english.endsWith(c[locale==='es'?'question_es':'question_en']));assert.equal(s.adaptiveOffer,null);
  assert.equal(s.adaptiveActive.evidence.quote,'Synthetic personal context');assert.throws(()=>adaptiveAction(s,confirm(s,c)),/CONTEXT_REQUIRED/);
  finishAdaptive(s);assert.equal(s.flow.question,resume);assert.equal(s.adaptiveActive,null);
  offerAdaptive(s,{id:'later',kind:'concept'},'New synthetic answer',adequate);assert.ok(!s.adaptiveOffer?.options.includes(c.id));
 }
});
test('detention, attributed affiliation and third-party narratives never imply prerequisites',()=>{
 for(const [text,branch,index] of [['I was detained at departure','exit_controls',1],['They attributed a political party to me; I never participated','political_role',0],['My friend changed jobs','employment',0]]){
  const s=fixture(text),c=adaptiveCards.filter(c=>c.branch===branch)[index];
  assert.equal(s.adaptiveActive,undefined);assert.equal(s.flow.question.id,'next');
  assert.throws(()=>adaptiveAction(s,confirm(s,c,{confirmed:[]})),/CONTEXT_REQUIRED/);
  assert.throws(()=>adaptiveAction(s,confirm(s,c,{sourceKind:'third_party'})),/CONTEXT_REQUIRED/);
 }
});
test('correction and omission invalidate prior evidence; silence and voice cannot confirm',()=>{
 for(const type of ['correct','omit']){const s=fixture(),c=adaptiveCards[0],old=confirm(s,c);adaptiveAction(s,{type});assert.throws(()=>adaptiveAction(s,old),/CONTEXT_REQUIRED/);assert.equal(s.flow.question.id,'next');}
 const s=fixture('', 'voice');assert.equal(adaptiveView(s),null);assert.throws(()=>adaptiveAction(s,{type:'confirm'}),/DISABLED/);
});
test('impact requires separate consent and withdrawal prevents any further impact offer',()=>{
 for(const c of adaptiveCards.filter(c=>c.impact)){
 const s=fixture();
 assert.throws(()=>adaptiveAction(s,confirm(s,c,{impactConsent:false})),/CONTEXT_REQUIRED/);
 adaptiveAction(s,confirm(s,c));adaptiveAction(s,{type:'withdraw'});assert.equal(s.flow.question.id,'next');
 offerAdaptive(s,{id:'later',kind:'concept'},'New synthetic answer',adequate);
 assert.ok(!s.adaptiveOffer.options.some(id=>adaptiveCards.find(c=>c.id===id).impact));
 }
});
test('clarifications, follow-up answers and uncertain responses cannot activate',()=>{
 for(const [kind,status,nextKind] of [['followup','adequate','concept'],['concept','uncertain','concept'],['concept','adequate','followup']]){const s=fixture();s.flow.question.kind=nextKind;offerAdaptive(s,{id:'source',kind},'Synthetic', {status});assert.equal(s.adaptiveOffer,null);}
 const s=fixture();for(const c of adaptiveCards.filter(c=>!c.enabled))assert.throws(()=>adaptiveAction(s,confirm(s,c)),/CONTEXT_REQUIRED/);
});

test('hypothetical scenarios require explicit versioned consent and never masquerade as real offers',()=>{
 for(const card of adaptiveCards.filter(c=>c.scenario)){
  const s=fixture();assert.throws(()=>adaptiveAction(s,confirm(s,card,{scenarioConsent:false})),/CONTEXT_REQUIRED/);
  assert.throws(()=>adaptiveAction(s,confirm(s,card,{scenarioVersion:'old'})),/CONTEXT_REQUIRED/);
  adaptiveAction(s,confirm(s,card));assert.ok(s.flow.question.english.startsWith(card.scenario.es));
  assert.equal(s.adaptiveActive.evidence.scenarioVersion,'1');adaptiveAction(s,{type:'omit'});assert.equal(s.flow.question.id,'next');
 }
});
test('record comparison requires two exact authorized quotations and explicit same-matter confirmation',()=>{
 for(const c of adaptiveCards.filter(c=>c.requiresPriorQuote)){
 const s=fixture();
 for(const extra of [{priorQuote:'fabricated'},{priorQuoteId:'unknown'},{sameMatterConfirmed:false}])assert.throws(()=>adaptiveAction(s,confirm(s,c,extra)),/CONTEXT_REQUIRED/);
 adaptiveAction(s,confirm(s,c));assert.equal(s.adaptiveActive.evidence.priorQuote,'Synthetic earlier account of the same matter');
 const empty=fixture();empty.history=[];offerAdaptive(empty,{id:'source',kind:'concept'},'Only one quotation',adequate);assert.ok(!empty.adaptiveOffer.options.includes(c.id));
 const assistant=fixture();assistant.history=[{role:'assistant',text:'A model statement'}];offerAdaptive(assistant,{id:'source',kind:'concept'},'Only one quotation',adequate);assert.ok(!assistant.adaptiveOffer.options.includes(c.id));
 }
});

test('new context prerequisites and UI preserve Spanish UTF-8 text',async()=>{
 const {readFile}=await import('node:fs/promises');
 for(const file of ['../modules/asylum/adaptive-prerequisites.json','../modules/asylum/AsylumAdaptivePicker.jsx']){
  const text=await readFile(new URL(file,import.meta.url),'utf8');assert.doesNotMatch(text,/Ã|Â|â€/);
 }
});

test('answers to contextual or hypothetical follow-ups cannot become record-comparison evidence',()=>{
 const s=fixture();s.history=[{role:'user',source:'adaptive',text:'Synthetic answer to a hypothetical scenario'}];
 offerAdaptive(s,{id:'base',kind:'concept'},'Synthetic personal statement',adequate);
 assert.equal(s.adaptiveOffer.priorQuotes.length,0);for(const c of adaptiveCards.filter(c=>c.requiresPriorQuote))assert.ok(!s.adaptiveOffer.options.includes(c.id));
});
