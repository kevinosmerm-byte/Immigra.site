(function(){
 'use strict';
 const names={kevin:{es:/\b(pablo|raul|raúl|jorge|juan|diego|eddy|reed|rocko)\b/i,en:/\b(david|mark|george|james|richard|ravi|sean|daniel|alex|fred|tom|eddy|reed|rocko)\b/i},sahara:{es:/\b(helena|laura|sabina|monica|mónica|paulina|marisol|flo|sandy|shelley)\b/i,en:/\b(zira|hazel|susan|catherine|linda|heera|samantha|victoria|karen|moira|tessa|flo|sandy|shelley)\b/i}};
 function select(voices,character,language){const lang=language.slice(0,2),pattern=names[character]?.[lang];if(!pattern)return null;return voices.filter(v=>v.lang.toLowerCase().startsWith(lang)&&pattern.test(v.name)).sort((a,b)=>Number(b.lang.toLowerCase()===language.toLowerCase())-Number(a.lang.toLowerCase()===language.toLowerCase()))[0]||voices.find(v=>Object.values(names[character]).some(p=>p.test(v.name)))||null;}
 window.AsiloCharacterVoices={select,apply(utterance,character){const voice=select(window.speechSynthesis?.getVoices()||[],character,utterance.lang);if(!voice)return false;utterance.voice=voice;utterance.rate=.94;utterance.pitch=1;return true;}};
 // Trigger asynchronous browser voice discovery before the user starts speaking.
 window.speechSynthesis?.getVoices();
})();
