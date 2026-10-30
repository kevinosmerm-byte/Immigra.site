import React,{useState} from 'react';
import {reviewDraft} from './review-draft.mjs';
import './ReviewsRibbon.css';
const examples=[
 {lang:'es',label:'Ejemplo',name:'Diseño ilustrativo',flag:'🇪🇸',text:'Me gusta poder estudiar a mi ritmo.'},
 {lang:'en',label:'Sample',name:'Illustrative design',flag:'🇺🇸',text:'The practice questions are easy to follow.'},
 {lang:'fr',label:'Exemple',name:'Présentation illustrative',flag:'🇫🇷',text:'Une présentation claire et facile à utiliser.'},
 {lang:'pt',label:'Exemplo',name:'Design ilustrativo',flag:'🇵🇹',text:'Gosto de praticar no meu próprio ritmo.'},
 {lang:'de',label:'Beispiel',name:'Illustratives Design',flag:'🇩🇪',text:'Ich lerne gern in meinem eigenen Tempo.'},
];
function ReviewCard({example,duplicate=false}){return <article className="review-card" tabIndex={duplicate?undefined:0} lang={example.lang}><div className="review-card-top"><div className="review-avatar" aria-hidden="true"><svg viewBox="0 0 48 48"><circle cx="24" cy="17" r="9"/><path d="M8 45v-5a16 16 0 0 1 32 0v5Z"/></svg></div><div><strong className="review-example-label">{example.label}</strong><span className="review-stars" aria-label="5 illustrative stars · ejemplo, no valoración real">★★★★★</span></div></div><p>{example.text}</p><small><span aria-hidden="true">{example.flag}</span> {example.lang.toUpperCase()} · {example.name}</small></article>;}
function FloatingReactions(){return <div className="review-reactions" aria-hidden="true"><span>♥</span><span>👍</span><span>♥</span></div>;}
export default function ReviewsMarquee({lang='es',previewExamples=false}){
 const es=lang==='es',t=(a,b)=>es?a:b;
 const[paused,setPaused]=useState(false);
 const[rating,setRating]=useState(''),[comment,setComment]=useState(''),[name,setName]=useState(''),[language,setLanguage]=useState(lang),[draft,setDraft]=useState(null);
 const prepare=e=>{e.preventDefault();setDraft(reviewDraft({rating,comment,name,language}));};
 return <section className="reviews-ribbon" data-motion-paused={paused} aria-labelledby="reviews-title"><h2 id="reviews-title">{t('Tu experiencia cuenta','Your experience matters')}</h2>
 {previewExamples?<><p className="reviews-example-note">{t('EJEMPLOS DE DISEÑO · No son reseñas reales ni valoraciones de clientes.','DESIGN EXAMPLES · Not real reviews or customer ratings.')}</p><div className="reviews-marquee-shell"><FloatingReactions/><div className="reviews-marquee-window" tabIndex={0} role="region" aria-label={t('Ejemplos de reseñas; puedes pausar o desplazar la cinta','Example reviews; pause or scroll the ribbon')} onTouchStart={()=>setPaused(true)}><div className="reviews-track" data-paused={paused}><div className="reviews-group">{examples.map(example=><ReviewCard key={example.lang} example={example}/>)}</div><div className="reviews-group reviews-duplicate" aria-hidden="true" inert="">{examples.map(example=><ReviewCard key={example.lang} example={example} duplicate/>)}</div></div></div></div><button className="reviews-pause" type="button" aria-pressed={paused} onClick={()=>setPaused(value=>!value)}>{paused?t('Reanudar cinta','Resume ribbon'):t('Pausar cinta','Pause ribbon')}</button></>:<p>{t('Todavía no hay reseñas aprobadas para mostrar.','There are no approved reviews to display yet.')}</p>}

 <details><summary>{t('Preparar una reseña','Prepare a review')}</summary><p>{t('Solo borrador: todavía no se envía ni se publica. La publicación requerirá revisión y aprobación. No incluyas datos de tu caso migratorio ni información sensible.','Draft only: not sent or published yet. Publication will require review and approval. Do not include immigration case details or sensitive information.')}</p><form onSubmit={prepare}>
 <label>{t('Valoración','Rating')}<select required value={rating} onChange={e=>{setRating(e.target.value);setDraft(null);}}><option value="">{t('Selecciona 1 a 5','Choose 1 to 5')}</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} ★</option>)}</select></label>
 <label>{t('Idioma','Language')}<select value={language} onChange={e=>{setLanguage(e.target.value);setDraft(null);}}><option value="es">Español</option><option value="en">English</option><option value="fr">Français</option><option value="pt">Português</option><option value="de">Deutsch</option></select></label>
 <label>{t('Nombre visible (opcional)','Display name (optional)')}<input maxLength={40} value={name} autoComplete="off" onChange={e=>{setName(e.target.value);setDraft(null);}}/></label>
 <label className="review-comment">{t('Comentario','Comment')}<textarea required maxLength={500} rows={3} value={comment} onChange={e=>{setComment(e.target.value);setDraft(null);}}/></label><button type="submit">{t('Preparar borrador','Prepare draft')}</button></form>{draft&&<p role="status">{t('Borrador preparado solo en esta pantalla. No se ha enviado, guardado en un servidor ni publicado.','Draft prepared only on this screen. It has not been sent, saved on a server or published.')}</p>}</details>
 </section>;
}
