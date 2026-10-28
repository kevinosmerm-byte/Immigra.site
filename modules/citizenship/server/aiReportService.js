import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
export const AI_REPORT_EVENT='ai_content_report';
const categories=new Set(['incorrect','legal_advice','offensive','privacy','other']);
const modules=new Set(['citizenship','asylum','residency','general']);
const invalid=()=>Object.assign(Error('Invalid report'),{status:400,code:'invalid_report'});
export function validateAiReport(body){
 if(!body||typeof body!=='object'||Array.isArray(body)||!categories.has(body.category)||!modules.has(body.module)||!/^[-0-9a-f]{36}$/i.test(body.reportId||''))throw invalid();
 if(typeof body.note!=='string'||body.note.length>1000||typeof body.responseExcerpt!=='string'||body.responseExcerpt.length>1200)throw invalid();
 if(body.responseExcerpt&&body.includeResponse!==true)throw invalid();
 if(!['es','en'].includes(body.locale))throw invalid();
 return {reportId:body.reportId,category:body.category,module:body.module,locale:body.locale,includeResponse:body.includeResponse===true,note:body.note.trim(),responseExcerpt:body.includeResponse===true?body.responseExcerpt.trim():''};
}
export function createAiReportStore({db,secret,now=Date.now}){
 const key=secret?createHash('sha256').update('immigra-ai-reports-v1:'+secret).digest():null;
 const available=()=>{if(!db||!key)throw Object.assign(Error('Report storage unavailable'),{status:503,code:'report_unavailable'});};
 const fail=error=>{if(error)throw Object.assign(Error('Report storage unavailable'),{status:503,code:'report_unavailable'});};
 const encrypt=value=>{const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from(AI_REPORT_EVENT));const encrypted=Buffer.concat([cipher.update(JSON.stringify(value)),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),encrypted]).toString('base64url');};
 const decrypt=value=>{const bytes=Buffer.from(value,'base64url'),decipher=createDecipheriv('aes-256-gcm',key,bytes.subarray(0,12));decipher.setAAD(Buffer.from(AI_REPORT_EVENT));decipher.setAuthTag(bytes.subarray(12,28));return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)),decipher.final()]).toString());};
 const pending=new Map();
 async function submit(userId,body){
  available();const report=validateAiReport(body);if(!userId)throw invalid();
  const id=userId+':'+report.reportId;if(pending.has(id))return pending.get(id);
  const work=(async()=>{
   const existing=await db.from('usage_events').select('id').eq('user_id',userId).eq('event_name',AI_REPORT_EVENT).contains('metadata',{reportId:report.reportId}).limit(1);fail(existing.error);
   if(!existing.data?.length){const {note,responseExcerpt,...metadata}=report;const result=await db.from('usage_events').insert({user_id:userId,event_name:AI_REPORT_EVENT,feature:report.module,metadata:{...metadata,version:1,encrypted:encrypt({note,responseExcerpt})},created_at:new Date(now()).toISOString()});fail(result.error);}
   return {reportId:report.reportId,received:true};
  })();pending.set(id,work);try{return await work;}finally{pending.delete(id);}
 }
 async function exportForUser(userId){
  available();const result=await db.from('usage_events').select('metadata,created_at').eq('user_id',userId).eq('event_name',AI_REPORT_EVENT).gte('created_at',new Date(now()-30*86400000).toISOString()).limit(100);fail(result.error);
  return (result.data||[]).map(row=>{const {encrypted,...metadata}=row.metadata;return {...metadata,...decrypt(encrypted),createdAt:row.created_at};});
 }
 async function removeForUser(userId){available();const result=await db.from('usage_events').delete().eq('user_id',userId).eq('event_name',AI_REPORT_EVENT);fail(result.error);}
 async function purge(){available();const result=await db.from('usage_events').delete().eq('event_name',AI_REPORT_EVENT).lt('created_at',new Date(now()-30*86400000).toISOString());fail(result.error);}
 return {submit,exportForUser,removeForUser,purge};
}
