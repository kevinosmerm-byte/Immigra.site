import {useRef,useState} from 'react';
import {useAccount} from './accountContext.js';

// Standard Supabase authentication, not a reviewer bypass or client entitlement.
export default function PasswordSignIn({language='es',disabled=false,onBusyChange}){
 const {signInWithPassword}=useAccount();
 const [email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const inFlight=useRef(false),es=language==='es',t=(a,b)=>es?a:b;
 async function submit(event){
  event.preventDefault();if(disabled||inFlight.current)return;
  inFlight.current=true;setBusy(true);onBusyChange?.(true);setMessage('');
  try{
   await signInWithPassword(email,password);
   setMessage(t('Verificando sesión…','Verifying session…'));
  }catch{
   setMessage(t('No pudimos iniciar sesión. Comprueba tus datos y la conexión, o usa el enlace por correo.','Could not sign in. Check your credentials and connection, or use the email link.'));
  }finally{setPassword('');inFlight.current=false;setBusy(false);onBusyChange?.(false);}
 }
 const field='block! min-h-12! w-full! rounded-xl! border! border-[var(--color-border)]! bg-[var(--color-white)]! px-4! py-3! text-[var(--color-text)]!';
 return <details className="my-4! rounded-xl! border! border-[var(--color-border)]! p-4!">
  <summary className="min-h-11! cursor-pointer! font-semibold!">{t('Entrar con contraseña','Sign in with password')}</summary>
  <p>{t('Para cuentas que ya tienen una contraseña configurada.','For accounts that already have a password configured.')}</p>
  <form onSubmit={submit} className="space-y-3!" aria-busy={busy}>
   <label className="block!">{t('Correo electrónico','Email address')}<input className={field} type="email" autoComplete="username" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} disabled={busy||disabled}/></label>
   <label className="block!">{t('Contraseña','Password')}<input className={field} type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} disabled={busy||disabled}/></label>
   <button type="submit" disabled={busy||disabled} className="min-h-12! rounded-xl! bg-[var(--color-primary)]! px-5! py-3! font-semibold! text-[var(--color-white)]! disabled:opacity-50!">{busy?t('Entrando…','Signing in…'):t('Iniciar sesión','Sign in')}</button>
   {message&&<p role="status">{message}</p>}
  </form>
 </details>;
}
