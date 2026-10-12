import { InterviewWorkspace } from "./InterviewWorkspace.jsx";
import { useEffect, useRef, useState } from "react";
import sarahImage from "./assets/sarah.png";
import sarahSpeakingImage from "./assets/sarah-speaking.png";
import n400Bank from "./data/n400InterviewBank.json";
import { useVoiceResponse } from "./useVoiceResponse.js";
import { conversationIntent } from "./conversationFlow.js";
import { speakAppText, stopAppSpeech } from "./speech";
import { recordN400Review } from "./progress.js";
import {
  confirmN400ProfileAnswer,
  createN400FollowUpPrompt,
  createN400InterviewState,
  getContextualN400FollowUps,
  parseYesNo,
  recordN400Answer,
  recordN400FollowUpAnswer,
  selectNextN400Question,
} from "./n400InterviewEngine.js";
import {
  emitCompanionState,
  getCompanionVisibility,
  setCompanionSessionVisibility,
} from "./companionEvents.js";

function createInitialFlow(context) {
  const initialState = createN400InterviewState(n400Bank, {}, context);
  const selection = selectNextN400Question(n400Bank, initialState);
  return { ...selection, followUpQueue: [] };
}

const SUB_BLOCK_LABELS = {
  IDENTITY: ["Identity", "Identidad"], BIRTH: ["Birth information", "Nacimiento"],
  PERMANENT_RESIDENCE: ["Permanent residence", "Residencia permanente"],
  CURRENT_ADDRESS: ["Current address", "Domicilio actual"], ADDRESS_HISTORY: ["Address history", "Domicilios anteriores"],
  MARITAL_HISTORY: ["Marital history", "Historial matrimonial"], CHILDREN: ["Children", "Hijos"],
  PARENTS: ["Parents", "Padres"], EMPLOYMENT_SCHOOL: ["Work and school", "Trabajo y estudios"],
  TRAVEL: ["Travel history", "Viajes"], CITIZENSHIP_VOTING: ["Citizenship and voting", "Ciudadanía y votación"],
  TAXES: ["Taxes", "Impuestos"], ORGANIZATIONS_IDEOLOGY: ["Organizations", "Organizaciones"],
  SECURITY_VIOLENCE: ["Security questions", "Preguntas de seguridad"], PERSECUTION_HARM: ["Conduct and harm", "Conducta y daños"],
  MILITARY_ARMED_GROUPS: ["Military and armed groups", "Fuerzas militares y grupos armados"],
  CRIMINAL_HISTORY: ["Criminal history", "Historial penal"], GOOD_MORAL_CHARACTER: ["Good moral character", "Carácter moral"],
  IMMIGRATION_GOVERNMENT: ["Immigration history", "Historial migratorio"], SELECTIVE_SERVICE: ["Selective Service", "Servicio Selectivo"],
  MILITARY_SERVICE: ["U.S. military service", "Servicio militar de EE. UU."], OATH_CONSTITUTION: ["Constitution and Oath", "Constitución y juramento"],
};
const COPY = {
  en: {
    brand: "INTERACTIVE N-400 PRACTICE", title: "N-400 interview practice", complete: "Practice Review Complete",
    reviewed: "reviewed", skipped: "skipped", concepts: "concepts reviewed", personal: "Personal information", eligibility: "Application review",
    results: "Your responses were used for this practice session without deciding eligibility or providing legal conclusions. Only answers you explicitly confirmed were remembered.",
    restart: "PRACTICE N-400 AGAIN", home: "Back to Home", exit: "Exit N-400 practice", repeat: "Repeat question",
    officer: "Choose your practice interviewer", interviewer: "Practice interviewer", speaking: "Speaking with you", listening: "Listening to your answer", ready: "Ready for your response",
    turn: "Your turn", spoken: "is speaking", heard: "is listening", followup: "Contextual follow-up", wording: "One wording per concept",
    voiceListening: "Listening… finish the recording when you are ready", voiceReady: "Speak or type your response below",
    input: "Your response", typed: "Type your answer", submit: "Review response", continue: "Continue", record: "Speak your answer", finish: "Finish recording",
    microphone: "Start recording answer", stop: "Stop recording answer", preparing: "Preparing your response…", skip: "Skip this question",
    recorded: "Response recorded for this session", incomplete: "Please answer yes or no. An uncertain response will not be saved as No.", error: "We couldn't record your response. Please try again or type it below.",
    reference: "Your saved information", useSaved: "Use saved answer for this practice", remember: "Confirm and remember this answer", remembered: "Answer remembered", saveError: "We couldn't remember this answer. You can continue practicing.",
    privacy: "Practice answers stay in this session. Remember an answer only if it accurately reflects your information. A-Numbers are never remembered.",
    progress: "N-400 session progress", completedMessage: "You completed the N-400 practice review.", support: "Take your time. Answer yes or no.", encouragement: "Response recorded. Keep going.", interviewSoon: "Your interview preparation uses the information you already provided.",
  },
  es: {
    brand: "PRÁCTICA INTERACTIVA N-400", title: "Práctica de entrevista N-400", complete: "Práctica completada",
    reviewed: "repasados", skipped: "omitidas", concepts: "conceptos repasados", personal: "Información personal", eligibility: "Revisión de solicitud",
    results: "Tus respuestas se usaron en esta práctica sin decidir elegibilidad ni dar conclusiones legales. Solo se recordaron las respuestas que confirmaste expresamente.",
    restart: "PRACTICAR N-400 OTRA VEZ", home: "Volver al inicio", exit: "Salir de la práctica N-400", repeat: "Repetir pregunta",
    officer: "Elige quién dirige la práctica", interviewer: "Entrevistador de práctica", speaking: "Hablando contigo", listening: "Escuchando tu respuesta", ready: "Listo para tu respuesta",
    turn: "Tu turno", spoken: "está hablando", heard: "está escuchando", followup: "Pregunta de seguimiento", wording: "Una variación por concepto",
    voiceListening: "Escuchando… termina la grabación cuando estés listo", voiceReady: "Responde hablando o escribiendo abajo",
    input: "Tu respuesta", typed: "Escribe tu respuesta", submit: "Revisar respuesta", continue: "Continuar", record: "Responder con voz", finish: "Terminar grabación",
    microphone: "Comenzar a grabar respuesta", stop: "Terminar de grabar respuesta", preparing: "Preparando tu respuesta…", skip: "Omitir esta pregunta",
    recorded: "Respuesta registrada para esta sesión", incomplete: "Responde sí o no. Una respuesta incierta no se guardará como No.", error: "No pudimos grabar tu respuesta. Inténtalo otra vez o escríbela abajo.",
    reference: "Tu información guardada", useSaved: "Usar respuesta guardada en esta práctica", remember: "Confirmar y recordar esta respuesta", remembered: "Respuesta recordada", saveError: "No pudimos recordar esta respuesta. Puedes seguir practicando.",
    privacy: "Las respuestas de práctica permanecen en esta sesión. Recuerda una respuesta solo si corresponde a tu información. Los números A nunca se guardan.",
    progress: "Progreso de la sesión N-400", completedMessage: "Completaste la práctica N-400.", support: "Tómate tu tiempo. Responde sí o no.", encouragement: "Respuesta registrada. Sigue adelante.", interviewSoon: "Tu preparación de entrevista utiliza la información que ya proporcionaste.",
  },
};
const N400_FORM_EDITION = n400Bank.formEdition;

export function N400InterviewPractice({ onExit, onComplete, onRestart, brainContext = {}, language = "en", userKey = "guest", onSaveN400Profile, requestVoiceAccess }) {
  const copy = COPY[language === "es" ? "es" : "en"];
  const [flow, setFlow] = useState(() => createInitialFlow(brainContext));
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [answer, setAnswer] = useState("");
  const [draft, setDraft] = useState("");
  const [answerStatus, setAnswerStatus] = useState("");
  const [pendingResponse, setPendingResponse] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [skipped, setSkipped] = useState(0);
  const [interviewer, setInterviewer] = useState("sarah");
  const clarificationAttemptsRef = useRef(0);
  const responseLockedRef = useRef(false);
  const speechRequestRef = useRef(0);
  const completionReportedRef = useRef(false);
  const speechTimerRef = useRef(null);
  const mountedRef = useRef(false);
  const confirmedProfileRef = useRef(brainContext.n400Profile || { answers: {}, flags: {} });
  const reviewedConceptsRef = useRef(new Set());
  const skippedConceptsRef = useRef(new Set());
  const initialQuestionRef = useRef(flow.question?.english || "");
  const soundEnabledRef = useRef(brainContext.preferences?.soundEnabled !== false);
  const isKevin = interviewer === "kevin";
  const interviewerName = isKevin ? "Kevin" : "Sarah";
  const reviewedCount = flow.state.askedConceptIDs.length;
  const totalConcepts = n400Bank.questions.length;
  const progress = isComplete ? 100 : Math.round(reviewedCount / totalConcepts * 100);

  const speakQuestion = async (text, selectedInterviewer = interviewer) => {
    clearTimeout(speechTimerRef.current);
    const requestId = ++speechRequestRef.current;
    if (!soundEnabledRef.current || !mountedRef.current) { setIsSpeaking(false); return; }
    setIsSpeaking(true);
    try {
      await speakAppText(text, { profile: selectedInterviewer === "kevin" ? "male" : "female" });
    } finally {
      if (mountedRef.current && requestId === speechRequestRef.current) setIsSpeaking(false);
    }
  };
  const queueQuestionSpeech = (text) => {
    clearTimeout(speechTimerRef.current);
    speechTimerRef.current = setTimeout(() => speakQuestion(text), 250);
  };
  const stopQuestionSpeech = () => {
    clearTimeout(speechTimerRef.current);
    speechRequestRef.current += 1;
    stopAppSpeech();
    setIsSpeaking(false);
  };

  useEffect(() => {
    mountedRef.current = true;
    setCompanionSessionVisibility(false);
    const timer = setTimeout(() => {
      if (!soundEnabledRef.current) return;
      const requestId = ++speechRequestRef.current;
      setIsSpeaking(true);
      speakAppText(`Welcome. We will review your Form N-400 in two parts. First, I will ask about your personal information. ${initialQuestionRef.current}`, { profile: "female" })
        .finally(() => { if (mountedRef.current && requestId === speechRequestRef.current) setIsSpeaking(false); });
    }, 500);
    speechTimerRef.current = timer;
    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      clearTimeout(speechTimerRef.current);
      speechRequestRef.current += 1;
      stopAppSpeech();
      setCompanionSessionVisibility(getCompanionVisibility());
    };
  }, []);

  useEffect(() => {
    if (!isComplete || completionReportedRef.current) return;
    completionReportedRef.current = true;
    onComplete?.({ score: null, outcome: "completed", reviewedConceptIds: [...reviewedConceptsRef.current], skippedConceptIds: [...skippedConceptsRef.current] });
    emitCompanionState("celebration", { message: copy.completedMessage });
  }, [isComplete, onComplete, copy.completedMessage]);

  const resetQuestionUi = () => { clarificationAttemptsRef.current = 0; responseLockedRef.current = false; setAnswer(""); setDraft(""); setAnswerStatus(""); setPendingResponse(null); setSaveStatus(""); };
  const recordConceptReview = (question, skippedReview = false) => {
    const conceptId = question.conceptId;
    if (!conceptId) return;
    const seen = skippedReview ? skippedConceptsRef.current : reviewedConceptsRef.current;
    if (seen.has(conceptId)) return;
    seen.add(conceptId);
    recordN400Review({ reviewedConceptIds: skippedReview ? [] : [conceptId], skippedConceptIds: skippedReview ? [conceptId] : [] }, userKey);
  };
  const finishInterview = (state) => {
    setFlow({ state, question: null, transition: "", followUpQueue: [] });
    setIsComplete(true);
    speakQuestion("Thank you. That concludes this Form N-400 practice review.");
  };
  const advanceToNextConcept = (state) => {
    const selection = selectNextN400Question(n400Bank, state);
    resetQuestionUi();
    if (!selection.question) { finishInterview(selection.state); return; }
    setFlow({ ...selection, followUpQueue: [] });
    queueQuestionSpeech([selection.transition, selection.question.english].filter(Boolean).join(" "));
  };
  const continueFollowUps = (state, currentFlow) => {
    const [nextFollowUp, ...remaining] = currentFlow.followUpQueue;
    if (!nextFollowUp) { advanceToNextConcept(state); return; }
    resetQuestionUi();
    setFlow({ ...currentFlow, state, question: nextFollowUp, followUpQueue: remaining });
    queueQuestionSpeech(nextFollowUp.english);
  };
  const acceptResponse = (value) => {
    const transcript = String(value || "").trim();
    const question = flow.question;
    if (!question || !transcript || pendingResponse || responseLockedRef.current) return;
    const intent = conversationIntent(transcript);
    if (intent === "repeat") { speakQuestion(question.english); return; }
    if (intent === "skip") { skipQuestion(true); return; }
    if (intent === "clarify") {
      setAnswerStatus("incomplete");
      return;
    }
    stopQuestionSpeech();
    setAnswer(transcript);
    if (question.answerType === "yes_no" && parseYesNo(transcript) === null) {
      clarificationAttemptsRef.current += 1;
      if (clarificationAttemptsRef.current >= 2) {
        responseLockedRef.current = true;
        setAnswerStatus("uncertain");
        const state = question.kind === "followup" ? recordN400FollowUpAnswer(flow.state, question, "") : recordN400Answer(flow.state, question, "");
        setPendingResponse({ question, transcript, state, uncertain: true });
        return;
      }
      setAnswerStatus("incomplete");
      emitCompanionState("support", { message: copy.support });
      return;
    }
    const state = question.kind === "followup" ? recordN400FollowUpAnswer(flow.state, question, transcript) : recordN400Answer(flow.state, question, transcript);
    responseLockedRef.current = true;
    setAnswerStatus("recorded");
    setPendingResponse({ question, transcript, state });
    emitCompanionState("progress", { message: copy.encouragement });
  };
  const continueResponse = () => {
    if (!pendingResponse) return;
    const { state, question, transcript, uncertain } = pendingResponse;
    if (uncertain) {
      recordConceptReview(question, true);
      setSkipped(count => count + 1);
      if (question.kind === "followup") continueFollowUps(state, flow);
      else advanceToNextConcept(state);
      return;
    }
    recordConceptReview(question);
    if (question.kind === "followup") { continueFollowUps(state, flow); return; }
    const followUps = getContextualN400FollowUps(question, transcript, state.applicantProfile)
      .map((text, index) => createN400FollowUpPrompt(question, text, index + 1, state.applicantProfile));
    if (followUps.length) {
      const [first, ...remaining] = followUps;
      resetQuestionUi();
      setFlow({ state, question: first, transition: "", followUpQueue: remaining });
      queueQuestionSpeech(`Thank you. ${first.english}`);
    } else advanceToNextConcept(state);
  };
  const rememberResponse = async () => {
    if (!pendingResponse || pendingResponse.uncertain || !onSaveN400Profile || saveStatus === "saving") return;
    const profile = confirmN400ProfileAnswer(confirmedProfileRef.current, pendingResponse.question, pendingResponse.transcript);
    if (!profile) return;
    setSaveStatus("saving");
    try {
      await onSaveN400Profile(profile);
      confirmedProfileRef.current = profile;
      if (mountedRef.current) setSaveStatus("saved");
    } catch { if (mountedRef.current) setSaveStatus("error"); }
  };
  const voice = useVoiceResponse({
    turnKey: `${flow.question?.id}:${isComplete}`,
    onTranscript: acceptResponse, beforeListen: stopQuestionSpeech, requestVoiceAccess,
  });
  const { isListening, isTranscribing, startListening, stopListening } = voice;
  const skipQuestion = (fromVoice = false) => {
    if (isListening || (isTranscribing && fromVoice !== true)) return;
    stopQuestionSpeech();
    const question = flow.question;
    if (!question) return;
    recordConceptReview(question, true);
    setSkipped(count => count + 1);
    if (question.kind === "followup") continueFollowUps(recordN400FollowUpAnswer(flow.state, question, ""), flow);
    else advanceToNextConcept(recordN400Answer(flow.state, question, ""));
  };

  if (isComplete) return (
    <div className="interview-screen">
      <div className="results-card n400-results-card">
        <div className="results-eyebrow">N-400 · {N400_FORM_EDITION}</div>
        <h1>{copy.complete}</h1>
        <div className="n400-results-total"><strong>{reviewedCount}</strong><span>{copy.concepts}</span></div>
        <p className="results-message">{copy.results}</p>
        <div className="results-stats">
          <div className="result-stat correct"><strong>{reviewedCount}</strong><small>{copy.reviewed}</small></div>
          <div className="result-stat incorrect"><strong>{skipped}</strong><small>{copy.skipped}</small></div>
        </div>
        <button className="results-focus-button" onClick={onRestart}>{copy.restart}</button>
        <button className="results-secondary-button" onClick={onExit}>{copy.home}</button>
      </div>
    </div>
  );

  const question = flow.question;
  const section = SUB_BLOCK_LABELS[flow.state.currentSubBlock]?.[language === "es" ? 1 : 0] || flow.state.currentSubBlock;
  const canRemember = onSaveN400Profile && pendingResponse && !pendingResponse.uncertain && !pendingResponse.question.id.startsWith("P_ANUMBER");
  return (
    <div className={`interview-screen n400-interview-screen live-interview-screen interviewer-${interviewer} ${isSpeaking ? "sarah-speaking-live" : isListening ? "sarah-listening-live" : "sarah-waiting-live"}`}>
      <header className="interview-header">
        <button className="back-button interview-exit-button" onClick={onExit} aria-label={copy.exit}><span aria-hidden="true">×</span></button>
        <div className="interview-brand"><strong>CITIZENSHIP <span>AI</span></strong><small>{copy.brand}</small></div>
        <button className="more-button interview-repeat-button" onClick={() => speakQuestion(question.english)} disabled={isListening || isTranscribing} aria-label={copy.repeat} title={copy.repeat}>↻</button>
      </header>
      <InterviewWorkspace language={language} mode="n400" current={Math.min(reviewedCount + 1, totalConcepts)} total={totalConcepts} busy={isListening || isTranscribing} onReplay={() => speakQuestion(question.english)}>
        <section className="sarah-live-stage" aria-label={`${interviewerName}, ${copy.interviewer}`}>
          <div className="live-stage-media" aria-hidden="true">
            <div className={`live-stage-motion-frame sarah-video-frame ${isKevin ? "kevin-motion-frame" : ""}`}>
              {isKevin ? <><video src="/kevin-listening.mp4" className="live-sarah-video live-sarah-resting" autoPlay muted loop playsInline /><video src="/kevin-speaking.mp4" className="live-sarah-video live-sarah-speaking" autoPlay muted loop playsInline /></> : <><video src="/sarah-listening.mp4" poster={sarahImage} className="live-sarah-video live-sarah-resting" autoPlay muted loop playsInline /><video src="/sarah-speaking.mp4" poster={sarahSpeakingImage} className="live-sarah-video live-sarah-speaking" autoPlay muted loop playsInline /></>}
            </div><div className="live-stage-mask"></div>
          </div>
          <div className="live-stage-topbar">
            <div className="live-agent-badge"><span className="live-dot"></span><div><strong>{interviewerName}</strong><small>{copy.interviewer}</small></div></div>
            <div className="live-interviewer-selector" role="group" aria-label={copy.officer}>
              {["sarah", "kevin"].map(name => <button key={name} type="button" className={interviewer === name ? "active" : ""} disabled={isListening || isTranscribing} aria-pressed={interviewer === name} onClick={() => { setInterviewer(name); speakQuestion(question.english, name); }}>{name === "sarah" ? "Sarah" : "Kevin"}</button>)}
            </div>
            <span className="live-practice-badge">N-400 {N400_FORM_EDITION}</span>
          </div>
          <div className="live-stage-presence"><span>{copy.title}</span><strong>{interviewerName}</strong><small>{isSpeaking ? copy.speaking : isListening ? copy.listening : copy.ready}</small></div>
          <section className="live-question-card n400-question-card" aria-live="polite">
            <div className="live-question-header"><div className="ai-turn-indicator">{isSpeaking ? `${interviewerName} ${copy.spoken}` : isListening ? `${interviewerName} ${copy.heard}` : copy.turn}</div><span>{flow.state.currentBlock === "PERSONAL" ? copy.personal : copy.eligibility} · {section}</span></div>
            <h2 className="question" lang="en">{question.english}</h2>
            <div className="n400-session-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label={`${reviewedCount}/${totalConcepts} ${copy.concepts}`}><span style={{ width: `${progress}%` }}></span></div>
            <small className="n400-progress-label">{reviewedCount} {copy.concepts} · {question.kind === "followup" ? copy.followup : copy.wording}</small>
          </section>
          <div className="live-voice-status" aria-live="polite"><span>{isTranscribing ? copy.preparing : isSpeaking ? `${interviewerName} ${copy.spoken}…` : isListening ? copy.voiceListening : copy.voiceReady}</span></div>
        </section>
        {flow.state.caseStage === "INTERVIEW_SCHEDULED" && <p className="n400-context-summary">{copy.interviewSoon}</p>}
        {question.knownAnswer && !pendingResponse && <details className="n400-known-answer"><summary>{copy.reference}</summary><p>{question.knownAnswer}</p><button className="secondary-button" disabled={isListening || isTranscribing} onClick={() => acceptResponse(question.knownAnswer)}>{copy.useSaved}</button></details>}
        <section className="live-answer-feedback" aria-live="polite">
          {answer && <div className={`answer-preview ${answerStatus}`}><span>{copy.input}</span><p>{answer}</p><div className="answer-result">{answerStatus === "recorded" ? copy.recorded : answerStatus === "incomplete" ? copy.incomplete : answerStatus === "uncertain" ? (language === "es" ? "La respuesta sigue siendo incierta. Puedes continuar; no se guardará como Sí o No." : "The response is still uncertain. You can continue; it will not be saved as Yes or No.") : ""}</div></div>}
          {(answerStatus === "error" || voice.error) && <p role="alert">{copy.error}</p>}
        </section>
        <section className="live-interview-controls" aria-label={copy.title}>
          {!pendingResponse ? <>
            <form className="n400-text-response" onSubmit={event => { event.preventDefault(); acceptResponse(draft); }}>
              <label htmlFor="n400-text-answer">{copy.typed}</label>
              <textarea id="n400-text-answer" value={draft} rows={3} maxLength={1600} disabled={isListening || isTranscribing} onFocus={stopQuestionSpeech} onChange={event => setDraft(event.target.value)} aria-describedby="n400-privacy-note" />
              <button className="primary-button" type="submit" disabled={!draft.trim() || isListening || isTranscribing}>{copy.submit}</button>
            </form>
            <button className={`secondary-button live-mic-button ${isListening ? "listening" : ""}`} onClick={isListening ? stopListening : startListening} disabled={isTranscribing} aria-label={isListening ? copy.stop : copy.microphone} aria-pressed={isListening}><svg className="workspace-microphone-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></svg>{isListening ? copy.finish : copy.record}</button>
            <button className="live-skip-button" onClick={() => skipQuestion()} disabled={isListening || isTranscribing}>{copy.skip}</button>
          </> : <>
            <button className="primary-button" onClick={continueResponse} disabled={saveStatus === "saving"}>{copy.continue}</button>
            {canRemember && <div className="n400-confirm-response"><button className="tertiary-button" onClick={rememberResponse} disabled={saveStatus === "saving" || saveStatus === "saved"}>{saveStatus === "saving" ? copy.preparing : saveStatus === "saved" ? copy.remembered : copy.remember}</button>{saveStatus === "error" && <p role="alert">{copy.saveError}</p>}</div>}
          </>}
          <details className="workspace-privacy"><summary>{language === "es" ? "Privacidad" : "Privacy"}</summary><p className="n400-privacy-note" id="n400-privacy-note">{copy.privacy}</p></details>
          <div className="live-score-summary n400-session-summary" role="group" aria-label={copy.progress}><span>{reviewedCount} {copy.reviewed}</span><span>{skipped} {copy.skipped}</span></div>
        </section>
      </InterviewWorkspace>
    </div>
  );
}
