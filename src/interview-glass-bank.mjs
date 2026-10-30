// Normalize existing banks without rewriting questions, answers or translations.
export function glassQuestions(category,{civics,asylum,residency}){
 if(category==='citizenship')return civics.questions.map(q=>({id:String(q.id),en:q.question,es:q.spanish}));
 if(category==='asylum')return asylum.map(q=>({id:q.id,en:q.question_en,es:q.question_es})).filter(q=>q.en&&q.es);
 if(category==='residency'){
  const en=new Map(residency.filter(q=>q.locale==='en').map(q=>[q.id.replace(/-en$/,''),q.question]));
  return residency.filter(q=>q.locale==='es').map(q=>({id:q.id.replace(/-es$/,''),es:q.question,en:en.get(q.id.replace(/-es$/,''))})).filter(q=>q.en);
 }
 return [];
}
export const interviewRoutes=Object.freeze({citizenship:'citizenship/practice',asylum:'asylum/practice',residency:'residency'});
export const progressRoutes=Object.freeze({citizenship:'citizenship/progress',asylum:'asylum/practice-report',residency:'residency/study'});
export function glassIndex(index,delta,length){return Math.max(0,Math.min(Math.max(0,length-1),index+delta));}
