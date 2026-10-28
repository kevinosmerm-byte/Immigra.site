import {handle} from '../../modules/asylum/services/analysis/worker.mjs';
// Only validated verbatim excerpts enter the scheduler. They remain unconfirmed
// document statements, never facts added to the person's profile.
export async function sourcePracticeQuestions(settings,{env,fetchImpl,reserveQuota}) {
  const request=new Request('https://internal/api/analyze',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:settings.context,source_id:'session-document',domain:settings.mode==='fictional'?'synthetic':'personal',language:settings.locale,consent:true,consent_version:'ai-excerpts-v1'})});
  let quotaDenied=false;
  const response=await handle(request,{AI_ENABLED:'true',OPENAI_API_KEY:env.OPENAI_API_KEY,OPENAI_MODEL:env.OPENAI_TEXT_MODEL||'gpt-4o-mini'},async(...args)=>{if(!await reserveQuota()){quotaDenied=true;throw Error('DAILY_LIMIT');}return fetchImpl(...args);},{authorized:true});
  if(quotaDenied)throw Error('DAILY_LIMIT');
  if(!response.ok)throw Error('PROVIDER_UNAVAILABLE');
  const {excerpts}=await response.json();
  const unique=[];
  for(const item of excerpts){
    if(item.quote.length>400||unique.some(x=>x.quote.includes(item.quote)||item.quote.includes(x.quote)))continue;
    unique.push(item);if(unique.length===6)break;
  }
  const prompts=settings.locale==='es'?{
    date:'¿Qué recuerdas sobre cuándo ocurrió lo descrito en este fragmento?',
    place:'¿Qué puedes explicar sobre el lugar mencionado en este fragmento?',
    event:'¿Cómo explicarías con tus palabras lo descrito en este fragmento?',
    uncertainty:'¿Qué parte de este fragmento recuerdas y qué necesitarías revisar?'
  }:{date:'What do you remember about when the event in this excerpt happened?',place:'What can you explain about the place mentioned in this excerpt?',event:'How would you describe this excerpt in your own words?',uncertainty:'Which part of this excerpt do you remember and what would you need to check?'};
  return unique.map((item,i)=>({id:`AS-DOC-${i+1}`,concept:`AS-DOC-${i+1}`,block:`document-${item.category}`,subBlock:'document',canonicalPracticePrompt:`${settings.locale==='es'?'El documento dice':'The document says'}: «${item.quote}». ${prompts[item.category]}`,answerType:'text',followUps:[],sourceRefs:['session-document']}));
}
