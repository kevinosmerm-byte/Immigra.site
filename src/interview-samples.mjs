// Illustrative reading samples, not an official interview script or personal answers.
export const interviewSamples=Object.freeze({
 citizenship:[
  {es:'¿Cuál es su nombre legal completo?',en:'What is your full legal name?'},
  {es:'¿Cuál es su fecha de nacimiento?',en:'What is your date of birth?'},
  {es:'¿Cuánto tiempo ha sido residente permanente?',en:'How long have you been a permanent resident?'},
 ],
 asylum:[
  {es:'¿Por qué solicita asilo en Estados Unidos?',en:'Why are you applying for asylum in the United States?'},
  {es:'¿Qué ocurrió antes de salir de su país?',en:'What happened before you left your country?'},
  {es:'¿Qué teme que ocurra si regresa?',en:'What do you fear would happen if you returned?'},
 ],
 residency:[
  {es:'¿Cuál es su relación con la persona que presentó la petición?',en:'What is your relationship to the person who filed the petition?'},
  {es:'¿Cuándo se conocieron?',en:'When did you first meet?'},
  {es:'¿Dónde vive actualmente?',en:'Where do you currently live?'},
 ],
});
export function sampleIndex(index,direction){return Math.max(0,Math.min(2,index+direction));}
