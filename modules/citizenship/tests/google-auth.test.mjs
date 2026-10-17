import test from 'node:test';
import assert from 'node:assert/strict';
import {startGoogleOAuth} from '../src/googleAuth.mjs';

function fixture(href='https://immigra.site/#/account'){
 let assigned=null,settingsCalls=0,oauthCalls=[];
 const browser={location:new URL(href),localStorage:{getItem:()=>null},sessionStorage:{getItem:()=>null}};browser.location.assign=url=>{assigned=url;};
 const dependencies={browser,url:'https://project.supabase.co',publishableKey:'public-fixture',request:async(url,options)=>{settingsCalls++;assert.equal(url,'https://project.supabase.co/auth/v1/settings');assert.equal(options.headers.apikey,'public-fixture');return {ok:true,json:async()=>({external:{google:true}})};},client:{auth:{signInWithOAuth:async payload=>{oauthCalls.push(payload);return {data:{url:'https://project.supabase.co/auth/v1/authorize?provider=google'},error:null};}}}};
 return {dependencies,assigned:()=>assigned,settingsCalls:()=>settingsCalls,oauthCalls:()=>oauthCalls};
}
test('web Google OAuth uses the existing provider, account return and a trusted authorization URL',async()=>{
 const f=fixture();await startGoogleOAuth(f.dependencies);assert.equal(f.assigned(),'https://project.supabase.co/auth/v1/authorize?provider=google');assert.equal(f.settingsCalls(),1);assert.deepEqual(f.oauthCalls()[0],{provider:'google',options:{redirectTo:'https://immigra.site/#/account',skipBrowserRedirect:true,queryParams:{prompt:'select_account'}}});
});
test('post-payment Google sign-in preserves the purchase reference and never starts a second checkout',async()=>{
 const f=fixture('https://immigra.site/?guest_checkout=return&session_id=cs_test_GuestCheckout123#/account');await startGoogleOAuth(f.dependencies);const redirect=new URL(f.oauthCalls()[0].options.redirectTo);assert.equal(redirect.searchParams.get('session_id'),'cs_test_GuestCheckout123');assert.equal(redirect.searchParams.get('guest_checkout'),'return');assert.equal(redirect.searchParams.has('checkout'),false);
});
test('an explicitly selected plan survives Google authentication',async()=>{
 const f=fixture('https://immigra.site/?checkout=annual#/account');await startGoogleOAuth(f.dependencies);assert.equal(new URL(f.oauthCalls()[0].options.redirectTo).searchParams.get('checkout'),'annual');
});
test('disabled Google and provider lookup failures stay in the app without OAuth or navigation',async()=>{
 for(const request of [async()=>({ok:true,json:async()=>({external:{google:false}})}),async()=>({ok:false}),async()=>{throw Error('network/private detail');}]){
  const f=fixture();await assert.rejects(startGoogleOAuth({...f.dependencies,request}),error=>['google_not_configured','google_unavailable'].includes(error.code)&&!error.message.includes('private'));assert.equal(f.assigned(),null);assert.equal(f.oauthCalls().length,0);
 }
});
test('native and missing configuration never invoke Google or expose credentials',async()=>{
 for(const extra of [{native:true},{client:null},{url:'http://project.supabase.co'},{publishableKey:''}]){const f=fixture();await assert.rejects(startGoogleOAuth({...f.dependencies,...extra}));assert.equal(f.settingsCalls(),0);assert.equal(f.assigned(),null);}
});
test('OAuth errors and unexpected provider destinations cannot redirect the user',async()=>{
 for(const result of [{error:{message:'private SDK message'},data:null},{data:{url:'https://evil.example/auth/v1/authorize?provider=google'}},{data:{url:'https://project.supabase.co/auth/v1/authorize?provider=github'}},{data:{url:'https://project.supabase.co/other?provider=google'}}]){
  const f=fixture();f.dependencies.client.auth.signInWithOAuth=async()=>result;await assert.rejects(startGoogleOAuth(f.dependencies),error=>error.code==='google_unavailable');assert.equal(f.assigned(),null);
 }
});
