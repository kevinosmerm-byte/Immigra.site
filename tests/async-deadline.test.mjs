import test from 'node:test';
import assert from 'node:assert/strict';
import {withDeadline} from '../shared/async-deadline.mjs';
test('hung SDK work releases the loading state with a bounded rejection',async()=>{
 await assert.rejects(withDeadline(()=>new Promise(()=>{}),20),{code:'OPERATION_TIMEOUT'});
});
test('deadline preserves success and original failure',async()=>{
 assert.equal(await withDeadline(()=>42),42);
 const error=new Error('original');await assert.rejects(withDeadline(()=>{throw error;}),e=>e===error);
});
