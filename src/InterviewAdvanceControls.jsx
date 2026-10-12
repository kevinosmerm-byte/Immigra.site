export function InterviewAdvanceControls({ language = "en", paused, onPause, onContinue }) {
  const es = language === "es";
  return <section aria-label={es ? "Avance de la entrevista" : "Interview progression"} className="my-4 w-full rounded-2xl border border-white/10 bg-[#030305]/90 p-4 text-slate-100 shadow-lg shadow-indigo-950/20 backdrop-blur-md dark:bg-[#030305]/80">
    <p role="status" className="mb-3 text-sm leading-relaxed text-slate-200!">{paused ? (es ? "En pausa para repasar." : "Paused for review.") : (es ? "La siguiente pregunta comenzará automáticamente. Pausa si necesitas más tiempo." : "The next question will start automatically. Pause if you need more time.")}</p>
    <div className="flex flex-wrap gap-3">
      {!paused && <button type="button" onClick={onPause} className="min-h-11 flex-1 cursor-pointer rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400">{es ? "Pausar para repasar" : "Pause to review"}</button>}
      <button type="button" onClick={onContinue} className="min-h-11 flex-1 cursor-pointer rounded-xl border border-indigo-300/20 bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400">{es ? "Continuar" : "Continue"}</button>
    </div>
  </section>;
}
