import {useRef,useState} from 'react';
import bankText from './master-package/03_question_bank/question_bank.jsonl?raw';
import supplemental from '../../shared/interview-ui/supplemental-questions.json';
import {reviewQuestions} from './country-review.mjs';
import '../../shared/design-system/asylum-study-book.css';
const bank=[...bankText.trim().split(/\r?\n/).map(line=>JSON.parse(line)),...supplemental.asylum,...reviewQuestions];
const countries=['Venezuela','Cuba','Nicaragua','Colombia','Haiti','China','Other'];
export default function AsylumStudyBook({lang='es'}){
 const es=lang==='es',[country,setCountry]=useState(''),[positions,setPositions]=useState({}),[turn,setTurn]=useState(0);
 const touch=useRef(null),lock=useRef(0);
 const questions=bank.filter(q=>!q.country||q.country===country);
 const index=Math.max(0,questions.findIndex(q=>q.id===positions[country]));
 const question=questions[index];
 const move=delta=>{if(Date.now()<lock.current)return;const next=Math.max(0,Math.min(questions.length-1,index+delta));if(next===index)return;lock.current=Date.now()+220;setPositions(p=>({...p,[country]:questions[next].id}));setTurn(t=>t+1);};
 return <section className="asylum-study-book" aria-label={es?'Libro de preguntas de asilo':'Asylum question book'}>
  <header><p className="study-eyebrow">{es?'ESTUDIO · SIN ENTREVISTA':'STUDY · NO INTERVIEW'}</p><h1>{es?'Una pregunta a la vez':'One question at a time'}</h1><p>{es?'Preguntas educativas para leer a tu ritmo. No son preguntas oficiales ni asesoría legal.':'Educational questions to read at your own pace. These are not official questions or legal advice.'}</p></header>
  <label>{es?'País de referencia':'Reference country'}<select value={country} onChange={e=>setCountry(e.target.value)}><option value="">{es?'Selecciona un país':'Choose a country'}</option>{countries.map(c=><option key={c} value={c}>{c==='Other'?(es?'Otro país':'Other country'):c==='Haiti'?(es?'Haití':'Haiti'):c}</option>)}</select></label>
  {country&&<><p className="study-context">{es?'Incluye preguntas generales y las específicas disponibles para tu selección. No presupone hechos de tu historia.':'Includes general questions and available prompts specific to your selection. It does not assume facts about your story.'}</p>
  <div className="study-page" tabIndex={0} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}}} onTouchStart={e=>{touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}} onTouchEnd={e=>{const p=touch.current;touch.current=null;if(!p)return;const dx=e.changedTouches[0].clientX-p.x,dy=e.changedTouches[0].clientY-p.y;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)move(dx<0?1:-1);}}>
    <span className="study-count">{index+1} / {questions.length}</span><div key={turn} className="study-question" aria-live="polite"><p lang={es?'es':'en'}>{question[es?'question_es':'question_en']}</p></div><small>{question.id}</small>
  </div><nav aria-label={es?'Cambiar pregunta':'Change question'}><button disabled={index===0} onClick={()=>move(-1)}>← {es?'Anterior':'Previous'}</button><span>{es?'Desliza o usa las flechas':'Swipe or use arrow keys'}</span><button disabled={index===questions.length-1} onClick={()=>move(1)}>{es?'Siguiente':'Next'} →</button></nav></>}
 </section>;
}
