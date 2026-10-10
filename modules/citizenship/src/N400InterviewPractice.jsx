import AnswerFeedback from '../../../shared/interview-ui/AnswerFeedback.jsx';
import CallView from '../../../shared/interview-ui/CallView.jsx';
import { useEffect, useRef, useState } from "react";
import n400Bank from "./data/n400InterviewBank.json";
import { startAudioRecording, transcribeRecording } from "./audio";
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
  const [callStarted,setCallStarted]=useState(false),[callPaused,setCallPaused]=useState(false),[captionsVisible,setCaptionsVisible]=useState(true),[elapsed,setElapsed]=useState(0);
  useEffect(()=>{if(!callStarted||isNaN(elapsed))return;const timer=setInterval(()=>setElapsed(v=>v+1),1000);return()=>clearInterval(timer);},[callStarted]);
  const [flow, setFlow] = useState(() => createInitialFlow(brainContext));
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [answer, setAnswer] = useState("");
  const [draft, setDraft] = useState("");
  const [answerStatus, setAnswerStatus] = useState("");
  const [pendingResponse, setPendingResponse] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [skipped, setSkipped] = useState(0);
  const [interviewer, setInterviewer] = useState("sarah");
  const recorderRef = useRef(null);
  const captureGeneration=useRef(0);
  const microphonePendingRef = useRef(false);
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
    if(!callStarted)return ()=>{mountedRef.current=false;};
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
      recorderRef.current?.cancel?.();
      stopAppSpeech();
      setCompanionSessionVisibility(getCompanionVisibility());
    };
  }, [callStarted]);

  useEffect(() => {
    if (!isComplete || completionReportedRef.current) return;
    completionReportedRef.current = true;
    onComplete?.({ score: null, outcome: "completed", reviewedConceptIds: [...reviewedConceptsRef.current], skippedConceptIds: [...skippedConceptsRef.current] });
    emitCompanionState("celebration", { message: copy.completedMessage });
  }, [isComplete, onComplete, copy.completedMessage]);

  const resetQuestionUi = () => { setAnswer(""); setDraft(""); setAnswerStatus(""); setPendingResponse(null); setSaveStatus(""); };
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
    if (!question || !transcript || pendingResponse) return;
    stopQuestionSpeech();
    setAnswer(transcript);
    if (question.answerType === "yes_no" && parseYesNo(transcript) === null) {
      setAnswerStatus("incomplete");
      emitCompanionState("support", { message: copy.support });
      return;
    }
    const state = question.kind === "followup" ? recordN400FollowUpAnswer(flow.state, question, transcript) : recordN400Answer(flow.state, question, transcript);
    setAnswerStatus("recorded");
    setPendingResponse({ question, transcript, state });
    emitCompanionState("progress", { message: copy.encouragement });
  };
  const continueResponse = () => {
    if (!pendingResponse) return;
    const { state, question, transcript } = pendingResponse;
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
    if (!pendingResponse || !onSaveN400Profile || saveStatus === "saving") return;
    const profile = confirmN400ProfileAnswer(confirmedProfileRef.current, pendingResponse.question, pendingResponse.transcript);
    if (!profile) return;
    setSaveStatus("saving");
    try {
      await onSaveN400Profile(profile);
      confirmedProfileRef.current = profile;
      if (mountedRef.current) setSaveStatus("saved");
    } catch { if (mountedRef.current) setSaveStatus("error"); }
  };
  const beginListening = async () => {
    if (!mountedRef.current || microphonePendingRef.current || recorderRef.current) return;
    microphonePendingRef.current = true;
    const generation=captureGeneration.current;
    stopQuestionSpeech();
    try {
      const recorder = await startAudioRecording();
      if (!mountedRef.current||generation!==captureGeneration.current) { recorder.cancel?.(); return; }
      recorderRef.current = recorder;
      setIsListening(true);
      setAnswerStatus("");
      emitCompanionState("thinking");
    } catch { if (mountedRef.current) setAnswerStatus("error"); }
    finally { microphonePendingRef.current = false; }
  };
  const startListening = () => requestVoiceAccess ? requestVoiceAccess(beginListening) : beginListening();
  const stopListening = async () => {
    const generation=captureGeneration.current;
    const recorder = recorderRef.current;
    recorderRef.current = null;
    setIsListening(false);
    if (!recorder) return;
    setIsTranscribing(true);
    try {
      const transcript = await transcribeRecording(await recorder.stop());
      if (!mountedRef.current||generation!==captureGeneration.current) return;
      if (transcript) acceptResponse(transcript);
      else setAnswerStatus("error");
    } catch { if (mountedRef.current) setAnswerStatus("error"); }
    finally { if (mountedRef.current) setIsTranscribing(false); }
  };
  const skipQuestion = () => {
    if (isListening || isTranscribing) return;
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
  const canRemember = onSaveN400Profile && pendingResponse && !pendingResponse.question.id.startsWith("P_ANUMBER");
  if(!callStarted)return <section className="call-setup"><h1>N-400</h1><p>{copy.title}</p><label>{copy.officer}<select value={interviewer} onChange={e=>setInterviewer(e.target.value)}><option value="sarah">Sarah</option><option value="kevin">Kevin</option></select></label><p>{copy.privacy}</p><button className="primary-button" onClick={()=>setCallStarted(true)}>{language==='es'?'Comenzar entrevista':'Start interview'}</button></section>;
  const paused=()=>{captureGeneration.current++;stopQuestionSpeech();recorderRef.current?.cancel?.();recorderRef.current=null;setIsListening(false);setCallPaused(v=>!v);};
  return <CallView onSkip={skipQuestion} skipDisabled={Boolean(pendingResponse)} moduleId="citizenship" lang={language} state={callPaused?'paused':isTranscribing?'processing':isSpeaking?'speaking':'listening'} elapsed={elapsed} muted={!isListening} captions={[{who:'ai',text:question.english},...(answer?[{who:'user',text:answer}]:[])]} showCaptions={captionsVisible} onCaptions={()=>setCaptionsVisible(v=>!v)} onMic={()=>{if(!callPaused&&!isTranscribing&&!pendingResponse)(isListening?stopListening:startListening)();}} onRepeat={()=>speakQuestion(question.english)} onPause={paused} onSuspend={()=>{captureGeneration.current++;stopQuestionSpeech();recorderRef.current?.cancel?.();recorderRef.current=null;setIsListening(false);setCallPaused(true);}} onFinish={()=>{captureGeneration.current++;stopQuestionSpeech();recorderRef.current?.cancel?.();recorderRef.current=null;setIsListening(false);setCallStarted(false);setIsComplete(true);}} interviewerName={interviewerName} interviewType="N-400" mediaBase={'/modules/citizenship/'+interviewer+'-'} mode="personal" error={answerStatus==='error'?copy.error:null}>
   {pendingResponse?<><p>{copy.recorded}</p><button onClick={continueResponse} disabled={callPaused||saveStatus==='saving'}>{copy.continue}</button>{canRemember&&<button onClick={rememberResponse} disabled={saveStatus==='saving'||saveStatus==='saved'}>{saveStatus==='saved'?copy.remembered:copy.remember}</button>}</>:<form onSubmit={e=>{e.preventDefault();acceptResponse(draft);}}><input aria-label={copy.input} value={draft} maxLength={1600} disabled={callPaused||isListening||isTranscribing} onFocus={stopQuestionSpeech} onChange={e=>setDraft(e.target.value)}/><button disabled={callPaused||isListening||isTranscribing||!draft.trim()}>{copy.submit}</button></form>}
   {answerStatus==='incomplete'&&<p role="status">{copy.incomplete}</p>}
   <AnswerFeedback module="n400" question={question.english} answer={pendingResponse?.transcript||draft||answer} lang={language} disabled={callPaused||isListening||isTranscribing}/>
   {callPaused&&<>{question.knownAnswer&&!pendingResponse&&<details><summary>{copy.reference}</summary><p>{question.knownAnswer}</p><button onClick={()=>acceptResponse(question.knownAnswer)}>{copy.useSaved}</button></details>}</>}
  </CallView>;
}
