import {provenanceNote} from './question-provenance.mjs';
import './source-note.css';
export default function AsylumSourceNote({questionId,lang='es'}){
 const note=provenanceNote(questionId,lang);if(!note)return null;
 return <aside className="asylum-source-note" aria-label={note.label}>
  <p>{note.wording} {note.relation} {note.sources.map((s,i)=><span key={s.id}>{i>0?' · ':''}<a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></span>)}</p>
  <details><summary>{lang==='es'?'Alcance de la referencia':'Reference scope'}</summary><p>{note.objective&&<><strong>{lang==='es'?'Objetivo de práctica: ':'Practice objective: '}</strong>{note.objective} </>}{note.sources.map(s=>s.topic).join(' · ')}. {note.limitation}</p><p>{note.derivation} {note.methodSources.map((s,i)=><span key={s.id}>{i>0?' · ':''}<a href={s.url} target="_blank" rel="noopener noreferrer">{s.title} · {s.locator}</a></span>)}</p></details>
 </aside>;
}
