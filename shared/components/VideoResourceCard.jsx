import React,{useState} from 'react';
const fallback='/video-resource-fallback.svg';
export default function VideoResourceCard({title,description,href,thumbnail,lang='es'}){
 const [failed,setFailed]=useState(false);
 const es=lang==='es';
 return <a className="video-resource-card" href={href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" aria-label={`${title} — ${es?'Ver en YouTube (otra pestaña)':'Watch on YouTube (new tab)'}`}>
  <span className="video-resource-thumbnail"><img src={failed?fallback:thumbnail} alt={es?`Miniatura: ${title}`:`Thumbnail: ${title}`} width="480" height="270" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/><span className="video-resource-play" aria-hidden="true">▶</span></span>
  <span className="video-resource-content"><strong>{title}</strong><span className="video-resource-description">{description}</span><span className="video-resource-cta"><svg viewBox="0 0 28 20" width="28" height="20" aria-hidden="true"><rect width="28" height="20" rx="5" fill="white"/><path d="m11 5 8 5-8 5z" fill="#1760de"/></svg>{es?'Ver en YouTube':'Watch on YouTube'}<span aria-hidden="true">→</span></span></span>
 </a>;
}
