import test from 'node:test';
import assert from 'node:assert/strict';
import {studyBank,adaptiveDesign} from '../modules/asylum/reflection-bank.mjs';
import {provenanceCatalog,questionProvenance,provenanceNote} from '../modules/asylum/question-provenance.mjs';
import {readFileSync} from 'node:fs';

test('every served base and adaptive card has explicit non-official provenance and a reviewed official excerpt',()=>{
 const questions=[...studyBank,...adaptiveDesign.branches.flatMap(b=>b.questions)];
 assert.equal(Object.keys(provenanceCatalog.questions).length,questions.length);
 for(const q of questions){
  const p=questionProvenance(q.id);assert.ok(p,q.id);assert.equal(p.official_verbatim,false);assert.equal(p.wording_origin,'immigra_original_practice');
  assert.ok(p.sources.length);for(const source of p.sources){assert.equal(new URL(source.url).hostname,'www.uscis.gov');assert.ok(source.locator);assert.ok(source.edition);assert.equal(source.full_document_reviewed,false);assert.equal(source.verification,'official_indexed_excerpt_only');}
  for(const lang of ['es','en']){const note=provenanceNote(q.id,lang);assert.ok(note.wording);assert.ok(note.limitation);assert.ok(note.sources.every(s=>s.label));}
 }
});
test('method-only references never claim verification of a specific topic or official wording',()=>{
 const methods=Object.values(provenanceCatalog.questions).filter(q=>q.attribution==='methodology_only');assert.ok(methods.length);
 for(const q of methods){assert.match(provenanceNote(q.question_id,'es').relation,/tema específico no verificado/);assert.match(provenanceNote(q.question_id,'en').relation,/specific topic not verified/);}
 assert.equal(questionProvenance('UNVERIFIED'),null);assert.equal(provenanceNote('UNVERIFIED'),null);
 assert.ok(provenanceCatalog.unassigned_requested_sources.some(s=>s.title.includes('AAPM')&&s.status.includes('403')));
 assert.ok(!Object.values(provenanceCatalog.questions).some(q=>q.source_ids.includes('aapm')));
});
test('study and optional cards visibly include source note with accessible external link safeguards',()=>{
 for(const path of ['AsylumStudyBook.jsx','AsylumAdaptivePicker.jsx'])assert.match(readFileSync(new URL(`../modules/asylum/${path}`,import.meta.url),'utf8'),/<AsylumSourceNote/);
 const note=readFileSync(new URL('../modules/asylum/AsylumSourceNote.jsx',import.meta.url),'utf8');assert.match(note,/aria-label={note.label}/);assert.match(note,/rel="noopener noreferrer"/);assert.match(note,/<summary>/);
});
