import {aosPrerequisites} from './question-flow.mjs';
import derivedPractice from '../data/derived-practice-bank.json' with {type:'json'};
import contextualPrompts from './contextual-prompts.json' with {type:'json'};
import supplemental from '../../../shared/interview-ui/supplemental-questions.json' with {type:'json'};
import englishQuestions from '../data/aos-questions.en.json' with {type:'json'};
import bank from '../data/preguntas_ajuste_estatus_300.json' with {type:'json'};
export const aosQuestions=[...bank.preguntas,...supplemental.residency,...derivedPractice];
export const aosRoutes={MATRIMONIO:'Cónyuge',HIJO_A_PADRES:'Hijo/a ciudadano/a pide a padre o madre',PADRES_A_HIJOS:'Padre o madre pide a hijo/a'};
export function difficulty(q){return q.dificultad==='Fácil'?0:q.dificultad==='Moderada'?1:2;}
export function selectAosQuestions({route,count=12,petitionerStatus='unknown',age='unknown',marital='unknown',random=Math.random}){
 if(!aosRoutes[route]||!Number.isInteger(count)||count<3||count>200)throw Error('Invalid setup');
 const pool=aosQuestions.filter(q=>q.ruta===route&&!(petitionerStatus==='resident'&&/Cómo obtuvo.*ciudadanía|prueba de ciudadanía/i.test(q.pregunta_es)));
 // Keep each family topic together. Complexity rises within a topic, not by
 // revisiting every topic at each level. This is a practice order, not a USCIS script.
 const blocks=[...new Set(pool.map(q=>q.bloque))];
 return pool.toSorted((a,b)=>blocks.indexOf(a.bloque)-blocks.indexOf(b.bloque)||difficulty(a)-difficulty(b)).slice(0,count);
}
export function selectPendingAosQuestions({reviewedQuestionIds=[],count=12,...options}){
 const all=selectAosQuestions({...options,count:200});
 const seen=new Set(reviewedQuestionIds);
 // A prerequisite from a previous session is not a fact for this session.
 const pending=all.filter(q=>!seen.has(q.id)&&!seen.has(aosPrerequisites[q.id]?.id));
 return (pending.length?pending:all).slice(0,count);
}
export function isUncertain(text){return /no recuerdo|no estoy segur|necesito revisar|no sé|no se\b|not sure|(?:do not|don't|cannot|can't) remember|need to (?:review|check)/i.test(text);}

export const aosRoutesEn={MATRIMONIO:'Spouse',HIJO_A_PADRES:'Citizen child petitions for a parent',PADRES_A_HIJOS:'Parent petitions for a child'};
export function aosQuestion(question,locale='es'){return contextualPrompts[question.id]?.[locale]||(locale==='en'?(question.question_en||englishQuestions[question.id]):question.pregunta_es);}
const topicsEn={'Preparación del formulario':'Application preparation','Ciudadanía del hijo':'Child citizenship','Ciudadanía del progenitor':'Parent citizenship','Contacto actual':'Current contact','Crianza':'Upbringing','Documentos':'Documents','Documentos familiares':'Family documents','Familia extendida':'Extended family','Familia y amigos':'Family and friends','Finanzas':'Finances','Historia migratoria':'Immigration history','Historia personal':'Personal history','Hogar':'Home','Identidad familiar':'Family identity','Identidad y categoría':'Identity and category','Identidad y relación':'Identity and relationship','Infancia y filiación':'Childhood and parentage','Matrimonio y eventos':'Marriage and events','Migración y formularios':'Immigration and forms','Noviazgo':'Dating','Patrocinio y espera':'Sponsorship and waiting','Patrocinio y requisitos':'Sponsorship and requirements','Preguntas de verificación':'Verification questions','Relación familiar':'Family relationship','Residencia y apoyo':'Residence and support','Rutinas':'Routines','Situación civil':'Marital status','Verificación avanzada':'Advanced verification','Vivienda y dependencia':'Housing and dependence','Fácil':'Easy','Moderada':'Moderate','Difícil':'Difficult'};
export function aosTopic(value,locale='es'){return locale==='en'?(topicsEn[value]||value):value;}
