import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
if(!process.argv[2])throw Error('Usage: node scripts/audit-bilingual-banks.mjs <original-repository>');
const root=process.argv[2].replaceAll('\\','/').replace(/\/$/,'')+'/src/data/';
const {asylumPracticeQuestions:a}=await import(pathToFileURL(root+'asylumPracticeQuestions.js'));
const {adjustmentPracticeQuestions:r}=await import(pathToFileURL(root+'adjustmentPracticeQuestions.js'));
const base=fs.readFileSync('modules/asylum/master-package/03_question_bank/question_bank.jsonl','utf8').trim().split(/\r?\n/).map(JSON.parse);
const sup=JSON.parse(fs.readFileSync('shared/interview-ui/supplemental-questions.json','utf8'));
const rb=JSON.parse(fs.readFileSync('modules/residency/data/preguntas_ajuste_estatus_300.json','utf8')).preguntas;
const en=JSON.parse(fs.readFileSync('modules/residency/data/aos-questions.en.json','utf8'));
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const words=s=>new Set(norm(s).split(' '));
const compare=(old,bank)=>old.map(q=>{const scores=bank.map(b=>{const text=b.question_en||b.english||en[b.id]||'';const x=words(q.en),y=words(text);const score=[...x].filter(w=>y.has(w)).length/new Set([...x,...y]).size;return {id:b.id,score,exact:norm(q.en)===norm(text)};}).sort((a,b)=>b.score-a.score);return {id:q.id,track:q.track,match:scores[0]};});
const results={asylum:compare(a,[...base,...sup.asylum]),residency:compare(r,[...rb,...sup.residency])};
let out='# Comparación de bancos bilingües\n\nPR #4 original: 106 preguntas de asilo y 127 de ajuste de estatus (233). Merge 5569fb68be8fb78607d03c4fc8d45a23f6d5fb80.\n\nComparación reproducible de texto inglés normalizado; similitud de palabras sirve solo para señalar candidatos, no prueba equivalencia semántica. No se borraron ni renumeraron identificadores y no se importaron preguntas de tribunal en la entrevista USCIS.\n\n';
for(const [kind,rows] of Object.entries(results)){out+=`## ${kind}\n\n${rows.length} originales; ${rows.filter(x=>x.match.exact).length} coincidencias exactas. Los restantes requieren revisión editorial y mapeo de vía antes de importación.\n\n| Original | Vía | Candidato existente | Similitud |\n|---|---|---|---|\n`;for(const x of rows)out+=`| ${x.id} | ${x.track} | ${x.match.id} | ${x.match.score.toFixed(2)}${x.match.exact?' exacta':''} |\n`;}
fs.writeFileSync('docs/IMMIGRA_BANK_COMPARISON.md',out);console.log({originalAsylum:a.length,originalResidency:r.length,currentAsylum:base.length+sup.asylum.length,currentResidency:rb.length+sup.residency.length,exact:Object.fromEntries(Object.entries(results).map(([k,v])=>[k,v.filter(x=>x.match.exact).length]))});
