import InterviewerPicker from "./interview-ui/InterviewerPicker.jsx";
import {interviewerLabel} from "./interview-ui/interviewer-media.mjs";
import { useEffect, useRef, useState } from "react";
import { readStoryFile } from "./storyImport.js";
import { STORY_LIMITS } from "./storyPractice.js";
import { EDUCATION_NOTICE } from "../modules/citizenship/src/educationNotice.js";
import { prepareStoryWithAi } from "./storyPreparationApi.mjs";

const messages = {
  es: {
    title: "Vamos paso a paso", intro: "Sube tu historia o comienza sin un documento. Tú eliges el idioma y el entrevistador.",
    language: "¿En qué idioma quieres practicar?", coach: "¿Con quién quieres hablar?", upload: "Subir mi historia", paste: "Prefiero pegar mi texto", start: "Hablar con", noFile: "Comenzar sin documento", reading: "Leyendo tu archivo…", analyzing: "Preparando tu práctica…", ready: "Tu práctica está preparada", cancel: "Cancelar", retry: "Volver a intentar", edit: "Revisar o corregir el texto", prepare: "Usar el texto que pegué", next: "Ahora puedes hablar con tu entrevistador.", leave: "Volver", summary: "Lo que entendimos", topics: "Temas para practicar", notice: "Estos botones autorizan enviar el texto a OpenAI para preparar tu práctica con IA. Leemos el PDF aquí; enviamos solo el texto. No guardamos tu historia aquí. La conversación utiliza hasta los primeros 6.000 caracteres como contexto. Evita números de identificación y otros datos privados.",
    steps: ["Prepara tu historia (opcional)", "Habla con Sahara, Kevin o William"],
    errors: { FILE_TYPE: "Elige un PDF o un archivo de texto (.txt).", FILE_TOO_LARGE: "El archivo es muy grande. Usa uno de hasta 10 MB o pega tu texto.", TOO_MANY_PAGES: "Usa un PDF de hasta 40 páginas o pega tu texto.", OCR_UNAVAILABLE: "Este PDF contiene una página escaneada que no podemos leer aquí. Pega el texto o usa un PDF con texto seleccionable.", STORY_TEXT_REQUIRED: "Necesitamos un poco más de texto: al menos 30 caracteres. También puedes comenzar sin documento.", STORY_TOO_LONG: "El texto supera 30.000 caracteres. Reduce el archivo o prepara una parte a la vez; no lo recortaremos sin avisarte.", ACCESS_REQUIRED: "Agrega tu correo en Mi cuenta o comprueba tu acceso para usar el análisis con IA. Tu texto sigue aquí para volver a intentar.", default: "No pudimos preparar el texto. Puedes volver a intentar, corregirlo o comenzar sin documento." },
  },
  en: {
    title: "One step at a time", intro: "Upload your story or start without a document. You choose the language and interviewer.",
    language: "Which language would you like to practice?", coach: "Who would you like to talk with?", upload: "Upload my story", paste: "I prefer to paste my text", start: "Talk with", noFile: "Start without a document", reading: "Reading your file…", analyzing: "Preparing your practice…", ready: "Your practice is ready", cancel: "Cancel", retry: "Try again", edit: "Review or correct the text", prepare: "Use my pasted text", next: "You can now talk with your interviewer.", leave: "Back", summary: "What we understood", topics: "Topics to practice", notice: "These buttons authorize sending the text to OpenAI to prepare your AI practice. We read the PDF here and send only the text. Your story is not saved here. The conversation uses up to the first 6,000 characters as context. Avoid identification numbers and other private details.",
    steps: ["Prepare your story (optional)", "Talk with Sahara, Kevin or William"],
    errors: { FILE_TYPE: "Choose a PDF or a plain text (.txt) file.", FILE_TOO_LARGE: "This file is too large. Use one up to 10 MB or paste your text.", TOO_MANY_PAGES: "Use a PDF up to 40 pages or paste your text.", OCR_UNAVAILABLE: "This PDF includes a scanned page we cannot read here. Paste the text or use a PDF with selectable text.", STORY_TEXT_REQUIRED: "We need a little more text: at least 30 characters. You can also start without a document.", STORY_TOO_LONG: "The text exceeds 30,000 characters. Reduce it or prepare one part at a time; we will not silently cut it short.", ACCESS_REQUIRED: "Add your email in Account or check your access to use AI analysis. Your text is still here to retry.", default: "We could not prepare the text. Retry, edit it or start without a document." },
  },
};

function StepIcon({ kind }) {
  const paths = { file: "M7 3h7l4 4v14H7V3m7 0v5h4M10 12h5m-5 4h5", talk: "M4 4h16v12H9l-5 4V4m4 4h8m-8 4h5", back: "m14 6-6 6 6 6", check: "m5 12 4 4L19 6" };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 shrink-0"><path d={paths[kind] || paths.check} /></svg>;
}

const glass = "rounded-3xl! border! border-white/80! bg-linear-to-br! from-white/75! via-white/45! to-purple-50/30! shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_12px_32px_-20px_rgba(65,35,100,0.3)]! backdrop-blur-xl!";
const button = "inline-flex! min-h-16! items-center! justify-center! gap-3! rounded-2xl! border! px-5! py-4! text-lg! font-semibold! backdrop-blur-xl! shadow-[inset_0_1px_0_rgba(255,255,255,0.65),inset_0_-1px_0_rgba(255,255,255,0.2),0_8px_20px_-14px_rgba(60,25,100,0.45)]! transition-[background-color,box-shadow,transform]! duration-200! motion-reduce:transition-none! enabled:active:translate-y-px! focus-visible:outline-2! focus-visible:outline-offset-4! focus-visible:outline-purple-700! disabled:cursor-wait! disabled:opacity-60!";
const primary = `${button} border-purple-300/70! bg-linear-to-b! from-[#7944C6]/95! via-purple-800/95! to-purple-950/95! text-white! hover:brightness-110!`;
const secondary = `${button} border-white/90! bg-linear-to-b! from-white/80! to-white/35! text-slate-800! hover:from-white/95! hover:to-purple-50/65!`;

export function AsylumPreparation({ language = "es", onAnalyze = prepareStoryWithAi, onStart, onBack, importFile = readStoryFile }) {
  const [practiceLanguage, setLanguage] = useState(language === "en" ? "en" : "es");
  const [interviewer, setInterviewer] = useState("sarah");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [editing, setEditing] = useState(false);
  const fileInput = useRef(null), controller = useRef(null), generation = useRef(0), summary = useRef(null);
  const busy = ["reading", "analyzing", "starting"].includes(phase);
  const copy = messages[practiceLanguage];
  const name = interviewerLabel(interviewer);
  useEffect(() => () => { generation.current++; controller.current?.abort(); }, []);
  useEffect(() => { if (phase === "ready") summary.current?.focus(); }, [phase]);
  const cancel = () => {
    generation.current++; controller.current?.abort(); setPhase("idle"); setProgress("");
  };
  const analyze = async (value, abort, id) => {
    if (value.trim().length < 30) throw new Error("STORY_TEXT_REQUIRED");
    if (value.length > STORY_LIMITS.characters) throw new Error("STORY_TOO_LONG");
    setPhase("analyzing"); setProgress("");
    const result = await onAnalyze({ text: value, language: practiceLanguage, consent: true, signal: abort.signal });
    if (id !== generation.current || abort.signal.aborted) return;
    setAnalysis(result.analysis); setPhase("ready"); setEditing(false);
  };
  const prepare = async file => {
    if (busy) return;
    const id = ++generation.current;
    controller.current?.abort(); const abort = new AbortController(); controller.current = abort;
    setError(""); setAnalysis(null);
    const timeout = setTimeout(() => abort.abort(), 240000);
    try {
      let value = text;
      if (file) {
        setText(""); setFileName(file.name); setPhase("reading");
        value = await importFile(file, { signal: abort.signal, onProgress: (page, total) => {
          if (id === generation.current) setProgress(`${page} / ${total}`);
        } });
        if (id !== generation.current || abort.signal.aborted) return;
        setText(value);
      }
      await analyze(value, abort, id);
    } catch (failure) {
      if (id === generation.current) { setError(copy.errors[failure.message] || copy.errors.default); setPhase("error"); }
    } finally { clearTimeout(timeout); }
  };
  const start = async withoutDocument => {
    if (busy) return;
    const id = ++generation.current;
    setPhase("starting"); setError("");
    controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    try {
      const approved = await onStart({ language: practiceLanguage, interviewer, analysis: withoutDocument ? null : analysis, text: withoutDocument ? "" : text, signal: abort.signal });
      if (id === generation.current && approved === false) { setPhase(analysis ? "ready" : "idle"); setError(copy.errors.ACCESS_REQUIRED); }
    } catch { if (id === generation.current) { setPhase(analysis ? "ready" : "idle"); setError(copy.errors.default); } }
  };
  return <section lang={practiceLanguage} className="asylum-preparation min-h-dvh! bg-transparent! px-4! py-6! font-sans! text-slate-900! sm:px-8!">
    <div className="mx-auto! max-w-3xl space-y-6!">
      <button type="button" className={secondary} onClick={onBack}><StepIcon kind="back" />{copy.leave}</button>
      <header><p className="mb-3! text-lg font-semibold text-purple-800!">IMMIGRA · {practiceLanguage === "es" ? "PRÁCTICA DE ASILO" : "ASYLUM PRACTICE"}</p><h1 className="text-3xl font-bold text-slate-900! sm:text-4xl">{copy.title}</h1><p className="mt-4! text-xl leading-relaxed text-slate-700!">{copy.intro}</p></header>
      <ol aria-label={practiceLanguage === "es" ? "Tu camino" : "Your path"} className="grid gap-3 sm:grid-cols-2">{copy.steps.map((step, index) => <li key={step} className={`flex! items-center! gap-3! rounded-2xl! border! border-white/80! bg-white/40! p-3! backdrop-blur-md! shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]!`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-900 text-xl font-bold text-purple-100!" aria-hidden="true">{index + 1}</span><span className="text-base font-medium text-slate-900!">{step}</span></li>)}</ol>
      <details className={`${glass} space-y-5! p-5!`}><summary className="min-h-12 cursor-pointer text-lg font-semibold text-slate-900!">{practiceLanguage === "es" ? "Español" : "English"} · {name} <span className="ml-2! text-purple-800!">{practiceLanguage === "es" ? "Cambiar" : "Change"}</span></summary>
        <fieldset className="min-w-0 border-0 p-0!" disabled={busy}><legend className="mb-3! text-xl font-semibold">{copy.language}</legend><div className="grid grid-cols-2 gap-3">{["es", "en"].map(value => <button type="button" key={value} aria-pressed={practiceLanguage === value} className={practiceLanguage === value ? primary : secondary} onClick={() => { cancel(); setLanguage(value); setAnalysis(null); setError(""); }}>{value === "es" ? "Español" : "English"}</button>)}</div></fieldset>
        <InterviewerPicker value={interviewer} onChange={setInterviewer} lang={practiceLanguage} moduleId="asylum" appearance="glass" disabled={busy}/>
      </details>
      <p className="text-base! leading-relaxed! text-slate-700!">{practiceLanguage === "es" ? "Al pulsar Hablar o Comenzar sin documento, autorizas enviar tu voz o texto y el contexto de esta práctica a OpenAI. Puedes pausar o salir. No somos abogados ni damos asesoría legal." : "By selecting Talk or Start without a document, you authorize sending your voice or text and this practice context to OpenAI. You can pause or leave. We are not lawyers and do not provide legal advice."}</p>
      <section aria-label={copy.steps[0]} className={`${glass} space-y-5! p-5!`} aria-busy={busy}>
        {!analysis && <>
          <input ref={fileInput} type="file" accept=".pdf,.txt,application/pdf,text/plain" className="hidden" aria-label={copy.upload} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) prepare(file); }} />
          <button type="button" className={`${primary} w-full`} disabled={busy} aria-describedby="story-authorization" onClick={() => fileInput.current?.click()}><StepIcon kind="file" />{copy.upload}</button>
          <p className="text-base text-slate-700!">PDF / TXT · 10 MB · {practiceLanguage === "es" ? "Hasta 40 páginas" : "Up to 40 pages"}</p>
        </>}
        <p id="story-authorization" className="text-base leading-relaxed text-slate-700!">{copy.notice}</p>
        <div role="status" aria-live="polite">{busy && <p className="rounded-2xl! border! border-purple-200/70! bg-purple-50/70! p-4! text-xl! font-semibold! text-purple-950! backdrop-blur-md!">{phase === "reading" ? copy.reading : phase === "starting" ? `${copy.start} ${name}…` : copy.analyzing} {progress}</p>}</div>
        {busy && <button type="button" className={`${secondary} w-full`} onClick={cancel}>{copy.cancel}</button>}
        {error && <div role="alert" className="space-y-3! rounded-2xl! border! border-amber-300/60! bg-amber-50/85! p-4! backdrop-blur-md!"><p className="text-lg leading-relaxed text-amber-950!">{error}</p>{text && !busy && <button type="button" className={primary} onClick={() => prepare()}>{copy.retry}</button>}</div>}
        {analysis && <section ref={summary} tabIndex={-1} className="space-y-4! rounded-2xl! border! border-emerald-200/80! bg-emerald-50/60! p-5! backdrop-blur-md! focus-visible:outline-2! focus-visible:outline-emerald-700!">
          <h2 className="flex items-center gap-3 text-2xl font-semibold text-emerald-950!"><StepIcon kind="check" />{copy.ready}</h2><p className="text-lg text-slate-900!">{copy.next}</p>
          <details><summary className="min-h-12 cursor-pointer py-3! text-lg font-semibold text-emerald-950!">{copy.summary}</summary><p className="py-3! text-lg leading-relaxed text-slate-900!">{analysis.summary}</p><h3 className="text-lg font-semibold text-slate-900!">{copy.topics}</h3><ul className="list-disc space-y-3! pl-5!">{analysis.topics.map(topic => <li key={topic.label}><strong>{topic.label}</strong><blockquote className="mt-2! text-slate-600!">“{topic.quote}”</blockquote></li>)}</ul></details>
          <button type="button" className={`${primary} w-full`} disabled={busy} onClick={() => start(false)}><StepIcon kind="talk" />{copy.start} {name}</button>
        </section>}
        <button type="button" className={`${secondary} w-full`} disabled={busy} aria-expanded={editing} aria-controls="story-editor" onClick={() => setEditing(value => !value)}>{text ? copy.edit : copy.paste}</button>
        {editing && <div id="story-editor" className="space-y-3!"><label htmlFor="story-text" className="block text-lg font-semibold">{copy.edit}{fileName && ` · ${fileName}`}</label><textarea id="story-text" rows={7} maxLength={STORY_LIMITS.characters} disabled={busy} className="w-full! rounded-2xl! border! border-white/90! bg-white/65! p-4! text-lg! leading-relaxed! text-slate-900! shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]! backdrop-blur-md! focus-visible:outline-2! focus-visible:outline-purple-700!" value={text} onChange={event => { setText(event.target.value); setAnalysis(null); setError(""); setPhase("idle"); }} /><button type="button" className={`${primary} w-full`} disabled={busy || !text.trim()} aria-describedby="story-authorization" onClick={() => prepare()}>{copy.prepare}</button></div>}
        {!analysis && <button type="button" className={`${secondary} w-full`} disabled={busy} onClick={() => start(true)}><StepIcon kind="talk" />{copy.noFile}</button>}
      </section>
      <p className="text-base leading-relaxed text-slate-600!">{EDUCATION_NOTICE[practiceLanguage].short} <a href="#/settings" className="inline-flex min-h-12 items-center text-purple-800! underline underline-offset-4">{practiceLanguage === "es" ? "Privacidad y términos" : "Privacy and terms"}</a></p>
    </div>
  </section>;
}
