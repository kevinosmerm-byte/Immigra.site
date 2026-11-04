import AsylumSourceNote from './AsylumSourceNote.jsx';
import {baseImpactIds,impactWarning} from './base-impact.mjs';
import {useEffect,useRef,useState} from 'react';
import {studyBank as bank, studyInstructions} from './reflection-bank.mjs';
import {newSession,restoreSession,saveSession,advanceSession,skipStudyTopic,skipStudyQuestion} from './study-session.mjs';
import '../../shared/design-system/asylum-study-book.css';
const byId=new Map(bank.map(q=>[q.id,q]));
import {asylumCountries as countries} from './countries.mjs';
function storage(){try{return window.localStorage;}catch{return null;}}
export default function AsylumStudyBook({lang='es'}){
 const es=lang==='es';
 const [revealedImpact,setRevealedImpact]=useState(null);
 const [session,setSession]=useState(()=>restoreSession(storage(),bank,countries));
 // Keep a pending migration backup across country changes, reset and deselection.
 const previousBankSession=useRef(session?.previousBankSession);
 const [motion,setMotion]=useState({turn:0,direction:1});
 const touch=useRef(null),lock=useRef(0);
 useEffect(()=>saveSession(storage(),session,previousBankSession.current),[session]);
 const country=session?.country||'',index=session?.index||0,question=session?.completed?null:byId.get(session?.order[index]);
 const move=delta=>{
  if(!session||Date.now()<lock.current)return;
  const next=advanceSession(session,delta);
  if(next.index===index)return;
  lock.current=Date.now()+240;setRevealedImpact(null);setSession(next);setMotion(m=>({turn:m.turn+1,direction:delta}));
 };
 const passQuestion=()=>{if(!session||Date.now()<lock.current)return;lock.current=Date.now()+240;setRevealedImpact(null);setSession(skipStudyQuestion(session));setMotion(m=>({turn:m.turn+1,direction:1}));};
 const restart=()=>{setRevealedImpact(null);setSession(newSession(bank,country));setMotion(m=>({turn:m.turn+1,direction:1}));};
 return <section className="asylum-study-book" aria-label={es?'Tarjetas de estudio de asilo':'Asylum study cards'}>
  <header><p className="study-eyebrow">{es?'ESTUDIO · SIN ENTREVISTA':'STUDY · NO INTERVIEW'}</p><h1>{es?'Una pregunta a la vez':'One question at a time'}</h1><p>{es?'Preguntas educativas para leer a tu ritmo. No son preguntas oficiales ni asesoría legal.':'Educational questions to read at your own pace. These are not official questions or legal advice.'}</p></header>
  <p className="study-context">{studyInstructions[es?'es':'en']}</p>
  {session?.migration&&<p role="status">{session.migration.reordered?(es?'Ahora las tarjetas siguen un orden por temas. Se conservó la sesión anterior y esta secuencia empieza desde el principio.':'Cards now follow a topic sequence. Your previous session was preserved; this sequence starts at the beginning.') : es?'El banco se actualizó. Las preguntas nuevas están pendientes y no heredan avance del banco anterior.':'The bank was updated. New questions remain unreviewed and do not inherit progress from the earlier bank.'}</p>}
  <label>{es?'País de referencia':'Reference country'}<select value={country} onChange={e=>{setRevealedImpact(null);setSession(e.target.value?newSession(bank,e.target.value):null);setMotion(m=>({turn:m.turn+1,direction:1}));}}><option value="">{es?'Selecciona un país':'Choose a country'}</option>{countries.map(c=><option key={c} value={c}>{c==='Other'?(es?'Otro país':'Other country'):c==='Haiti'?(es?'Haití':'Haiti'):c}</option>)}</select></label>
  {session?.completed&&<section role="status"><p>{es?'Llegaste al final del recorrido. Pasar preguntas no registra respuestas ni demuestra dominio.':'You reached the end of this sequence. Skipping questions does not record answers or establish mastery.'}</p><button type="button" onClick={restart}>{es?'Volver a empezar':'Start again'}</button></section>}
  {question&&<><p className="study-context">{es?'Preguntas generales, con preguntas del país seleccionado cuando están disponibles, en una secuencia por temas. El avance se guarda si el dispositivo permite almacenamiento local.':'General questions, with questions for the selected country when available, in a topic-based sequence. Progress is saved when this device permits local storage.'}</p>
  <p className="study-context">{es?'Si una pregunta o un tema no corresponde a tu experiencia, puedes omitirlo. El recorrido no deduce lo que te ocurrió.':'If a question or topic does not apply to your experience, you may skip it. This sequence does not infer what happened to you.'}</p>
  <button type="button" aria-label={es?'Pasar esta pregunta sin responder':'Skip this question without answering'} onClick={passQuestion}>{es?'Pasar pregunta':'Skip question'}</button>
  <button type="button" onClick={()=>{const next=skipStudyTopic(session);setRevealedImpact(null);setSession(next);setMotion(m=>({turn:m.turn+1,direction:1}));}}>{es?'Omitir este tema':'Skip this topic'}</button>
  <div className="study-page" tabIndex={0} role="group" aria-label={es?'Tarjeta. Usa las flechas para cambiar de pregunta.':'Card. Use arrow keys to change questions.'}
    onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}}}
    onTouchStart={e=>{touch.current=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;}}
    onTouchCancel={()=>{touch.current=null;}}
    onTouchEnd={e=>{const p=touch.current;touch.current=null;if(!p||!e.changedTouches.length)return;const dx=e.changedTouches[0].clientX-p.x,dy=e.changedTouches[0].clientY-p.y;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)move(dx<0?1:-1);}}>
    <div className="study-water" aria-hidden="true"><svg viewBox="0 0 1200 360" preserveAspectRatio="none"><defs><linearGradient id="study-water-color" x2="0" y2="1"><stop stopColor="#99c7ff" stopOpacity=".65"/><stop offset=".55" stopColor="#d2c4ff" stopOpacity=".5"/><stop offset="1" stopColor="#f4efff" stopOpacity=".85"/></linearGradient></defs><path d="M-100 90 C120 -90 260 360 500 225 S760 300 950 125 S1160 30 1300 100 V400 H-100Z"/><path d="M-100 140 C120 20 280 380 530 245 S780 330 980 160 S1170 80 1300 130 V400 H-100Z"/></svg><i/><i/><i/></div>
    <p className="study-topic">{question[es?'topic_es':'topic_en']}</p>
    <span className="study-count">{index+1} / {session.order.length}</span>
    <div className="study-live" aria-live="polite" aria-atomic="true"><div key={motion.turn} className="study-question" style={{'--study-direction':motion.direction}}>{baseImpactIds.has(question.id)&&revealedImpact!==question.id?<section aria-label={es?'Pregunta opcional de impacto':'Optional impact question'}><p lang={es?'es':'en'}>{impactWarning[es?'es':'en']}</p><button type="button" onClick={passQuestion}>{es?'Omitir y continuar':'Skip and continue'}</button><button type="button" onClick={()=>setRevealedImpact(question.id)}>{es?'Quiero leer esta pregunta':'I want to read this question'}</button></section>:<p lang={es?'es':'en'}>{question[es?'question_es':'question_en']}</p>}</div><span className="study-sr">{index+1} / {session.order.length}</span></div>
    <AsylumSourceNote questionId={question.id} lang={lang}/>
    <div key={'ripple'+motion.turn} className="study-ripple" aria-hidden="true"/>
    <nav aria-label={es?'Cambiar pregunta':'Change question'}><button disabled={index===0} onClick={()=>move(-1)}>← {es?'Anterior':'Previous'}</button><span className="study-dots" aria-hidden="true">{[0,1,2,3].map(n=><i key={n} className={Math.min(3,Math.floor(index/session.order.length*4))===n?'active':''}/>)}</span>{index===session.order.length-1?<button className="study-next" onClick={restart}>{es?'Estudiar de nuevo':'Study Again'} ↻</button>:<button className="study-next" onClick={()=>move(1)}>{es?'Siguiente':'Next'} →</button>}</nav>
  </div><p className="study-hint">{es?'Desliza o usa las flechas del teclado.':'Swipe or use the keyboard arrow keys.'}</p></>}
 </section>;
}
