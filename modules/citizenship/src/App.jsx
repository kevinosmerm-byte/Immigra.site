import '../../../shared/design-system/citizenship-exercises.css';
import {GlassCard,GlassProgress} from '../../../shared/design-system/Glass.jsx';
import EmailProfile from '../../../shared/EmailProfile.jsx';
import CoachCall from '../CoachCall.jsx';
import CallView from '../../../shared/interview-ui/CallView.jsx';
import PlatformHome from '../PlatformHome.jsx';
import { queueSavedQuestion, syncSavedQuestions } from "./savedQuestions.js";
import { MyCivicsProfile } from "./MyCivicsProfile.jsx";
import { saveCivicProfile } from "./civicProfileStorage.js";
import { useCivicProfile } from "./useCivicProfile.js";
import { resolveCivicsQuestion } from "./dynamicCivicsData.js";
import { ProgressGate } from "./ProgressGate.jsx";
import { useProgressGate } from "./progressGateContext.js";
import {ModuleNavigation} from '../../../shared/design-system/Components.jsx';
import { lazy, Suspense, useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import "./BrandPalette.css";
import PlatformPractice from "../PlatformPractice.jsx";
import { buildBrainContext, getDailyStudyPlan, getNextAction } from "./brain.js";
import { useBrainProfile } from "./useBrainProfile.js";
import { Profile } from "./Profile.jsx";
import CaseJourney from "./CaseJourney.jsx";
import { getQuizProgress, recordQuizAttempt } from "./quizLearning.js";
import { readAppRoute, appRouteHash } from "../routes.mjs";
import sarahImage from "./assets/sarah.png";
import sarahSpeakingImage from "./assets/sarah-speaking.png";
import { civicsQuestionBank } from "./civicsQuestionBank.js";
import { evaluateCivicsAnswer } from "./civicsAnswerEvaluator.js";
import { apiJson } from "./api";
import { startAudioRecording, transcribeRecording, audioErrorMessage } from "./audio";
import { LegalSettings, Onboarding } from "./LegalSettings";
import { getPracticeEvents, getPracticeSummary, recordPracticeEvent, getModuleProgress, saveModuleProgress, recordCivicsMistake, migrateLegacyCivicsProgress, getN400LearningProgress } from "./progress";
import { PodcastLibrary } from "./PodcastPlayer";
import { usePromotionAccess } from "./promotionAccessContext.js";
import { daysSinceOfficialDate, formatOfficialDate, getCaseGuidance } from "./caseTracker";import { DidLiveAvatar } from "./DidLiveAvatar";
import ImmigrationHelp from "./ImmigrationHelp";
import { speakAppText, stopAppSpeech } from "./speech";
import { AccountSheet } from "./Account.jsx";
import { useAccount } from "./accountContext.js";
import { ProgressDashboard } from "./ProgressDashboard.jsx";
import { writingSentences } from "./writingSentences.js";
import { evaluateWritingSentence } from "./writingEvaluator.js";
import { CivicsStudyCard } from "./CivicsStudyCard.jsx";
import { createNavigationHistory, navigateBack, navigateForward } from "./navigationHistory.js";
import { getCivicsVisual } from "./data/civicsVisuals.js";
import { emitCompanionResult, emitCompanionState, emitCompanionContext } from "./companionEvents.js";
import { N400InterviewPractice } from "./N400InterviewPractice.jsx";
import { normalizeThemePreference, resolveTheme, THEME_STORAGE_KEY } from "./theme.js";


const ONBOARDING_STORAGE_KEY = "citizenshipai.onboarding.v1";
const CivicsStudyGuide = lazy(() => import("./CivicsStudyGuide.jsx").then((module) => ({ default: module.CivicsStudyGuide })));
const QuizLearningPath = lazy(() => import("./QuizLearningPath.jsx"));
const LANGUAGE_STORAGE_KEY = "citizenshipai.language";
const CASE_TRACKER_COPY = {
  en: {
    uscIs: "USCIS", title: "Case Tracker", sandbox: "Sandbox",
    header: "Practice using an official USCIS Sandbox API response. This is not a live production case tracker.",
    label: "USCIS SANDBOX · TEST DATA ONLY", enter: "Enter a Sandbox receipt number",
    help: "Use an official USCIS Sandbox test receipt number. This environment does not check a live USCIS case.",
    placeholder: "Sandbox receipt number", inputLabel: "USCIS Sandbox receipt number", missing: "Please enter your receipt number.",
    invalid: "Use 3 letters followed by 10 numbers, for example IOE1234567890.", check: "CHECK SANDBOX STATUS",
    active: "Sandbox mode is active", privacy: "Immigration AI does not save your receipt number or create case monitoring in this version.",
    loading: "Checking official Sandbox status...", unavailable: "Status unavailable", official: "OFFICIAL USCIS STATUS",
    receipt: "RECEIPT NUMBER", testReceipt: "SANDBOX TEST RECEIPT", form: "FORM", updated: "LAST UPDATED", unavailableShort: "Not available",
    daysStatus: "DAYS IN CURRENT STATUS", daysReceived: "DAYS SINCE RECEIVED", calculatedStatus: "Calculated from USCIS last updated date",
    calculatedReceived: "Calculated from the official received date", intelligence: "IMMIGRATION AI EXPLANATION", next: "WHAT SHOULD I DO NOW",
    educational: "Educational information only — not legal advice or an outcome prediction.", history: "OFFICIAL HISTORY", events: "Case events",
    noHistory: "USCIS did not provide a historical event timeline in this Sandbox response. Immigration AI will not create or infer events.",
    monitoringTitle: "Case monitoring is not available yet.", monitoring: "It requires secure accounts, encrypted case storage, user controls, and USCIS Production approval.", back: "← Back to Home",
  },
  es: {
    uscIs: "USCIS", title: "Seguimiento del caso", sandbox: "Sandbox",
    header: "Practica con una respuesta oficial de la API Sandbox de USCIS. No es un rastreador de casos de producción en vivo.",
    label: "USCIS SANDBOX · SOLO DATOS DE PRUEBA", enter: "Ingresa un número de recibo Sandbox",
    help: "Usa un número de recibo oficial de prueba de USCIS Sandbox. Este entorno no consulta un caso real de USCIS.",
    placeholder: "Número de recibo Sandbox", inputLabel: "Número de recibo de USCIS Sandbox", missing: "Ingresa tu número de recibo.",
    invalid: "Usa 3 letras seguidas de 10 números, por ejemplo IOE1234567890.", check: "CONSULTAR ESTADO SANDBOX",
    active: "El modo Sandbox está activo", privacy: "Immigration AI no guarda tu número de recibo ni crea monitoreo de casos en esta versión.",
    loading: "Consultando el estado oficial de Sandbox...", unavailable: "Estado no disponible", official: "ESTADO OFICIAL DE USCIS",
    receipt: "NÚMERO DE RECIBO", testReceipt: "RECIBO DE PRUEBA SANDBOX", form: "FORMULARIO", updated: "ÚLTIMA ACTUALIZACIÓN", unavailableShort: "No disponible",
    daysStatus: "DÍAS EN EL ESTADO ACTUAL", daysReceived: "DÍAS DESDE LA RECEPCIÓN", calculatedStatus: "Calculado desde la fecha de actualización de USCIS",
    calculatedReceived: "Calculado desde la fecha oficial de recepción", intelligence: "EXPLICACIÓN DE IMMIGRATION AI", next: "¿QUÉ DEBO HACER AHORA?",
    educational: "Información educativa únicamente; no es asesoría legal ni una predicción del resultado.", history: "HISTORIAL OFICIAL", events: "Eventos del caso",
    noHistory: "USCIS no proporcionó una línea de tiempo de eventos en esta respuesta Sandbox. Immigration AI no creará ni inferirá eventos.",
    monitoringTitle: "El monitoreo del caso aún no está disponible.", monitoring: "Requiere cuentas seguras, almacenamiento cifrado de casos, controles de usuario y aprobación de USCIS para Producción.", back: "← Volver al inicio",
  },
};

function readLocalValue(key, fallback = "") {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function readLocalJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocalValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The application remains usable when browser storage is unavailable.
  }
}
const readingSentences = [
  {
    english: "The United States Constitution is the supreme law of the land.",
    spanish: "La Constitución de los Estados Unidos es la ley suprema del país."
  },
  {
    english: "The President of the United States lives in the White House.",
    spanish: "El Presidente de los Estados Unidos vive en la Casa Blanca."
  },
  {
    english: "Citizens have the right to vote in federal elections.",
    spanish: "Los ciudadanos tienen derecho a votar en las elecciones federales."
  },
  {
    english: "The United States has fifty states.",
    spanish: "Los Estados Unidos tienen cincuenta estados."
  },
  {
    english: "The Constitution protects the rights of all citizens.",
    spanish: "La Constitución protege los derechos de todos los ciudadanos."
  },
  {
    english: "The American flag has fifty stars.",
    spanish: "La bandera estadounidense tiene cincuenta estrellas."
  },
  {
    english: "The American flag has thirteen stripes.",
    spanish: "La bandera estadounidense tiene trece franjas."
  },
  {
    english: "George Washington was the first President.",
    spanish: "George Washington fue el primer Presidente."
  },
  {
    english: "Abraham Lincoln was President during the Civil War.",
    spanish: "Abraham Lincoln fue Presidente durante la Guerra Civil."
  },
  {
    english: "The capital of the United States is Washington, D.C.",
    spanish: "La capital de los Estados Unidos es Washington, D.C."
  },
  {
    english: "The White House is in Washington, D.C.",
    spanish: "La Casa Blanca está en Washington, D.C."
  },
  {
    english: "Congress makes federal laws.",
    spanish: "El Congreso hace las leyes federales."
  },
  {
    english: "The President lives in the White House.",
    spanish: "El Presidente vive en la Casa Blanca."
  },
  {
    english: "Citizens can vote in elections.",
    spanish: "Los ciudadanos pueden votar en las elecciones."
  },
  {
    english: "People can vote for the President.",
    spanish: "Las personas pueden votar por el Presidente."
  },
  {
    english: "The Bill of Rights protects individual rights.",
    spanish: "La Declaración de Derechos protege los derechos individuales."
  },
  {
    english: "The United States is a country.",
    spanish: "Los Estados Unidos son un país."
  },
  {
    english: "California is a state.",
    spanish: "California es un estado."
  },
  {
    english: "Washington, D.C. is the capital.",
    spanish: "Washington, D.C. es la capital."
  },
  {
    english: "The President is the leader of the country.",
    spanish: "El Presidente es el líder del país."
  },
  {
    english: "Senators work in Congress.",
    spanish: "Los senadores trabajan en el Congreso."
  },
  {
    english: "The American flag is a symbol of the country.",
    spanish: "La bandera estadounidense es un símbolo del país."
  },
  {
    english: "Independence Day is July 4.",
    spanish: "El Día de la Independencia es el 4 de julio."
  },
  {
    english: "Thanksgiving is a national holiday.",
    spanish: "El Día de Acción de Gracias es un feriado nacional."
  },
  {
    english: "The President is elected by the people.",
    spanish: "El Presidente es elegido por el pueblo."
  },
  {
    english: "Citizens have rights and responsibilities.",
    spanish: "Los ciudadanos tienen derechos y responsabilidades."
  },
  {
    english: "The government protects the people.",
    spanish: "El gobierno protege al pueblo."
  },
  {
    english: "People live in every state.",
    spanish: "Las personas viven en cada estado."
  },
  {
    english: "The United States has a government.",
    spanish: "Los Estados Unidos tienen un gobierno."
  },
  {
    english: "The Constitution forms the government.",
    spanish: "La Constitución forma el gobierno."
  }
];
function RealInterview({ onExit, onComplete, onReview, onQuestionResult, onRestart, civicProfile, brainContext = {}, language = "en", userKey = "guest", mode = "full", requestVoiceAccess }) {
  const { runTransition } = useProgressGate();
  const [microphoneError,setMicrophoneError]=useState("");
  const [callStarted,setCallStarted]=useState(false),[paused,setPaused]=useState(false),[captions,setCaptions]=useState(true),[elapsed,setElapsed]=useState(0);
  const captureGeneration=useRef(0);
  const [endedEarly,setEndedEarly]=useState(false);
  const t = (en, es) => language === "es" ? es : en;
  const [checkpoint] = useState(() => {
    const saved = getModuleProgress(userKey).interview;
    const ids = Array.isArray(saved?.questionIds) ? saved.questionIds : [];
    return mode === "civics" && saved && !saved.isComplete && ids.length && Number.isInteger(saved.questionIndex) && saved.questionIndex >= 0 && saved.questionIndex < ids.length && new Set(ids).size === ids.length && ids.every(id => civicsQuestionBank.some(question => question.questionId === id)) ? saved : null;
  });
  const [questions] = useState(() => {
    const profile = civicProfile || brainContext.civicProfile;
    if (checkpoint) return checkpoint.questionIds.map(id => resolveCivicsQuestion(civicsQuestionBank.find(question => question.questionId === id), { profile }));
    const prioritizedIds = getDailyStudyPlan(brainContext).items.flatMap(item => item.questionIds || []);
    const rank = new Map(prioritizedIds.map((id, index) => [id, index]));
    return civicsQuestionBank.map(question => resolveCivicsQuestion(question, { profile }))
      .sort((left, right) => (rank.get(left.questionId) ?? Number.MAX_SAFE_INTEGER) - (rank.get(right.questionId) ?? Number.MAX_SAFE_INTEGER) || left.questionId - right.questionId)
      .slice(0, mode === "civics" ? 10 : 5);
  });
  const [currentQuestion, setCurrentQuestion] = useState(checkpoint?.questionIndex || 0);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [answer, setAnswer] = useState("");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [answerStatus, setAnswerStatus] = useState("");
  const [feedback, setFeedback] = useState("");
  const [readyForNext, setReadyForNext] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(checkpoint?.score || 0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(checkpoint?.incorrect || 0);
  const [missedQuestions, setMissedQuestions] = useState(() => (checkpoint?.missedIds || []).map(id => ({ id, english: civicsQuestionBank.find(question => question.questionId === id)?.question || "" })));
  const [hasRetried, setHasRetried] = useState(false);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  useEffect(()=>{if(!callStarted||isInterviewComplete)return;const timer=setInterval(()=>setElapsed(x=>x+1),1000);return()=>clearInterval(timer);},[callStarted,isInterviewComplete]);
  const [interviewer, setInterviewer] = useState("sarah");
  const [useStandardInterview, setUseStandardInterview] = useState(false);
  const recorderRef = useRef(null);
  const microphonePendingRef = useRef(false);
  const mountedRef = useRef(false);
  const completionReportedRef = useRef(false);
  const speechRequestRef = useRef(0);
  const speechTimerRef = useRef(null);
  const savedTransition = useRef(null);
  const soundEnabled = brainContext.preferences?.soundEnabled !== false;
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    if (mode !== "civics") return;
    const transition = `${currentQuestion}:${isInterviewComplete}:${readyForNext}:${correctAnswers}:${incorrectAnswers}`;
    if (savedTransition.current === transition) return;
    savedTransition.current = transition;
    const completed = isInterviewComplete && !endedEarly ? questions.length : currentQuestion + Number(readyForNext);
    saveModuleProgress("interview", { completed, total: questions.length, questionIndex: completed, questionIds: questions.map(question => question.questionId), score: correctAnswers, incorrect: incorrectAnswers, missedIds: missedQuestions.map(question => question.id), resultStatus: answerStatus }, userKey);
  }, [currentQuestion, isInterviewComplete, questions, correctAnswers, incorrectAnswers, missedQuestions, userKey, mode, readyForNext, answerStatus,endedEarly]);
  const isKevin = interviewer === "kevin";
  const interviewerName = isKevin ? "Kevin" : "Sarah";
  const questionText = question => question.question || question.english;
  const questionSpanish = question => question.questionSpanish || question.spanish;
  const questionKey = question => question.questionId || question.id;
  const addMissedQuestion = question => setMissedQuestions(current => current.some(item => item.id === questionKey(question)) ? current : [...current, { id: questionKey(question), english: questionText(question) }]);
  useEffect(() => {
    if (mode === "full") emitCompanionState("idle", { duration: 0, silent: true });
  }, [mode]);
  useEffect(() => {
    if (!isInterviewComplete || completionReportedRef.current) return;
    completionReportedRef.current = true;
    const graded = correctAnswers + incorrectAnswers;
    onComplete?.({ score: graded ? Math.round(correctAnswers / graded * 100) : null, outcome: "completed" });
    emitCompanionState("celebration");
  }, [isInterviewComplete, correctAnswers, incorrectAnswers, onComplete]);
  const speakQuestion = async (text, onFinished, selectedInterviewer = interviewer) => {
    const requestId = ++speechRequestRef.current;
    if (!soundEnabled) { setIsSpeaking(false); onFinished?.(); return; }
    setIsSpeaking(true);
    emitCompanionState("coach");
    try { await speakAppText(text, { profile: selectedInterviewer === "kevin" ? "male" : "female" }); }
    finally { if (mountedRef.current && requestId === speechRequestRef.current) { setIsSpeaking(false); onFinished?.(); } }
  };
  const stopQuestionSpeech = () => {
    clearTimeout(speechTimerRef.current);
    speechRequestRef.current += 1;
    stopAppSpeech();
    setIsSpeaking(false);
  };
  useEffect(() => {
    mountedRef.current = true;
    if (callStarted && (mode !== "full" || useStandardInterview)) speechTimerRef.current = setTimeout(() => {
      if (!soundEnabledRef.current) return;
      const requestId = ++speechRequestRef.current;
      setIsSpeaking(true);
      const question = questions[checkpoint?.questionIndex || 0];
      speakAppText(`Welcome. We are going to begin your civics interview practice. ${question.question || question.english}`, { profile: "female" })
        .finally(() => { if (mountedRef.current && requestId === speechRequestRef.current) setIsSpeaking(false); });
    }, 500);
    return () => {
      mountedRef.current = false;
      clearTimeout(speechTimerRef.current);
      speechRequestRef.current += 1;
      recorderRef.current?.cancel?.();
      stopAppSpeech();
    };
  }, [questions, mode, checkpoint, useStandardInterview, callStarted]);
  const goToNextQuestion = () => runTransition({ module: "interview", completed: currentQuestion + 1, total: questions.length, busy: Boolean(recorderRef.current) }, () => {
    stopQuestionSpeech();
    const nextQuestion = currentQuestion + 1;
    if (nextQuestion >= questions.length) { setIsInterviewComplete(true); speakQuestion("Thank you. That concludes this practice interview."); return; }
    setCurrentQuestion(nextQuestion);
    setAnswer(""); setTypedAnswer(""); setAnswerStatus(""); setFeedback(""); setReadyForNext(false); setHasRetried(false);
    speechTimerRef.current = setTimeout(() => speakQuestion(questionText(questions[nextQuestion])), 250);
  });
  const handleSkip = () => {
    if (isListening || isTranscribing || readyForNext) return;
    setIncorrectAnswers(count => count + 1);
    addMissedQuestion(questions[currentQuestion]);
    onQuestionResult?.(questionKey(questions[currentQuestion]), false, { mode: "written", source: "interview", helpUsed: [] });
    emitCompanionResult(false);
    goToNextQuestion();
  };
  const evaluateInterviewAnswer = (value, answerMode = "written") => {
    const transcript = String(value || "").trim();
    if (!transcript || readyForNext) return;
    stopQuestionSpeech();
    setAnswer(transcript);
    const activeQuestion = questions[currentQuestion];
    // The official civics evaluator is deterministic; neither typed nor spoken answers consume an AI evaluation quota.
    const result = evaluateCivicsAnswer(activeQuestion, transcript);
    setAnswerStatus(result.status);
    if (result.status === "correct") {
      setCorrectAnswers(count => count + 1);
      onQuestionResult?.(questionKey(activeQuestion), true, { mode: answerMode, source: "interview", helpUsed: [] });
      setReadyForNext(true);
      setFeedback(t("Correct. Continue when you are ready.", "Correcto. Continúa cuando estés listo."));
      emitCompanionResult(true);
    } else if (result.status === "review") {
      setReadyForNext(true);
      setFeedback(t("Compare your response with the official answers. This response was not graded.", "Compara tu respuesta con las respuestas oficiales. Esta respuesta no se calificó."));
      emitCompanionState("support");
    } else if (result.status === "incomplete") {
      setFeedback(t(`Please give ${activeQuestion.minimumAnswersRequired} different answers.`, `Da ${activeQuestion.minimumAnswersRequired} respuestas distintas.`));
      emitCompanionState("support");
    } else {
      onQuestionResult?.(questionKey(activeQuestion), false, { mode: answerMode, source: "interview", helpUsed: [] });
      emitCompanionResult(false);
      if (hasRetried) {
        setIncorrectAnswers(count => count + 1);
        addMissedQuestion(activeQuestion);
        setReadyForNext(true);
        setFeedback(t("Review the official answers, then continue.", "Repasa las respuestas oficiales y continúa."));
      } else {
        setHasRetried(true);
        setFeedback(t("Try this question once more.", "Intenta responder esta pregunta otra vez."));
      }
    }
  };
  const beginListening = async () => {
    if (!mountedRef.current || microphonePendingRef.current || recorderRef.current) return;
    microphonePendingRef.current = true;
    const generation=captureGeneration.current;
    stopQuestionSpeech();
    try {
      const recorder = await startAudioRecording();
      if (!mountedRef.current || generation!==captureGeneration.current) { recorder.cancel?.(); return; }
      recorderRef.current = recorder;
      setIsListening(true); setAnswerStatus("");
      emitCompanionState("thinking");
    } catch (error) { if (mountedRef.current && generation===captureGeneration.current) {setMicrophoneError(audioErrorMessage(error,language));setAnswerStatus("error");} }
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
      if (mountedRef.current && generation===captureGeneration.current) { if (transcript) { setTypedAnswer(transcript); evaluateInterviewAnswer(transcript, "spoken"); } else setAnswerStatus("error"); }
    } catch (error) { if (mountedRef.current && generation===captureGeneration.current) {setMicrophoneError(audioErrorMessage(error,language));setAnswerStatus("error");} }
    finally { if (mountedRef.current && generation===captureGeneration.current) setIsTranscribing(false); }
  };
  if (isInterviewComplete) {
    const gradedCount = correctAnswers + incorrectAnswers;
    const scorePercentage = gradedCount ? Math.round(correctAnswers / gradedCount * 100) : null;
    return <div className="interview-screen"><div className="results-card liquid-glass">
      <div className="results-eyebrow">{t("Practice interview complete", "Práctica de entrevista completada")}</div>
      <h1>{t("Interview Complete", "Entrevista completada")}</h1>
      <div className="results-score">{correctAnswers}<span> / {gradedCount}</span></div><div className="results-percentage">{scorePercentage === null ? "—" : `${scorePercentage}%`}</div>
      <div className="results-stats"><div className="result-stat correct"><strong>{correctAnswers}</strong><small>{t("Correct", "Correctas")}</small></div><div className="result-stat incorrect"><strong>{incorrectAnswers}</strong><small>{t("Missed", "Por repasar")}</small></div></div>
      <p className="results-message">{t("Keep practicing to build confidence. Unverified responses were not graded.", "Sigue practicando para ganar confianza. Las respuestas no verificadas no se calificaron.")}</p>
      <section className="interview-review-plan" aria-label={t("Your focused review plan", "Tu plan de repaso")}><h2>{t("Your next focus", "Tu próximo paso")}</h2>
        <p>{missedQuestions.length ? t(`${missedQuestions.length} questions to revisit`, `${missedQuestions.length} preguntas para repasar`) : t("Continue your study plan for the next useful practice.", "Continúa tu plan de estudio con la próxima práctica.")}</p>
        {missedQuestions.length > 0 && <ol>{missedQuestions.slice(0, 3).map(question => <li key={question.id} lang="en">{question.english}</li>)}</ol>}
      </section>
      {missedQuestions.length > 0 && <button className="results-focus-button" onClick={() => onReview?.(missedQuestions.map(question => question.id))}>{t("Review missed questions", "Repasar preguntas")}</button>}
      <button className={missedQuestions.length ? "results-secondary-button" : "results-focus-button"} onClick={onRestart || onExit}>{t("Practice again", "Practicar otra vez")}</button>
      <button className="results-secondary-button" onClick={onExit}>{t("Back to Home", "Volver al inicio")}</button>
    </div></div>;
  }
  if (mode === "full" && !useStandardInterview) return <div className="interview-screen live-interview-screen live-avatar-only-screen">
    <header className="interview-header"><button className="back-button interview-exit-button" onClick={onExit} aria-label={t("Exit live interview", "Salir de la entrevista")}><span aria-hidden="true">×</span></button><div className="interview-brand"><strong>IMMIGRATION <span>AI</span></strong><small>{t("LIVE N-400 + CIVICS INTERVIEW", "ENTREVISTA N-400 + CIVISMO")}</small></div></header>
    <main className="interview-content live-avatar-only-content"><DidLiveAvatar autoStart language={language} onStandardInterview={() => setUseStandardInterview(true)} /></main>
  </div>;
  const question = questions[currentQuestion];
  const suspend=()=>{captureGeneration.current++;recorderRef.current?.cancel?.();recorderRef.current=null;setIsListening(false);setIsTranscribing(false);stopQuestionSpeech();setPaused(true);};
  if(!callStarted)return <section className="platform-panel platform-call-start liquid-glass"><h1>{t('Civics interview','Entrevista cívica')}</h1><p>{t('Choose your interviewer. Speak or type your responses.','Elige tu entrevistador. Puedes responder hablando o escribiendo.')}</p><label>{t('Interviewer','Entrevistador')}<select value={interviewer} onChange={e=>setInterviewer(e.target.value)}><option value="sarah">Sarah</option><option value="kevin">Kevin</option></select></label><button onClick={()=>setCallStarted(true)}>{t('Begin interview','Comenzar entrevista')}</button></section>;
  return <CallView moduleId="citizenship" lang={language} interviewerName={interviewerName} interviewType={t('Civics interview','Entrevista cívica')} mediaBase={'/modules/citizenship/'+interviewer+'-'} state={paused?'paused':isTranscribing?'processing':isSpeaking?'speaking':'listening'} elapsed={elapsed} muted={!isListening} captions={[{who:'ai',text:questionText(question)},...(answer?[{who:'user',text:answer}]:[])]} showCaptions={captions} onCaptions={()=>setCaptions(x=>!x)} onSkip={handleSkip} skipDisabled={readyForNext} progress={{current:currentQuestion+1,total:questions.length}} onMic={()=>{if(!paused&&!isTranscribing&&!readyForNext)(isListening?stopListening:startListening)();}} onRepeat={()=>{suspend();setPaused(false);speakQuestion(questionText(question));}} onPause={()=>{if(paused)setPaused(false);else suspend();}} onSuspend={suspend} onFinish={()=>{suspend();setEndedEarly(true);setCallStarted(false);setIsInterviewComplete(true);}} error={answerStatus==='error'?microphoneError||t('No audio detected. Try again.','No se detectó audio. Inténtalo de nuevo.'):''}>
  {feedback&&<p role="status">{feedback}</p>}
  {readyForNext?<button disabled={paused} onClick={goToNextQuestion}>{t('Continue','Continuar')}</button>:<form onSubmit={e=>{e.preventDefault();evaluateInterviewAnswer(typedAnswer);}}><input aria-label={t('Your response','Tu respuesta')} value={typedAnswer} maxLength={1600} disabled={paused||isListening||isTranscribing} onFocus={stopQuestionSpeech} onChange={e=>setTypedAnswer(e.target.value)}/><button disabled={paused||!typedAnswer.trim()||isListening||isTranscribing}>{t('Check','Comprobar')}</button></form>}
  {readyForNext&&answerStatus!=='correct'&&<details><summary>{t('Official answers','Respuestas oficiales')}</summary><ul>{question.acceptedAnswers?.map(x=><li key={x}>{x}</li>)}</ul></details>}
  {language==='es'&&answer&&<p>{questionSpanish(question)}</p>}
  </CallView>;
}

function AppContent({ userKey,platformLanguage,onPlatformLanguageChange }) {
  const { runTransition } = useProgressGate();
  // 1. TODOS LOS HOOKS (ESTADOS) VAN AQUÍ ARRIBA SIN EXCEPCIÓN
  const [navigation, setNavigation] = useState(() => createNavigationHistory(
    readAppRoute(window.location.hash).screen
  ));
  const screen = navigation.current;
  const previousScreen = navigation.entries.at(-1);
  const previousScreenLabel = (fallback = "home") => language === "es" ? ({home:"Inicio",practice:"Práctica",civics:"Civismo",english:"Inglés",reading:"Lectura",writing:"Escritura",coach:"Sarah",progress:"Progreso",immigrationHelp:"Ayuda",podcasts:"Podcasts",quiz:"Examen",civicsGuide:"Guía",interview:"Entrevista",profile:"Perfil",uscisTracker:"Mi proceso"})[previousScreen || fallback] || "Volver" : ({
    home: "Home",
    practice: "Practice",
    civics: "Civics",
    english: "English",
    reading: "Reading",
    writing: "Writing",
    coach: "Sarah",
    progress: "Progress",
    immigrationHelp: "Immigration Help",
    podcasts: "Podcasts",
    quiz: "Quiz",
    civicsGuide: "Study Guide",
    interview: "Interview",
  })[previousScreen || fallback] || "Back";
  const [coachMode, setCoachMode] = useState("welcome");
  const [interviewMode, setInterviewMode] = useState(() => readAppRoute(window.location.hash).interviewMode);
  const [plannedQuizMode, setPlannedQuizMode] = useState(null);
  const [interviewRunId, setInterviewRunId] = useState(0);
  const [civicsIndex, setCivicsIndex] = useState(() => migrateLegacyCivicsProgress(civicsQuestionBank.length, userKey)?.questionIndex || 0);
  const [civicsFlipped, setCivicsFlipped] = useState(false);
  const [civicsStudyMode, setCivicsStudyMode] = useState("study");
  const [studyFeedback, setStudyFeedbackMessage] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(() => readLocalValue("citizenshipai.feedback-sound.v1", "on") !== "off");
  const [civicsFavorites, setCivicsFavorites] = useState(() => {
    const saved = readLocalJson(userKey === "guest" ? "citizenshipai.civics.favorites.v1" : "citizenshipai.civics.favorites.v1:" + userKey, []);
    return Array.isArray(saved) ? saved : [];
  });
  const [civicsMastered, setCivicsMastered] = useState(() => {
    const saved = readLocalJson(userKey === "guest" ? "citizenshipai.civics.mastered.v1" : "citizenshipai.civics.mastered.v1:" + userKey, []);
    return Array.isArray(saved) ? saved : [];
  });
  const [civicsNeedsPractice, setCivicsNeedsPractice] = useState(() => {
    const saved = readLocalJson(userKey === "guest" ? "citizenshipai.civics.needsPractice.v1" : "citizenshipai.civics.needsPractice.v1:" + userKey, []);
    return Array.isArray(saved) ? saved : [];
  });
  const civicsTouchRef = useRef(null);
  const [uscisReceiptNumber, setUscisReceiptNumber] = useState("");
  const [uscisCaseResult, setUscisCaseResult] = useState(null);
  const [uscisLoading, setUscisLoading] = useState(false);
  const [uscisError, setUscisError] = useState("");
  const [language, setLanguage] = useState(() =>
    readLocalValue(LANGUAGE_STORAGE_KEY, "en") === "es" ? "es" : "en"
  );
  const [themePreference, setThemePreference] = useState(() =>
    normalizeThemePreference(readLocalValue(THEME_STORAGE_KEY, "light"))
  );
  const [systemPrefersLight, setSystemPrefersLight] = useState(() =>
    window.matchMedia?.("(prefers-color-scheme: light)").matches ?? false
  );
  const [onboardingComplete, setOnboardingComplete] = useState(
    // The platform already supplies the language and entry screen. Do not
    // replay the standalone welcome or record consent on the user's behalf.
    () => Boolean(platformLanguage) || readLocalValue(ONBOARDING_STORAGE_KEY) === "complete"
  );
  const [accountOpen, setAccountOpen] = useState(false);
  const { session, recordAccountEvent } = useAccount();
  const brainProfile = useBrainProfile(userKey, session);
  const t = useCallback((en, es) => language === "es" ? es : en, [language]);
  useEffect(() => {
    const handleRoute = () => {
      const route = readAppRoute(window.location.hash);
      if (route.screen === "interview") setInterviewMode(route.interviewMode);
      setNavigation(current => navigateForward(current, route.screen, { replace: true }));
    };
    window.addEventListener("hashchange", handleRoute);
    window.addEventListener("popstate", handleRoute);
    return () => { window.removeEventListener("hashchange", handleRoute); window.removeEventListener("popstate", handleRoute); };
  }, []);
  useEffect(()=>{if(platformLanguage)setLanguage(platformLanguage);},[platformLanguage]);
  useEffect(() => { document.documentElement.lang = language; }, [language]);

  const [profileRevision, setProfileRevision] = useState(0);
  useEffect(() => {
    if (!session?.access_token) return;
    let active = true;
    const sync = () => syncSavedQuestions(session).then(saved => {
      if (!active || !saved) return;
      setCivicsFavorites(saved);
      saveLocalValue(`citizenshipai.civics.favorites.v1:${userKey}`, JSON.stringify(saved));
    }).catch(() => {});
    sync(); window.addEventListener("online", sync);
    return () => { active = false; window.removeEventListener("online", sync); };
  }, [session, userKey]);
  const { civicProfile, refreshStatus: civicRefreshStatus } = useCivicProfile(userKey, brainProfile.profile);
  const trackerCopy = CASE_TRACKER_COPY[language];

  const [civicsViewed, setCivicsViewed] = useState(() => {
    const saved = readLocalJson(userKey === "guest" ? "civicsViewed" : "civicsViewed:" + userKey, []);
    return Array.isArray(saved) ? saved : [];
  });
  const [practiceEvents, setPracticeEvents] = useState(() => getPracticeEvents(userKey));
  useEffect(() => {
    if (screen === "civics") saveModuleProgress("civics", { completed: civicsViewed.length, total: civicsQuestionBank.length, questionIndex: civicsIndex }, userKey);
  }, [screen, civicsIndex, userKey, civicsViewed.length]);
  const { requestAiSession, finishActiveAiSession } = usePromotionAccess();
  const finishActiveAiSessionRef = useRef(finishActiveAiSession);
  useEffect(() => {
    finishActiveAiSessionRef.current = finishActiveAiSession;
  }, [finishActiveAiSession]);

  useEffect(() => {
    if (!["interview", "writing", "coach", "reading"].includes(screen)) {
      finishActiveAiSessionRef.current("auto");
    }
  }, [screen]);

  useEffect(() => {
    document.body.dataset.appScreen = screen;
    return () => delete document.body.dataset.appScreen;
  }, [screen]);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: light)");
    if (!media) return undefined;
    const syncSystemTheme = (event) => setSystemPrefersLight(event.matches);
    media.addEventListener?.("change", syncSystemTheme);
    return () => media.removeEventListener?.("change", syncSystemTheme);
  }, []);

  useEffect(() => {
    const resolvedTheme = resolveTheme(themePreference, systemPrefersLight);
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dataset.themePreference = themePreference;
    document.documentElement.style.colorScheme = resolvedTheme;
    saveLocalValue(THEME_STORAGE_KEY, themePreference);
  }, [themePreference, systemPrefersLight]);

  useEffect(() => {
    if (screen === "interview" && interviewMode === "full") {
      emitCompanionState("idle", { duration: 0, silent: true });
      return;
    }
    const stateByScreen = {
      home: ["welcome", language === "es" ? "¡Hola! Estoy listo para practicar contigo." : "Hi! I'm ready to practice with you."],
      civics: ["reading", language === "es" ? "Estudiemos una pregunta a la vez." : "Let's study one question at a time."],
      quiz: ["determined", language === "es" ? "Avancemos paso a paso." : "Let's build mastery step by step."],
      interview: ["coach", language === "es" ? "Practiquemos como en la entrevista real." : "Let's practice like the real interview."],
      coach: ["coach", language === "es" ? "Conversemos en inglés." : "Let's practice English together."],
      reading: ["reading", language === "es" ? "Lee con calma; estoy escuchando." : "Read calmly; I'm listening."],
      writing: ["reading", language === "es" ? "Escucha y escribe con calma." : "Listen and write at your own pace."],
      progress: ["progress", language === "es" ? "Mira cuánto has avanzado." : "Look how far you've come."],
    };
    const reaction = stateByScreen[screen];
    if (reaction) emitCompanionState(reaction[0], { message: reaction[1], duration: screen === "home" ? 3500 : 0 });
    else emitCompanionState("idle");
  }, [screen, language, interviewMode]);

  useEffect(() => {
    // Every module is a new screen. Do not carry the Home page's scroll
    // position into it, otherwise the coach can open below Sarah's face.
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [screen]);

  const [coachListening, setCoachListening] = useState(false);
  const [coachHistory, setCoachHistory] = useState([]);
  const [coachReply, setCoachReply] = useState("");
  const [coachThinking, setCoachThinking] = useState(false);
  const [coachSpeaking, setCoachSpeaking] = useState(false);
  const coachRecorderRef = useRef(null);
  const coachGeneration = useRef(0);
  const coachMicPending = useRef(false);
  const suspendCoach = () => {coachGeneration.current++;coachRecorderRef.current?.cancel?.();coachRecorderRef.current=null;stopAppSpeech();setCoachListening(false);setCoachSpeaking(false);setCoachThinking(false);};
  useEffect(()=>()=>{coachGeneration.current++;coachRecorderRef.current?.cancel?.();stopAppSpeech();},[screen]);

  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [isReading, setIsReading] = useState(false);
  const [readingIndex, setReadingIndex] = useState(() => getModuleProgress(userKey).reading?.questionIndex || 0);
  const readingRecorderRef = useRef(null);
  const [writingAnswer, setWritingAnswer] = useState("");
  const [writingGoodCount, setWritingGoodCount] = useState(0);
  const [writingNeedsPracticeCount, setWritingNeedsPracticeCount] = useState(0);
  const [writingIndex, setWritingIndex] = useState(() => getModuleProgress(userKey).writing?.questionIndex || 0);
  const [writingEvaluation, setWritingEvaluation] = useState(null);

  const [readingOrder, setReadingOrder] = useState(() =>
    (getModuleProgress(userKey).reading?.questionIds.length === readingSentences.length ? getModuleProgress(userKey).reading.questionIds.map(id => id - 1) : [...readingSentences]
      .map((_, index) => index))
  );
  const practiceSummary = getPracticeSummary(practiceEvents, civicsViewed, civicsMastered);
  const brainContext = buildBrainContext({
    ...brainProfile.profile, civicProfile, language,
    userProfile: { ...brainProfile.profile.userProfile, zipCode: brainProfile.profile.userProfile?.zipCode || civicProfile?.zipCode },
    preferences: { ...brainProfile.profile.preferences, soundEnabled, theme: themePreference, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    learningProfile: { practiceEvents, civicsViewed, civicsMastered, civicsNeedsPractice, quizProgress: getQuizProgress(userKey), moduleProgress: getModuleProgress(userKey), n400Progress: getN400LearningProgress(userKey) },
  });
  const dailyPlan = getDailyStudyPlan(brainContext, { now: new Date().toISOString() });
  const nextAction = getNextAction(brainContext, dailyPlan);
  const previousBrainContext = useRef(null);
  useEffect(() => {
    emitCompanionContext(brainContext, previousBrainContext.current);
    previousBrainContext.current = brainContext;
  }, [brainContext]);
  useEffect(() => {
    if (screen !== "home") return;
    if (dailyPlan.daysUntilInterview !== null && dailyPlan.daysUntilInterview >= 0 && dailyPlan.daysUntilInterview <= 14) {
      emitCompanionState("determined", { message: t("Your interview is approaching. Let's prepare together.", "Tu entrevista se acerca. Preparémonos juntos."), duration: 4000 });
    } else if (civicsMastered.length > 0) {
      emitCompanionState("progress", { message: t("You're building lasting knowledge, one question at a time.", "Estás aprendiendo, una pregunta a la vez."), duration: 3500 });
    }
  }, [screen, language, dailyPlan.daysUntilInterview, civicsMastered.length, t]);

  const handleQuestionResult = (questionId, correct, evidence) => {
    const index = civicsQuestionBank.findIndex(question => question.questionId === questionId);
    if (index < 0) return;
    if (evidence?.source === "interview") {
      recordQuizAttempt({userKey, question: civicsQuestionBank[index], mode: "recall", correct, helpUsed: evidence.helpUsed || []});
    }
    setCivicsNeedsPractice(recordCivicsMistake(index, correct, userKey));
  };
  const recordPractice = (event) => {
    setPracticeEvents(recordPracticeEvent(event, userKey));
    recordAccountEvent("practice_completed", event.module).catch(() => {});
  };

  const navigateTo = (nextScreen, options) => {
    if (nextScreen === "coach") nextScreen = "home";
    if (["civics", "quiz", "vocabulary", "choose", "connect", "reading", "writing", "interview"].includes(nextScreen) && nextScreen !== screen) recordAccountEvent("practice_started", nextScreen).catch(() => {});
    setNavigation((current) => navigateForward(current, nextScreen, options));
    window.history.pushState(null, "", appRouteHash(nextScreen, nextScreen === "interview" ? interviewMode : undefined));
  };

  const goBack = (fallbackScreen = "home") => {
    setNavigation((current) => {
      const previous = navigateBack(current, fallbackScreen);
      window.history.replaceState(null, "", appRouteHash(previous.current));
      return previous;
    });
  };

  const startAiFeature = (feature, continuation) => {
    requestAiSession(feature, continuation, language);
  };
  const requestVoiceAccess = continuation => requestAiSession("classicInterview", continuation, language);


  const startInterview = (mode = "full") => {
    const begin = () => {
      setInterviewMode(mode);
      setInterviewRunId(current => current + 1);
      navigateTo("interview");
      window.history.replaceState(null, "", appRouteHash("interview", mode));
    };
    if (mode === "full") startAiFeature("realInterview", begin);
    else begin();
  };

  const continueDailyPlan = () => {
    if (nextAction.module === "interview") { startInterview(nextAction.mode || "civics"); return; }
    if (nextAction.module === "civics" && nextAction.questionIds?.length) {
      const index = civicsQuestionBank.findIndex(question => question.questionId === nextAction.questionIds[0]);
      if (index >= 0) setCivicsIndex(index);
      setCivicsStudyMode("study");
    }
    if (nextAction.module === "quiz") setPlannedQuizMode(nextAction.mode || "recall");
    navigateTo(nextAction.module || "practice");
  };

  const openPracticeModule = (key) => {
    if (key === "quiz") { navigateTo("quiz"); return; }
    if (key === "interview") {
      startInterview();
      return;
    }
    if (key === "civics") {
      navigateTo("civics");
      return;
    }
    if (key === "coach") return;
    const feature = key === "writing" ? "writing" : "speaking";
    startAiFeature(feature, () => navigateTo(key === "writing" ? "writing" : key === "coach" ? "coach" : "reading"));
  };



  // 2. TODOS LOS EFECTOS (USEEFFECT) VAN AQUÍ
  const markCivicsViewed = (index) => {
    setCivicsViewed((current) => {
      if (current.includes(index)) return current;
      const updated = [...current, index];
      saveLocalValue(userKey === "guest" ? "civicsViewed" : "civicsViewed:" + userKey, JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (screen !== "civics") return;
    const timer = setTimeout(() => {
      setCivicsViewed((current) => {
        if (current.includes(civicsIndex)) return current;
        const updated = [...current, civicsIndex];
        saveLocalValue(userKey === "guest" ? "civicsViewed" : "civicsViewed:" + userKey, JSON.stringify(updated));
        return updated;
      });
      if (soundEnabled) {
        speakAppText(civicsQuestionBank[civicsIndex].question, {
          profile: "female",
          rate: 0.88,
          pitch: 1.08,
        });
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      stopAppSpeech();
    };
  }, [screen, civicsIndex, soundEnabled, userKey]);

  // Funciones auxiliares de soporte...
  const playCorrectSound = () => {
    if (!soundEnabled) return;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.frequency.value = 880;
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.35);
  };

  const playIncorrectSound = () => {
    if (!soundEnabled) return;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.frequency.value = 220;
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const nextReadingSentence = () => runTransition({ module: "reading", completed: readingIndex + 1, total: readingOrder.length, busy: Boolean(readingRecorderRef.current) }, () => {
    saveModuleProgress("reading", { completed: readingIndex + 1, total: readingOrder.length, questionIndex: (readingIndex + 1) % readingOrder.length, questionIds: readingOrder.map(index => index + 1) }, userKey);
    setReadingIndex((currentIndex) => {
      const nextIndex = currentIndex + 1;
      if (nextIndex >= readingOrder.length) {
        const newOrder = [...readingOrder];
        setReadingOrder(newOrder);
        return 0;
      }
      return nextIndex;
    });
    setAiMessage("");
  });

  const nextWritingSentence = () => runTransition({ module: "writing", completed: writingIndex + 1, total: writingSentences.length, busy: isAIThinking }, () => {
    saveModuleProgress("writing", { completed: writingIndex + 1, total: writingSentences.length, questionIndex: (writingIndex + 1) % writingSentences.length }, userKey);
    setWritingAnswer("");
    setWritingEvaluation(null);
    setWritingIndex((currentIndex) => {
      const nextIndex = currentIndex + 1;
      if (nextIndex >= writingSentences.length) return 0;
      return nextIndex;
    });
    setAiMessage("");
  });

  const checkWriting = async () => {
    if (!writingAnswer.trim()) {
      setAiMessage("Please write your answer first.");
      return;
    }
    setIsAIThinking(true);
    emitCompanionState("thinking");
    setAiMessage("Checking your writing...");
    try {
      const sentence = writingSentences[writingIndex];
      const localResult = evaluateWritingSentence(sentence, writingAnswer);
      let result = localResult;
      if (localResult.needsSemanticReview) {
        try {
          result = await apiJson("/evaluate-writing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sentenceId: sentence.sentenceId, answer: writingAnswer }),
          });
        } catch {
          console.warn("Semantic writing review unavailable; using deterministic review.");
        }
      }
      const completeResult = {
        ...localResult,
        ...result,
        details: result.details || localResult.details,
        writtenAnswer: writingAnswer,
        expectedAnswer: sentence.english,
      };
      if (completeResult.accuracy === "Excellent" || completeResult.accuracy === "Good") {
        setWritingGoodCount((count) => count + 1);
        playCorrectSound();
        emitCompanionResult(true);
      } else {
        setWritingNeedsPracticeCount((count) => count + 1);
        playIncorrectSound();
        emitCompanionResult(false);
      }
      const resultLabel = completeResult.resultLabel || (completeResult.accuracy === "Excellent" ? "Correcta" : completeResult.accuracy === "Good" ? "Correcta con observaciones" : "Necesita práctica");
      recordPractice({ module: "writing", score: completeResult.score, outcome: resultLabel });
      setWritingEvaluation({ ...completeResult, resultLabel });
      setAiMessage("");
    } catch {
      console.error("Writing evaluation error:");
      setAiMessage(t("We could not review your writing. Please try again.", "No pudimos revisar tu escritura. Inténtalo otra vez."));
    } finally {
      setIsAIThinking(false);
    }
  };

  const speakCoachReply = async (text) => {
    if (!text) return;
    setCoachSpeaking(false);
    await speakAppText(text, {
      profile: "female",
      rate: 0.92,
      pitch: 1.05,
      onStart: () => setCoachSpeaking(true),
      onEnd: () => setCoachSpeaking(false),
    });
  };

  const sendCoachMessage = async (message) => {
    const generation=coachGeneration.current;
    setCoachThinking(true);
    try {
      const result = await apiJson("/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: coachHistory }),
      });
      if(generation!==coachGeneration.current)return;
      setCoachReply(result.reply || "");
      speakCoachReply(result.reply || "");
      setCoachHistory((current) => [
        ...current,
        { role: "user", content: message },
        { role: "assistant", content: result.reply || "" },
      ]);
      recordPractice({ module: "coach", outcome: "reply" });
    } catch {
      if(generation!==coachGeneration.current)return;
      console.error("Coach AI error:");
      setCoachReply(t("We could not connect. Please try again.", "No pudimos conectar. Inténtalo otra vez."));
    } finally {
      if(generation===coachGeneration.current)setCoachThinking(false);
    }
  };

  const startCoachListening = async () => {
    if(coachMicPending.current||coachRecorderRef.current)return;
    const generation=coachGeneration.current;coachMicPending.current=true;stopAppSpeech();setCoachSpeaking(false);
    try {
      const recorder=await startAudioRecording();
      if(generation!==coachGeneration.current){recorder.cancel?.();return;}
      coachRecorderRef.current=recorder;
      setCoachListening(true);
      emitCompanionState("thinking", { message: language === "es" ? "Te escucho." : "I'm listening." });
    } catch {
      if(generation!==coachGeneration.current)return;
      console.error("Coach microphone error:");
      setCoachReply(t("Allow microphone access and try again.", "Permite el acceso al micrófono e inténtalo otra vez."));
    } finally {coachMicPending.current=false;}
  };

  const stopCoachListening = async () => {
    const generation=coachGeneration.current;
    const recorder = coachRecorderRef.current;
    coachRecorderRef.current = null;
    setCoachListening(false);
    if (!recorder) return;

    try {
      const transcript = await transcribeRecording(await recorder.stop());
      if(generation!==coachGeneration.current)return;
      if (!transcript) throw new Error("No speech was detected.");
      await sendCoachMessage(transcript);
    } catch {
      if(generation!==coachGeneration.current)return;
      console.error("Coach transcription error:");
      setCoachReply(t("We could not hear you. Please try again.", "No pudimos escucharte. Inténtalo otra vez."));
    }
  };

  const startReading = async () => {
    try {
      readingRecorderRef.current = await startAudioRecording();
      setIsAIThinking(true);
      setIsReading(true);
      setAiMessage(t("Listening to your reading…", "Escuchando tu lectura…"));
      emitCompanionState("thinking", { message: language === "es" ? "Te escucho. Lee con calma." : "I'm listening. Read at your own pace." });
    } catch {
      console.error("Reading microphone error:");
      setIsAIThinking(false);
      setAiMessage(t("Allow microphone access and try again.", "Permite el acceso al micrófono e inténtalo otra vez."));
    } finally {coachMicPending.current=false;}
  };

  const stopReading = async () => {
    const recorder = readingRecorderRef.current;
    readingRecorderRef.current = null;
    setIsReading(false);
    if (!recorder) return;

    try {
      setAiMessage(t("Reviewing your reading…", "Revisando tu lectura…"));
      const transcript = await transcribeRecording(await recorder.stop());
      if (!transcript) {
        setAiMessage(t("We could not hear your reading. Please try again.", "No pudimos escuchar tu lectura. Inténtalo otra vez."));
        return;
      }

      const result = await apiJson("/evaluate-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentence: readingSentences[readingIndex].english,
          transcript,
        }),
      });

      if (result.accuracy === "Excellent" || result.accuracy === "Good") {
        playCorrectSound();
        emitCompanionResult(true);
      } else {
        playIncorrectSound();
        emitCompanionResult(false);
      }
      recordPractice({ module: "reading", score: result.score, outcome: result.accuracy });

      setAiMessage(`${result.score}% — ${result.accuracy}\n\n${result.feedback}`);
      setTimeout(nextReadingSentence, 3000);
    } catch {
      console.error("Reading AI error:");
      setAiMessage(t("We could not review your reading. Please try again.", "No pudimos revisar tu lectura. Inténtalo otra vez."));
    } finally {
      setIsAIThinking(false);
    }
  };

  const setPreferredLanguage = (nextLanguage) => {
    const value = nextLanguage === "es" ? "es" : "en";
    setLanguage(value);
    onPlatformLanguageChange?.(value);
    saveLocalValue(LANGUAGE_STORAGE_KEY, value);
  };

  const completeOnboarding = ({ zipCode, initialPractice = "home" } = {}) => {
    if (zipCode && !brainContext.userProfile.zipCode) brainProfile.updateProfile({ userProfile: {zipCode} });
    if (zipCode && !civicProfile) { saveCivicProfile({ zipCode, districtStatus: "unknown", verifiedAt: null }, userKey); setProfileRevision(value => value + 1); }
    saveLocalValue(ONBOARDING_STORAGE_KEY, "complete");
    setOnboardingComplete(true);
    navigateTo(initialPractice);
  };

  const restartOnboarding = () => {
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    } catch {
      // Storage may be unavailable; state still permits the review.
    }
    setNavigation(createNavigationHistory("home"));
    setOnboardingComplete(false);
  };

  const renderScreen = () => {
  // 3. LAS CONDICIONES DE RENDERIZADO (IF) VAN AQUÍ ABAJO, NUNCA ANTES DE LOS HOOKS
  if (!onboardingComplete && screen !== "settings") {
    return <Onboarding language={language} onLanguageChange={setPreferredLanguage} onComplete={completeOnboarding} />;
  }

  if (screen === "settings") {
    return (
      <LegalSettings
        onBack={() => {
          window.history.replaceState(null, "", window.location.pathname);
          goBack("home");
        }}
        language={language}
        themePreference={themePreference}
        onThemeChange={(value) => setThemePreference(normalizeThemePreference(value))}
        onRestartOnboarding={restartOnboarding}
      />
    );
  }

  if (screen === "immigrationHelp") {
    return <ImmigrationHelp language={language} caseProfile={brainContext.caseProfile} n400Profile={brainContext.n400Profile} onLanguageChange={setPreferredLanguage} onBack={() => goBack("home")} />;
  }

  if (screen === "profile" && platformLanguage) return <EmailProfile language={language}/>;
  if (screen === "profile") return <Profile language={language} profile={brainProfile.profile} onUpdate={brainProfile.updateProfile} onBack={() => goBack("home")} onOpenCivicProfile={() => navigateTo("civicProfile")} onOpenAccount={() => setAccountOpen(true)} onOpenSettings={() => navigateTo("settings")} cloudStatus={brainProfile.cloudStatus} onSaveCloud={brainProfile.saveToCloud} onRestoreCloud={brainProfile.restoreFromCloud} onDeleteCloud={brainProfile.deleteFromCloud} onReset={brainProfile.resetProfile} />;
  if (screen === "uscisTracker") return <CaseJourney language={language} userKey={userKey} caseProfile={brainContext.caseProfile} n400Profile={brainContext.n400Profile} onUpdate={caseProfile => brainProfile.updateProfile({ caseProfile })} onNavigate={(destination, options) => destination === "interview" ? startInterview(options?.mode || "n400") : navigateTo(destination, options)} onBack={() => goBack("home")} />;
  if (screen === "civicProfile") return <MyCivicsProfile key={`${userKey}:${profileRevision}`} userKey={userKey} language={language} userProfile={brainContext.userProfile} n400Profile={brainContext.n400Profile} profile={civicProfile} refreshStatus={civicRefreshStatus} onProfileUpdate={userProfile => brainProfile.updateProfile({userProfile})} onSave={profile => { saveCivicProfile(profile, userKey); setProfileRevision(value => value + 1); }} onBack={() => goBack("profile")} />;
  if (screen === "pro") return <AccountSheet embedded language={language} onClose={() => goBack("home")} />;
  if (screen === "podcasts") {
    return <PodcastLibrary language={language} onBack={() => goBack("home")} />;
  }

  if (screen === "civicsGuide") {
    return (
      <Suspense fallback={<div className="study-guide-route-loading" role="status">{t("Loading official study guide…", "Cargando la guía oficial…")}</div>}>
        <CivicsStudyGuide language={language} onBack={() => goBack("civics")} />
      </Suspense>
    );
  }

  if (["quiz", "vocabulary", "choose", "connect"].includes(screen)) {
    return (
      <Suspense fallback={<div className="study-guide-route-loading" role="status">{t("Preparing practice…", "Preparando tu práctica…")}</div>}>
        <QuizLearningPath
          key={`${userKey}:${screen}`}
          language={language}
          onQuestionResult={handleQuestionResult}
          civicProfile={civicProfile}
          initialMode={["vocabulary", "choose", "connect"].includes(screen) ? screen : plannedQuizMode}
          checkpointModule={screen}
          preferredQuestionIds={dailyPlan.items.find(item => item.module === "quiz" || item.module === "civics")?.questionIds || []}
          sessionSize={Math.max(1, Math.min(10, (dailyPlan.items.find(item => item.module === "quiz")?.minutes || 4) * 2))}
          userKey={session?.user?.id || "guest"}
          onBack={() => goBack("civics")}
          onPracticeComplete={({ score, outcome }) => recordPractice({ module: "quiz", score, outcome, category: "civics" })}
        />
      </Suspense>
    );
  }

  if (screen === "coach") return <CoachCall language={language} started={coachMode==='conversation'} speaking={coachSpeaking} listening={coachListening} thinking={coachThinking} reply={coachReply} history={coachHistory} onText={sendCoachMessage} onStart={()=>{setCoachReply("");setCoachMode("conversation");speakCoachReply("Hi! I'm Sarah. Let's practice English together. Tell me about yourself.");}} onMic={coachListening?stopCoachListening:startCoachListening} onRepeat={()=>speakCoachReply(coachReply||"Hi! I'm Sarah. Let's practice English together. Tell me about yourself.")} onSuspend={suspendCoach} onExit={()=>{suspendCoach();setCoachMode('welcome');goBack('home');}}/>;
  // Control de pantallas de la aplicación
  // Control de pantallas de la aplicación
  if (screen === "civics") {
    const isSpanish = language === "es";
    const currentQuestionRecord = resolveCivicsQuestion(civicsQuestionBank[civicsIndex], { profile: civicProfile });
    const currentVisual = getCivicsVisual(currentQuestionRecord.questionId);
    const currentQuestion = currentQuestionRecord.question;
    const currentQuestionSpanish = currentQuestionRecord.questionSpanish;
    const currentAnswers = currentQuestionRecord.acceptedAnswers.length ? currentQuestionRecord.acceptedAnswers : [isSpanish ? "La respuesta cambia. Verifica la actualización oficial." : "This answer changes. Check the official update before practicing."];
    const favoriteIndexes = civicsFavorites.filter((index) => index >= 0 && index < civicsQuestionBank.length);
    const visibleIndexes = civicsStudyMode === "favorites" ? favoriteIndexes : civicsStudyMode === "mistakes" ? civicsNeedsPractice : civicsQuestionBank.map((_, index) => index);
    const activePosition = Math.max(0, visibleIndexes.indexOf(civicsIndex));
    const studiedPercent = Math.round((civicsViewed.length / civicsQuestionBank.length) * 100);
    const copy = isSpanish ? {
      subtitle: "Domina las preguntas para tu entrevista.", progress: "Progreso", cards: "Tarjetas",
      practice: "Práctica", quiz: "Examen", guide: "Libro", favorites: "Favoritas", reveal: "Toca para ver la respuesta",
      question: "PREGUNTA", answer: "RESPUESTA", need: "Necesito practicar", know: "Ya la sé",
      studied: "estudiadas", mastered: "dominadas", review: "repasar", empty: "Aún no tienes preguntas favoritas.",
      backToQuestion: "Toca para volver a la pregunta", playAudio: "Escuchar pregunta y respuesta",
      source: "Fuente de la imagen", addFavorite: "Agregar a favoritas", removeFavorite: "Quitar de favoritas",
      soundOn: "Lectura de tarjetas activada", soundOff: "Lectura de tarjetas desactivada",
    } : {
      subtitle: "Master the questions for your interview.", progress: "Study Progress", cards: "Study Cards",
      practice: "Practice", quiz: "Quiz", guide: "Book", favorites: "Favorites", reveal: "Tap to reveal answer",
      question: "QUESTION", answer: "ANSWER", need: "Need Practice", know: "I Know This",
      studied: "studied", mastered: "mastered", review: "review", empty: "You have not saved any favorite questions yet.",
      backToQuestion: "Tap to return to the question", playAudio: "Play question and answer audio",
      source: "Image source", addFavorite: "Add to favorites", removeFavorite: "Remove from favorites",
      soundOn: "Card reading on", soundOff: "Card reading off",
    };

    const adjacentVisuals = [-1, 1].map((direction) => {
      if (!visibleIndexes.length) return null;
      const position = (activePosition + direction + visibleIndexes.length) % visibleIndexes.length;
      return getCivicsVisual(civicsQuestionBank[visibleIndexes[position]].questionId)?.imagePath ?? null;
    });
    const visualSource = currentVisual ?? {
      imagePath: null,
      imageAlt: "",
      sourceName: "U.S. Citizenship and Immigration Services",
      sourceLabel: "USCIS.gov",
      sourceUrl: "https://www.uscis.gov/citizenship/2025test",
      category: "document",
    };

    const changeCivicsCard = (direction) => {
      if (!visibleIndexes.length) return;
      const nextPosition = (activePosition + direction + visibleIndexes.length) % visibleIndexes.length;
      const nextIndex = visibleIndexes[nextPosition];
      stopAppSpeech().then(() => runTransition({ module: "civics", completed: civicsViewed.length, total: civicsQuestionBank.length }, () => {
        setCivicsFlipped(false); setCivicsIndex(nextIndex); markCivicsViewed(nextIndex);
      }));
    };

    const updateCivicsCollection = (setter, storageKey, shouldAdd) => {
      setter((current) => {
        const updated = shouldAdd
          ? (current.includes(civicsIndex) ? current : [...current, civicsIndex])
          : current.filter((index) => index !== civicsIndex);
        saveLocalValue(userKey === "guest" ? storageKey : `${storageKey}:${userKey}`, JSON.stringify(updated));
        return updated;
      });
    };

    const toggleFavorite = () => {
      const isFavorite = civicsFavorites.includes(civicsIndex);
      queueSavedQuestion(userKey, currentQuestionRecord.questionId, !isFavorite);
      syncSavedQuestions(session).catch(() => {});
      if (!isFavorite) recordAccountEvent("question_saved", "civics").catch(() => {});
      updateCivicsCollection(setCivicsFavorites, "citizenshipai.civics.favorites.v1", !isFavorite);
      if (civicsStudyMode === "favorites" && isFavorite) {
        const remaining = favoriteIndexes.filter((index) => index !== civicsIndex);
        if (remaining.length) setCivicsIndex(remaining[Math.min(activePosition, remaining.length - 1)]);
      }
    };

    const setStudyFeedback = (mastered) => {
      updateCivicsCollection(setCivicsMastered, "citizenshipai.civics.mastered.v1", mastered);
      updateCivicsCollection(setCivicsNeedsPractice, "citizenshipai.civics.needsPractice.v1", !mastered);
      setStudyFeedbackMessage(mastered ? (isSpanish ? "Correcto. La repasaremos más adelante." : "Correct. We will review it again later.") : (isSpanish ? "Guardada para practicar de nuevo." : "Saved for extra practice."));
      if (mastered) playCorrectSound(); else playIncorrectSound();
      emitCompanionResult(mastered);
      window.setTimeout(() => { setStudyFeedbackMessage(""); changeCivicsCard(1); }, 900);
    };

    return (
      <div className="practice-screen civics-screen">
        <GlassCard as="main" className="civics-deck-content">
          <section className="civics-deck-hero" aria-labelledby="civics-deck-title">
            <div className="civics-deck-icon" aria-hidden="true">▤</div>
            <div className="civics-deck-heading">
              <span>CIVICS</span>
              <h1 id="civics-deck-title">128 {isSpanish ? "Preguntas" : "Questions"}</h1>
              <p>{copy.subtitle}</p>
            </div>
            <div className="civics-deck-progress" aria-label={`${copy.progress}: ${studiedPercent}%`}>
              <div><span>{isSpanish ? "Tarjetas vistas" : "Cards viewed"}</span><strong>{studiedPercent}%</strong></div>
              <div className="civics-deck-progress-track"><i style={{ width: `${studiedPercent}%` }}></i></div>
            </div>
          </section>

          <nav className="civics-modes" aria-label={t("Civics study modes", "Formas de estudiar civismo")}>
            <button className={civicsStudyMode === "study" ? "active" : ""} onClick={() => { setCivicsStudyMode("study"); setCivicsFlipped(false); }}>{copy.cards}</button>
            <button onClick={() => startInterview("civics")}>{copy.practice}</button>
            <button onClick={() => navigateTo("quiz")}>{copy.quiz}</button>
            <button onClick={() => navigateTo("civicsGuide")}>{copy.guide}</button>
            <button className={civicsStudyMode === "favorites" ? "active" : ""} onClick={() => { setCivicsStudyMode("favorites"); setCivicsFlipped(false); if (favoriteIndexes.length && !favoriteIndexes.includes(civicsIndex)) setCivicsIndex(favoriteIndexes[0]); }}>{copy.favorites}<span>{civicsFavorites.length}</span></button>
          </nav>
          {visibleIndexes.length ? (
            <>
              <section className="civics-card-deck premium" aria-label={`${copy.cards}: ${civicsIndex + 1} / 128`}>
                <CivicsStudyCard
                  question={currentQuestion}
                  questionSpanish={currentQuestionSpanish}
                  answers={currentAnswers}
                  image={visualSource.imagePath}
                  imageAlt={visualSource.imageAlt}
                  imageFit={visualSource.imageFit}
                  imagePosition={visualSource.imagePosition}
                  sourceName={visualSource.sourceName}
                  sourceLabel={visualSource.sourceLabel}
                  sourceUrl={visualSource.sourceUrl}
                  sourceCategory={visualSource.category}
                  questionNumber={civicsIndex + 1}
                  totalQuestions={civicsQuestionBank.length}
                  favorite={civicsFavorites.includes(civicsIndex)}
                  mastered={civicsMastered.includes(civicsIndex)}
                  answerVisible={civicsFlipped}
                  audioEnabled={soundEnabled}
                  preloadImages={[visualSource.imagePath, ...adjacentVisuals]}
                  touchRef={civicsTouchRef}
                  onToggleAnswer={() => setCivicsFlipped((current) => {
                    if (!current) emitCompanionState("explain");
                    return !current;
                  })}
                  onToggleFavorite={toggleFavorite}
                  onPlayAudio={() => {
                    if (soundEnabled) {
                      emitCompanionState("reading");
                      speakAppText(`${currentQuestion}. ${currentAnswers.join(". ")}`, { profile: "female", rate: 0.88, pitch: 1.08 });
                    }
                  }}
                  onNavigate={changeCivicsCard}
                  copy={copy}
                  footer={({favoriteControl,questionNumber,totalQuestions})=><div className="civics-card-controls">
              <div className="civics-deck-navigation">
                <button onClick={() => changeCivicsCard(-1)} aria-label={t("Previous question", "Pregunta anterior")}><span>←</span>{isSpanish ? "Anterior" : "Previous"}</button>
                <div className="civics-readable-stats" aria-live="polite"><span><strong>{questionNumber} / {totalQuestions}</strong><em>{isSpanish ? "Tarjeta actual" : "Current card"}</em></span>{favoriteControl}<span><strong>{civicsMastered.length}</strong><em>{copy.mastered}</em></span><span><strong>{civicsNeedsPractice.length}</strong><em>{copy.review}</em></span></div>
                <button className="next" onClick={() => changeCivicsCard(1)} aria-label={t("Next question", "Pregunta siguiente")}>{isSpanish ? "Siguiente" : "Next"}<span>→</span></button>
              </div>

              {civicsFlipped && <div className="civics-study-feedback" aria-label={t("Study feedback", "Resultado de práctica")}>
                <button className="needs-practice" onClick={() => setStudyFeedback(false)}>{copy.need}</button>
                <button className="know-this" onClick={() => setStudyFeedback(true)}>{copy.know}</button>
              </div>}
              <div className={`study-feedback-message ${studyFeedback ? "visible" : ""}`} role="status" aria-live="polite">{studyFeedback}</div>
              <button className="feedback-sound-toggle" type="button" aria-pressed={soundEnabled} onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                saveLocalValue("citizenshipai.feedback-sound.v1", next ? "on" : "off");
                if (!next) stopAppSpeech();
              }}>
                {soundEnabled ? `🔊 ${copy.soundOn}` : `🔇 ${copy.soundOff}`}
              </button>
                  </div>}
                />
              </section>

            </>
          ) : (
            <section className="civics-favorites-empty"><span>☆</span><p>{civicsStudyMode === "mistakes" ? (isSpanish ? "No tienes errores pendientes de repasar." : "No mistakes waiting for review.") : copy.empty}</p><button onClick={() => setCivicsStudyMode("study")}>{copy.cards}</button></section>
          )}
        </GlassCard>
      </div>
    );
  }

  if (screen === "practice") {
    return <PlatformPractice language={language} plan={dailyPlan} nextAction={nextAction}
      onContinue={continueDailyPlan} onProgress={() => navigateTo("progress")}
      onNavigate={id => id.startsWith("interview-") ? startInterview(id.slice(10)) : navigateTo(id)} />;
  }

  if (screen === "english") {
    return (
      <div className="practice-screen">
        <header className="practice-header">
          <button className="back-button" onClick={() => goBack("practice")}>
            ← {previousScreenLabel("practice")}
          </button>

        </header>
        <main className="practice-content">
          <div className="practice-eyebrow">{t("ENGLISH PREPARATION", "Preparación de inglés")}</div>
          <h1>{t("English.", "Inglés.")}</h1>
          <p className="practice-intro">{t("Practice the English skills needed for your citizenship interview.", "Practica el inglés para tu entrevista de ciudadanía.")}</p>
          <div className="practice-options">
            <button className="practice-option" onClick={() => startAiFeature("speaking", () => navigateTo("reading"))}>
              <div className="practice-option-left">
                <div className="practice-option-icon">A</div>
                <div className="practice-option-content">
                  <h2>{t("Reading", "Lectura")}</h2>
                  <p>{t("Practice reading sentences aloud.", "Practica leyendo oraciones en voz alta.")}</p>
                </div>
              </div>
              <span className="practice-arrow">→</span>
            </button>
            <button className="practice-option" onClick={() => startAiFeature("writing", () => navigateTo("writing"))}>
              <div className="practice-option-left">
                <div className="practice-option-icon">✎</div>
                <div className="practice-option-content">
                  <h2>{t("Writing", "Escritura")}</h2>
                  <p>{t("Practice writing sentences correctly.", "Practica escribiendo oraciones correctamente.")}</p>
                </div>
              </div>
              <span className="practice-arrow">→</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (screen === "reading") {
    return (
      <div className="practice-screen reading-practice-screen">
        <header className="practice-header">
          <button className="back-button" onClick={() => goBack("english")}>
            ← {previousScreenLabel("english")}
          </button>

        </header>
        <main className="practice-content">
          <div className="practice-eyebrow">{t("ENGLISH · READING", "Inglés · Lectura")}</div>
          <h1>{t("Reading.", "Lectura.")}</h1>
          <p className="practice-intro">{t("Read the sentence aloud and practice your English.", "Lee la oración en voz alta y practica tu inglés.")}</p>
          <div className="reading-card liquid-glass">
            <div className="reading-card-heading">
              <span className="reading-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M7 4.5h8.5A2.5 2.5 0 0 1 18 7v12H8a3 3 0 0 1-3-3V6.5a2 2 0 0 1 2-2Z"/><path d="M8 4.5V16h10M10.5 9H15M10.5 12H15"/></svg>
              </span>
              <div>
                <small>{t("ENGLISH PRACTICE", "Práctica de inglés")}</small>
                <div className="reading-label">{t("READ THIS SENTENCE", "Lee esta oración")}</div>
              </div>
              <div className="reading-session-progress"><span className="reading-card-count">{readingIndex + 1} / {readingSentences.length}</span><GlassProgress value={readingIndex + 1} max={readingSentences.length} label={t("Sentence progress", "Progreso de oraciones")}/></div>
            </div>
            <div className="reading-sentence-panel liquid-glass"><button type="button" className="reading-audio" disabled={isReading || isAIThinking} aria-label={t("Listen to the sentence", "Escuchar la oración")} onClick={() => speakAppText(readingSentences[readingIndex].english, { profile: "female", rate: 0.85, pitch: 1.08 })}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9v6h4l5 4V5L9 9H5Zm11.5.5a4 4 0 0 1 0 5M18.8 7a7 7 0 0 1 0 10"/></svg></button><div className="reading-sentence" lang="en">{readingSentences[readingIndex].english}</div>
            <div className="writing-spanish">{readingSentences[readingIndex].spanish}</div></div>
            {aiMessage && (
              <div className="ai-reading-feedback" role="status" aria-live="polite">
                <div className="ai-reading-label">{t("AI HEARD", "Lo que escuchamos")}</div>
                <div className="ai-reading-text">
                  {aiMessage.replace('I heard: "', '').replace('"', '')}
                </div>
              </div>
            )}
            <button
              className={`reading-button ${isReading ? "recording" : ""}`}
              onClick={isReading ? stopReading : startReading}
              disabled={isAIThinking && !isReading}
              type="button"
            >
              <span className="reading-button-icon" aria-hidden="true">
                {isReading ? (
                  <svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6"/></svg>
                )}
              </span>
              <span className="reading-button-copy">
                <small>{isReading ? t("Recording", "Grabando") : t("Your turn", "Tu turno")}</small>
                <strong>{isReading ? t("Stop and review", "Detener y revisar") : isAIThinking ? t("Analyzing your reading…", "Analizando tu lectura…") : t("Start reading", "Comenzar lectura")}</strong>
              </span>

            </button>
          </div>
        </main>
      </div>
    );
  }

  if (screen === "writing") {
    return (
      <div className="writing-ai-screen">
        <header className="writing-ai-header">
          <button className="writing-back-button" onClick={() => goBack("english")}>
            ← <span>{previousScreenLabel("english")}</span>
          </button>
          <div className="writing-ai-brand">IMMIGRATION <span>AI</span></div>
        </header>
        <main className="writing-ai-content">
          <section className="writing-practice-panel liquid-glass">
          <div className="writing-top-section">
            <div>
              <div className="writing-eyebrow">{t("ENGLISH · WRITING DICTATION", "Inglés · Dictado")}</div>
              <h1 className="writing-ai-title">{t("Writing", "Escritura")} <span>{t("Practice.", "Práctica.")}</span></h1>
              <p className="writing-ai-intro">{t("Listen carefully to Sarah and type the sentence in English.", "Escucha a Sarah y escribe la oración en inglés.")}</p>
            </div>
            <div className="writing-ai-badge">
              <div className="writing-ai-badge-icon">✎</div>
              <div>
                <strong>{t("AI AUDIO DICTATION", "Dictado en inglés")}</strong>
                <small>{t("LISTENING & WRITING TEST", "Escucha y escritura")}</small>
              </div>
            </div>
          </div>
          <div className="writing-progress-strip" aria-label={`${t("Question", "Oración")} ${writingIndex + 1} ${t("of", "de")} ${writingSentences.length}`}>
            <div className="writing-progress-copy">
              <span>{t("Question", "Oración")} {writingIndex + 1} {t("of", "de")} {writingSentences.length}</span>
              <strong>{writingIndex + 1} / {writingSentences.length}</strong>
            </div>
            <div className="writing-progress-track" aria-hidden="true">
              <span style={{ width: `${((writingIndex + 1) / writingSentences.length) * 100}%` }} />
            </div>
          </div>
          <div className="writing-performance">
            <div className="writing-performance-title">AI PERFORMANCE</div>
            <div className="writing-performance-content">
              <div className="performance-item good">
                <div className="performance-dot"></div>
                <div>
                  <strong>{String(writingGoodCount).padStart(2, "0")}</strong>
                  <span>{t("GOOD", "Correctas")}</span>
                </div>
              </div>
              <div className="performance-divider"></div>
              <div className="performance-item needs">
                <div className="performance-dot"></div>
                <div>
                  <strong>{String(writingNeedsPracticeCount).padStart(2, "0")}</strong>
                  <span>{t("NEEDS PRACTICE", "Por practicar")}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="writing-question-card">
            <div className="writing-question-header">
              <div className="writing-question-label">
                {t("Listen and type what you hear", "Escucha y escribe lo que oyes")}
              </div>
              <div className="writing-progress">
                {writingIndex + 1} / {writingSentences.length}
              </div>
            </div>
            <div className="dictation-audio-prompt">
              <button
                className="dictation-speak-btn"
                onClick={() => {
                  emitCompanionState("reading");
                  speakAppText(writingSentences[writingIndex].english, { profile: "female", rate: 0.85, pitch: 1.08 });
                }}
                type="button"
              >
                <span className="speaker-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 9v6h4l5 4V5L9 9H5Zm11.5.5a4 4 0 0 1 0 5M18.8 7a7 7 0 0 1 0 10" /></svg></span>
                <span className="dictation-replay-copy"><small>{t("AUDIO PROMPT", "Oración en audio")}</small><strong>{t("Replay Sentence", "Escuchar otra vez")}</strong></span>
                <span className="dictation-replay-arrow" aria-hidden="true">→</span>
              </button>
            </div>
            <div className="writing-line"></div>
            <details className="writing-context"><summary className="writing-translation-label">
              <span>◎</span> {t("SPANISH TRANSLATION (CONTEXT)", "Traducción al español (contexto)")}
            </summary>
            <div className="writing-big-spanish">
              {writingSentences[writingIndex].spanish}
            </div></details>
          </div>
          <label className="sr-only" htmlFor="writing-practice-answer">
            {t("Type the English sentence you hear", "Escribe la oración que escuchas en inglés")}
          </label>
          <textarea
            id="writing-practice-answer"
            className="writing-ai-input"
            placeholder={t("Type what you hear in English...", "Escribe lo que escuchas en inglés…")}
            value={writingAnswer}
            aria-busy={isAIThinking}
            readOnly={Boolean(writingEvaluation)}
            onChange={(e) => setWritingAnswer(e.target.value)}
          />
          {!writingEvaluation && (
            <button
              className="writing-ai-button"
              onClick={checkWriting}
              disabled={isAIThinking}
            >
              <span className="writing-check-icon" aria-hidden="true">✓</span>
              <span className="writing-check-copy"><small>{isAIThinking ? t("Reviewing", "Revisando") : t("Ready to review", "Lista para revisar")}</small><strong>{isAIThinking ? t("Reviewing…", "Revisando…") : t("Check writing", "Revisar escritura")}</strong></span>
              <span className="writing-check-arrow" aria-hidden="true">→</span>
            </button>
          )}
          {aiMessage && (
            <div className="writing-ai-evaluation" role="status" aria-live="polite">
              <div className="writing-evaluation-label">{t("AI EVALUATION", "Evaluación")}</div>
              <div className="writing-evaluation-text">{aiMessage}</div>
            </div>
          )}
          {writingEvaluation && (
            <div className={`writing-ai-evaluation ${writingEvaluation.accuracy === "Needs Practice" ? "needs-practice" : "is-correct"}`} role="status" aria-live="polite">
              <div className="writing-evaluation-heading">
                <div>
                  <div className="writing-evaluation-label">{t("REVIEW YOUR ANSWER · REVISA TU RESPUESTA", "Revisa tu respuesta")}</div>
                  <strong>{writingEvaluation.resultLabel}</strong>
                </div>
                <span className="writing-evaluation-score">{writingEvaluation.score == null ? "—" : `${writingEvaluation.score}%`}</span>
              </div>
              <p className="writing-evaluation-text">{writingEvaluation.feedback}</p>
              <div className="writing-answer-comparison">
                <div>
                  <small>{t("YOUR ANSWER · TU RESPUESTA", "Tu respuesta")}</small>
                  <p>{writingEvaluation.writtenAnswer}</p>
                </div>
                <div className="expected">
                  <small>{t("CORRECT SENTENCE · ORACIÓN CORRECTA", "Oración correcta")}</small>
                  <p>{writingEvaluation.expectedAnswer}</p>
                </div>
              </div>
              {(writingEvaluation.details?.missingWords?.length > 0 || writingEvaluation.details?.extraWords?.length > 0 || writingEvaluation.details?.corrections?.length > 0) && (
                <div className="writing-detail-list">
                  {writingEvaluation.details.missingWords?.length > 0 && <p><strong>{t("Missing / Faltó:", "Faltó:")}</strong> {writingEvaluation.details.missingWords.join(", ")}</p>}
                  {writingEvaluation.details.extraWords?.length > 0 && <p><strong>Extra:</strong> {writingEvaluation.details.extraWords.join(", ")}</p>}
                  {writingEvaluation.details.corrections?.length > 0 && <p><strong>{t("Spelling / Ortografía:", "Ortografía:")}</strong> {writingEvaluation.details.corrections.map((item) => `${item.written} → ${item.expected}`).join(", ")}</p>}
                </div>
              )}
              <div className="writing-review-actions">
                {writingEvaluation.accuracy !== "Excellent" && writingEvaluation.accuracy !== "Good" && (
                  <button type="button" className="writing-review-retry" onClick={() => setWritingEvaluation(null)}>{t("Try again · Intentar otra vez", "Intentar otra vez")}</button>
                )}
                <button type="button" className="writing-review-continue" onClick={nextWritingSentence}>{t("Next sentence · Siguiente →", "Siguiente oración →")}</button>
              </div>
            </div>
          )}
          </section>
        </main>
      </div>
    );
  }

  if (screen === "uscisSandbox") {
    return (
      <div className="app uscis-tracker-screen">
        <main className="uscis-tracker-content">
          <div className="uscis-tracker-page-header">
            <span>{trackerCopy.uscIs}</span>
            <h1>{trackerCopy.title} <small>{trackerCopy.sandbox}</small></h1>
            <p>{trackerCopy.header}</p>
          </div>
          <section className="uscis-tracker-panel">
            <div className="uscis-tracker-panel-label">{trackerCopy.label}</div>
            <h2>{trackerCopy.enter}</h2>
            <p className="uscis-tracker-help" id="uscis-sandbox-help">
              {trackerCopy.help}
            </p>
            <label className="sr-only" htmlFor="uscis-sandbox-receipt">{trackerCopy.inputLabel}</label>
            <input
              id="uscis-sandbox-receipt"
              type="text"
              className="uscis-receipt-input"
              placeholder={trackerCopy.placeholder}
              value={uscisReceiptNumber}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck="false"
              inputMode="text"
              maxLength={13}
              aria-describedby="uscis-sandbox-help"
              aria-invalid={Boolean(uscisError)}
              onChange={(event) => {
                setUscisReceiptNumber(event.target.value.toUpperCase());
                setUscisError("");
              }}
            />
            {uscisError && <p className="uscis-form-error" role="alert">{uscisError}</p>}
            <button
              className="uscis-check-button"
              type="button"
              disabled={uscisLoading}
              aria-busy={uscisLoading}
              onClick={async () => {
                if (uscisLoading) return;
                const receipt = uscisReceiptNumber.replace(/[\s-]/g, "").toUpperCase();
                if (!receipt) {
                  setUscisError(trackerCopy.missing);
                  return;
                }
                if (!/^[A-Z]{3}\d{10}$/.test(receipt)) {
                  setUscisError(trackerCopy.invalid);
                  return;
                }
                setUscisReceiptNumber(receipt);
                setUscisLoading(true);
                setUscisCaseResult(null);
                setUscisError("");
                try {
                  const result = await apiJson("/uscis-case-status", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ receiptNumber: receipt }),
                  });
                  const caseStatus = result.case_status || {};
                  const tracker = result.tracker || {};
                  setUscisCaseResult({
                    status: language === "es"
                      ? caseStatus.current_case_status_text_es || caseStatus.current_case_status_text_en || trackerCopy.unavailable
                      : caseStatus.current_case_status_text_en || trackerCopy.unavailable,
                    description: language === "es"
                      ? caseStatus.current_case_status_desc_es || caseStatus.current_case_status_desc_en || ""
                      : caseStatus.current_case_status_desc_en || "",
                    receiptNumber: tracker.maskedReceiptNumber || caseStatus.receiptNumber || receipt,
                    form: caseStatus.formType || trackerCopy.unavailableShort,
                    lastUpdated: caseStatus.modifiedDate || "",
                    receivedDate: caseStatus.receivedDate || "",
                    environment: tracker.environment || "sandbox",
                    isTestData: tracker.isTestData !== false,
                    checkedAt: tracker.checkedAt || new Date().toISOString(),
                  });
                } catch {
                  console.error("Case Tracker error:");
                  setUscisError(t("We could not update this status. You can check the official USCIS page.", "No pudimos actualizar el estado. Puedes consultar la página oficial de USCIS."));
                } finally {
                  setUscisLoading(false);
                }
              }}
            >
              {trackerCopy.check} <span>→</span>
            </button>
          </section>
          <div className="uscis-official-note" role="note">
            <span>●</span>
            <div><strong>{trackerCopy.active}</strong><p>{trackerCopy.privacy}</p></div>
          </div>
          {uscisLoading && <div className="uscis-loading" role="status" aria-live="polite">{trackerCopy.loading}</div>}
          {uscisCaseResult && (() => {
            const guidance = getCaseGuidance(uscisCaseResult.status, language);
            const daysInStatus = daysSinceOfficialDate(uscisCaseResult.lastUpdated);
            const daysSinceReceived = daysSinceOfficialDate(uscisCaseResult.receivedDate);
            const formatDate = (value) => formatOfficialDate(value, language) || value || trackerCopy.unavailableShort;
            return <div className="uscis-case-result">
              <div className="uscis-status-top">
                <div className="uscis-status-icon">✓</div>
                <div className="uscis-status-main">
                  <div className="uscis-result-label">{trackerCopy.official}</div>
                  <h2>{uscisCaseResult.status}</h2>
                  {uscisCaseResult.description && (
                    <p className="uscis-result-description">{uscisCaseResult.description}</p>
                  )}
                </div>
                <div className="uscis-official-badge">
                  <span></span> USCIS API · {uscisCaseResult.environment.toUpperCase()}
                </div>
              </div>
              <div className="uscis-result-info">
                <div className="uscis-info-item">
                  <span>{uscisCaseResult.isTestData ? trackerCopy.testReceipt : trackerCopy.receipt}</span>
                  <strong>{uscisCaseResult.receiptNumber}</strong>
                </div>
                <div className="uscis-info-item">
                  <span>{trackerCopy.form}</span>
                  <strong>{uscisCaseResult.form}</strong>
                </div>
                <div className="uscis-info-item">
                  <span>{trackerCopy.updated}</span>
                  <strong>{formatDate(uscisCaseResult.lastUpdated)}</strong>
                </div>
              </div>
              {(daysInStatus !== null || daysSinceReceived !== null) && (
                <div className="uscis-calculated-grid" aria-label={t("Educational date calculations", "Cálculos educativos de fechas")}>
                  {daysInStatus !== null && <div><span>{trackerCopy.daysStatus}</span><strong>{daysInStatus}</strong><small>{trackerCopy.calculatedStatus}</small></div>}
                  {daysSinceReceived !== null && <div><span>{trackerCopy.daysReceived}</span><strong>{daysSinceReceived}</strong><small>{trackerCopy.calculatedReceived}</small></div>}
                </div>
              )}
              <section className="uscis-case-intelligence" aria-labelledby="case-intelligence-title">
                <div className="uscis-section-eyebrow">{trackerCopy.intelligence}</div>
                <h3 id="case-intelligence-title">{guidance.title}</h3>
                <p>{guidance.explanation}</p>
                <div className="uscis-next-step"><strong>{trackerCopy.next}</strong><p>{guidance.next}</p></div>
                <small>{trackerCopy.educational}</small>
              </section>
              <section className="uscis-history" aria-labelledby="official-history-title">
                <div className="uscis-history-header"><div><div className="uscis-section-eyebrow">{trackerCopy.history}</div><h3 id="official-history-title">{trackerCopy.events}</h3></div></div>
                <div className="uscis-history-empty">{trackerCopy.noHistory}</div>
              </section>
              <div className="uscis-monitoring-pending"><strong>{trackerCopy.monitoringTitle}</strong><span>{trackerCopy.monitoring}</span></div>
            </div>
          })()}
          <button className="uscis-tracker-back" onClick={() => goBack("home")}>
            ← {previousScreenLabel("home")}
          </button>
        </main>
      </div>
    );
  }

  if (screen === "progress") {
    return <ProgressDashboard language={language} summary={practiceSummary} viewed={civicsViewed} events={practiceEvents} onBack={() => goBack("home")} onPractice={openPracticeModule} />;
  }

  if (screen === "interview") {
    if (interviewMode === "n400") {
      return (
        <N400InterviewPractice
          key={`n400-${interviewRunId}`}
          onExit={() => goBack("home")}
          onComplete={({ score, outcome }) => recordPractice({ module: "interview", score, outcome })}
          onRestart={() => setInterviewRunId((current) => current + 1)}
          brainContext={brainContext}
          language={language}
          userKey={userKey}
          requestVoiceAccess={requestVoiceAccess}
          onSaveN400Profile={n400Profile => brainProfile.updateProfile({n400Profile})}
        />
      );
    }
    return (
      <RealInterview
        key={`${interviewMode}-${interviewRunId}`}
        userKey={userKey}
        onQuestionResult={handleQuestionResult}
        civicProfile={civicProfile}
        brainContext={brainContext}
        language={language}
        requestVoiceAccess={requestVoiceAccess}
        mode={interviewMode}
        onExit={() => goBack("home")}
        onComplete={({ score, outcome }) => recordPractice({ module: "interview", score, outcome })}
        onRestart={() => setInterviewRunId((current) => current + 1)}
        onReview={(questionIds) => {
          const firstMissedIndex = civicsQuestionBank.findIndex((question) => question.questionId === questionIds[0]);
          if (firstMissedIndex >= 0) setCivicsIndex(firstMissedIndex);
          navigateTo("civics", { replace: true });
        }}
      />
    );
  }

  return (
    <>
    <PlatformHome
      onStartInterview={() => startInterview("full")}
      onStartN400Interview={() => startInterview("n400")}
      onStartCivicsInterview={() => startInterview("civics")}
      onOpenFeature={openPracticeModule}
      onOpenProgress={() => navigateTo("progress")}
      onOpenImmigrationHelp={() => navigateTo("immigrationHelp")}
      onOpenPodcasts={() => navigateTo("podcasts")}
      context={brainContext} plan={dailyPlan} nextAction={nextAction} onContinue={continueDailyPlan}
      onNavigate={navigateTo} onOpenAccount={() => setAccountOpen(true)} onOpenSettings={() => navigateTo("settings")}
      language={language} onLanguageChange={setPreferredLanguage} practiceSummary={practiceSummary}
    />
    </>
  );
  };
  const showNavigation = onboardingComplete && !["interview", "coach"].includes(screen);
  return <div data-citizen-screen={screen} className={showNavigation ? "global-navigation-shell" : undefined}>{showNavigation && <ModuleNavigation current={screen} onNavigate={navigateTo} label={language==='es'?'Ciudadanía':'Citizenship'} items={language==='es'?[['home','Resumen'],['civics','128 preguntas'],['practice','Practicar'],['progress','Progreso']]:[['home','Overview'],['civics','128 questions'],['practice','Practice'],['progress','Progress']]}/>} {renderScreen()}{accountOpen && <AccountSheet language={language} onClose={() => setAccountOpen(false)} />}</div>;
}
export default function App({platformLanguage,onPlatformLanguageChange}={}) {
  const { session } = useAccount();
  const userKey = session?.user?.id || "guest";
  return <ProgressGate key={userKey}><AppContent key={userKey} userKey={userKey} platformLanguage={platformLanguage} onPlatformLanguageChange={onPlatformLanguageChange} /></ProgressGate>;
}
