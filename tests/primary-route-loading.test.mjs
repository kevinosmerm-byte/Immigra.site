import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('primary routes load with the shell instead of requesting stale chunks on navigation',async()=>{
  const source=await readFile(new URL('../src/main.jsx',import.meta.url),'utf8');
  for(const [name,path] of [['Citizenship','../modules/citizenship/Module.jsx'],['Asylum','../modules/asylum/Module.jsx'],['Residency','../modules/residency/src/Residency.jsx']]){
    assert.ok(source.includes(`import ${name} from '${path}';`),name+' must be in the initial module graph');
    assert.ok(!source.includes(`import('${path}')`),name+' must not load on first navigation');
  }
  assert.ok(source.includes("hidden={page!=='residency'}"),'keep hidden practice state mounted');
});
