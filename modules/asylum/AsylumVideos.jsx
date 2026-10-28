import React,{useState} from 'react';
import VideoResourceCard from '../../shared/components/VideoResourceCard.jsx';
import '../../shared/design-system/asylum-videos.css';
const videos=[
 ['5fBHSfg5tdY','Asilo en Estados Unidos','Una introducción al tema del asilo en Estados Unidos.','An introduction to asylum in the United States.'],
 ['XgQo0orDFwA','La realidad de un preso político en Venezuela: Renzo Prieto','Testimonio y contexto sobre una experiencia de prisión política en Venezuela.','Testimony and context about an experience of political imprisonment in Venezuela.'],
 ['QGhR9GvmKAA','Ex-presos políticos responden preguntas de una entrevista de asilo','Experiencias personales y respuestas a preguntas de una entrevista de asilo.','Personal experiences and responses to asylum interview questions.'],
 ['4nJKb-xmjgk','Así es una entrevista de asilo en Estados Unidos: las preguntas que nadie te dice','Una mirada a las preguntas y al desarrollo de una entrevista de asilo.','A look at the questions and process of an asylum interview.'],
];
export default function AsylumVideos({lang='es'}){
 const [open,setOpen]=useState(false);const es=lang==='es';
 return <section className="asylum-videos video-library" aria-label={es?'Material de YouTube':'YouTube resources'}>
  <button type="button" className="asylum-videos-toggle" aria-expanded={open} aria-controls="asylum-youtube-links" onClick={()=>setOpen(value=>!value)}><svg viewBox="0 0 32 24" width="44" height="33" aria-hidden="true"><rect x="0" y="1" width="32" height="22" rx="6" fill="#ff0000"/><path d="M13 7 22 12 13 17Z" fill="white"/></svg><span>{es?'Videos de asilo en YouTube':'Asylum videos on YouTube'}</span><span className="video-library-collapse" aria-hidden="true">{open?'−':'+'}</span></button>
  <div id="asylum-youtube-links" hidden={!open}>
   <p className="video-library-intro">{es?'Conoce experiencias reales, entrevistas y recomendaciones para comprender mejor el proceso de asilo en Estados Unidos.':'Explore real experiences, interviews and recommendations to better understand the asylum process in the United States.'}</p>
   <p className="video-library-language">{es?'Videos en español de Kevin Medina · Se abren en YouTube en otra pestaña.':'Spanish-language videos by Kevin Medina · Open on YouTube in a new tab.'}</p>
   <ul className="video-library-grid">{videos.map(([id,title,description,english],index)=><li key={id} style={{'--video-delay':`${index*60}ms`}}><VideoResourceCard title={title} description={es?description:english} href={'https://www.youtube.com/watch?v='+id} thumbnail={'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg'} lang={lang}/></li>)}</ul>
   <p className="asylum-videos-note"><span aria-hidden="true">ⓘ</span>{es?'Contenido externo e informativo. Los testimonios describen experiencias personales y no sustituyen asesoría legal.':'External informational content. Testimonies describe personal experiences and do not replace legal advice.'}</p>
  </div>
 </section>;
}
