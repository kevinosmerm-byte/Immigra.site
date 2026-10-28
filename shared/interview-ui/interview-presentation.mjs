// Presentation only. Educational coaching never becomes simulated interviewer
// speech. Civics keeps its original deterministic correction sequence.
export function interviewerQuestion(result,locale='es'){
 let question=result.next_question||result.suggested_follow_up||'';
 if(result.educational_feedback&&question.startsWith(result.educational_feedback))question=question.slice(result.educational_feedback.length).trim();
 return question||(locale==='es'?'La práctica ha terminado. Puedes revisar tus respuestas.':'Practice is complete. You can review your answers.');
}
export function interventionParts(result,{domain='personal',answer='',locale='es'}={}){
 if(domain==='civics')return result.next_question
  ? [...(answer&&result.educational_feedback?[{text:result.educational_feedback,phase:'SPEAKING_FEEDBACK'}]:[]),{text:result.next_question,phase:answer?'SPEAKING_NEXT_QUESTION':'SPEAKING_QUESTION'}]
  : [{text:result.suggested_follow_up,phase:answer?'SPEAKING_FEEDBACK':'SPEAKING_QUESTION'}];
 const question=interviewerQuestion(result,locale);
 const acknowledgment=answer?result.interviewer_response||'':'';
 const text=[acknowledgment,question].filter(Boolean).join(' ')||(locale==='es'?'La práctica ha terminado. Puedes revisar tus respuestas.':'Practice is complete. You can review your answers.');
 return [{text,phase:answer?'SPEAKING_NEXT_QUESTION':'SPEAKING_QUESTION'}];
}

export function reviewedAnswers(turns,reviews){
 const byId=new Map(reviews.filter(r=>r.turnId).map(r=>[r.turnId,r]));
 return turns.filter(t=>t.who==='user'&&!t.command).map(turn=>({turn,review:byId.get(turn.turnId)}));
}
export function reviewFocus(reviews){
 const useful=reviews.filter(r=>r.educational_feedback&&r.status!=='evaluation_unavailable');
 return useful.findLast(r=>['incomplete','ambiguous','needs_clarification'].includes(r.status))||useful.at(-1)||null;
}
