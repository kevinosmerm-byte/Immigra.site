export const modules = Object.freeze([
  {id:'citizenship',icon:'landmark',color:'#173D76',light:'#EDF3FC',es:'Ciudadanía',en:'Citizenship',descEs:'Prepárate para tu entrevista de naturalización.',descEn:'Prepare for your naturalization interview.'},
  {id:'asylum',icon:'shield',color:'#6741A5',light:'#F3EFFA',es:'Asilo',en:'Asylum',descEs:'Practica tu entrevista de protección.',descEn:'Practice your protection interview.'},
  {id:'residency',icon:'house',color:'#176B4D',light:'#EAF6EF',es:'Residencia',en:'Green Card',descEs:'Entrevistas de matrimonio y peticiones familiares.',descEn:'Marriage and family petition interviews.'}
]);
export const moduleById=id=>modules.find(m=>m.id===id)??null;
