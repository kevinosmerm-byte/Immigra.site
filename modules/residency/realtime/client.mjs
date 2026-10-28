// Browser transport only. Permanent credentials never enter this module.
export function createRealtimeClient({env=globalThis,fetchImpl=fetch,onState=()=>{},onCaption=()=>{},onError=()=>{},onClear=()=>{}}={}){
 let generation=0,pc=null,dc=null,stream=null,audio=null,abort=null,timer=null,lifeTimer=null,muted=false,paused=false;
 function stop(){generation++;abort?.abort();abort=null;clearTimeout(timer);clearTimeout(lifeTimer);timer=lifeTimer=null;
  if(dc){dc.onopen=dc.onmessage=dc.onerror=dc.onclose=null;try{dc.close();}catch{}dc=null;}
  if(pc){pc.ontrack=pc.onconnectionstatechange=null;try{pc.close();}catch{}pc=null;}
  stream?.getTracks().forEach(t=>{t.onended=null;t.stop();});stream=null;
  if(audio){audio.pause();audio.srcObject=null;audio=null;}muted=false;paused=false;onState('idle');onClear();
 }
 function fail(code){stop();onError(code);}
 function send(message){if(dc?.readyState==='open'){dc.send(JSON.stringify(message));return true;}return false;}
 return {
  stop,
  async start(settings,alreadyStopped=false,{startMuted=false}={}){
   if(!alreadyStopped)stop();onError('');if(settings.consent!==true){onError('consent-required');return false;}
   if(!env.RTCPeerConnection||!env.navigator?.mediaDevices?.getUserMedia){onError('unsupported');return false;}
   let captionChars=0;const captionIds=new Set();
   const deliver=caption=>{const key=caption.id?caption.who+':'+caption.id:null;if(key&&captionIds.has(key))return;if(captionIds.size>=150||captionChars+caption.text.length>200000){fail('transcript-limit');return;}captionIds.add(key||Symbol());captionChars+=caption.text.length;onCaption(caption);};
   const token=generation;const alive=()=>token===generation;abort=new AbortController();const signal=abort.signal;
   onState('connecting');timer=setTimeout(()=>{if(alive())fail('timeout');},45000);
   try{
    const status=await fetchImpl('/api/realtime/status',{signal});if(!alive())return false;
    if(!status.ok||!(await status.json()).ready)throw Error('not-configured');if(!alive())return false;
    const mic=await env.navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
    if(!alive()){mic.getTracks().forEach(t=>t.stop());return false;}stream=mic;muted=startMuted;mic.getAudioTracks().forEach(track=>{track.enabled=!muted;});
    mic.getTracks().forEach(t=>t.onended=()=>{if(alive())fail('microphone-ended');});
    const response=await fetchImpl('/api/realtime/session',{method:'POST',headers:{'Content-Type':'application/json','X-Immigration-Client':'local-demo'},body:JSON.stringify(settings),signal});
    if(!alive())return false;if(!response.ok)throw Error(response.status===429?'rate-limit':'session-unavailable');
    const secret=await response.json();if(!alive())return false;if(!secret.client_secret?.startsWith('ek_'))throw Error('session-unavailable');
    pc=new env.RTCPeerConnection();const peer=pc;mic.getTracks().forEach(track=>peer.addTrack(track,mic));audio=new env.Audio();audio.autoplay=true;
    peer.ontrack=e=>{if(!alive())return;audio.srcObject=e.streams[0];audio.play().catch(()=>{if(alive())onError('playback-blocked');});};
    peer.onconnectionstatechange=()=>{if(alive()&&['failed','disconnected','closed'].includes(peer.connectionState))fail('disconnected');};
    dc=peer.createDataChannel('oai-events');
    dc.onopen=()=>{if(!alive())return;clearTimeout(timer);onState('listening');lifeTimer=setTimeout(()=>{if(alive())fail('time-limit');},Math.min(secret.max_duration_seconds||600,600)*1000);send({type:'response.create',response:{instructions:settings.locale==='es'?'Preséntate como Sahara, asistente de IA para práctica educativa, y haz una pregunta acorde al modo y parentesco configurados.':'Introduce yourself as Sahara, an AI educational practice assistant, and ask one question consistent with the configured mode and relationship.'}});};
    dc.onmessage=e=>{if(!alive())return;let m;try{m=JSON.parse(e.data);}catch{return;}
     if(m.type==='response.created'&&!paused)onState('processing');
     if(m.type==='output_audio_buffer.started'){if(paused){send({type:'response.cancel'});send({type:'output_audio_buffer.clear'});}else onState('speaking');}
     if(!paused&&['output_audio_buffer.stopped','output_audio_buffer.cleared','input_audio_buffer.speech_started'].includes(m.type))onState('listening');
     if(m.type==='conversation.item.input_audio_transcription.completed'&&m.transcript)deliver({id:m.item_id,who:'user',text:m.transcript.slice(0,5000)});
     if(m.type==='response.output_audio_transcript.done'&&m.transcript)deliver({id:m.item_id||m.response_id,who:'ai',text:m.transcript.slice(0,5000)});
     if(m.type==='error'&&m.error?.code!=='response_cancel_not_active')fail('provider-error');
    };
    dc.onerror=()=>{if(alive())fail('disconnected');};dc.onclose=()=>{if(alive())fail('disconnected');};
    const offer=await peer.createOffer();if(!alive())return false;await peer.setLocalDescription(offer);if(!alive())return false;
    const result=await fetchImpl('https://api.openai.com/v1/realtime/calls',{method:'POST',headers:{Authorization:`Bearer ${secret.client_secret}`,'Content-Type':'application/sdp'},body:offer.sdp,signal});
    if(!alive())return false;if(!result.ok)throw Error('negotiation-failed');const sdp=await result.text();if(!alive())return false;
    await peer.setRemoteDescription({type:'answer',sdp});return alive();
   }catch(e){if(alive())fail(e.name==='NotAllowedError'?'permission-denied':['not-configured','rate-limit','session-unavailable','negotiation-failed'].includes(e.message)?e.message:'connection-failed');return false;}
  },
  sendText(text){if(paused||!String(text||"").trim())return false;const sent=send({type:"conversation.item.create",item:{type:"message",role:"user",content:[{type:"input_text",text:String(text).trim().slice(0,5000)}]}});if(sent){onCaption({id:"typed-"+Date.now(),who:"user",text:String(text).trim().slice(0,5000)});send({type:"response.create"});}return sent;},
  toggleMic(){muted=!muted;stream?.getAudioTracks().forEach(t=>t.enabled=!muted&&!paused);return muted;},
  setPaused(value){paused=value===true;stream?.getAudioTracks().forEach(t=>t.enabled=!muted&&!paused);if(audio)audio.muted=paused;if(paused){send({type:'response.cancel'});send({type:'output_audio_buffer.clear'});send({type:'input_audio_buffer.clear'});}onState(paused?'paused':'listening');return paused;},
  interrupt(){send({type:'response.cancel'});send({type:'output_audio_buffer.clear'});},
  repeat(locale){if(paused)return;send({type:'response.cancel'});send({type:'output_audio_buffer.clear'});send({type:'response.create',response:{instructions:locale==='es'?'Repite la última pregunta sin sugerir respuestas.':'Repeat the last question without suggesting answers.'}});},
  resumeAudio(){return audio?.play()?.catch(()=>onError('playback-blocked'));}
 };
}
