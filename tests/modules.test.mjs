import test from 'node:test';
import assert from 'node:assert/strict';
import {modules,moduleById} from '../src/modules.js';
test('Three modules retain their specified identity and official glass palette',()=>{
 assert.deepEqual(modules.map(m=>[m.id,m.color]),[['citizenship','#175CD3'],['asylum','#7944C6'],['residency','#168464']]);
 assert.equal(new Set(modules.map(m=>m.id)).size,3);
});
test('Unknown module identifiers never fall back to another engine',()=>{
 for(const id of ['', 'account', 'unknown', '__proto__'])assert.equal(moduleById(id),null);
 for(const m of modules)assert.equal(moduleById(m.id),m);
});
test('Every portal has Spanish and English labels and descriptions',()=>{
 for(const m of modules)for(const field of ['es','en','descEs','descEn'])assert.ok(m[field]?.trim());
});

