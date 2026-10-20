// Educational prompts for the existing question bank, never facts for a user's case.
export const reviewGroups = {
  REVIEW_GENERAL: {es:'Entrevista general',en:'General interview'},
  REVIEW_INDIVIDUAL: {es:'Temor individual',en:'Individual fear'},
  REVIEW_CHANGES: {es:'Cambios en el país',en:'Country changes'},
  REVIEW_VENEZUELA: {es:'Venezuela',en:'Venezuela'},
};
const prompts = [
  ['GENERAL','¿Qué hechos de su experiencia desea explicar y en qué orden ocurrieron?','What events from your experience would you like to explain, and in what order did they occur?'],
  ['GENERAL','¿Qué fechas recuerda con certeza y cuáles son aproximadas?','Which dates do you remember with certainty, and which are approximate?'],
  ['GENERAL','¿Qué información conoce personalmente y cuál recibió de otras personas?','What information do you know firsthand, and what did you learn from other people?'],
  ['GENERAL','¿Hay algo que no recuerde o que desee corregir de su relato?','Is there anything you do not remember or would like to correct in your account?'],
  ['INDIVIDUAL','¿Qué teme que le ocurra personalmente si regresa hoy, y por qué?','What do you fear would happen to you personally if you returned today, and why?'],
  ['INDIVIDUAL','¿Cuándo fue el último contacto o incidente relacionado con ese temor, si hubo alguno?','When was the most recent contact or incident related to that fear, if any?'],
  ['INDIVIDUAL','¿Qué sabe actualmente de las personas o grupos a quienes teme, y cómo lo sabe?','What do you currently know about the people or groups you fear, and how do you know it?'],
  ['INDIVIDUAL','¿Qué ha ocurrido con sus familiares desde su salida, si tiene información?','What has happened to your relatives since you left, if you have information?'],
  ['CHANGES','¿Qué cambios conoce en su país desde que salió y qué fuentes consultó?','What changes do you know about in your country since you left, and what sources did you consult?'],
  ['CHANGES','¿De qué fecha es esa información y qué aspectos no ha podido confirmar?','What is the date of that information, and what aspects have you been unable to confirm?'],
  ['CHANGES','¿Cómo afectan esos cambios, si de alguna manera, su situación personal?','How do those changes, if at all, affect your personal situation?'],
  ['CHANGES','¿Qué información apunta a una mejora, a un empeoramiento o a que su situación sigue igual?','What information points to improvement, worsening, or no change in your situation?'],
  ['VENEZUELA','Si ha leído sobre liberaciones de personas detenidas en Venezuela, ¿qué fuente y fecha tiene esa información y qué sabe de sus condiciones?','If you have read about releases of detained people in Venezuela, what is the source and date of that information, and what do you know about the conditions of their release?'],
  ['VENEZUELA','Si conoce el retorno de algún dirigente a Venezuela, ¿qué ha podido verificar y qué similitudes o diferencias observa con su situación?','If you know of a political leader returning to Venezuela, what have you been able to verify, and what similarities or differences do you see with your situation?'],
  ['VENEZUELA','¿Qué información reciente tiene sobre las personas o instituciones vinculadas a su temor en Venezuela?','What recent information do you have about the people or institutions connected to your fear in Venezuela?'],
  ['VENEZUELA','¿Qué puede explicar con sus propios hechos sobre cómo esos acontecimientos afectan, o no, su temor de regresar a Venezuela?','What can you explain using your own facts about how those developments affect, or do not affect, your fear of returning to Venezuela?'],
];
export const reviewQuestions = prompts.map(([group,question_es,question_en],i)=>({
  id:`IMMIGRA_REVIEW_${String(i+1).padStart(2,'0')}`,category:`REVIEW_${group}`,
  question_es,question_en,question_type:'neutral_factual',
  ...(group==='VENEZUELA'?{country:'Venezuela'}:{}),
}));

// This is a verified reference directory, not a verified description of present conditions.
export const venezuelaReference = {
  url:'https://unric.org/en/unric-library-backgrounder-venezuela/',
  publisher:'UNRIC',verifiedAt:'2026-10-20',expiresAt:'2026-11-19',
  verificationScope:'reference_directory_only',
};
export function referenceStatus(reference, now = new Date()) {
  const checked = Date.parse(reference.verifiedAt+'T00:00:00Z');
  const expires = Date.parse(reference.expiresAt+'T00:00:00Z');
  return Number.isFinite(checked)&&Number.isFinite(expires)&&now.getTime()>=checked&&now.getTime()<expires?'reviewed':'needs_review';
}
export function renderReviewNotice(language,escape,now=new Date()) {
  const en=language==='en',r=venezuelaReference;
  const status=referenceStatus(r,now)==='reviewed'
    ?(en?'Reference directory reviewed':'Directorio de fuentes revisado')
    :(en?'Reference needs a new review; do not treat it as current':'Referencia pendiente de nueva revisión; no tratar como actual');
  return `<aside class="card" aria-label="${en?'Practice guidance':'Orientación para la práctica'}"><p>${en?'Use your own words and experiences. You may say you do not know or do not remember. These are educational prompts, not official interview questions or suggested answers.':'Use sus propias palabras y experiencias. Puede decir que no sabe o no recuerda. Son preguntas educativas, no preguntas oficiales de entrevista ni respuestas sugeridas.'}</p><p>${en?'Releases or returns of other people do not, by themselves, establish what would happen to you. Country questions apply only when relevant to your own situation.':'Las liberaciones o retornos de otras personas no establecen por sí solos qué le ocurriría a usted. Las preguntas por país se aplican solo cuando corresponden a su situación.'}</p><details><summary>${en?'Venezuela: sources and review dates':'Venezuela: fuentes y fechas de revisión'}</summary><p><a href="${escape(r.url)}" target="_blank" rel="noopener noreferrer">${escape(r.publisher)} · ${en?'Reference directory':'Directorio de referencias'}</a></p><p>${escape(status)}. ${en?'Checked':'Verificación'}: ${r.verifiedAt}. ${en?'Review expires':'Vencimiento de revisión'}: ${r.expiresAt} (UTC).</p><p>${en?'Only the directory and its links were checked. No current country-condition finding is asserted here. Check the date, scope and original text of each report before comparing it with your circumstances.':'Se comprobó únicamente el directorio y sus enlaces. Aquí no se afirma una conclusión sobre las condiciones actuales del país. Revise la fecha, el alcance y el texto original de cada informe antes de compararlo con sus circunstancias.'}</p></details></aside>`;
}
