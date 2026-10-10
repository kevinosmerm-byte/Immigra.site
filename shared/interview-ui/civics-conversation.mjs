import {evaluateCivicsAnswer} from '../../modules/citizenship/src/civicsAnswerEvaluator.js';
import {normalizeEvaluation} from './evaluation-result.mjs';

// Audio transport adapter over the original evaluator and already resolved bank.
// No provider request, generated facts, or separate question dataset.
export function createCivicsConversation(questions,{locale='en',startIndex=0}={}){
  let index=startIndex;
  const results=new Map();
  const text=q=>q?.question||q?.english||'';
  const t=(en,es)=>locale==='es'?es:en;
  const turn=async ({answer='',turnId})=>{
    if(turnId&&results.has(turnId))return results.get(turnId);
    const question=questions[index];
    if(!question)throw Error('INTERVIEW_COMPLETE');
    if(!answer.trim())return {provider:'official-bank',question_id:String(question.questionId),next_question:text(question),suggested_follow_up:text(question),educational_feedback:''};
    const original=evaluateCivicsAnswer(question,answer);
    const normalized=normalizeEvaluation(original,'civics');
    const feedback=original.status==='correct'?t('Correct.','Correcto.'):
      original.status==='incomplete'?t(`Please give ${question.minimumAnswersRequired} different answers.`,`Da ${question.minimumAnswersRequired} respuestas distintas.`):
      original.status==='review'?t('This response was not graded. Review the applicable official answers.','Esta respuesta no se calificó. Revisa las respuestas oficiales aplicables.'):
      t('Review the official answer: ','Repasa la respuesta oficial: ')+(question.acceptedAnswers||[]).slice(0,question.minimumAnswersRequired).join('; ');
    if(original.status!=='incomplete')index++;
    const next=questions[index];
    const nextQuestion=text(next);
    const intervention=[feedback,nextQuestion||t('Practice is complete.','La práctica ha terminado.')].join(' ');
    const result={...normalized,original_status:original.status,provider:'official-bank',answer_status:normalized.status,educational_feedback:feedback,next_question:nextQuestion,suggested_follow_up:intervention,question_id:next?String(next.questionId):null,reviewed_question_id:question.questionId,completed:index,next_action:next?'continue':'finish',topic:question.category};
    if(turnId)results.set(turnId,result);
    return result;
  };
  turn.reset=()=>{index=startIndex;results.clear();};
  return turn;
}
