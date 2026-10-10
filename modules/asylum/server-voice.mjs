import {authenticatedFetch,getSessionToken} from '../../shared/authentication/fetch.mjs';
let consent=false;
export function authorizeAsylumAudio(language){
 if(!getSessionToken()){window.location.hash='/account';return false;}
 if(!consent)consent=window.confirm(language==='es'?'Para conversar, enviaremos el audio de tus respuestas a nuestro servidor en Render y a OpenAI para transcribirlo. No guardamos el audio en la aplicación. ¿Autorizas el envío durante esta práctica?':'To converse, your answer audio will be sent to our Render server and OpenAI for transcription. The app does not save the audio. Allow this during this practice?');
 return consent;
}
export function resetAsylumAudioConsent(){consent=false;}
export class AsylumAudioRecognition{
 async start(){
  this.cancelled=false;this.stopping=false;this.chunks=[];this.controller=new AbortController();
  if(!consent){this.onerror?.({error:'consent-required'});return;}
  if(!getSessionToken()){this.onerror?.({error:'login-required'});return;}
  try{
   this.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
   if(this.cancelled){this.release();return;}
   const mime=['audio/webm','audio/mp4'].find(type=>MediaRecorder.isTypeSupported(type));
   this.recorder=new MediaRecorder(this.stream,mime?{mimeType:mime}:undefined);
   this.recorder.ondataavailable=e=>{if(e.data.size)this.chunks.push(e.data);};
   this.recorder.onstop=()=>this.send();
   this.recorder.onerror=()=>{this.abort();this.onerror?.({error:'audio-capture'});};
   this.context=new AudioContext();await this.context.resume();
   if(this.cancelled){this.release();return;}
   const analyser=this.context.createAnalyser();analyser.fftSize=2048;this.context.createMediaStreamSource(this.stream).connect(analyser);
   const samples=new Float32Array(analyser.fftSize);let lastVoice=Date.now();this.heard=false;
   this.recorder.start(250);this.onstart?.();
   this.poll=setInterval(()=>{analyser.getFloatTimeDomainData(samples);const rms=Math.sqrt(samples.reduce((sum,v)=>sum+v*v,0)/samples.length);this.onlevel?.(Math.min(1,rms*12));if(rms>.008){this.heard=true;lastVoice=Date.now();}if(this.heard&&Date.now()-lastVoice>3000)this.stop();},100);
   this.limit=setTimeout(()=>{if(this.heard)this.stop();else{this.abort();this.onerror?.({error:'no-speech'});}},60000);
  }catch(error){this.abort();this.onerror?.({error:error.name==='NotAllowedError'?'not-allowed':'audio-capture'});}
 }
 release(){clearInterval(this.poll);clearTimeout(this.limit);this.stream?.getTracks().forEach(t=>t.stop());this.context?.close().catch(()=>{});}
 stop(){if(this.stopping)return;this.stopping=true;if(this.recorder?.state==='recording')this.recorder.stop();this.release();}
 abort(){this.cancelled=true;this.controller?.abort();this.stop();}
 async send(){
  if(this.cancelled)return;
  if(!this.heard){this.onerror?.({error:'no-speech'});return;}
  try{
   this.onprocessing?.();
   const blob=new Blob(this.chunks,{type:this.recorder.mimeType||'audio/webm'});
   if(blob.size>8*1024*1024)throw Error('AUDIO_TOO_LARGE');
   const body=new FormData();body.append('audio',blob,blob.type.includes('mp4')?'answer.mp4':'answer.webm');body.append('language',this.lang?.startsWith('es')?'es':'en');
   const timeout=setTimeout(()=>this.controller.abort(),35000);
   let response;try{response=await authenticatedFetch('/api/asylum/transcribe',{method:'POST',headers:{'x-audio-consent':'asylum-audio-v1'},body,signal:this.controller.signal});}finally{clearTimeout(timeout);}
   if(this.cancelled)return;
   if(!response.ok){this.onerror?.({error:response.status===401?'login-required':response.status===429?'quota-exceeded':'transcription-failed'});return;}
   const {transcript}=await response.json();if(this.cancelled)return;
   if(transcript?.trim()){const result=[{transcript}];result.isFinal=true;this.onresult?.({resultIndex:0,results:[result]});}
   if(!transcript?.trim()){this.onerror?.({error:'no-speech'});return;}
   this.onend?.();
  }catch{if(!this.cancelled)this.onerror?.({error:'transcription-failed'});}
  finally{this.chunks=[];}
 }
}
