// Opt-in production smoke check. Uses fictional text, never real personal data or keys.
// node scripts/verify-public-interviews.mjs https://immigra.site
const base=process.argv[2];
if(!['https://immigra.site','https://immigration-ai-e590.onrender.com'].includes(base))throw Error('Specify the authorized production origin');
let cookie='';
const request=async(path,body,method='POST')=>{
 const response=await fetch(base+path,{method,headers:{'content-type':'application/json',origin:base,...(cookie?{cookie}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(45000)});
 if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];
 const value=response.status===204?null:await response.json();
 if(!response.ok)throw Error('HTTP '+response.status+' '+value?.error);
 return value;
};
const examples={citizenship:['This is fictional practice. I worked in a bakery for three years.','Please ask a follow-up about the work I just mentioned.'],asylum:['This is a fictional story. In May 2022 I received a threat at my bakery. I left the town in June 2022.','Please ask a neutral clarification about the place I mentioned.'],residency:['This is fictional practice. My adult US citizen daughter filed the petition for me, her father.','Please ask the next question based on the family relationship I just described.']};
for(const [module,answers] of Object.entries(examples)){
 let session;
 try{
  session=await request('/api/interview/sessions',{module,locale:'en',avatar:module==='asylum'?'kevin':'sahara',mode:'fictional',route:module==='residency'?'HIJO_A_PADRES':'MATRIMONIO',transport:'text',consent:true});
  let result=await request('/api/interview/sessions/'+session.id+'/turn',{answer:'',question:''});
  for(const answer of answers)result=await request('/api/interview/sessions/'+session.id+'/turn',{answer,question:result.suggested_follow_up});
  console.log(JSON.stringify({module,realProvider:result.provider==='OpenAI',evaluation:result.answer_status,hasFeedback:Boolean(result.educational_feedback),hasFollowUp:Boolean(result.suggested_follow_up),contextReference:(module==='residency'?/daughter|father|parent|child|petition/i:/bakery|work|threat|town|place/i).test(result.suggested_follow_up)}));
 }catch(error){console.log(JSON.stringify({module,error:error.message}));process.exitCode=1;}
 finally{if(session)await request('/api/interview/sessions/'+session.id,null,'DELETE').catch(()=>{process.exitCode=1;});}
}
