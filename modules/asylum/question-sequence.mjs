// Editorial sequence only. No inference about an applicant's experiences.
import expansion from './card-expansion.json' with {type:'json'};
export const SEQUENCE_VERSION = 'asylum-topics-v4';
const range = (a,b) => Array.from({length:b-a+1},(_,i)=>a+i);
const revised = new Set([4, 18, 24, 32, 37, 42, 55, 56, 75, 91, 96, 108, 109, 113, 119]);
const id = n => `IMMIGRA_ASYLUM_REFLECT_${String(n).padStart(3,'0')}${revised.has(n)?'_V2':''}`;
export const topicGroups = [
 ['events','Hechos y cronología','Events and chronology',[...range(1,12),...range(91,95)]],
 ['actors','Personas, motivos y actividades','People, reasons and activities',range(13,18)],
 ['politics','Participación política · si corresponde','Political participation · if applicable',range(85,90)],
 ['protection','Ayuda y opciones dentro del país','Help and options within the country',[...range(25,30),104,83]],
 ['departure','Decisión y salida del país','Decision and departure',[...range(19,24),...range(96,102)]],
 ['travel','Viaje y declaraciones anteriores','Travel and previous statements',[...range(61,66),125]],
 ['application','Solicitud y preparación','Application and preparation',[...range(67,72),...range(118,124)]],
 ['current_fear','Temor actual','Current fear',[...range(31,36),...range(79,82),84]],
 ['current_activity','Actividades actuales','Current activities',range(109,114)],
 ['country','Cambios y fuentes del país','Country changes and sources',[...range(37,42),...range(73,78),103,106,'IMMIGRA_ASYLUM_VENEZUELA_RELEASES_001','IMMIGRA_ASYLUM_VENEZUELA_LEADER_RETURN_001','IMMIGRA_REVIEW_15','IMMIGRA_ASYLUM_VENEZUELA_CONTEXT_001']],
 ['returns','Regresos y comparaciones','Returns and comparisons',range(43,48)],
 ['evidence','Materiales, recuerdos y aclaraciones','Materials, memories and clarifications',range(49,54)],
 ['impact','Efectos personales · opcional','Personal impact · optional',[107,108]],
 ['scenarios','Escenarios hipotéticos','Hypothetical scenarios',[105,...range(115,117)]],
 ['closing','Reflexión y cierre','Reflection and closing',range(55,60)],
].map(([key,es,en,ids])=>({key,es,en,ids:ids.map(n=>typeof n==='number'?id(n):n).flatMap(parent=>expansion[parent]||[parent])}));
const entries = topicGroups.flatMap(g=>g.ids.map((id,index)=>[id,{topic:g.key,topic_es:g.es,topic_en:g.en,index}]));
const metadata = new Map(entries);
const rank = new Map(entries.map(([id],index)=>[id,index]));
export function sequenceQuestions(questions) {
 return questions.map((q,index)=>({q,index})).sort((a,b)=>(rank.get(a.q.id)??1e6+a.index)-(rank.get(b.q.id)??1e6+b.index)).map(({q})=>({...q,...metadata.get(q.id)}));
}

export function topicForQuestion(id){return metadata.get(id)?.topic||null;}
export function isSkipAsylumTopic(value){return /^(?:omitir este tema|skip this topic)[.!? ]*$/i.test(String(value||'').trim());}
