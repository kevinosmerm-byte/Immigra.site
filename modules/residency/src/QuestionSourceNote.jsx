import React from 'react';
import {aosQuestions,aosQuestion} from './aosEngine.mjs';
import {residencyQuestionSource} from './question-sources.mjs';
export default function QuestionSourceNote({question,questionId,prompt,lang='es'}){
 const t=(es,en)=>lang==='es'?es:en;
 // Call captions may include an acknowledgment before the bank question.
 const text=String(prompt||'').trim();
 const item=question||aosQuestions.find(q=>q.id===questionId)||aosQuestions.find(q=>{const wording=aosQuestion(q,lang);return wording&&text.endsWith(wording);});
 const source=residencyQuestionSource(item);
 return <small className="res-question-source" data-source-kind={source.kind}>
  {source.kind==='adapted_practice'?t('Práctica adaptada de un tema; no es una pregunta textual de USCIS.','Adapted topic practice; not a verbatim USCIS question.'):t('Reflexión educativa propia; no es una pregunta oficial de USCIS.','Original educational reflection; not an official USCIS question.')}
  {source.url&&<> {t('Referencia temática:','Topic reference:')} <a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a>.
   {source.editionObserved&&<> {t('Edición observada:','Observed edition:')} {source.editionObserved}.</>}
   {source.pageObserved&&<> {t('Página observada:','Observed page:')} {source.pageObserved}.</>}
   {source.verification==='official_search_index'&&<> {t('Se revisaron extractos indexados del dominio oficial, no el documento completo.','Indexed excerpts from the official domain were reviewed, not the full document.')}</>}
   {' '}{t('Verifique la edición vigente.','Check the current edition.')}</>}
 </small>;
}
