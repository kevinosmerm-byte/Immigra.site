import test from 'node:test';
import assert from 'node:assert/strict';
import {createPracticeAccess} from '../services/ai/practice-access.mjs';
import {TRIAL_POLICY_VERSION} from '../modules/citizenship/shared/trialPolicy.js';
import {rememberQuestion,readQuestionMemory} from '../shared/interview-ui/question-memory.mjs';
import {createDomainInterview,domainBank} from '../services/ai/interview-domain.mjs';
const approved={policyVersion:TRIAL_POLICY_VERSION,allowed:true,status:'trial_active'};
async function check(dependencies){let code,body,passed=false;await createPracticeAccess(dependencies)({account:{userId:'verified-user'}},{status(n){code=n;return this;},json(v){body=v;return this;}},()=>{passed=true;});return {code,body,passed};}
test('first premium use starts trial with server identity; an existing trial never restarts',async()=>{
 let starts=0,finishes=0;
 const dependencies={getPracticeAccess:async()=>({status:'not_started'}),startAiSession:async args=>{assert.equal(args.userId,'verified-user');starts++;return {sessionId:'synthetic',access:approved};},finishAiSession:async()=>{finishes++;}};
 assert.equal((await check(dependencies)).passed,true);assert.equal(starts,1);assert.equal(finishes,1);
 dependencies.getPracticeAccess=async()=>approved;assert.equal((await check(dependencies)).passed,true);assert.equal(starts,1);
});
test('expired and unavailable policies fail closed without restarting trial',async()=>{
 let starts=0;const startAiSession=async()=>{starts++;};
 assert.equal((await check({getPracticeAccess:async()=>({status:'trial_expired'}),startAiSession})).code,403);
 assert.equal((await check({getPracticeAccess:async()=>{throw Error('database');},startAiSession})).code,503);assert.equal(starts,0);
});
test('question memory isolates accounts and topics and rejects response text',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 rememberQuestion('a','asylum','Q0001',storage);rememberQuestion('a','asylum','My private personal answer',storage);
 assert.deepEqual(readQuestionMemory('a','asylum',storage),['Q0001']);assert.deepEqual(readQuestionMemory('b','asylum',storage),[]);assert.deepEqual(readQuestionMemory('a','residency',storage),[]);
});
test('domain memory only accepts IDs from its own bank and pending N400 concepts are randomized within blocks',()=>{
 const settings={module:'citizenship',locale:'en'},bank=domainBank(settings);
 const first=createDomainInterview(settings,{random:()=>0.99999});
 const next=createDomainInterview({...settings,reviewedQuestionIds:[first.question.conceptId,'invented-answer']},{random:()=>0});
 assert.notEqual(next.question.conceptId,first.question.conceptId);assert.equal(next.question.block,first.question.block);
 assert.ok(next.state.askedConceptIDs.every(id=>bank.questions.some(q=>(q.concept||q.id)===id)));
});
