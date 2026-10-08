import test from 'node:test';import assert from 'node:assert/strict';
import {selectQuestions,createSession,addTurn,summarize,getScenario} from '../src/engine.mjs';
test('isolation',()=>{const q=selectQuestions({relationshipType:'child_petitions_mother',count:10});assert.equal(q.length,10);assert.ok(q.every(x=>x.engine_id==='residency'&&x.relationship_type==='child_petitions_mother'));});
test('locale',()=>assert.ok(selectQuestions({relationshipType:'marriage_husband_petitioner',locale:'en'}).every(x=>x.locale==='en')));
test('scenario mismatch',()=>assert.throws(()=>createSession({relationshipType:'child_petitions_mother',mode:'fictional',scenarioId:'marriage_wife_petitioner-01'})));
test('turns and summary',()=>{const s=createSession({relationshipType:'marriage_husband_petitioner'});addTurn(s,{speaker:'applicant',text:'June'});assert.equal(summarize(s).answered,1);});
test('cross engine rejected',()=>{const s=createSession({relationshipType:'marriage_wife_petitioner'});s.engine_id='asylum';assert.throws(()=>addTurn(s,{speaker:'applicant',text:'test'}));});
