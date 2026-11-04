// Practice-only continuity rules. A skip or uncertainty never supplies a fact.
export function explicitAnswer(value){
 const text=String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
 if(/^(si|yes)[.! ]*$/.test(text))return true;
 if(/^no[.! ]*$/.test(text))return false;
 return null;
}
export const aosPrerequisites={
 'AOS-077':{id:'AOS-076',answer:true},
 'AOS-128':{id:'AOS-127',answer:true},
 'AOS-130':{id:'AOS-127',answer:true},
 'AOS-144':{id:'AOS-141',answer:true},
 'AOS-157':{id:'AOS-152',answer:false},
 'AOS-236':{id:'AOS-207',answer:true},
};
export function applicableAosQuestion(question,answers={}){
 const gate=aosPrerequisites[question.id];
 return !gate||explicitAnswer(answers[gate.id])===gate.answer;
}
export function nextAosIndex(questions,index,answers={},skipTopic=false){
 const block=questions[index]?.bloque;
 let next=index+1;
 while(next<questions.length&&((skipTopic&&questions[next].bloque===block)||!applicableAosQuestion(questions[next],answers)))next++;
 return next;
}
export function isTopicSkipCommand(value=''){
 const text=String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/[.!?¿¡]/g,'').replace(/\s+/g,' ');
 return /^(?:(?:por favor|please) )?(?:omitir (?:este |el )?tema|saltar (?:este |el )?bloque|skip (?:this |the )?(?:topic|block))(?: (?:por favor|please))?$/.test(text);
}
