import {createMemory,recordClaim} from './memory.mjs';
import {extractStatements} from '../analysis/facts.mjs';
// Only explicitly reviewed text enters claim memory. Certainty describes wording, not truth.
export function memoryFromReviewed(record){
 if(record?.engine!=='residency'||record.reviewed!==true)throw Error('Reviewed residency transcript required');
 let m=createMemory({sessionId:record.createdAt,locale:record.locale});
 for(const s of extractStatements(record.turns))m=recordClaim(m,{topic:s.topic==='general'?'relationship':s.topic,statement:s.answer,source:record.mode==='fictional'?'fictional':'applicant',certainty:s.uncertain?'uncertain':'unverified',questionId:s.questionIndex===null?null:s.question.toLowerCase().replace(/[¿?!.]/g,'').trim(),turnIndex:s.turnIndex});
 return {...m,mode:record.mode};
}
