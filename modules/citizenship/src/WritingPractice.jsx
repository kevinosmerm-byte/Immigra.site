import {useEffect,useRef} from 'react';
import '../../../shared/design-system/writing-compact.css';

// Presentation only. The parent retains audio, evaluation, scoring and progress.
export default function WritingPractice({t,sentence,index,total,answer,onAnswer,evaluation,message,busy,goodCount,needsCount,onListen,onCheck,onRetry,onNext,onBack,backLabel}){
 const resultRef=useRef(null),headingRef=useRef(null),previousIndex=useRef(index);
 useEffect(()=>{if(evaluation)resultRef.current?.focus({preventScroll:true});},[evaluation]);
 useEffect(()=>{if(previousIndex.current!==index){previousIndex.current=index;headingRef.current?.focus({preventScroll:true});}},[index]);
 const correct=evaluation&&['Excellent','Good'].includes(evaluation.accuracy);
 const tone=!evaluation?'':correct?'is-correct':evaluation.accuracy==='Needs Review'?'is-partial':'needs-practice';
 return <div className={`writing-ai-screen writing-compact ${evaluation?'is-evaluated':''}`}>
  <header className="writing-ai-header"><button className="writing-back-button" onClick={onBack}>← <span>{backLabel}</span></button></header>
  <main className="writing-ai-content">
   <section className="writing-practice-panel" aria-labelledby="writing-compact-title">
    <header className="writing-compact-heading">
     <span className="writing-compact-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 14v-3a8 8 0 0 1 16 0v3M4 12h3v8H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2Zm16 0h-3v8h3a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2Z"/></svg></span>
     <div><h1 id="writing-compact-title" ref={headingRef} tabIndex={-1}>{t('Listen and type what you hear','Escucha y escribe lo que oyes')}</h1><p>{t('Listen to the sentence and write it in English.','Escucha la oración y escríbela en inglés.')}</p></div>
     <div className="writing-compact-progress"><strong>{index+1} / {total}</strong><progress value={index+1} max={total} aria-label={t('Sentence progress','Progreso de oraciones')}/></div>
    </header>
    <section className="writing-compact-exercise" aria-label={t('Audio and writing','Audio y escritura')}>
     <div className="writing-compact-audio">
      <button type="button" className="writing-compact-listen" onClick={onListen}><span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 9v6h4l5 4V5L9 9H5Zm11.5.5a4 4 0 0 1 0 5M18.8 7a7 7 0 0 1 0 10"/></svg></span><strong>{t('Listen again','Escuchar otra vez')}</strong></button>
      <details className="writing-compact-context"><summary>{t('Spanish translation (context)','Traducción al español (contexto)')}</summary><p lang="es">{sentence.spanish}</p></details>
     </div>
     {!evaluation&&<form className="writing-compact-form" onSubmit={e=>{e.preventDefault();if(busy)return;e.currentTarget.querySelector('textarea')?.blur();onCheck();}}>
      <label className="sr-only" htmlFor="writing-practice-answer">{t('Type the English sentence you hear','Escribe la oración que escuchas en inglés')}</label>
      <textarea id="writing-practice-answer" rows={2} className="writing-ai-input" value={answer} onChange={e=>onAnswer(e.target.value)} readOnly={busy} aria-busy={busy} placeholder={t('Type what you hear in English…','Escribe lo que escuchas en inglés…')} />
      <button type="submit" className="writing-ai-button" disabled={busy||!answer.trim()}>{busy?t('Reviewing…','Revisando…'):t('Verify','Verificar')}</button>
     </form>}
     {message&&!evaluation&&<p className="writing-compact-status" role="status">{message}</p>}
    </section>
    {evaluation&&<section ref={resultRef} tabIndex={-1} className={`writing-compact-result ${tone}`} aria-labelledby="writing-result-title">
     <div className="writing-compact-result-heading"><span className="writing-result-icon" aria-hidden="true">{correct?'✓':'!'}</span><h2 id="writing-result-title">{evaluation.resultLabel}</h2><strong className="writing-compact-score">{evaluation.score==null?'—':`${evaluation.score}%`}<small>{t('Score','Puntaje')}</small></strong></div>
     <p className="writing-compact-feedback" role="status">{evaluation.feedback}</p>
     <div className="writing-compact-comparison"><div><h3>{t('Your answer','Tu respuesta')}</h3><p lang="en">{evaluation.writtenAnswer}</p></div><div className="expected"><h3>{t('Correct sentence','Oración correcta')}</h3><p lang="en">{evaluation.expectedAnswer}</p></div></div>
     {(evaluation.details?.missingWords?.length>0||evaluation.details?.extraWords?.length>0||evaluation.details?.corrections?.length>0)&&<div className="writing-compact-details">
      {evaluation.details.missingWords?.length>0&&<p><strong>{t('Missing:','Faltó:')}</strong> {evaluation.details.missingWords.join(', ')}</p>}
      {evaluation.details.extraWords?.length>0&&<p><strong>Extra:</strong> {evaluation.details.extraWords.join(', ')}</p>}
      {evaluation.details.corrections?.length>0&&<p><strong>{t('Spelling:','Ortografía:')}</strong> {evaluation.details.corrections.map(item=>`${item.written} → ${item.expected}`).join(', ')}</p>}
     </div>}
    </section>}
    <footer className="writing-compact-footer">
     <div className="writing-compact-stats" aria-label={t('Practice totals','Totales de práctica')}><span><i className="good" aria-hidden="true"/><strong>{String(goodCount).padStart(2,'0')}</strong><small>{t('Correct','Correctas')}</small></span><span><i className="needs" aria-hidden="true"/><strong>{String(needsCount).padStart(2,'0')}</strong><small>{t('To practice','Por practicar')}</small></span></div>
     {evaluation&&<div className="writing-compact-actions">{!correct&&<button type="button" className="writing-review-retry" onClick={onRetry}>{t('Try again','Intentar otra vez')}</button>}<button type="button" className="writing-review-continue" disabled={busy} onClick={onNext}>{t('Next sentence →','Siguiente oración →')}</button></div>}
    </footer>
   </section>
  </main>
 </div>;
}
