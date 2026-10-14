import test from 'node:test';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';import assert from 'node:assert/strict';
test('PostgreSQL enforces unlimited first-use trial, expiry, subscription and permissions', async () => {
const migrationRoot=new URL('../supabase/migrations/',import.meta.url);
const db=new PGlite({extensions:{pgcrypto}});await db.exec('create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key);');
for(const name of fs.readdirSync(migrationRoot).filter(n=>n.endsWith('.sql')).sort()) await db.exec(fs.readFileSync(new URL(name,migrationRoot),'utf8'));
const user='10000000-0000-4000-8000-000000000001';await db.query('insert into auth.users values($1)',[user]);
const access=async()=> (await db.query('select public.get_practice_access($1) as result',[user])).rows[0].result;
const start=async(feature,key)=> (await db.query('select public.start_ai_session($1,$2,$3) as result',[user,feature,key])).rows[0].result;
assert.equal((await access()).status,'not_started');
let first=await start('coach','first-test-session');assert.equal(first.allowed,true);assert.equal(first.source,'free_trial');const firstTime=first.access.trialStartedAt;
for(let i=0;i<75;i++){const r=await start('coach','trial-session-'+String(i).padStart(6,'0'));assert.equal(r.allowed,true);assert.equal(r.access.trialStartedAt,firstTime);}
assert.equal((await start('coach','first-test-session')).sessionId,first.sessionId);console.log('PASS first-use anchor, 75 unlimited sessions and idempotency without resetting dates');
const second=await start('writing','second-feature-test');assert.equal(second.access.trialStartedAt,firstTime);
await db.query("update public.user_profiles set trial_started_at = now() - interval '7 days' where user_id=$1",[user]);assert.equal((await access()).status,'trial_expired');assert.equal((await start('coach','expired-session-test')).allowed,false);assert.equal((await start('coach','first-test-session')).allowed,false);console.log('PASS exact seven-day expiry and previously reserved session cannot bypass expiry');
await db.query("insert into public.entitlements(user_id,tier,status,period_end) values($1,'pro','active',now()+interval '1 day')",[user]);assert.equal((await start('coach','paid-session-test')).source,'pro_allowance');
await db.query("update public.entitlements set period_end=now() where user_id=$1",[user]);assert.equal((await access()).allowed,false);console.log('PASS verified subscription grants access; expired subscription does not');
await db.query("update public.ai_feature_config set enabled=false where feature='coach'");assert.equal((await start('coach','disabled-feature-test')).reason,'feature_unavailable');
const fresh='10000000-0000-4000-8000-000000000002';await db.query('insert into auth.users values($1)',[fresh]);const disabled=(await db.query('select public.start_ai_session($1,$2,$3) as result',[fresh,'coach','new-disabled-user'])).rows[0].result;assert.equal(disabled.allowed,false);const untouched=(await db.query('select public.get_practice_access($1) as result',[fresh])).rows[0].result;assert.equal(untouched.status,'not_started');
const snapshot=(await db.query('select public.get_ai_usage_snapshot($1) as result',[user])).rows[0].result;assert.equal(snapshot.access.status,'trial_expired');assert.equal(snapshot.tier,'free');assert.equal(snapshot.features.coach.proMonthlyLimit,null);console.log('PASS disabled-feature gate and time-based usage snapshot');
await db.exec(fs.readFileSync(new URL('202610120001_seven_day_trial.sql',migrationRoot),'utf8'));assert.equal((await access()).status,'trial_expired');
await db.exec('set role authenticated;');await assert.rejects(()=>db.query('select public.get_practice_access($1)',[user]),/permission denied/);await db.exec('reset role;');
await db.query('insert into public.native_store_purchases(provider,reference_hash,user_id,encrypted_reference) values($1,$2,$3,$4)',['apple','a'.repeat(64),fresh,'encrypted-fixture']);
await assert.rejects(()=>db.query('insert into public.native_store_purchases(provider,reference_hash,user_id,encrypted_reference) values($1,$2,$3,$4)',['apple','a'.repeat(64),user,'different-fixture']),/duplicate key/);
await db.exec('set role authenticated;');await assert.rejects(()=>db.query('select * from public.native_store_purchases'),/permission denied/);await db.exec('reset role;');
await db.query('delete from auth.users where id=$1',[fresh]);assert.equal((await db.query('select count(*)::int as count from public.native_store_purchases')).rows[0].count,0);
console.log('PASS native purchase ownership uniqueness, browser denial and account deletion cascade');
await db.query('insert into public.ai_feedback_reports(user_id,feature,reason,response_text,expires_at) values($1,$2,$3,$4,now()-interval \'1 day\')',[user,'coach','incorrect','Consented AI fixture']);
assert.equal((await db.query('select public.purge_expired_ai_feedback() as count')).rows[0].count,1);
await db.exec('set role authenticated;');await assert.rejects(()=>db.query('select * from public.ai_feedback_reports'),/permission denied/);await db.exec('reset role;');console.log('PASS consented AI feedback has expiration cleanup and browser privacy');await db.close();console.log('PASS authenticated browser role cannot grant itself trial access');

});
