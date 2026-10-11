import test from 'node:test';
import assert from 'node:assert/strict';
import {sourcePracticeQuestions} from '../services/ai/source-practice.mjs';
import {createDomainInterview,skipDomainQuestion} from '../services/ai/interview-domain.mjs';
const context='En abril viajé a Puerto Nube. No recuerdo el día.';
const env={OPENAI_API_KEY:'test',OPENAI_TEXT_MODEL:'mock'};
const mock=excerpts=>async()=>Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({excerpts})}]}]});
test('document prompts use validated quotes, selected language and advance without repeating',async()=>{
 for(const locale of ['es','en']){
 const settings={module:'asylum',locale,context};
 const sourceQuestions=await sourcePracticeQuestions(settings,{env,reserveQuota:async()=>true,fetchImpl:mock([{quote:'En abril viajé a Puerto Nube.',category:'event'},{quote:'No recuerdo el día.',category:'uncertainty'}])});
 assert.equal(sourceQuestions.length,2);
 const flow=createDomainInterview({...settings,sourceQuestions});
 assert.match(flow.question.english,/Puerto Nube/);
 assert.match(flow.question.english,locale==='es'?/Cómo explicarías/:/How would/);
 assert.notEqual(skipDomainQuestion(flow).question.id,flow.question.id);
 }
});
test('ungrounded extraction and quota failure never become invented questions',async()=>{
 const settings={module:'asylum',locale:'es',context};
 await assert.rejects(sourcePracticeQuestions(settings,{env,reserveQuota:async()=>true,fetchImpl:mock([{quote:'Invented city',category:'place'}])}),/PROVIDER_UNAVAILABLE/);
 let sent=false;await assert.rejects(sourcePracticeQuestions(settings,{env,reserveQuota:async()=>false,fetchImpl:async()=>{sent=true;}}),/DAILY_LIMIT/);assert.equal(sent,false);
});
test('mixed extraction discards altered quotes and keeps only exact document excerpts',async()=>{
 const questions=await sourcePracticeQuestions({module:'asylum',locale:'es',context},{env,reserveQuota:async()=>true,fetchImpl:mock([{quote:'Invented city',category:'place'},{quote:'No recuerdo el día.',category:'uncertainty'}])});
 assert.equal(questions.length,1);assert.match(questions[0].canonicalPracticePrompt,/No recuerdo el día/);assert.doesNotMatch(questions[0].canonicalPracticePrompt,/Invented/);
});
