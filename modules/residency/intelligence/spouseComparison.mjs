// Explicit same-question comparison. No inference from wording differences.
export function compareSpouseAnswers(a,b,{consentA=false,consentB=false,shareResults=false}={}){
 if(consentA!==true||consentB!==true||shareResults!==true)throw Error('Both participants and shared results require consent');
 if(a?.engine!=='residency'||b?.engine!=='residency')throw Error('Wrong engine');
 const read=r=>{if(!Array.isArray(r.answers)||r.answers.length>100)throw Error('Invalid answers');const m=new Map();for(const x of r.answers){if(typeof x.questionId!=='string'||!x.questionId.trim()||typeof x.answer!=='string'||x.answer.length>5000||m.has(x.questionId))throw Error('Invalid or duplicate question');m.set(x.questionId,x.answer.trim());}return m;};
 const left=read(a),right=read(b);return [...left].filter(([k,v])=>right.has(k)&&v&&right.get(k)).map(([questionId,answerA])=>({questionId,answerA,answerB:right.get(questionId),comparison:answerA.toLowerCase()===right.get(questionId).toLowerCase()?'same_wording':'needs_contextual_review',verified:false}));
}
