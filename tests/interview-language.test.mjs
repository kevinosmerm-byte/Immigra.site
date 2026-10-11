import test from 'node:test';
import assert from 'node:assert/strict';
import {domainBank,createDomainInterview,recordDomainTurn,advanceDomainTurn} from '../services/ai/interview-domain.mjs';
import {createCivicsConversation} from '../shared/interview-ui/civics-conversation.mjs';
import {civicsQuestionBank} from '../modules/citizenship/src/civicsQuestionBank.js';
import answersEs from '../shared/interview-ui/civics-answers.es.json' with {type:'json'};
test('all N400 concepts and follow-ups use selected language with stable identities',()=>{
 const es=domainBank({module:'citizenship',locale:'es'}),en=domainBank({module:'citizenship',locale:'en'});
 assert.equal(es.questions.length,90);assert.deepEqual(es.questions.map(q=>q.id),en.questions.map(q=>q.id));
 for(const q of es.questions){assert.match(q.canonicalPracticePrompt,/^¿/);assert.deepEqual(q.alternatePhrasings,[]);for(const f of q.followUps)assert.match(f,/^¿/);}
 const flow=createDomainInterview({module:'citizenship',locale:'es'});assert.equal(flow.question.english,'¿Cuál es su nombre legal completo?');
 const next=advanceDomainTurn(recordDomainTurn(flow,'Ana Ejemplo'),{answer_status:'adequate',educational_feedback:'Claro.',next_action:'continue'});
 assert.equal(next.flow.question.english,'¿Cómo se deletrea su apellido?');
});
test('supplemental civics translations cover every static answer one-to-one',()=>{
 for(const q of civicsQuestionBank.filter(q=>!q.isDynamic))assert.equal(answersEs[q.questionId].length,q.acceptedAnswers.length,String(q.questionId));
});
test('Spanish civics uses translated questions and deterministic official answer identities',async()=>{
 const q=civicsQuestionBank.find(q=>q.questionId===2);const turn=createCivicsConversation([q],{locale:'es'});
 assert.equal((await turn({})).next_question,q.questionSpanish);
 assert.equal((await turn({answer:'La Constitución',turnId:'a'})).status,'correct');
 const multi=civicsQuestionBank.find(q=>q.questionId===65);const run=createCivicsConversation([multi],{locale:'es'});
 assert.equal((await run({answer:'Libertad de expresión, libertad de religión y derecho a portar armas',turnId:'b'})).status,'correct');
 const duplicate=createCivicsConversation([multi],{locale:'es'});
 assert.notEqual((await duplicate({answer:'Libertad de religión, freedom of religion',turnId:'c'})).status,'correct');
});
import {isNextQuestionCommand} from '../shared/interview-ui/commands.mjs';
test('navigation commands are exact and not confused with narrative answers',()=>{
 for(const text of ['Siguiente pregunta','siguiente','Next question, please.','Por favor pasa a la siguiente pregunta','skip this question'])assert.equal(isNextQuestionCommand(text),true,text);
 for(const text of ['Mi hijo me hizo la siguiente pregunta','I did not skip the question','No recuerdo'])assert.equal(isNextQuestionCommand(text),false,text);
});
test('civics next command reads only next question and retries do not skip twice',async()=>{
 const turn=createCivicsConversation(civicsQuestionBank.slice(0,3),{locale:'es'});
 const result=await turn({answer:'siguiente pregunta',turnId:'skip'});
 assert.equal(result.status,'skipped');assert.equal(result.educational_feedback,'');assert.equal(result.next_question,civicsQuestionBank[1].questionSpanish);
 assert.deepEqual(await turn({answer:'siguiente pregunta',turnId:'skip'}),result);
});
