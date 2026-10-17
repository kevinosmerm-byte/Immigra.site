import {useEffect,useId,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {useAccount} from '../modules/citizenship/src/accountContext.js';

const control='block! min-h-12! w-full! rounded-xl! border! border-slate-300! bg-white! px-3! py-2! text-base! text-slate-900! focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-blue-700!';
const action='inline-flex! min-h-12! items-center! justify-center! rounded-xl! border! border-slate-300! px-4! py-3! text-base! font-semibold! focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-blue-700! disabled:cursor-not-allowed! disabled:opacity-60!';
export default function AIReport({language='es',moduleId='general',responseExcerpt='',onOpen,compact=false,className=''}){
 const {session}=useAccount(),id=useId(),dialog=useRef(null),opener=useRef(null),request=useRef(null);
 const [reportId,setReportId]=useState('');
 const [open,setOpen]=useState(false),[category,setCategory]=useState(''),[note,setNote]=useState(''),[includeResponse,setIncludeResponse]=useState(false),[pending,setPending]=useState(false),[sent,setSent]=useState(false),[error,setError]=useState('');
 const es=language==='es',t=(a,b)=>es?a:b;
 const excerpt=String(responseExcerpt||'').slice(0,1200),module=['citizenship','asylum','residency'].includes(moduleId)?moduleId:'general';
 const close=()=>{request.current?.abort();setOpen(false);setPending(false);setNote('');setIncludeResponse(false);setCategory('');setSent(false);setError('');setReportId('');};
 useEffect(()=>{if(open){dialog.current?.showModal();}else if(dialog.current?.open){dialog.current.close();opener.current?.focus();}},[open]);
 useEffect(()=>()=>request.current?.abort(),[]);
 async function submit(event){
  event.preventDefault();if(pending||!category||!session?.access_token)return;
  const controller=new AbortController();request.current=controller;setPending(true);setError('');
  const timeout=setTimeout(()=>controller.abort('timeout'),10000);
  try{
   const response=await fetch('/api/ai-reports',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},signal:controller.signal,body:JSON.stringify({reportId,category,module,locale:es?'es':'en',note,includeResponse,responseExcerpt:includeResponse?excerpt:''})});
   if(!response.ok){setError(response.status===429?t('Ya recibimos varios reportes. Espera un momento e inténtalo nuevamente.','Several reports were received. Please wait and try again.'):response.status===401?t('Tu sesión venció. Vuelve a iniciar sesión para enviar el reporte.','Your session expired. Sign in again to send the report.'):t('No se pudo enviar. Tu reporte sigue aquí; puedes reintentar.','Could not send. Your report is still here; you can retry.'));return;}
   const data=await response.json();if(data.received!==true)throw Error('Not confirmed');setSent(true);setNote('');setIncludeResponse(false);
  }catch{if(!controller.signal.aborted||controller.signal.reason==='timeout')setError(t('No se pudo confirmar el envío. Revisa la conexión y reintenta.','Submission could not be confirmed. Check your connection and retry.'));}
  finally{clearTimeout(timeout);if(request.current===controller){request.current=null;setPending(false);}}
 }
 return <>
  <button type="button" ref={opener} className={className||'inline-flex! min-h-11! items-center! rounded-xl! border-0! bg-transparent! px-3! text-sm! text-slate-700! underline! focus-visible:outline-2! focus-visible:outline-blue-700!'} aria-label={t('Reportar respuesta de IA','Report AI response')} onClick={()=>{setReportId(crypto.randomUUID());setOpen(true);onOpen?.();}}>{compact?<><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 21V3m0 0c5-3 9 4 14 0v10c-5 4-9-3-14 0"/></svg><span>{t('Reportar','Report')}</span></>:t('Reportar respuesta de IA','Report AI response')}</button>
  {createPortal(<dialog ref={dialog} aria-labelledby={id+'-title'} onCancel={event=>{event.preventDefault();close();}} onClose={()=>{if(open)close();}} className="m-auto! max-h-[85dvh]! w-[min(92vw,34rem)]! overflow-y-auto! overscroll-contain! rounded-3xl! border! border-white/80! bg-slate-50! p-5! text-slate-900! shadow-2xl! backdrop:bg-slate-950/50! sm:p-7!">
   <h2 id={id+'-title'} className="m-0! mb-4! text-2xl! font-bold! text-slate-950!">{t('Reportar respuesta de IA','Report AI response')}</h2>
   {sent?<div role="status"><p className="text-lg! text-emerald-900!">{t('Recibimos tu reporte. Gracias por ayudarnos a mejorar.','Your report was received. Thank you for helping us improve.')}</p><p className="text-sm! text-slate-600!">{t('Referencia: ','Reference: ')}{reportId}</p></div>:!session?<p role="status">{t('Agrega tu correo o inicia sesión en Cuenta para enviar un reporte.','Enter your email or sign in through Account to send a report.')}</p>:<form onSubmit={submit} className="space-y-4!" aria-busy={pending}>
    <p className="text-base! leading-relaxed! text-slate-700!">{t('No incluyas nombres, documentos ni datos privados. El reporte se guarda cifrado para revisión y se elimina mediante limpieza periódica tras 30 días.','Do not include names, documents or private details. The report is encrypted for review and removed through periodic cleanup after 30 days.')}</p>
    <label htmlFor={id+'-category'} className="block! font-semibold!">{t('¿Qué problema encontraste?','What went wrong?')}<select id={id+'-category'} required value={category} onChange={event=>setCategory(event.target.value)} className={control} disabled={pending}><option value="">{t('Elige un motivo','Choose a reason')}</option>{[['incorrect','Información incorrecta','Incorrect information'],['legal_advice','Parece dar asesoría legal','Appears to give legal advice'],['offensive','Contenido ofensivo o peligroso','Offensive or harmful content'],['privacy','Problema de privacidad','Privacy concern'],['other','Otro problema','Other issue']].map(([value,a,b])=><option value={value} key={value}>{t(a,b)}</option>)}</select></label>
    <label htmlFor={id+'-note'} className="block! font-semibold!">{t('Descripción breve (opcional)','Brief description (optional)')}<textarea id={id+'-note'} className={control} rows={3} maxLength={1000} value={note} disabled={pending} onChange={event=>setNote(event.target.value)}/></label>
    {excerpt&&<label className="flex! min-h-11! cursor-pointer! items-start! gap-3! text-sm! leading-relaxed! text-slate-700!"><input type="checkbox" className="mt-1! size-5! shrink-0! accent-blue-700!" checked={includeResponse} disabled={pending} onChange={event=>setIncludeResponse(event.target.checked)}/><span>{t('Autorizo incluir el fragmento de respuesta mostrado abajo.','I authorize including the response excerpt shown below.')}<details><summary className="min-h-11! cursor-pointer! py-3! underline!">{t('Ver fragmento','View excerpt')}</summary><blockquote className="m-0! rounded-xl! bg-white! p-3! font-normal!">{excerpt}</blockquote></details></span></label>}
    {error&&<p role="alert" className="text-base! text-red-800!">{error}</p>}
    <button type="submit" className={action+' w-full! bg-blue-700! text-white!'} disabled={pending||!category}>{pending?t('Enviando…','Sending…'):t('Enviar reporte','Send report')}</button>
   </form>}
   <button type="button" className={action+' mt-4! w-full! bg-white! text-slate-800!'} onClick={close}>{sent?t('Listo','Done'):t('Cerrar','Close')}</button>
  </dialog>,document.body)}
 </>;
}
