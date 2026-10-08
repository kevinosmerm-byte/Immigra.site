// Text-only ingestion. PDFs/scans need an audited parser; do not treat extracted text as fact.
export const DOC_TYPES=Object.freeze(['I-130','I-485','personal_statement','other']);
export function ingestDocument({engine='residency',type='other',name='',text='',consent=false}={}){
 if(engine!=='residency')throw Error('Cross-engine document blocked');
 if(consent!==true)throw Error('Explicit consent required');
 if(!DOC_TYPES.includes(type))throw Error('Unsupported document type');
 if(typeof text!=='string'||text.length>100000)throw Error('Invalid document text');
 const clean=text.normalize('NFKC').replace(/\u0000/g,'').trim();
 if(!clean)throw Error('Empty document');
 return {engine,type,name:String(name).slice(0,100),source:'user_provided_document',verified:false,characters:clean.length,truncated:clean.split(/\n\s*\n/).filter(Boolean).length>150||clean.split(/\n\s*\n/).some(s=>s.length>3000),sections:clean.split(/\n\s*\n/).filter(Boolean).slice(0,150).map((section,index)=>({index,text:section.slice(0,3000)}))};
}
export function extractReviewPrompts(document){
 if(document.engine!=='residency')throw Error('Wrong engine');
 return document.sections.slice(0,10).map(s=>({sourceType:document.type,section:s.index,question_es:'¿Puede explicar con sus propias palabras la información de esta sección del documento?',question_en:'Can you explain the information in this document section in your own words?',sourceExcerpt:s.text.slice(0,140),status:'not_verified'}));
}
