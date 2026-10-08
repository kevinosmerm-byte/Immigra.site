// Deterministic local observations. Never evaluates credibility or legal outcomes.
const uncertain=/\b(no recuerdo|no me acuerdo|no s[eé]|quiz[aá]s|aproximad[ao]|tal vez|i don't remember|i do not remember|i don't know|maybe|approximately|not sure)\b/i;
export function analyzeInterview({session,locale='es'}={}){
 if(!['es','en'].includes(locale)||session?.engine_id!=='residency'||!session.finished||!Array.isArray(session.responses))throw Error('Invalid completed residency session');
 const es=locale==='es',items=[],groups=new Map();
 const responses=session.responses.filter(r=>!r.skipped).map((r,i)=>({reference:`R${i+1}`,question:r.question,text:r.text,clarification:r.clarification||'',topic:r.category,locale:r.locale}));
 for(const r of responses){
  const text=[r.text,r.clarification].filter(Boolean).join('\n');
  const evidence={reference:r.reference,question:r.question,quote:text};
  if(text.trim().length<12)items.push({kind:'short_answer',detail:es?'Respuesta breve; puede ampliarse voluntariamente si la pregunta lo requiere.':'Brief answer; may be expanded voluntarily if the question calls for it.',evidence:[evidence]});
  if(uncertain.test(text))items.push({kind:'uncertain',detail:es?'Se expresó incertidumbre. Es válido no recordar; no implica contradicción.':'Uncertainty was expressed. It is valid not to remember; this does not imply a contradiction.',evidence:[evidence]});
  const years=[...new Set(text.match(/\b(?:19|20)\d{2}\b/g)||[])];
  if(years.length===1&&['wedding','household','travel'].includes(r.topic)){const group=groups.get(r.topic)||[];group.push({...evidence,year:years[0]});groups.set(r.topic,group);}
 }
 for(const records of groups.values())if(new Set(records.map(r=>r.year)).size>1)items.push({kind:'timeline_review',detail:es?'Años distintos dentro de un tema amplio: podrían corresponder a eventos diferentes. Revisa las preguntas y aclaraciones antes de interpretar.':'Different years within a broad topic may describe separate events. Review the questions and clarifications before interpreting.',evidence:records});
 return {schemaVersion:1,engine_id:'residency',locale,mode:session.mode,answered:responses.length,skipped:session.responses.filter(r=>r.skipped).length,responses,items,followups:(session.followups||[]).map((r,i)=>({reference:`A${i+1}`,question:r['prompt_'+locale],quote:r.skipped?(es?'Omitida':'Skipped'):r.text})),disclaimer:es?'Análisis educativo automático mediante reglas simples. No determina credibilidad, fraude, elegibilidad ni resultado migratorio.':'Automated educational analysis using simple rules. Does not determine credibility, fraud, eligibility or immigration outcome.'};
}
export function reportAsText(r){const es=r.locale==='es';return [es?'INFORME DE PRÁCTICA — RESIDENCIA':'PRACTICE REPORT — RESIDENCY',r.mode==='fictional'?(es?'CASO FICTICIO — no representa historia personal':'FICTIONAL CASE — not personal history'):(es?'PRÁCTICA PERSONAL':'PERSONAL PRACTICE'),r.disclaimer,`${es?'Respuestas analizadas':'Answers reviewed'}: ${r.answered}`, ...r.items.flatMap(x=>['',x.detail,...x.evidence.map(e=>`[${e.reference}] ${e.question}\n${e.quote}`)]),'',es?'RESPUESTAS Y AMPLIACIONES DECLARADAS':'STATED ANSWERS AND EXPANSIONS',...r.responses.map(x=>`[${x.reference}] ${x.question}\n${x.text}${x.clarification?'\n'+x.clarification:''}`),'',es?'ACLARACIONES POSTERIORES (sin evaluación automática)':'LATER CLARIFICATIONS (not automatically evaluated)',...r.followups.map(x=>`[${x.reference}] ${x.question}\n${x.quote}`)].join('\n');}
