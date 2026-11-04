import catalog from './question-provenance.json' with {type:'json'};
export const provenanceCatalog=catalog;
const sources=new Map(catalog.sources.map(s=>[s.id,s]));
export function questionProvenance(id){
 const entry=catalog.questions[id];
 return entry?{...entry,methodSources:(entry.method_source_ids||[]).map(id=>sources.get(id)).filter(Boolean),sources:entry.source_ids.map(id=>sources.get(id)).filter(Boolean)}:null;
}
export function provenanceNote(id,locale='es'){
 const entry=questionProvenance(id),es=locale==='es';
 if(!entry)return null;
 return {
  label:es?'Origen de esta práctica':'Practice origin',
  wording:es?'Práctica propuesta por IMMIGRA; no es una pregunta oficial.':'Practice proposed by IMMIGRA; not an official question.',
  relation:entry.attribution==='methodology_only'?(es?'Referencia de método; tema específico no verificado:':'Method reference; specific topic not verified:'):(es?'Referencia del tema:':'Topic reference:'),
  sources:entry.sources.map(s=>({...s,label:`${s.title} · ${s.locator} (${s.edition})`,topic:s[es?'topic_es':'topic_en']})),
  objective:entry[es?'objective_es':'objective_en']||'',
  derivation:entry[es?'derivation_es':'derivation_en']||'',
  methodSources:entry.methodSources,
  limitation:catalog[es?'limitations_es':'limitations_en'],
 };
}
