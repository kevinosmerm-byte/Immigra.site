const memory=new Map();
const key=(user,topic)=>'immigra.reviewed.v1:'+String(user||'guest')+':'+topic;
const browserStorage=storage=>{if(storage)return storage;try{return globalThis.localStorage;}catch{return null;}};
const safe=id=>typeof id==='string'&&/^[A-Za-z0-9_.:-]{1,100}$/.test(id)&&!/^(source|AS-DOC-)/i.test(id);
export function readQuestionMemory(user,topic,storage){
 const k=key(user,topic);try{storage=browserStorage(storage);if(!storage)return memory.get(k)||[];const ids=JSON.parse(storage?.getItem(k)||'[]');return Array.isArray(ids)?ids.filter(safe).slice(-1000):[];}catch{return memory.get(k)||[];}
}
export function rememberQuestion(user,topic,id,storage){
 if(!safe(id))return;const k=key(user,topic),ids=[...new Set([...readQuestionMemory(user,topic,storage),id])].slice(-1000);memory.set(k,ids);try{browserStorage(storage)?.setItem(k,JSON.stringify(ids));}catch{}
}
globalThis.addEventListener?.('citizenshipai:local-data-cleared',()=>memory.clear());
