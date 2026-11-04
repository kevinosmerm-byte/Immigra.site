import {useState} from 'react';
import AsylumAdaptivePicker from './AsylumAdaptivePicker.jsx';
// Experimental: production callers do not enable this control or its server capability.
export default function VoiceAdaptiveControls({value,lang='es',state,onBegin,onAction,onResume}){
 const [choosing,setChoosing]=useState(false),t=(es,en)=>lang==='es'?es:en;
 if(!value)return null;
 if(!choosing||state!=='paused')return value.offer||value.active?<button type="button" disabled={state==='processing'||state==='idle'} onClick={()=>{if(onBegin()!==false)setChoosing(true);}}>{t('Pausar voz para confirmar, omitir o corregir','Pause voice to confirm, skip or correct')}</button>:null;
 return <section aria-label={t('Confirmaciones con voz en pausa','Confirmations with voice paused')}>
  <p role="status">{t('Voz en pausa. El micrófono no se usa para confirmar. Selecciona los controles y después reanuda; también puedes continuar sin repregunta.','Voice paused. The microphone is not used to confirm. Choose the controls, then resume; you can also continue without a follow-up.')}</p>
  <AsylumAdaptivePicker key={value.offer?.id||value.active?.id||'none'} value={value} lang={lang} disabled={false} confirmationMode="paused-voice" onAction={onAction}/>
  {(value.offer||value.active)&&<button type="button" onClick={()=>onAction({type:value.active?.impact?'withdraw':'omit'})}>{t('Continuar sin repregunta','Continue without a follow-up')}</button>}
  <button type="button" onClick={()=>{setChoosing(false);onResume();}}>{t('Reanudar voz','Resume voice')}</button>
 </section>;
}
