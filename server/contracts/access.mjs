import {randomUUID} from 'node:crypto';
export function authorizeSession({userId,ownerId,engine='residency',entitled=false,consented=false}={}){
 return typeof userId==='string'&&userId.length>0&&userId===ownerId&&engine==='residency'&&entitled===true&&consented===true;
}
export function safeSessionId(){return randomUUID()}
export function redactForLogs(value){
 const s=String(value??'');
 return s.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,'[EMAIL]')
 .replace(/\b(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b/g,'[PHONE]')
 .replace(/\bA[- ]?\d{7,9}\b/gi,'[ALIEN_NUMBER]');
}
export function privacyReceipt({consented=false,locale='es',purposes=[]}={}){
 if(!consented)throw Error('Consent required');
 return {consented:true,locale,purposes:purposes.filter(x=>['audio_processing','document_analysis','comparison'].includes(x)),version:'draft-1',storedAudioByApp:false,providerRetention:'review_provider_terms'};
}
