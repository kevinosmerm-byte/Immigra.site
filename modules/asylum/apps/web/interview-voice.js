(function(){
 'use strict';
 let dispose=()=>{},pause=()=>{};
 window.AsiloVoice={stop(){pause();},mount(config){
  dispose();if(!config)return;
  const answer=document.getElementById('master-answer'),status=document.getElementById('voice-status');if(!answer||!status)return;
  const en=config.language==='en',Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  let dead=false,recognizer=null,timer=null,speaking=false,readTimer=null,generation=0;
  const say=(es,english)=>{if(!dead)status.textContent=en?english:es;};
  const stopMic=()=>{clearTimeout(timer);if(recognizer){const old=recognizer;recognizer=null;old.onend=null;old.onresult=null;old.onerror=null;try{old.abort();}catch{}}document.getElementById('mic-start')?.setAttribute('aria-pressed','false');};
  const stop=()=>{generation++;clearTimeout(readTimer);speaking=false;window.speechSynthesis?.cancel();stopMic();config.video(false);};
  const listen=()=>{
   if(dead)return;stop();
   if(!config.microphone){say('El micrófono no fue autorizado al iniciar. Puedes escribir o iniciar una nueva práctica con voz.','Microphone was not enabled at the start. Type or start a new voice practice.');return;}
   if(!Recognition){say('Este navegador no admite dictado. Abre la práctica en un navegador compatible o escribe tu respuesta.','Speech recognition is unavailable in this browser. Use a compatible browser or type your answer.');return;}
   const r=new Recognition();recognizer=r;r.lang=en?'en-US':'es-ES';r.continuous=true;r.interimResults=true;
   r.onstart=()=>{if(dead||recognizer!==r)return;say('Micrófono activo. Habla; después detén y revisa la transcripción.','Microphone on. Speak, then stop and review the transcript.');document.getElementById('mic-start')?.setAttribute('aria-pressed','true');};
   r.onresult=e=>{if(dead||recognizer!==r)return;let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const result=e.results[i];if(result.isFinal){answer.value=(answer.value.trim()+' '+result[0].transcript).trim().slice(0,10000);answer.dispatchEvent(new Event('input',{bubbles:true}));}else interim+=result[0].transcript;}say(interim?'Escuchando: '+interim:'Micrófono activo…',interim?'Listening: '+interim:'Microphone on…');};
   r.onerror=e=>{if(dead||recognizer!==r)return;stopMic();const denied=['not-allowed','service-not-allowed'].includes(e.error);say(denied?'Permiso de micrófono denegado. Habilítalo en el navegador o escribe tu respuesta.':'El dictado no está disponible ahora. Puedes reintentar o escribir; tu texto se conserva.',denied?'Microphone permission denied. Enable it in your browser or type.':'Speech recognition is unavailable. Retry or type; your text is preserved.');};
   r.onend=()=>{if(dead||recognizer!==r)return;recognizer=null;clearTimeout(timer);document.getElementById('mic-start')?.setAttribute('aria-pressed','false');say('Micrófono detenido. Revisa y corrige la transcripción antes de evaluar o continuar.','Microphone stopped. Review and correct the transcript before evaluation or continuing.');};
   try{r.start();timer=setTimeout(()=>{if(recognizer===r)r.stop();},90000);}catch{stopMic();say('Pulsa Activar micrófono para reintentar.','Press Start microphone to retry.');}
  };
  const read=()=>{
   stop();if(dead)return;
   if(!window.speechSynthesis){say('La lectura de voz no está disponible. Puedes leer la pregunta y activar el micrófono.','Speech playback is unavailable. Read the question and start the microphone.');return;}
   const u=new SpeechSynthesisUtterance(config.question),token=generation;u.lang=en?'en-US':'es-ES';speaking=true;
   if(window.AsiloCharacterVoices&&!window.AsiloCharacterVoices.apply(u,'kevin')){speaking=false;say('No hay una voz en español disponible. Activa una voz en español en tu dispositivo y vuelve a abrir la app.','No English voice is available. Enable an English voice on your device and reopen the app.');return;}
   u.onstart=()=>{if(!dead&&speaking&&token===generation){clearTimeout(readTimer);config.video(true);say('Kevin · Voz masculina: '+(u.voice?.name||'voz del navegador')+(u.voice&&!u.voice.lang.startsWith(en?'en':'es')?' · El acento depende del idioma de esta voz.':''),'Kevin · Male voice: '+(u.voice?.name||'browser voice'));}};
   u.onend=()=>{if(dead||!speaking||token!==generation)return;speaking=false;config.video(false);if(config.microphone)listen();else say('Pregunta terminada. Puedes escribir tu respuesta.','Question finished. You can type your answer.');};
   u.onerror=()=>{if(dead||!speaking||token!==generation)return;speaking=false;config.video(false);say('No se pudo reproducir la voz. Pulsa Repetir pregunta o activa el micrófono.','Voice playback failed. Repeat the question or start the microphone.');};
   say('Preparando lectura automática…','Preparing automatic reading…');window.speechSynthesis.speak(u);
   readTimer=setTimeout(()=>{if(!dead&&speaking&&!window.speechSynthesis.speaking)say('El navegador bloqueó la lectura automática. Pulsa Repetir pregunta.','Your browser blocked automatic playback. Press Repeat question.');},4000);
  };
  document.getElementById('voice-repeat').onclick=read;
  document.getElementById('mic-start').onclick=listen;
  document.getElementById('voice-stop').onclick=()=>{generation++;speaking=false;clearTimeout(readTimer);clearTimeout(timer);window.speechSynthesis?.cancel();config.video(false);if(recognizer){try{recognizer.stop();}catch{stopMic();}}else stopMic();say('Finalizando dictado. Revisa la transcripción antes de continuar.','Finishing dictation. Review the transcript before continuing.');};
  const hidden=()=>{if(document.hidden){stop();say('Micrófono pausado al salir de la pestaña.','Microphone paused when leaving the tab.');}};
  document.addEventListener('visibilitychange',hidden);
  pause=stop;dispose=()=>{dead=true;stop();document.removeEventListener('visibilitychange',hidden);};
  read();
 }};
 window.addEventListener('pagehide',()=>dispose());
})();
