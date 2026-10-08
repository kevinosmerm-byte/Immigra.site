import { Children, cloneElement, isValidElement, useRef } from 'react';
import './InterviewWorkspace.css';

// Presentation only: interview owners retain their existing handlers and state.
export function InterviewWorkspace({ children, language, onReplay, busy, mode, current, total }) {
  const root = useRef(null);
  const parts = Children.toArray(children);
  const hasClass = (node, name) => isValidElement(node) && String(node.props.className || '').split(' ').includes(name);
  const stage = parts.find(node => hasClass(node, 'sarah-live-stage'));
  const stageParts = Children.toArray(stage?.props.children);
  const question = stageParts.find(node => hasClass(node, 'live-question-card'));
  const header = stageParts.find(node => hasClass(node, 'live-stage-topbar'));
  const es = language === 'es';
  return <main ref={root} className="interview-content interview-workspace">
    <div className="workspace-topbar">{header}<span className="workspace-mode">{mode === 'n400' ? 'N-400' : 'CIVICS'} · {current}/{total}</span></div>
    {stage && cloneElement(stage, {}, stageParts.filter(node => !hasClass(node, 'live-question-card') && !hasClass(node, 'live-stage-topbar') && !hasClass(node, 'live-stage-presence') && !hasClass(node, 'live-voice-status')))}
    <div className="workspace-overlay">
      <button className="workspace-replay" type="button" onClick={onReplay} disabled={busy} aria-label={es ? 'Repetir pregunta' : 'Replay question'} title={es ? 'Repetir pregunta' : 'Replay question'}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4m12 0a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12" /></svg></button>
      {question}
      {parts.filter(node => node !== stage).map(node => hasClass(node, 'live-interview-controls') ? cloneElement(node, {}, <>{node.props.children}<button className="workspace-type" type="button" disabled={busy} onClick={() => root.current?.querySelector('textarea')?.focus()}>{es ? 'Escribir respuesta' : 'Type answer'}</button></>) : node)}
    </div>
    <footer className="workspace-progress"><span>{current} / {total}</span><progress value={current} max={total} aria-label={es ? 'Progreso de la entrevista' : 'Interview progress'} /></footer>
  </main>;
}
