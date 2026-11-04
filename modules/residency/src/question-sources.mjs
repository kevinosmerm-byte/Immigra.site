// Sources support TOPICS, not the wording of these illustrative practice prompts.
// Verified from official USCIS search excerpts; direct PDF retrieval returned 403.
const i130='https://www.uscis.gov/sites/default/files/document/forms/i-130instr.pdf';
const i485='https://www.uscis.gov/sites/default/files/document/forms/i-485instr.pdf';
export const residencySourceReview=Object.freeze({verification:'official_search_index',directFetch:403,currentEditionVerified:false});
const i130Topics=new Set(['identity','relationship','wedding','household','finance','family','documents','Identidad y relación','Hogar','Familia y amigos','Finanzas','Matrimonio y eventos','Identidad familiar','Ciudadanía del hijo','Familia extendida','Residencia y apoyo','Documentos','Identidad y categoría','Infancia y filiación','Relación familiar','Situación civil','Ciudadanía del progenitor','Vivienda y dependencia','Documentos familiares']);
const i485Topics=new Set(['immigration','Historia migratoria','Migración y formularios','Patrocinio y requisitos','Patrocinio y espera','Preparación del formulario']);
export function residencyQuestionSource(question){
 if(question?.source)return {kind:'adapted_practice',label:question.source.title,...question.source};
 const topic=question?.bloque||question?.category;
 const reflection=question?.dificultad==='Difícil'||!i130Topics.has(topic)&&!i485Topics.has(topic);
 const url=i130Topics.has(topic)?i130:i485Topics.has(topic)?i485:null;
 return {kind:reflection?'original_reflection':'adapted_practice',label:url===i130?'USCIS · I-130 Instructions':url?'USCIS · I-485 Instructions':null,url,...(url?residencySourceReview:{}),...(url===i130?{editionObserved:'04/01/24'}:{})};
}
