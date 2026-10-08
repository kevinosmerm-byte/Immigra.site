import test from 'node:test';
import assert from 'node:assert/strict';
import {modules,moduleById} from '../src/modules.js';
test('Three independent portals retain their specified identity and palette',()=>{
 assert.deepEqual(modules.map(m=>[m.id,m.color]),[['citizenship','#173D76'],['asylum','#6741A5'],['residency','#176B4D']]);
 assert.equal(new Set(modules.map(m=>m.id)).size,3);
});
test('Unknown module identifiers never fall back to another engine',()=>{
 for(const id of ['', 'account', 'unknown', '__proto__'])assert.equal(moduleById(id),null);
 for(const m of modules)assert.equal(moduleById(m.id),m);
});
test('Every portal has Spanish and English labels and descriptions',()=>{
 for(const m of modules)for(const field of ['es','en','descEs','descEn'])assert.ok(m[field]?.trim());
});
