import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('checkout migration preserves immutable attempts, CAS rotation, browser isolation and deletion cascade',async t=>{
 const db=new PGlite();t.after(()=>db.close());
 await db.exec('create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key);');
 const user='10000000-0000-4000-8000-000000000001',hash='a'.repeat(64);
 await db.query('insert into auth.users(id) values($1)',[user]);
 const sql=await readFile(new URL('../supabase/migrations/202610290001_checkout_reservations.sql',import.meta.url),'utf8');
 await db.exec(sql);await db.exec(sql);
 const payload={client_reference_id:user,metadata:{interval:'monthly'},customer_email:'fixture@example.test'};
 const reserve=async(value=payload,expired=null)=>(await db.query('select public.reserve_checkout_attempt($1,$2,$3) as result',[hash,value,expired])).rows[0].result;
 const save=async(attempt,id)=>(await db.query('select public.save_checkout_attempt($1,$2,$3) as result',[hash,attempt,id])).rows[0].result;
 const first=await reserve();const retry=await reserve({...payload,metadata:{interval:'annual'}});
 assert.equal(first.attempt_id,retry.attempt_id);assert.equal(retry.payload.metadata.interval,'monthly');
 assert.equal(await save(first.attempt_id,'cs_test_original123'),true);
 assert.equal(await save(first.attempt_id,'cs_test_foreign123'),false);
 assert.equal((await reserve(payload,'cs_test_wrong123')).attempt_id,first.attempt_id);
 const next=await reserve(payload,'cs_test_original123');assert.notEqual(next.attempt_id,first.attempt_id);
 assert.equal((await reserve(payload,'cs_test_original123')).attempt_id,next.attempt_id);
 assert.equal(await save(first.attempt_id,'cs_test_original123'),false);
 for(const role of ['anon','authenticated']){
  await db.exec(`set role ${role}`);
  await assert.rejects(db.query('select * from public.checkout_attempts'),/permission denied/);
  await assert.rejects(reserve(),/permission denied/);await assert.rejects(save(next.attempt_id,'cs_test_new123'),/permission denied/);
  await db.exec('reset role');
 }
 await db.exec('set role service_role');assert.equal((await reserve()).attempt_id,next.attempt_id);await db.exec('reset role');
 await db.query('delete from auth.users where id=$1',[user]);
 assert.equal((await db.query('select count(*)::int as count from public.checkout_attempts')).rows[0].count,0);
});
