import test from 'node:test';
import assert from 'node:assert/strict';
import { avatarCivicsBank, createAvatarPractice, avatarQuestionScript, evaluateAvatarResponse } from '../src/avatarCivics.js';
import { civicsQuestionBank } from '../src/civicsQuestionBank.js';
import { createDidCivicsSession } from '../src/didCivicsSession.js';
test('avatar uses the same 128 official questions and excludes unavailable answers from practice', () => {
 const bank = avatarCivicsBank();
 assert.equal(bank.length,128);
 assert.deepEqual(bank.map(avatarQuestionScript),civicsQuestionBank.map(q=>q.question));
 const practice=createAvatarPractice(undefined,()=>0.5);
 assert.equal(practice.length,20);
 assert.equal(new Set(practice.map(q=>q.questionId)).size,20);
 assert.ok(practice.every(q=>q.acceptedAnswers.length));
 assert.equal(evaluateAvatarResponse(bank.find(q=>q.questionId===81),'Virginia').status,'incomplete');
 assert.equal(evaluateAvatarResponse(bank.find(q=>q.questionId===81),'New York, New Jersey, Georgia, Delaware and Virginia').status,'correct');
});
test('avatar transport uses DirectPlayback and exposes no generative chat', async()=>{
 const calls=[];
 const sdk={ChatMode:{DirectPlayback:'direct'},createAgentManager:async(id,options)=>{
 assert.equal(id,'test-agent'); assert.equal(options.mode,'direct'); assert.equal(options.analytics.enabled,false);
 return {connect:async()=>calls.push('connect'),disconnect:async()=>calls.push('disconnect'),speak:async script=>calls.push(script),chat:()=>assert.fail('No chat allowed')};
 }};
 const session=await createDidCivicsSession(sdk,{agentId:'test-agent',clientKey:'test-key'},{});
 assert.equal(session.chat,undefined);
 await session.connect(); await session.speak('What is the supreme law of the land?'); await session.disconnect();
 assert.deepEqual(calls,['connect',{type:'text',input:'What is the supreme law of the land?'},'disconnect']);
});
