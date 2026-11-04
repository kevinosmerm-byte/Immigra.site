import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {readAppRoute,appRouteHash} from '../modules/citizenship/routes.mjs';
import {authorizeModule,reserveModuleQuota} from '../shared/subscriptions/quota.mjs';
test('unified citizenship routes preserve modes without escaping module',()=>{assert.equal(appRouteHash('interview','n400'),'#/citizenship/interview?mode=n400');assert.deepEqual(readAppRoute('#/citizenship/interview?mode=n400'),{screen:'interview',interviewMode:'n400'});assert.equal(readAppRoute('#/citizenship/not-a-route').screen,'home');});
test('shared quota denies missing identity and consent without reservation',async()=>{let calls=0;const reserve=async()=>{calls++;return true};assert.equal((await authorizeModule({module:'asylum',consent:true,reserve})).status,401);assert.equal((await authorizeModule({userId:'a',module:'residency',consent:'yes',reserve})).status,400);assert.equal(calls,0);});
test('shared quota fails closed on exhaustion and database outage',async()=>{const args={userId:'a',module:'residency',consent:true};assert.equal((await authorizeModule({...args,reserve:async()=>false})).status,429);assert.equal((await authorizeModule({...args,reserve:async()=>{throw Error('private database details')}})).error,'QUOTA_UNAVAILABLE');assert.equal((await authorizeModule({...args,reserve:async()=>true})).status,200);});
test('reservation sends only server identity and module, never client tier',async()=>{let payload;const allowed=await reserveModuleQuota({userId:'u',module:'asylum',env:{SUPABASE_URL:'https://test.invalid',SUPABASE_SECRET_KEY:'mock'},fetchImpl:async(url,options)=>{payload=JSON.parse(options.body);return {ok:true,json:async()=>({allowed:true})};}});assert.equal(allowed,true);assert.deepEqual(payload,{p_user_id:'u',p_module:'asylum'});await assert.rejects(reserveModuleQuota({userId:'u',module:'unknown'}));});
test('official civics and asylum engine retain migration snapshot hashes',async()=>{const manifest=JSON.parse(await readFile(new URL('../connected-apps/manifest.json',import.meta.url)));for(const [module,files] of [['citizenship',['src/data/uscis2025Civics.json','src/civicsAnswerEvaluator.js']],['asylum',['packages/core/index.cjs','apps/web/package-data.js']]])for(const file of files){const bytes=await readFile(new URL('../modules/'+module+'/'+file,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest[module].files[file],module+'/'+file);}});

// N-400 was deliberately extended with provenance in the reviewed integration.
// Keep the historical migration manifest unchanged; validate the reviewed revision separately.
test('reviewed N400 provenance engine retains integration snapshot',async()=>{
 const bytes=await readFile(new URL('../modules/citizenship/src/n400InterviewEngine.js',import.meta.url));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'df2e39e8de0581d43a77b4162765db898ae9e9ec19546d2ef8c69f873846ce0e');
});
