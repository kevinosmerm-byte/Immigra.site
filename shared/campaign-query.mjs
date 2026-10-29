// Redirect attribution only. Never forward arbitrary form/story/email parameters.
// Campaign metadata must be URL-safe identifiers, not prose or contact details.
const campaignKeys=['utm_source','utm_medium','utm_campaign','utm_id','utm_content','utm_term','gclid','dclid','gbraid','wbraid'];
export function campaignQuery(searchParams){
 const result=new URLSearchParams();
 for(const key of campaignKeys){
  const values=searchParams.getAll(key);
  if(values.length!==1)continue;
  const value=values[0];
  if(/^[A-Za-z0-9][A-Za-z0-9._~-]{0,199}$/.test(value))result.set(key,value);
 }
 const query=result.toString();
 return query?'?'+query:'';
}
