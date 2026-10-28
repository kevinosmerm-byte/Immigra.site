export const INTERVIEWERS = [{id:"sarah",name:"Sahara"},{id:"kevin",name:"Kevin"},{id:"william",name:"William"}];
export function interviewerLabel(name){return INTERVIEWERS.find(x=>x.id===String(name).toLowerCase()||x.name.toLowerCase()===String(name).toLowerCase())?.name||"Sahara";}
export function interviewerMediaBase(name,requestedBase,baseUrl='/'){
 if(/^william$/i.test(name))return `${baseUrl}interviewer/william-20261014/`;
 if(/^kevin$/i.test(name))return `${baseUrl}interviewer/kevin-20261014/`;
 return /^(sarah|sahara)$/i.test(name)?`${baseUrl}interviewer/`:requestedBase||`${baseUrl}interviewer/`;
}
