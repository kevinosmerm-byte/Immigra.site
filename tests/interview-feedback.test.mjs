import test from 'node:test';
import assert from 'node:assert/strict';
import {clarificationOptions,interviewerAcknowledgment,clarificationIsGrounded} from '../services/ai/interview-feedback.mjs';
import {createDomainInterview,recordDomainTurn,advanceDomainTurn,uncertainAnswer,hasUncertainty} from '../services/ai/interview-domain.mjs';
import {InterviewResponseEvaluator,currentTurnSchema} from '../services/ai/interview-engine.mjs';
import bank from '../services/ai/clarification-bank.json' with {type:'json'};
const evaluation=(answer,question)=>({answer_status:'ambiguous',consistency_status:'insufficient_context',educational_feedback:'Señala a qué te refieres con tus propias palabras.',suggested_follow_up:question,next_action:'clarify',evidence:[answer],topic:'clarity',difficulty:'easy'});
for(const module of ['asylum','residency'])for(const locale of ['es','en'])test(`${module}/${locale} asks one grounded clarification without alleging discrepancy`,()=>{
 let flow=createDomainInterview({module,locale,route:'MATRIMONIO'});const answer=locale==='es'?'Eso fue después.':'That was later.';
 const q=clarificationOptions({module,locale},answer).find(x=>x.id==='CIT-006').text;const e=evaluation(answer,q);
 const original=flow.question.id;flow=advanceDomainTurn(recordDomainTurn(flow,answer),e).flow;
 assert.equal(flow.question.kind,'followup');assert.equal(flow.question.english,q);assert.notEqual(flow.question.id,original);
 flow=advanceDomainTurn(recordDomainTurn(flow,answer),e).flow;assert.equal(flow.question.kind,'concept');
 assert.equal(flow.clarified.length,1);
});
test('partial uncertainty is analyzed specifically but not committed as confirmed biography',()=>{
 for(const answer of ['Fue en mayo, pero no recuerdo el día.','I moved in 2021, but I am not sure of the month.','Quizás fue en mayo.','I don’t remember the day, but it happened in May.']){
  assert.equal(uncertainAnswer(answer),false);assert.equal(hasUncertainty(answer),true);
  assert.notDeepEqual(currentTurnSchema([],answer,'es','asylum').properties.answer_status.enum,['uncertain']);
 }
 assert.equal(uncertainAnswer('No recuerdo'),true);
 const flow=createDomainInterview({module:'citizenship',locale:'es'});const recorded=recordDomainTurn(flow,'Quizás fue en mayo.');assert.equal(recorded.next.state.applicantProfile.answers[flow.question.id],undefined);
});
test('negation does not introduce a trip, job, person or document',()=>{
 for(const module of ['citizenship','asylum','residency'])for(const answer of ['No viajé y no tengo documentos.','I never traveled and I do not have a job.']){
  const options=clarificationOptions({module,locale:'es'},answer);assert.ok(options.every(q=>q.id==='CIT-006'||q.id==='CIT-005'));
 }
 assert.ok(bank.questions.every(q=>q.hypothetical===false));
 for(const q of bank.questions)for(const locale of ['es','en']){assert.equal((q[locale].match(/\?/g)||[]).length,1);assert.doesNotMatch(q[locale],/[{}]/);}
});
test('acknowledgment quotes current words without changing doubt or adverse facts',()=>{
 const answer='No recuerdo la fecha y no tenía permiso.';const e=evaluation(answer,'');
 assert.equal(interviewerAcknowledgment(e,answer,'es'),`Mencionaste: «${answer}».`);
 assert.equal(interviewerAcknowledgment({...e,evidence:['Invented']},answer,'es'),'');
 const q=clarificationOptions({module:'asylum',locale:'es'},answer)[0].text;
 assert.equal(clarificationIsGrounded({...e,suggested_follow_up:q},answer,{module:'asylum',locale:'es'}),true);
 assert.equal(clarificationIsGrounded({...e,evidence:['Other answer'],suggested_follow_up:q},answer,{module:'asylum',locale:'es'}),false);
});
test('evaluator rejects generic ungrounded feedback and off-bank personal followups',async()=>{
 const answer='Eso fue después.';const session={settings:{module:'asylum',locale:'es'},instructions:'Practice only',history:[]};
 for(const result of [{...evaluation(answer,''),evidence:[]},evaluation(answer,'¿Quién te amenazó?')]){
  const fetchImpl=async()=>Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(result)}]}]});
  await assert.rejects(InterviewResponseEvaluator(session,{env:{OPENAI_API_KEY:'test-only'},fetchImpl,answer,question:'¿Qué ocurrió?'}),/UNGROUNDED_EVALUATION/);
 }
});
test('evaluator request offers reviewed choices and keeps expression help out of officer speech',async()=>{
 const answer='Eso fue después.';const settings={module:'asylum',locale:'es'};const q=clarificationOptions(settings,answer)[0].text;let request;
 const fetchImpl=async(url,options)=>{request=JSON.parse(options.body);return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(evaluation(answer,q))}]}]});};
 await InterviewResponseEvaluator({settings,instructions:'Practice only',history:[]},{env:{OPENAI_API_KEY:'test-only'},fetchImpl,answer,question:'¿Qué ocurrió?'});
 assert.match(request.instructions,/NOT simulated officer speech/);assert.match(request.instructions,/adverse facts/);assert.equal(request.store,false);assert.ok(request.text.format.schema.properties.suggested_follow_up.enum.includes(q));
});
test('long-answer generic clarification needs a displayable complete quote',()=>{
 const answer='This is '+ 'a long statement '.repeat(30);
 assert.equal(clarificationOptions({module:'asylum',locale:'en'},answer).some(q=>q.id==='CIT-006'),false);
 const mixed='That was later. '+answer;
 const q=clarificationOptions({module:'asylum',locale:'en'},mixed).find(q=>q.id==='CIT-006').text;
 assert.equal(clarificationIsGrounded(evaluation(mixed,q),mixed,{module:'asylum',locale:'en'}),false);
 assert.equal(clarificationIsGrounded({...evaluation(mixed,q),evidence:['That was later.']},mixed,{module:'asylum',locale:'en'}),true);
});
test('cherry-picked substring inside a negated sentence is not admissible evidence',async()=>{
 const answer='I never said I had permission.';
 const fetchImpl=async()=>Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({...evaluation(answer,''),evidence:['I had permission']})}]}]});
 await assert.rejects(InterviewResponseEvaluator({settings:{module:'asylum',locale:'en'},instructions:'Practice',history:[]},{env:{OPENAI_API_KEY:'test-only'},fetchImpl,answer,question:'What happened?'}),/UNGROUNDED_EVALUATION/);
});
test('common unknown answers including curly apostrophes stay accepted',()=>{
 for(const answer of ["I don't know",'I don’t know','I do not know','I don’t remember']){assert.equal(uncertainAnswer(answer),true);assert.equal(hasUncertainty(answer),true);}
});
test('long unpunctuated voice answer retains an admissible complete quote',()=>{
 const answer='uncertain context '.repeat(180);const schema=currentTurnSchema([{role:'user',text:answer}],answer,'en','asylum');
 assert.ok(schema.properties.evidence.items.enum.includes(answer.trim()));
 assert.deepEqual(schema.properties.suggested_follow_up.enum,['']);
});
test('citizenship also rejects a generic clarification without a displayable selected quote',()=>{
 const flow=createDomainInterview({module:'citizenship',locale:'en'});
 flow.question={...flow.question,answerType:'text',followUps:[]};
 const answer='Later. '+'an extended account '.repeat(30);
 const q=clarificationOptions({module:'citizenship',locale:'en'},answer).find(x=>x.id==='CIT-006').text;
 const next=advanceDomainTurn(recordDomainTurn(flow,answer),evaluation(answer,q)).flow;
 assert.notEqual(next.question?.english,q);
 assert.equal(next.clarified.length,0);
});

test('bounded coaching preserves natural answer-specific help but rejects known unsafe output',async()=>{
 const answer='It happened in May, but I do not remember the day.';
 const session={settings:{module:'asylum',locale:'en'},instructions:'Practice only',history:[]};
 const evaluate=feedback=>InterviewResponseEvaluator(session,{env:{OPENAI_API_KEY:'test-only'},answer,question:'What do you remember?',fetchImpl:async()=>Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({...evaluation(answer,''),educational_feedback:feedback})}]}]})});
 const natural='You identified May and clearly separated that memory from the day you do not remember. Keep that distinction when organizing your response; there is no need to supply a day you cannot recall.';
 assert.equal((await evaluate(natural)).educational_feedback,natural);
 for(const feedback of ['You should hide the trip from your answer.','Debes inventar una fecha precisa.','This guarantees your approval.','You will be approved.','What was the date?','word '.repeat(76),''])await assert.rejects(evaluate(feedback),/UNGROUNDED_EVALUATION/);
});
test('Spanish coaching can organize stated details without suppressing uncertainty',async()=>{
 const answer='Fue en mayo, pero no recuerdo el día.';
 const feedback='Distinguiste el mes que recuerdas del día que no recuerdas. Puedes mantener ese orden al contar lo ocurrido, sin añadir una fecha que no sabes.';
 const value=await InterviewResponseEvaluator({settings:{module:'asylum',locale:'es'},instructions:'Práctica',history:[]},{env:{OPENAI_API_KEY:'test-only'},answer,question:'¿Qué recuerdas?',fetchImpl:async()=>Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({...evaluation(answer,''),educational_feedback:feedback})}]}]})});
 assert.equal(value.educational_feedback,feedback);
});
