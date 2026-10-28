import test from 'node:test';
import assert from 'node:assert/strict';
import {interventionParts,reviewedAnswers,reviewFocus} from '../shared/interview-ui/interview-presentation.mjs';

test('personal interviewer voice and captions exclude educational coaching',()=>{
 const result={interviewer_response:'Mencionaste mayo.',educational_feedback:'Organiza tus fechas sin inventar detalles.',next_question:'¿Qué pasó después?',suggested_follow_up:'Organiza tus fechas sin inventar detalles. ¿Qué pasó después?'};
 const parts=interventionParts(result,{answer:'En mayo.',locale:'es'});
 assert.deepEqual(parts,[{text:'Mencionaste mayo. ¿Qué pasó después?',phase:'SPEAKING_NEXT_QUESTION'}]);
 assert.doesNotMatch(JSON.stringify(parts),/Organiza/);
});
test('legacy ending removes coaching without losing closing message',()=>{
 const result={educational_feedback:'Keep uncertainty.',suggested_follow_up:'Keep uncertainty. Practice is complete.'};
 assert.equal(interventionParts(result,{answer:'Maybe.',locale:'en'})[0].text,'Practice is complete.');
});
test('civics retains deterministic feedback before question',()=>{
 assert.deepEqual(interventionParts({educational_feedback:'Correct.',next_question:'Next?',suggested_follow_up:'Next?'},{answer:'The Constitution.',domain:'civics'}),[{text:'Correct.',phase:'SPEAKING_FEEDBACK'},{text:'Next?',phase:'SPEAKING_NEXT_QUESTION'}]);
});
test('identical answers retain their own question and feedback; commands excluded',()=>{
 const rows=reviewedAnswers([{who:'user',turnId:'a',text:'Sí'},{who:'user',turnId:'b',text:'Sí'},{who:'user',turnId:'skip',text:'Siguiente',command:true}], [{turnId:'a',question:'Primera?',educational_feedback:'Primera revisión'},{turnId:'b',question:'Segunda?',educational_feedback:'Segunda revisión'}]);
 assert.equal(rows.length,2);assert.equal(rows[1].review.question,'Segunda?');assert.equal(rows[0].review.educational_feedback,'Primera revisión');
 assert.equal(reviewedAnswers([{who:'user',turnId:'missing',text:'Sí'}],[{turnId:'a',answer:'Sí'}])[0].review,undefined);
});
test('recap selects an actual recent clarity review, not inferred truth or approval',()=>{
 const reviews=[{status:'incomplete',question:'When?',educational_feedback:'Preserve your approximate date.'},{status:'adequate',question:'Where?',educational_feedback:'You named the place.'}];
 assert.equal(reviewFocus(reviews),reviews[0]);assert.equal(reviewFocus([]),null);
});
