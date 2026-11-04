import test from 'node:test';
import assert from 'node:assert/strict';
import bank from '../modules/asylum/reflection-bank.json' with {type:'json'};
import country from '../modules/asylum/country-study-questions.json' with {type:'json'};
import expansion from '../modules/asylum/card-expansion.json' with {type:'json'};
import {studyBank} from '../modules/asylum/reflection-bank.mjs';
import {baseImpactIds} from '../modules/asylum/base-impact.mjs';
import {adaptiveCards} from '../modules/asylum/adaptive-session.mjs';
import {questionProvenance} from '../modules/asylum/question-provenance.mjs';
const all=[...bank.questions,...country,...adaptiveCards];
test('337 own practice cards preserve 171 parent topics and individual objectives',()=>{
 assert.equal(bank.questions.length,241);assert.equal(country.length,8);assert.equal(adaptiveCards.length,88);
 assert.equal(all.length,337);assert.equal(Object.keys(expansion).length,171);
 assert.equal(new Set(all.map(q=>q.id)).size,337);
 assert.deepEqual(new Set(Object.values(expansion).flat()),new Set(all.map(q=>q.id)));
 for(const q of all){
  for(const lang of ['es','en']){assert.equal((q[`question_${lang}`].match(/\?/g)||[]).length,1,q.id);assert.ok(q[`objective_${lang}`],q.id);}
  const source=questionProvenance(q.id);assert.equal(source.official_verbatim,false);assert.ok(source.methodSources.length>=3);assert.ok(source.objective_es);assert.ok(source.objective_en);
 }
});
test('children remain adjacent within the same topic without inherited completion IDs',()=>{
 const indices=new Map(studyBank.map((q,i)=>[q.id,i]));
 for(const [parent,children] of Object.entries(expansion)){
  if(!indices.has(children[0]))continue;
  children.forEach((id,i)=>{assert.equal(indices.get(id),indices.get(children[0])+i);assert.equal(studyBank[indices.get(id)].topic,studyBank[indices.get(children[0])].topic);});
  if(children.length>1)assert.ok(!children.includes(parent));
 }
});
test('every split personal-impact base card retains its consent gate',()=>{
 const expected=[...expansion.IMMIGRA_ASYLUM_REFLECT_107,...expansion.IMMIGRA_ASYLUM_REFLECT_108_V2];
 assert.deepEqual(baseImpactIds,new Set(expected));assert.ok(expected.length>2);
});
