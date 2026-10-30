// Static, fictional teaching examples. No requests, recording, scoring or user data.
export const heroExamples = Object.freeze({
 citizenship: {
  es: {question:'¿Cuál es su nombre legal completo?',answer:'Mi nombre legal completo es Alex Rivera.',feedback:'El ejemplo responde directamente con un nombre completo. En tu entrevista, usa tu propio nombre tal como aparece en tus documentos; no copies el del ejemplo.'},
  en: {question:'What is your full legal name?',answer:'My full legal name is Alex Rivera.',feedback:'The example answers directly with a full name. In your interview, use your own name as it appears on your documents; do not copy the example.'},
 },
 asylum: {
  es: {question:'¿Por qué teme regresar a su país?',answer:'Temo regresar porque recibí amenazas después de expresar mis opiniones políticas.',feedback:'El ejemplo menciona el temor y su contexto, pero no un hecho concreto. En tu propia historia, explica qué ocurrió y cuándo, solo si lo recuerdas. No adivines fechas.'},
  en: {question:'Why are you afraid to return to your country?',answer:'I am afraid to return because I received threats after expressing my political views.',feedback:'The example names a fear and its context, but not a specific event. In your own account, explain what happened and when, only if you remember. Do not guess dates.'},
 },
 residency: {
  es: {question:'¿En qué mes y año se casaron?',answer:'Nos casamos en 2021.',feedback:'El ejemplo indica el año, pero no el mes solicitado. En una respuesta real, añade el mes únicamente si lo recuerdas; si no, expresa esa incertidumbre sin inventar.'},
  en: {question:'In what month and year did you get married?',answer:'We got married in 2021.',feedback:'The example gives the year, but not the requested month. In a real answer, add the month only if you remember it; otherwise express that uncertainty without inventing details.'},
 },
});
export const freeStudyRoutes=Object.freeze({citizenship:'citizenship/civics',asylum:'asylum/full-bank',residency:'residency/study'});
export const initialHeroDemo=()=>({route:'asylum',step:0,playing:false,revision:0});
export function heroDemoReducer(state,action){
 const reset={...state,step:0,playing:false,revision:state.revision+1};
 switch(action.type){
  case 'route':return Object.hasOwn(heroExamples,action.route)?{...reset,route:action.route}:state;
  case 'reset':return reset;
  case 'play':return {...state,step:state.step===2?0:state.step,playing:true,revision:state.revision+1};
  case 'replay':return {...reset,playing:true};
  case 'pause':return {...state,playing:false,revision:state.revision+1};
  case 'step':return Number.isInteger(action.step)&&action.step>=0&&action.step<=2?{...state,step:action.step,playing:false,revision:state.revision+1}:state;
  case 'tick':return state.playing&&action.revision===state.revision?{...state,step:Math.min(2,state.step+1),playing:state.step<1,revision:state.revision+1}:state;
  default:return state;
 }
}
