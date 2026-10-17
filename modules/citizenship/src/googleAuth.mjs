import {checkoutReturnUrl} from './checkoutIntent.mjs';
const unavailable=code=>Object.assign(new Error('Google sign-in unavailable'),{code});

export async function startGoogleOAuth({client,url,publishableKey,native=false,browser=window,request=fetch}){
 if(native)throw unavailable('google_native_unavailable');
 if(!client||!url||!publishableKey)throw unavailable('google_unavailable');
 let origin;
 try{const parsed=new URL(url);if(parsed.protocol!=='https:')throw Error();origin=parsed.origin;}catch{throw unavailable('google_unavailable');}
 // Check the provider before redirecting, so a disabled Google configuration
 // leaves the user on the app with email access and the purchase intact.
 let settings;
 try{
  const response=await request(`${origin}/auth/v1/settings`,{headers:{apikey:publishableKey},cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error();settings=await response.json();
 }catch{throw unavailable('google_unavailable');}
 if(settings?.external?.google!==true)throw unavailable('google_not_configured');
 const redirect=new URL(checkoutReturnUrl('',browser));redirect.hash='/account';
 const {data,error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:redirect.href,skipBrowserRedirect:true,queryParams:{prompt:'select_account'}}});
 if(error||!data?.url)throw unavailable('google_unavailable');
 try{const destination=new URL(data.url);if(destination.origin!==origin||destination.pathname!=='/auth/v1/authorize'||destination.searchParams.get('provider')!=='google')throw Error();}catch{throw unavailable('google_unavailable');}
 browser.location.assign(data.url);
}
