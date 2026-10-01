import test from 'node:test';
import assert from 'node:assert/strict';
import { claimProNotice, PRO_NOTICE_INTERVAL } from '../src/proNoticePolicy.js';
import { getPracticeSummary } from '../src/progress.js';
test('one PRO recommendation across modules and reloads, with a weekly cooldown and account isolation',()=>{
 const map=new Map();const store={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};const now=1700000000000;
 assert.equal(claimProNotice(store,'alice',now),true);
 assert.equal(claimProNotice(store,'alice',now+1),false);
 assert.equal(claimProNotice(store,'alice',now+PRO_NOTICE_INTERVAL-1),false);
 assert.equal(claimProNotice(store,'bob',now),true);
 assert.equal(claimProNotice(store,'alice',now+PRO_NOTICE_INTERVAL),true);
});
test('repeat quizzes do not inflate studied question count',()=>{
 const summary=getPracticeSummary([{module:'quiz',score:100,at:1700000000000}],[0,0,1],[]);
 assert.equal(summary.civics.viewed,2);
 assert.equal(summary.quiz.attempts,1);
});
