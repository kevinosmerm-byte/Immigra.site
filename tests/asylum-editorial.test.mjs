import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {studyBank,adaptiveDesign} from '../modules/asylum/reflection-bank.mjs';
import {adaptiveCards} from '../modules/asylum/adaptive-session.mjs';
const base=(n,part)=>studyBank.find(q=>q.id===`IMMIGRA_ASYLUM_REFLECT_${n}_V2_S${part}`);
const adaptive=(prefix,part)=>adaptiveCards.find(q=>q.id===`${prefix}_V2_S${part}`);
test('split base prompts distinguish seeking from receiving, unchanged activity and future reactions',()=>{
 assert.match(base('108',1).question_es,/Si buscó apoyo/);assert.match(base('108',1).question_en,/If you sought support/);
 for(const part of [2,3]){assert.match(base('108',part).question_es,/^Si recibió apoyo/);assert.match(base('108',part).question_en,/^If you received support/);}
 assert.match(base('109',1).question_es,/cambios o continuidad/);assert.match(base('109',1).question_en,/change or continuity/);
 assert.match(base('113',2).question_es,/si alguna/);assert.match(base('113',2).question_en,/if any/);
 assert.match(base('113',3).question_es,/reacción futura/);assert.match(base('113',3).question_en,/future reaction/);
 assert.match(base('024',2).question_es,/^Si el temor fue/);assert.match(base('024',2).question_en,/^If fear was/);
 assert.match(base('119',1).question_es,/oportunidad.*si alguna/);assert.match(base('119',1).question_en,/opportunity.*if any/);
 for(const part of [2,3]){assert.match(base('119',part).question_es,/^Si revisó/);assert.match(base('119',part).question_en,/^If you reviewed/);}
});
test('split adaptive cards preserve record, possible-connection and fictional-comparison safeguards',()=>{
 const statement=adaptive('IMMIGRA_ASYLUM_ADAPT_PRIOR_STATEMENTS_1',1);
 assert.doesNotMatch(statement.question_es,/registro/);assert.doesNotMatch(statement.question_en,/record/);
 const record=adaptive('IMMIGRA_ASYLUM_ADAPT_PRIOR_STATEMENTS_1',2);
 assert.match(record.question_es,/registro.*aportó voluntariamente/);assert.match(record.question_en,/record.*voluntarily provided/);
 // A statement OR a record is insufficient for a card that requires a record.
 assert.ok(record.requirements.some(r=>/registro/.test(r.es)&&/record/.test(r.en)&&!/(?:propia o un registro|statement or a record)/.test(r.es+' '+r.en)),'record-only card needs an explicit record prerequisite');
 const chain=adaptive('IMMIGRA_ASYLUM_ADAPT_EVENT_CHAIN_2',3);assert.match(chain.question_es,/podría indicar que no existe/);assert.match(chain.question_en,/might suggest there is no connection/);
 for(const part of [1,2]){const returns=adaptive('IMMIGRA_ASYLUM_ADAPT_RETURNEE_EVIDENCE_1',part);assert.match(returns.question_es,/comparación ficticia/);assert.match(returns.question_en,/fictional comparison/);assert.ok(returns.scenario);}
 assert.equal(adaptiveCards.length,88);assert.ok(adaptiveCards.every(q=>q.question_es&&q.question_en&&q.requirements.length));
});
test('split country wording has equivalent leader scope and explicit release referent with revised IDs',()=>{
 for(const part of [1,2,3]){const leader=studyBank.find(q=>q.id===`IMMIGRA_ASYLUM_VENEZUELA_LEADER_RETURN_001_S${part}`);assert.match(leader.question_en,/a leader returning/);assert.doesNotMatch(leader.question_en,/political leader/);}
 const releases=studyBank.find(q=>q.id==='IMMIGRA_ASYLUM_VENEZUELA_RELEASES_001_S3');assert.match(releases.question_es,/condiciones de esas liberaciones/);
 assert.ok(!studyBank.some(q=>['IMMIGRA_REVIEW_13','IMMIGRA_REVIEW_14','IMMIGRA_REVIEW_15','IMMIGRA_ASYLUM_VENEZUELA_LEADER_RETURN_001','IMMIGRA_ASYLUM_VENEZUELA_RELEASES_001'].includes(q.id)));
});
test('privacy notices and local metadata accurately describe mode-specific selection',()=>{
 const copy=readFileSync(new URL('../modules/citizenship/src/LegalSettings.jsx',import.meta.url),'utf8');
 assert.doesNotMatch(copy,/New practice sessions randomize pending questions|Al volver se eligen preguntas pendientes en orden aleatorio/);
 assert.match(copy,/Asylum study and bank-based interviews follow a topic sequence/);assert.match(copy,/El estudio y las entrevistas basadas en el banco de asilo siguen una secuencia por temas/);
 assert.equal(adaptiveDesign.status,'explicit_confirmation_local_not_published');assert.match(adaptiveDesign.runtime_rules,/never automatic activation rules/);
});
