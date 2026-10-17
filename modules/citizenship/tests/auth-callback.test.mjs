import test from 'node:test';
import assert from 'node:assert/strict';
import {authCallbackKind} from '../../../shared/authentication/callback.mjs';
import {moduleFromHash} from '../../../shared/navigation/routes.mjs';

test('implicit verification fragments resolve to account before a session is available',()=>{
  const hash='#access_token=fixture-only&refresh_token=fixture-only&type=magiclink';
  assert.equal(authCallbackKind({hash}),'session');
  assert.equal(moduleFromHash(hash),'account');
});
test('authorization-code returns resolve to account while preserving the selected plan',()=>{
  const location=new URL('https://immigra.site/?code=fixture-only&checkout=annual');
  assert.equal(authCallbackKind(location),'code');
  assert.equal(moduleFromHash(location.hash,location.search),'account');
  assert.equal(location.searchParams.get('checkout'),'annual');
  assert.equal(location.searchParams.get('code'),'fixture-only');
});
test('expired and rejected verification links resolve to account instead of not found',()=>{
  for(const location of [{hash:'#error=access_denied&error_code=otp_expired'},{search:'?error=access_denied'},{hash:'#error_code=otp_expired'}]){
    assert.equal(authCallbackKind(location),'error');
    assert.equal(moduleFromHash(location.hash,location.search),'account');
  }
});
test('module routes and unknown destinations retain their normal routing',()=>{
  for(const module of ['asylum','citizenship','residency','account','settings'])assert.equal(moduleFromHash('#/'+module+'/practice'),module);
  assert.equal(moduleFromHash(''),'');
  assert.equal(moduleFromHash('#/missing'),'missing');
  assert.equal(authCallbackKind({hash:'#/asylum/fiction?code=country'}),null);
  assert.equal(authCallbackKind({search:'?checkout=monthly'}),null);
});
