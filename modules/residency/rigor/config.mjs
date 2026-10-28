export const LEVELS=Object.freeze(['normal','rigorous','pressure']);
export function validateLevel(level){if(!LEVELS.includes(level))throw new Error('Invalid interview intensity');return level}
export function levelName(level,locale='es'){validateLevel(level);const names={normal:['Normal','Normal'],rigorous:['Rigurosa','Rigorous'],pressure:['Bajo presión','Under pressure']};return names[level][locale==='es'?0:1]}
export const FOLLOW_UP_CATEGORIES=Object.freeze(['chronology','cohabitation','relationship','finance','family','travel','documents']);
export function chooseFollowUp({answer='',previous=[],topic='chronology',level='normal',locale='es'}){
 validateLevel(level);
 const es=locale==='es';const words=answer.trim().split(/\s+/).filter(Boolean);
 if(/\b(no recuerdo|no me acuerdo|no s[eé]|don't remember|do not remember|not sure|skip|omitir|prefiero no responder)\b/i.test(answer))return es?'Está bien. Puede dejarlo sin precisar u omitir esta pregunta.':'That is okay. You may leave it uncertain or skip this question.';
 if(!answer.trim())return es?'¿Podría responder la pregunta con sus propias palabras?':'Could you answer the question in your own words?';
 if(words.length<5)return es?'¿Podría explicar un poco más qué ocurrió?':'Could you explain a little more about what happened?';
 if(level==='normal')return es?'¿Hay algún detalle adicional que considere importante?':'Is there any additional detail you consider important?';
 if(topic==='chronology')return es?'Explique la secuencia de acontecimientos y cómo recuerda las fechas.':'Explain the sequence of events and how you remember the dates.';
 if(topic==='cohabitation')return es?'Describa cómo se organizaban para convivir durante ese período.':'Describe how you arranged living together during that period.';
 return es?'¿Qué hechos concretos le permiten recordar ese acontecimiento?':'What concrete details help you remember that event?';
}
