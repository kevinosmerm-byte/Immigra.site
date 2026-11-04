import test from 'node:test';
import assert from 'node:assert/strict';
import {createDomainInterview,skipDomainQuestion,skipAsylumTopic,skipResidencyTopic,recordDomainTurn,advanceDomainTurn} from '../services/ai/interview-domain.mjs';
import {questionProvenance} from '../modules/asylum/question-provenance.mjs';

for(const locale of ['es','en'])for(const module of ['asylum','residency','citizenship']){
 test(`integrated ${module}/${locale}: omission is navigation, never a personal statement`,()=>{
  const f=createDomainInterview({module,locale,route:'MATRIMONIO',transport:'text',practiceOptions:{count:30}},{random:()=>.5});
  assert.ok(f.question?.id);const id=f.question.id;
  if(module==='asylum')assert.ok(questionProvenance(id),`Missing asylum provenance: ${id}`);
  const next=skipDomainQuestion(f);
  assert.notEqual(next.question?.id,id);assert.deepEqual(next.statements,[]);assert.deepEqual(f.statements,[]);
  assert.equal(next.revision,f.revision+1);
  if(module!=='citizenship'){
   const skipped=(module==='asylum'?skipAsylumTopic:skipResidencyTopic)(f);
   assert.notEqual(skipped.question?.block,f.question.block);assert.deepEqual(skipped.statements,[]);
  }
 });
}
for(const locale of ['es','en'])test(`integrated citizenship/${locale}: derived follow-up keeps procedural source`,()=>{
 const f=createDomainInterview({module:'citizenship',locale},{random:()=>.999999});
 const result=advanceDomainTurn(recordDomainTurn(f,'Synthetic Name'),{answer_status:'adequate',next_action:'continue'});
 assert.equal(result.flow.question.derivedSource?.sourceRef,'USCIS_SCORING_ENGLISH');
 assert.equal(result.flow.question.derivedSource?.wordingType,'educational-adaptation-not-official-question');
 assert.ok(result.flow.question.sourceRefs.length);
});
