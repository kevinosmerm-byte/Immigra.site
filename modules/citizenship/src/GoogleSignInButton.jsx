import {useRef,useState} from 'react';
import {Capacitor} from '@capacitor/core';
import {useAccount} from './accountContext.js';

export default function GoogleSignInButton({language='es',disabled=false,expectedEmail='',onBusyChange}){
 const {signInWithGoogle}=useAccount();
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),inFlight=useRef(false);
 const es=language==='es',t=(a,b)=>es?a:b;
 // Native Google sign-in needs its own platform setup and the equivalent Apple
 // option before App Store distribution. Existing native email access is kept.
 if(Capacitor.isNativePlatform())return null;
 async function signIn(){
  if(inFlight.current)return;inFlight.current=true;setBusy(true);onBusyChange?.(true);setError('');
  try{await signInWithGoogle();}catch(e){setError(e.code==='google_not_configured'?t('Google aún no está habilitado. Puedes continuar con tu correo.','Google is not enabled yet. You can continue with your email.'):t('No pudimos abrir Google. Revisa la conexión, reintenta o usa tu correo.','Could not open Google. Check your connection, retry or use your email.'));}
  finally{inFlight.current=false;setBusy(false);onBusyChange?.(false);}
 }
 return <div className="my-4! space-y-2!">
  <button type="button" onClick={signIn} disabled={disabled||busy} aria-busy={busy} className="inline-flex! min-h-12! w-full! items-center! justify-center! gap-3! rounded-2xl! border! border-slate-300! bg-white! px-5! py-3! text-base! font-semibold! text-slate-800! shadow-sm! hover:bg-slate-50! focus-visible:outline-2! focus-visible:outline-offset-4! focus-visible:outline-blue-700! disabled:opacity-50!">
   <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5! w-5! shrink-0!"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.04 46.98 31.89 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.96 23.96 0 0 0 0 21.56l7.98-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>
   {busy?t('Abriendo Google…','Opening Google…'):t('Continuar con Google','Continue with Google')}
  </button>
  {expectedEmail&&<p className="text-sm! leading-relaxed! text-[var(--liquid-muted,#53667a)]!">{t('Elige en Google el mismo correo que usaste para pagar.','Choose the same Google email you used to pay.')}</p>}
  {error&&<p role="alert" className="rounded-xl! bg-amber-50! p-3! text-sm! leading-relaxed! text-amber-950!">{error}</p>}
 </div>;
}
