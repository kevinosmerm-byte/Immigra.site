// Web Speech does not expose gender. Prefer recognized feminine voice names in the selected language.
export function selectSaharaVoice(voices,locale='es'){
 const names=locale==='es'?/\b(sabina|helena|elvira|dalia|paulina|monica|mónica|conchita|lucia|lucía|laura|catalina|paloma|female)\b/i:/\b(zira|samantha|jenny|aria|ava|emma|michelle|susan|salli|joanna|karen|moira|tessa|victoria|female)\b/i;
 return voices.filter(v=>v.lang?.toLowerCase().startsWith(locale+'-')||v.lang?.toLowerCase()===locale).filter(v=>names.test(v.name)).sort((a,b)=>Number(b.localService)-Number(a.localService))[0]||null;
}
// Web Speech enhancement. No API keys, recorder, storage, or remote client library.
export function speechSupport(env=globalThis){return {recognition:!!(env.SpeechRecognition||env.webkitSpeechRecognition),synthesis:!!(env.speechSynthesis&&env.SpeechSynthesisUtterance),secure:env.isSecureContext!==false};}
export function videoForState(state){return state==='speaking'?'speaking':'listening';}
export function createVoiceController({env=globalThis,onState=()=>{},onTranscript=()=>{},onInterim=()=>{},onError=()=>{}}={}){
 let recognition=null,utterance=null,generation=0,disposed=false,state='idle',voiceWaitCleanup=null;
 const emit=value=>{state=value;if(!disposed)onState(value);};
 function cancel(){generation++;voiceWaitCleanup?.();voiceWaitCleanup=null;if(recognition){const old=recognition;recognition=null;old.onresult=old.onerror=old.onend=old.onstart=null;try{old.abort();}catch{}}if(utterance){utterance.onend=utterance.onerror=utterance.onstart=null;utterance=null;env.speechSynthesis?.cancel();}if(!disposed){onInterim('');emit('idle');}}
 function fail(code){if(disposed)return;emit('error');onError(code);}
 return {
  support:()=>speechSupport(env),
  state:()=>state,
  cancel,
  listen({locale='es',consent=false}={}){
   if(disposed)return false;cancel();
   if(!consent){fail('consent-required');return false;}
   const support=speechSupport(env);if(!support.secure){fail('insecure-context');return false;}if(!support.recognition){fail('recognition-unavailable');return false;}
   const Constructor=env.SpeechRecognition||env.webkitSpeechRecognition;
   const token=generation;let finalSent=false,failed=false,finalBuffer='';
   try{
    const rec=new Constructor();recognition=rec;rec.lang=locale==='es'?'es-US':'en-US';rec.continuous=false;rec.interimResults=true;rec.maxAlternatives=1;
    rec.onstart=()=>{if(generation===token&&!disposed)emit('listening');};
    rec.onresult=e=>{if(generation!==token||disposed||finalSent)return;
     let finalText='',interim='';for(let i=0;i<e.results.length;i++){const r=e.results[i];if(r.isFinal)finalText+=r[0].transcript+' ';else interim+=r[0].transcript+' ';}
     finalBuffer=finalText.trim().slice(0,5000);onInterim((finalText+interim).trim().slice(0,5000));
     if(finalText.trim()&&!interim.trim()){finalSent=true;onTranscript(finalText.trim().slice(0,5000));onInterim('');emit('processing');try{rec.stop();}catch{emit('idle');}}
    };
    rec.onerror=e=>{if(generation!==token||disposed)return;failed=true;cancel();fail(e.error||'speech-error');};
    rec.onend=()=>{if(generation!==token||disposed)return;recognition=null;if(!failed){if(!finalSent&&finalBuffer){finalSent=true;onTranscript(finalBuffer);onInterim('');}if(!finalSent)fail('no-speech');else emit('idle');}};
    emit('requesting');rec.start();return true;
   }catch{cancel();fail('speech-error');return false;}
  },
  stopListening(){if(!disposed&&recognition){emit('processing');try{recognition.stop();}catch{cancel();}}},
  speak(text,locale='es'){
   if(disposed)return false;cancel();if(!speechSupport(env).synthesis){fail('tts-unavailable');return false;}
   const token=generation;
   const launch=voice=>{
    if(generation!==token||disposed)return;
    try{const u=new env.SpeechSynthesisUtterance(text);utterance=u;u.voice=voice;u.lang=voice.lang;u.rate=.94;
     u.onstart=()=>{if(generation===token&&!disposed)emit('speaking');};
     u.onend=()=>{if(generation===token&&!disposed){utterance=null;emit('idle');}};
     u.onerror=e=>{if(generation===token&&!disposed){utterance=null;fail(e.error||'tts-error');}};
     // Keep the listening video while speech is queued; onstart switches to speaking.
     emit('loading');env.speechSynthesis.speak(u);
    }catch{cancel();fail('tts-error');}
   };
   const chosen=selectSaharaVoice(env.speechSynthesis.getVoices?.()||[],locale);
   if(chosen){launch(chosen);return true;}
   // Some browsers populate voices asynchronously. Never fall back to a masculine default.
   emit('loading');
   let timer;
   const cleanup=()=>{clearTimeout(timer);env.speechSynthesis.removeEventListener?.('voiceschanged',ready);};
   const ready=()=>{const voice=selectSaharaVoice(env.speechSynthesis.getVoices?.()||[],locale);if(voice){cleanup();voiceWaitCleanup=null;launch(voice);}};
   voiceWaitCleanup=cleanup;
   env.speechSynthesis.addEventListener?.('voiceschanged',ready);
   timer=setTimeout(()=>{cleanup();voiceWaitCleanup=null;if(generation===token&&!disposed)fail('female-voice-unavailable');},1500);
   return true;
  },
  dispose(){cancel();disposed=true;}
 };
}
