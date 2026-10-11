import test from 'node:test';
import assert from 'node:assert/strict';
import {aosQuestions,aosQuestion,selectAosQuestions} from '../modules/residency/src/aosEngine.mjs';
import english from '../modules/residency/data/aos-questions.en.json' with {type:'json'};
import {domainBank,uncertainAnswer} from '../services/ai/interview-domain.mjs';
import {validateSettings,InterviewResponseEvaluator,currentTurnSchema} from '../services/ai/interview-engine.mjs';
import {createAsylumHtml,translateAsylumStatic} from '../modules/asylum/localization.mjs';

test('all 300 original AOS IDs have an English translation without modifying Spanish questions',()=>{
 const originals=aosQuestions.filter(q=>/^AOS-\d+$/.test(q.id));assert.equal(originals.length,300);assert.deepEqual(Object.keys(english).sort(),originals.map(q=>q.id).sort());
 for(const q of aosQuestions){assert.equal(aosQuestion(q,'es'),q.pregunta_es);assert.ok(aosQuestion(q,'en').length>12,q.id);assert.doesNotMatch(aosQuestion(q,'en'),/[¿¡]/);}
 for(const route of ['MATRIMONIO','HIJO_A_PADRES','PADRES_A_HIJOS']){const es=domainBank({module:'residency',locale:'es',route}),en=domainBank({module:'residency',locale:'en',route});assert.deepEqual(es.questions.map(q=>q.id),en.questions.map(q=>q.id));assert.notEqual(es.questions[0].canonicalPracticePrompt,en.questions[0].canonicalPracticePrompt);}
});
test('validated family options reach the same authoritative selector and invalid values are rejected',()=>{
 const practiceOptions={petitionerStatus:'resident',age:'under21',marital:'single',count:6};
 const settings=validateSettings({module:'residency',locale:'en',consent:true,route:'PADRES_A_HIJOS',practiceOptions});
 assert.deepEqual(settings.practiceOptions,practiceOptions);
 const bank=domainBank(settings);assert.equal(bank.questions.length,6);
 assert.deepEqual(bank.questions.map(q=>q.id),selectAosQuestions({route:settings.route,...practiceOptions,random:()=>.5}).map(q=>q.id));
 for(const options of [{count:0},{count:101},{count:'6'},{age:'bad'},{marital:'bad'},{petitionerStatus:'bad'}])assert.throws(()=>validateSettings({module:'residency',locale:'en',consent:true,practiceOptions:options}),/INVALID_SETTINGS/);
});
test('Spanish and English uncertainty are accepted and constrained without requiring personal facts',()=>{
 for(const answer of ['No recuerdo','No estoy seguro','Necesito revisar mis documentos','I do not remember','I am not sure',"I don't remember",'I need to check my documents']){
  assert.equal(uncertainAnswer(answer),true,answer);const schema=currentTurnSchema([],answer,'en');assert.deepEqual(schema.properties.answer_status.enum,['uncertain']);assert.deepEqual(schema.properties.suggested_follow_up.enum,['']);
 }
});
test('evaluator separates current answer from history; rejects misleading uncertainty feedback',async()=>{
 const session={settings:{locale:'en'},instructions:'English',history:[{role:'assistant',text:'Your birth date?'},{role:'user',text:'January 15, 1980.'}]};
 let payload;const answer='I do not remember';const question='How old is your child?';
 const fetchImpl=async(url,options)=>{payload=JSON.parse(options.body);return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({answer_status:'uncertain',consistency_status:'insufficient_context',educational_feedback:'You gave your own birth date.',suggested_follow_up:'',next_action:'continue',evidence:[],topic:'family',difficulty:'easy'})}]}]});};
 await assert.rejects(InterviewResponseEvaluator(session,{fetchImpl,env:{OPENAI_API_KEY:'test-only'},answer,question}),/UNGROUNDED_EVALUATION/);
 const input=JSON.parse(payload.input);assert.deepEqual(input.current_turn,{question,answer});assert.deepEqual(input.prior_turns,session.history);assert.equal(payload.store,false);
});
test('Asylum locale changes translate static UI but never translate user content',()=>{
 let locale='es';const html=createAsylumHtml(()=>locale);const userText='Tu historia, paso a paso.';
 assert.equal(html`<h1>Tu historia, paso a paso.</h1><p>${userText}</p>`,'<h1>Tu historia, paso a paso.</h1><p>Tu historia, paso a paso.</p>');
 locale='en';assert.equal(html`<h1>Tu historia, paso a paso.</h1><p>${userText}</p>`,'<h1>Your story, step by step.</h1><p>Tu historia, paso a paso.</p>');
 assert.equal(translateAsylumStatic('Escribe BORRAR','en'),'Type BORRAR');
});
