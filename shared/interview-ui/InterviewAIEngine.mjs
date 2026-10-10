import {logDiagnostic} from './diagnostics.mjs';
import {authenticatedFetch} from '../authentication/fetch.mjs';
export function AvatarConversationController(event){
 return ({'response.created':'thinking','input_audio_buffer.speech_started':'listening','input_audio_buffer.speech_stopped':'thinking','output_audio_buffer.started':'speaking','output_audio_buffer.stopped':'listening','output_audio_buffer.cleared':'listening'})[event]||null;
}
export function createInterviewAIEngine({env=globalThis,fetchImpl=authenticatedFetch,onState=()=>{},onCaption=()=>{},onEvaluation=()=>{},onError=()=>{},onDiagnostic=logDiagnostic}={}){
 let generation=0,session=null,pc=null,dc=null,stream=null,audio=null,abort=null,timer=null,deadline=null,paused=false,muted=true,settings=null,lastQuestion='',queue=Promise.resolve();
 const diagnostic=(phase,extra={})=>onDiagnostic(phase,{module:settings?.module,transport:settings?.transport,...extra});
 const report=code=>{diagnostic('INTERVIEW_ERROR',{code});onError(code);};
 const seen=new Set(),questionByItem=new Map();let failedReview=null;
 const send=value=>{if(dc?.readyState!=='open')return false;dc.send(JSON.stringify(value));return true;};
 async function json(path,body,method='POST',signal=abort?.signal){const r=await fetchImpl(path,{method,headers:{'content-type':'application/json'},body:body?JSON.stringify(body):undefined,signal});if(!r.ok){let data;try{data=await r.json();}catch{}throw Error(r.status===401?'AUTHENTICATION_REQUIRED':data?.error||'CONNECTION_FAILED');}return r.status===204?null:r.json();}
 function close(){generation++;abort?.abort();abort=null;clearTimeout(timer);clearTimeout(deadline);if(dc){dc.onopen=dc.onmessage=dc.onerror=dc.onclose=null;dc.close();dc=null;}if(pc){pc.ontrack=pc.onconnectionstatechange=null;pc.close();pc=null;}stream?.getTracks().forEach(t=>{t.onended=null;t.stop();});stream=null;if(audio){audio.onplaying=null;audio.pause();audio.srcObject=null;audio=null;}const old=session;session=null;if(old)void json('/api/interview/sessions/'+old.id,null,'DELETE',null).catch(()=>{});muted=true;paused=false;seen.clear();questionByItem.clear();failedReview=null;lastQuestion='';queue=Promise.resolve();onState('idle');}
 const fail=code=>{close();report(code);};
 const caption=c=>{if(c.id&&seen.has(c.who+c.id))return false;if(c.id)seen.add(c.who+c.id);onCaption(c);return true;};
 async function review(answer,question,token){
  if(token!==generation||!session)return;
  try{diagnostic('EVALUATION_REQUESTED');const result=await json('/api/interview/sessions/'+session.id+'/turn',{answer,question});if(token!==generation)return;failedReview=null;diagnostic('EVALUATION_COMPLETED');onEvaluation({answer,question,...result});if(settings.transport==='text'){lastQuestion=result.suggested_follow_up;caption({id:crypto.randomUUID(),who:'ai',text:lastQuestion});onState('listening');}}
  catch(error){if(token===generation){failedReview={answer,question,token};report(error.message);if(settings.transport==='text')onState('listening');}}
 }
 return {close,
 async start(next){
  if(next.consent!==true){onError('CONSENT_REQUIRED');return false;}
  close();settings=next;onError('');onState('connecting');const token=generation;abort=new AbortController();const signal=abort.signal;timer=setTimeout(()=>{if(token===generation)fail('CONNECTION_TIMEOUT');},45000);
  try{
   if(next.transport==='voice'){
    if(!env.RTCPeerConnection||!env.navigator?.mediaDevices?.getUserMedia)throw Error('VOICE_UNSUPPORTED');
    const acquired=await env.navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
    if(token!==generation){acquired.getTracks().forEach(t=>t.stop());return false;}stream=acquired;diagnostic('MIC_PERMISSION_GRANTED');if(!stream.getAudioTracks().length)throw Error('MICROPHONE_DISCONNECTED');
    muted=false;stream.getTracks().forEach(t=>t.onended=()=>{if(token===generation)fail('MICROPHONE_DISCONNECTED');});pc=new env.RTCPeerConnection();const peer=pc;
    stream.getTracks().forEach(t=>peer.addTrack(t,stream));audio=new env.Audio();audio.autoplay=true;audio.onplaying=()=>{if(token===generation)diagnostic('AI_AUDIO_PLAYING');};
    peer.ontrack=e=>{if(token!==generation)return;audio.srcObject=e.streams?.[0]||(env.MediaStream?new env.MediaStream([e.track]):null);if(!audio.srcObject){report('CONNECTION_FAILED');return;}audio.play().catch(()=>report('PLAYBACK_BLOCKED'));};
    peer.onconnectionstatechange=()=>{if(token===generation&&['failed','disconnected'].includes(peer.connectionState))fail('CONNECTION_LOST');};
    dc=peer.createDataChannel('oai-events');
    dc.onopen=()=>{if(token!==generation)return;clearTimeout(timer);diagnostic('REALTIME_CONNECTED');onState('listening');send({type:'response.create'});};
    dc.onmessage=e=>{
     if(token!==generation)return;let m;try{m=JSON.parse(e.data);}catch{return;}
     if(m.type==='session.created')diagnostic('OPENAI_SESSION_CREATED');
     if(m.type==='input_audio_buffer.speech_started'){diagnostic('MIC_AUDIO_CAPTURED');diagnostic('USER_AUDIO_RECEIVED');if(m.item_id)questionByItem.set(m.item_id,lastQuestion);}
     if(m.type==='input_audio_buffer.committed')diagnostic('USER_TURN_COMPLETED');
     const state=AvatarConversationController(m.type);if(state&&!paused)onState(state==='thinking'?'processing':state);
     if(m.type==='conversation.item.input_audio_transcription.completed'&&m.transcript){const answer=m.transcript.slice(0,5000),question=questionByItem.get(m.item_id)||lastQuestion;if(caption({who:'user',id:m.item_id,text:answer}))queue=queue.then(()=>review(answer,question,token));}
     if(m.type==='response.output_audio_transcript.done'&&m.transcript){diagnostic('AI_RESPONSE_RECEIVED');lastQuestion=m.transcript.slice(0,2000);caption({who:'ai',id:m.item_id||m.response_id,text:lastQuestion});}
     if(m.type==='conversation.item.input_audio_transcription.failed')report('TRANSCRIPTION_FAILED');
     if(m.type==='response.done'&&m.response?.status==='failed')report('PROVIDER_UNAVAILABLE');
     if(m.type==='error'&&!['response_cancel_not_active','input_audio_buffer_commit_empty'].includes(m.error?.code))report('PROVIDER_UNAVAILABLE');
    };
    dc.onerror=()=>{if(token===generation)fail('CONNECTION_LOST');};dc.onclose=()=>{if(token===generation)fail('CONNECTION_LOST');};
    const offer=await peer.createOffer();await peer.setLocalDescription(offer);
    const created=await json('/api/interview/sessions',{...next,sdp:offer.sdp},'POST',signal);
    if(token!==generation){void json('/api/interview/sessions/'+created.id,null,'DELETE',null).catch(()=>{});return false;}session=created;
    await peer.setRemoteDescription({type:'answer',sdp:session.sdp});
   }else{
    const created=await json('/api/interview/sessions',next,'POST',signal);if(token!==generation){void json('/api/interview/sessions/'+created.id,null,'DELETE',null).catch(()=>{});return false;}session=created;clearTimeout(timer);await review('','',token);
   }
   if(token!==generation)return false;deadline=setTimeout(()=>{if(token===generation)fail('SESSION_EXPIRED');},Math.max(0,session.expires_at-Date.now()));return true;
  }catch(error){if(token===generation)fail(error.name==='NotAllowedError'?'MICROPHONE_DENIED':error.message||'CONNECTION_FAILED');return false;}
 },
 sendText(text){if(!session||paused||!text.trim())return false;const answer=text.trim().slice(0,5000),token=generation;onError('');
  if(settings.transport==='voice'){send({type:'response.cancel'});send({type:'output_audio_buffer.clear'});if(!send({type:'conversation.item.create',item:{type:'message',role:'user',content:[{type:'input_text',text:answer}]}}))return false;send({type:'response.create'});}
  caption({who:'user',id:crypto.randomUUID(),text:answer});const question=lastQuestion;if(settings.transport==='text')onState('processing');queue=queue.then(()=>review(answer,question,token));return true;
 },
 retryEvaluation(){if(failedReview){const {answer,question,token}=failedReview;onError('');queue=queue.then(()=>review(answer,question,token));}},
 toggleMic(){muted=!muted;stream?.getAudioTracks().forEach(t=>t.enabled=!muted&&!paused);return muted;},
 pause(value){paused=value;stream?.getAudioTracks().forEach(t=>t.enabled=!muted&&!paused);if(audio)audio.muted=paused;if(paused){send({type:'response.cancel'});send({type:'output_audio_buffer.clear'});send({type:'input_audio_buffer.clear'});}onState(paused?'paused':'listening');},
 repeat(){if(paused)return;if(settings.transport==='text'){caption({who:'ai',id:crypto.randomUUID(),text:lastQuestion});return;}send({type:'response.cancel'});send({type:'output_audio_buffer.clear'});send({type:'response.create',response:{instructions:settings.locale==='es'?'Repite únicamente tu última pregunta, sin sugerir una respuesta.':'Repeat only your last question, without suggesting an answer.'}});},
 resumeAudio(){return audio?.play().then(()=>onError('')).catch(()=>onError('PLAYBACK_BLOCKED'));}
 };
}
