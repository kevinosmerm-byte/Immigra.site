import { Children, cloneElement, isValidElement } from "react";

const MODULES = {
  n400: { color: "var(--color-primary)", ink: "#ffffff", en: "N-400 practice", es: "Práctica N-400" },
  civics: { color: "var(--color-ai)", ink: "#030305", en: "Civics practice", es: "Práctica de civismo" },
  citizenship: { color: "var(--color-primary)", ink: "#ffffff", en: "Citizenship practice", es: "Práctica de ciudadanía" },
  asylum: { color: "var(--color-navy)", ink: "#ffffff", en: "Asylum practice", es: "Práctica de asilo" },
  adjustment: { color: "var(--color-navy)", ink: "#ffffff", en: "Adjustment-of-status practice", es: "Práctica de ajuste de estatus" },
};

export function interviewModule(mode, language = "en") {
  const module = MODULES[mode] || MODULES.citizenship;
  return { style: { "--interview-accent": module.color, "--interview-action-ink": module.ink }, label: language === "es" ? module.es : module.en };
}

export function OptionalTypedAnswer({ children, language = "en" }) {
  return <details className="interview-typed-answer w-full! rounded-2xl! border! border-white/15! bg-white/5! p-4! text-slate-100!">
    <summary className="flex min-h-12 cursor-pointer items-center gap-3 text-lg! font-semibold! text-slate-100! focus-visible:outline-2 focus-visible:outline-sky-300">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-6 shrink-0"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M5 9h2m2 0h2m2 0h2m2 0h2M5 12h2m2 0h2m2 0h2m2 0h2M7 16h10"/></svg>
      {language === "es" ? "Prefiero escribir mi respuesta" : "I prefer to type my answer"}
    </summary>
    <div className="mt-4!">{children}</div>
  </details>;
}

export function simplifyResponseForms(node, language) {
  if (!isValidElement(node)) return node;
  if (node.type === "form") return <OptionalTypedAnswer key={node.key} language={language}>{node}</OptionalTypedAnswer>;
  if (!node.props.children) return node;
  return cloneElement(node, {}, Children.map(node.props.children, child => simplifyResponseForms(child, language)));
}

export const interviewSurface = "bg-[#030305]! text-slate-100! [&_button]:min-h-12! [&_button]:text-base! [&_button]:rounded-xl! [&_button]:px-4! [&_button]:py-3! [&_button]:font-semibold! [&_button]:whitespace-normal! [&_button:focus-visible]:outline-2! [&_button:focus-visible]:outline-offset-2! [&_button:focus-visible]:outline-sky-300! [&_textarea]:w-full! [&_textarea]:min-h-28! [&_textarea]:rounded-xl! [&_textarea]:border-white/20! [&_textarea]:bg-[#030305]! [&_textarea]:p-4! [&_textarea]:text-lg! [&_textarea]:text-slate-100! [&_label]:text-slate-200! [&_.education-notice]:bg-white/5! [&_.education-notice]:text-slate-200! [&_.education-notice]:border-white/15! [&_.education-notice_p]:text-slate-200! [&_.education-notice_a]:text-sky-300! [&_.interview-advance-primary]:bg-[var(--interview-accent)]! [&_.interview-advance-primary]:bg-none! [&_.interview-advance-primary]:text-[var(--interview-action-ink)]! [&_.n400-text-response]:grid! [&_.n400-text-response]:grid-cols-1! [&_.n400-text-response]:gap-3! [&_.primary-button]:bg-[var(--interview-accent)]! [&_.primary-button]:bg-none! [&_.primary-button]:text-[var(--interview-action-ink)]! [&_.live-mic-button]:bg-[var(--interview-accent)]! [&_.live-mic-button]:bg-none! [&_.live-mic-button]:text-[var(--interview-action-ink)]! [&_.live-mic-button]:min-h-16! [&_.live-mic-button.listening]:bg-[var(--color-red)]! [&_.live-mic-button.listening]:text-white!";

export function ConversationPresentation({ children, mode, language }) {
  const module = interviewModule(mode, language);
  return <div style={module.style} className={`conversation-app-presentation ${interviewSurface} [&_.conversation-practice]:bg-[#030305]! [&_.conversation-practice]:text-slate-100! [&_.coach-conversation-content]:max-w-3xl! [&_.coach-conversation-content]:px-4! [&_.coach-conversation-content]:pb-28! [&_.coach-conversation-content]:mx-auto! [&_.coach-conversation-content>h1]:text-2xl! [&_.coach-conversation-content>h1]:text-slate-100! [&_.coach-conversation-content_p]:text-slate-200! [&_.coach-conversation-card]:bg-[#090b12]! [&_.coach-conversation-card]:h-auto! [&_.coach-conversation-card]:min-h-0! [&_.coach-conversation-card]:border-white/15! [&_.coach-message]:bg-white/5! [&_.coach-message-text]:text-2xl! [&_.coach-message-text]:text-slate-100! [&_.conversation-options]:grid-cols-1! [&_.conversation-options_select]:min-h-12! [&_.conversation-options_select]:bg-[#030305]! [&_.conversation-options_select]:text-slate-100! [&_.coach-response-area]:space-y-4! [&_.coach-response-area]:bg-[#090b12]! [&_.coach-response-area]:text-slate-100! [&_.coach-conversation-status]:bg-white/5! [&_.coach-conversation-status]:text-slate-200! [&_.coach-message-text]:max-h-none! [&_.coach-message-text]:overflow-visible! [&_.coach-conversation-content_p]:text-base! [&_.coach-conversation-content_p]:leading-relaxed! [&_.conversation-auto]:text-slate-200! [&_.conversation-choice-panel]:my-4! [&_.conversation-choice-panel]:p-4! [&_.conversation-choice-panel]:border! [&_.conversation-choice-panel]:border-white/15! [&_.conversation-choice-panel]:rounded-xl! [&_.conversation-choice-panel]:bg-white/5! [&_.conversation-options]:grid! [&_.coach-response-area>form]:grid! [&_.coach-response-area>form]:gap-3! [&_summary]:min-h-12! [&_summary]:text-lg! [&_summary]:text-slate-100! [&_.conversation-actions]:grid! [&_.conversation-actions]:grid-cols-2! [&_.conversation-actions]:gap-3! [&_.conversation-actions>button]:w-full! [&_.conversation-actions>button]:min-w-0! [&_.conversation-continuous>button]:min-h-16! [&_.conversation-actions>button:disabled]:opacity-50! [&_.conversation-actions>button]:flex-1! [&_.conversation-actions>button]:text-slate-100! [&_.conversation-actions>button]:bg-white/10! [&_.conversation-feedback]:border-white/15! [&_.conversation-feedback]:bg-white/5! [&_.conversation-options]:gap-3! [&_.practice-header]:bg-[#030305]! [&_.practice-header]:text-slate-100!`}>
    <p className="mx-auto! mt-4! max-w-3xl! border-l-4! border-[var(--interview-accent)]! px-4! py-2! text-lg! font-semibold! text-slate-100!">{module.label}</p>
    {children}
  </div>;
}
