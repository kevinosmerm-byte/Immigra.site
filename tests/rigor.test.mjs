import test from 'node:test';
import assert from 'node:assert/strict';
import {LEVELS,validateLevel,levelName,chooseFollowUp} from '../modules/residency/rigor/config.mjs';
import {rigorInstructions,buildReviewRubric} from '../server/rigor.mjs';
import {validateRequest,createClientSecret} from '../server/realtime.mjs';
const base={engine_id:'residency',relationshipType:'child_petitions_mother',locale:'es',mode:'fictional',scenarioId:'child_petitions_mother-01',consent:true};
test('Intensity defaults to normal; rejects malformed and unrecognized levels',()=>{
 assert.equal(validateRequest(base).level,'normal');
 for(const level of [null,'hostile','',{},[],42])assert.throws(()=>validateRequest({...base,level}));
 for(const level of LEVELS){assert.equal(validateLevel(level),level);assert.equal(validateRequest({...base,level}).level,level);assert.ok(levelName(level,'es'));assert.ok(levelName(level,'en'));}
});
test('Every intensity reaches the provider while retaining consent, fictional context and voice',async()=>{
 const markers={normal:'Friendly, supportive',rigorous:'Firm, skeptical',pressure:'Demanding, realistic'};
 for(const level of LEVELS){let body;await createClientSecret({...base,level},{apiKey:'sk_mock',fetchImpl:async(_,o)=>{body=JSON.parse(o.body);return {ok:true,json:async()=>({value:'ek_mock'})};}});
 assert.ok(body.session.instructions.includes(markers[level]));assert.match(body.session.instructions,/FICTIONAL/);assert.match(body.session.instructions,/child_petitions_mother/);assert.match(body.session.instructions,/residency ONLY/);assert.equal(body.session.audio.output.voice,'marin');assert.match(body.session.instructions,/does not remember/);assert.match(body.session.instructions,/immediately use normal/);
 }
});
test('Invalid intensity is rejected before provider access',async()=>{await assert.rejects(()=>createClientSecret({...base,level:'hostile'},{apiKey:'sk_mock',fetchImpl:()=>assert.fail('must not contact provider')}),/Invalid interview intensity/);});
test('All policies permit uncertainty and avoid unsupported accusations and outcome scores',()=>{for(const level of LEVELS){const p=rigorInstructions(level);assert.match(p,/falsely claim a contradiction/);assert.match(p,/may decline, pause/);assert.match(p,/Never predict credibility/);}assert.match(rigorInstructions('pressure'),/immediately lower intensity/);assert.match(rigorInstructions('pressure'),/after the applicant finishes/);});
test('Local clarification helper accepts uncertainty and skipping even under pressure',()=>{for(const answer of ['No recuerdo','No me acuerdo de esa fecha','Prefiero no responder',"I don't remember",'skip'])assert.match(chooseFollowUp({answer,level:'pressure',locale:'en'}),/may leave it uncertain or skip/);assert.match(chooseFollowUp({answer:'We lived in two different apartments',level:'rigorous',locale:'en',topic:'cohabitation'}),/Describe how/);});
test('Review rubric is a grounded future contract, not a credibility verdict',()=>{const r=buildReviewRubric();for(const x of ['fraud','deception','credibility_score','approval_probability'])assert.ok(r.never.includes(x));assert.match(r.instructions,/cite turns/);assert.match(r.instructions,/user-confirmed/);assert.ok(r.labels.includes('not_assessed'));});
