import { Children, cloneElement, isValidElement } from 'react';
import { interviewModule, interviewSurface, simplifyResponseForms } from './InterviewPresentation.jsx';
import './InterviewWorkspace.css';

// Presentation only: interview owners retain their existing handlers and state.
export function InterviewWorkspace({ children, language, onReplay, busy, mode, current, total }) {
  const module = interviewModule(mode, language);
  const scoreColors = mode === "civics" ? "[&_.live-score-summary_span:first-child]:bg-emerald-950! [&_.live-score-summary_span:first-child]:text-emerald-200! [&_.live-score-summary_span:last-child]:bg-rose-950! [&_.live-score-summary_span:last-child]:text-rose-200!" : "[&_.live-score-summary_span]:bg-white/10! [&_.live-score-summary_span]:text-sky-200!";
  const parts = Children.toArray(children);
  const hasClass = (node, name) => isValidElement(node) && String(node.props.className || '').split(' ').includes(name);
  const stage = parts.find(node => hasClass(node, 'sarah-live-stage'));
  const stageParts = Children.toArray(stage?.props.children);
  const question = stageParts.find(node => hasClass(node, 'live-question-card'));
  const header = stageParts.find(node => hasClass(node, 'live-stage-topbar'));
  const es = language === 'es';
  return <main style={module.style} className={`interview-content interview-workspace ${interviewSurface} [&_.question]:text-slate-100! [&_.live-question-header]:text-slate-300! [&_.live-question-header]:text-sm! [&_.workspace-mode]:text-sm! [&_.question-spanish]:text-slate-300! [&_.live-interview-controls]:flex-col! [&_.live-interview-controls]:gap-4! [&_.live-interview-controls]:items-stretch! [&_.live-mic-button]:w-full! [&_.live-mic-button]:order-first! [&_.live-skip-button]:w-full! [&_.live-skip-button]:text-slate-100! [&_.live-skip-button]:bg-white/10! [&_.live-stage-topbar]:w-full! [&_.live-stage-topbar]:basis-full! [&_.live-stage-topbar]:flex-wrap! [&_.live-stage-topbar]:gap-3! [&_.live-agent-badge]:shrink-0! [&_.live-agent-badge_strong]:whitespace-nowrap! [&_.live-interviewer-selector]:flex-wrap! [&_.live-interviewer-selector]:min-w-0! [&_.live-interviewer-selector_button]:px-3! [&_.live-score-summary]:flex! [&_.live-score-summary]:flex-wrap! [&_.live-score-summary]:gap-3! [&_.live-score-summary_span]:rounded-lg! [&_.live-score-summary_span]:px-3! [&_.live-score-summary_span]:py-2! ${scoreColors} [&_.answer-preview]:bg-white/5! [&_.answer-preview]:text-slate-100! [&_.answer-preview_p]:text-slate-100! [&_.answer-result]:text-slate-200! [&_.workspace-topbar]:flex-wrap! [&_.workspace-topbar]:bg-[#030305]! [&_.workspace-topbar]:px-4! [&_.workspace-topbar]:py-3! [&_.live-question-card]:pr-0!`}>
    <div className="workspace-topbar">{header}<span className="workspace-mode">{module.label} · {current}/{total}</span></div>
    {stage && cloneElement(stage, {}, stageParts.filter(node => !hasClass(node, 'live-question-card') && !hasClass(node, 'live-stage-topbar') && !hasClass(node, 'live-stage-presence') && !hasClass(node, 'live-voice-status')))}
    <div className="workspace-overlay bg-[#090b12]! text-slate-100! border-white/15!">
      <button className="interview-replay-action mb-4! inline-flex! w-full! items-center! justify-center! gap-3! border! border-white/20! bg-white/5! text-slate-100!" type="button" onClick={onReplay} disabled={busy} aria-label={es ? 'Repetir pregunta' : 'Replay question'} title={es ? 'Repetir pregunta' : 'Replay question'}><svg viewBox="0 0 24 24" aria-hidden="true" className="size-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 9v6h4l5 4V5L8 9H4m12 0a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12" /></svg><span>{es ? 'Repetir pregunta' : 'Repeat question'}</span></button>
      <p className="mb-4! text-base! leading-relaxed! text-slate-300!">{es ? "Lee o escucha la pregunta. Responde con voz, escribe o salta si lo necesitas." : "Read or listen to the question. Speak, type or skip when you need to."}</p>
      {question}
      {parts.filter(node => node !== stage).map(node => hasClass(node, 'live-interview-controls') ? simplifyResponseForms(node, language) : node)}
    </div>
    <footer className="workspace-progress bg-[#030305]! text-slate-100! [&_progress]:accent-[var(--interview-accent)]! [&_progress::-webkit-progress-value]:bg-[var(--interview-accent)]!"><span>{current} / {total}</span><progress value={current} max={total} aria-label={es ? 'Progreso de la entrevista' : 'Interview progress'} /></footer>
  </main>;
}
