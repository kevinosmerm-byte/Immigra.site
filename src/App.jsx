import { lazy, Suspense, useState, useEffect, useRef } from "react";
import "./App.css";
import sarahImage from "./assets/sarah.png";
import sarahSpeakingImage from "./assets/sarah-speaking.png";
import { civicsQuestionBank } from "./civicsQuestionBank.js";
import { evaluateCivicsAnswer } from "./civicsAnswerEvaluator.js";
import { apiJson } from "./api";
import { startAudioRecording, transcribeRecording } from "./audio";
import { LegalSettings, Onboarding } from "./LegalSettings";
import { getPracticeEvents, getPracticeSummary, recordPracticeEvent } from "./progress";
import { PodcastLibrary } from "./PodcastPlayer";
import { usePromotionAccess } from "./PromotionAccess.jsx";
import { daysSinceOfficialDate, formatOfficialDate, getCaseGuidance } from "./caseTracker";import { DidLiveAvatar } from "./DidLiveAvatar";
import ImmigrationHelp from "./ImmigrationHelp";
import { speakAppText, stopAppSpeech } from "./speech";
import { AccountButton, AccountSheet, useAccount } from "./Account.jsx";
import { CategoryMastery, RetrievalPracticeCard } from "./EducationalActivities.jsx";
import { writingSentences } from "./writingSentences.js";
import { evaluateWritingSentence } from "./writingEvaluator.js";
import { CivicsStudyCard } from "./CivicsStudyCard.jsx";
import { createNavigationHistory, navigateBack, navigateForward } from "./navigationHistory.js";
import { getCivicsVisual } from "./data/civicsVisuals.js";
import { emitCompanionResult, emitCompanionState } from "./companionEvents.js";
import { N400InterviewPractice } from "./N400InterviewPractice.jsx";


const ONBOARDING_STORAGE_KEY = "citizenshipai.onboarding.v1";
const CivicsStudyGuide = lazy(() => import("./CivicsStudyGuide.jsx").then((module) => ({ default: module.CivicsStudyGuide })));
const QuizLearningPath = lazy(() => import("./QuizLearningPath.jsx"));
const LANGUAGE_STORAGE_KEY = "citizenshipai.language";
const PRACTICE_MODULE_NAMES = {
  reading: "Reading practice",
  writing: "Writing practice",
  interview: "Sarah interview",
  coach: "Sarah coaching",
};
const CASE_TRACKER_COPY = {
  en: {
    uscIs: "USCIS", title: "Case Tracker", sandbox: "Sandbox",
    header: "Practice using an official USCIS Sandbox API response. This is not a live production case tracker.",
    label: "USCIS SANDBOX · TEST DATA ONLY", enter: "Enter a Sandbox receipt number",
    help: "Use an official USCIS Sandbox test receipt number. This environment does not check a live USCIS case.",
    placeholder: "Sandbox receipt number", inputLabel: "USCIS Sandbox receipt number", missing: "Please enter your receipt number.",
    invalid: "Use 3 letters followed by 10 numbers, for example IOE1234567890.", check: "CHECK SANDBOX STATUS",
    active: "Sandbox mode is active", privacy: "Citizenship AI does not save your receipt number or create case monitoring in this version.",
    loading: "Checking official Sandbox status...", unavailable: "Status unavailable", official: "OFFICIAL USCIS STATUS",
    receipt: "RECEIPT NUMBER", testReceipt: "SANDBOX TEST RECEIPT", form: "FORM", updated: "LAST UPDATED", unavailableShort: "Not available",
    daysStatus: "DAYS IN CURRENT STATUS", daysReceived: "DAYS SINCE RECEIVED", calculatedStatus: "Calculated from USCIS last updated date",
    calculatedReceived: "Calculated from the official received date", intelligence: "CITIZENSHIP AI EXPLANATION", next: "WHAT SHOULD I DO NOW",
    educational: "Educational information only — not legal advice or an outcome prediction.", history: "OFFICIAL HISTORY", events: "Case events",
    noHistory: "USCIS did not provide a historical event timeline in this Sandbox response. Citizenship AI will not create or infer events.",
    monitoringTitle: "Case monitoring is not available yet.", monitoring: "It requires secure accounts, encrypted case storage, user controls, and USCIS Production approval.", back: "← Back to Home",
  },
  es: {
    uscIs: "USCIS", title: "Seguimiento del caso", sandbox: "Sandbox",
    header: "Practica con una respuesta oficial de la API Sandbox de USCIS. No es un rastreador de casos de producción en vivo.",
    label: "USCIS SANDBOX · SOLO DATOS DE PRUEBA", enter: "Ingresa un número de recibo Sandbox",
    help: "Usa un número de recibo oficial de prueba de USCIS Sandbox. Este entorno no consulta un caso real de USCIS.",
    placeholder: "Número de recibo Sandbox", inputLabel: "Número de recibo de USCIS Sandbox", missing: "Ingresa tu número de recibo.",
    invalid: "Usa 3 letras seguidas de 10 números, por ejemplo IOE1234567890.", check: "CONSULTAR ESTADO SANDBOX",
    active: "El modo Sandbox está activo", privacy: "Citizenship AI no guarda tu número de recibo ni crea monitoreo de casos en esta versión.",
    loading: "Consultando el estado oficial de Sandbox...", unavailable: "Estado no disponible", official: "ESTADO OFICIAL DE USCIS",
    receipt: "NÚMERO DE RECIBO", testReceipt: "RECIBO DE PRUEBA SANDBOX", form: "FORMULARIO", updated: "ÚLTIMA ACTUALIZACIÓN", unavailableShort: "No disponible",
    daysStatus: "DÍAS EN EL ESTADO ACTUAL", daysReceived: "DÍAS DESDE LA RECEPCIÓN", calculatedStatus: "Calculado desde la fecha de actualización de USCIS",
    calculatedReceived: "Calculado desde la fecha oficial de recepción", intelligence: "EXPLICACIÓN DE CITIZENSHIP AI", next: "¿QUÉ DEBO HACER AHORA?",
    educational: "Información educativa únicamente; no es asesoría legal ni una predicción del resultado.", history: "HISTORIAL OFICIAL", events: "Eventos del caso",
    noHistory: "USCIS no proporcionó una línea de tiempo de eventos en esta respuesta Sandbox. Citizenship AI no creará ni inferirá eventos.",
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
function Home({
  onStartInterview,
  onStartN400Interview,
  onStartCivicsInterview,
  onOpenFeature,
  onOpenProgress,
  onOpenSettings,
  onOpenImmigrationHelp,
  onOpenPodcasts,
  onOpenAccount,
  language,
  onLanguageChange,
  practiceSummary,
}) {
  const copy = language === "en" ? {
    status: "AI-POWERED CITIZENSHIP TRAINING",
    aiReady: "AI READY",
    quickPractice: "QUICK PRACTICE",
    trainWithAi: "Train with AI",
    ready: "READY",
    english: "ENGLISH",
    reading: "Reading",
    writing: "Writing",
    preparation: "YOUR PREPARATION",
    preparationTitle: "Keep moving forward.",
    civics: "Civics",
    interview: "Interview",
    viewProgress: "VIEW PROGRESS",
    caseTracker: "Case Tracker",
    development: "IN DEVELOPMENT",
    caseBody: "Practice checking a status response through the USCIS API Sandbox.",
    checkCase: "COMING SOON",
    languageLabel: "Change preferred language",
    settingsLabel: "Open Legal and Privacy Settings",
    civicsLabel: "Civics — 128 Questions. Master the questions for your interview.",
  } : {
    status: "ENTRENAMIENTO DE CIUDADANÍA CON IA",
    aiReady: "IA LISTA",
    quickPractice: "PRÁCTICA RÁPIDA",
    trainWithAi: "Entrena con IA",
    ready: "LISTO",
    english: "INGLÉS",
    reading: "Lectura",
    writing: "Escritura",
    preparation: "TU PREPARACIÓN",
    preparationTitle: "Sigue avanzando.",
    civics: "Educación cívica",
    interview: "Entrevista",
    viewProgress: "VER PROGRESO",
    caseTracker: "Seguimiento del caso",
    development: "EN DESARROLLO",
    caseBody: "Practica la consulta de una respuesta de estado mediante la API Sandbox de USCIS.",
    checkCase: "PRÓXIMAMENTE",
    languageLabel: "Cambiar idioma preferido",
    settingsLabel: "Abrir ajustes legales y de privacidad",
    civicsLabel: "Educación cívica — 128 preguntas. Domina las preguntas para tu entrevista.",
  };
  const readiness = practiceSummary?.readiness ?? 0;
  const civicsProgress = Math.round(Math.min(100, ((practiceSummary?.civics?.attempts || 0) / 128) * 100));
  const englishScores = [practiceSummary?.reading?.score, practiceSummary?.writing?.score, practiceSummary?.coach?.score]
    .filter(Number.isFinite);
  const englishProgress = englishScores.length
    ? Math.round(englishScores.reduce((total, score) => total + score, 0) / englishScores.length)
    : 0;
  const interviewProgress = practiceSummary?.interview?.score ?? 0;
  return (
    <div className="app home-ai">

      {/* ================= HEADER ================= */}

      <header className="home-new-header">

        <div className="home-new-brand" aria-label="Citizenship AI">
          <span className="home-brand-wordmark">Citizenship <strong>AI</strong></span>
        </div>

        <div className="language-selector">
          <AccountButton language={language} onClick={onOpenAccount} />
          <button
            className="home-language"
            onClick={() => onLanguageChange(language === "en" ? "es" : "en")}
            aria-label={copy.languageLabel}
          >
            {language === "en" ? "EN" : "ES"}
          </button>
          <button className="home-settings-button" onClick={onOpenSettings} aria-label={copy.settingsLabel}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19 12a7 7 0 0 0-.1-1.15l2-1.55-2-3.45-2.45 1A7 7 0 0 0 14.5 5.7L14.15 3h-4.3L9.5 5.7a7 7 0 0 0-1.95 1.15l-2.45-1-2 3.45 2 1.55A7 7 0 0 0 5 12c0 .4.03.78.1 1.15l-2 1.55 2 3.45 2.45-1A7 7 0 0 0 9.5 18.3l.35 2.7h4.3l.35-2.7a7 7 0 0 0 1.95-1.15l2.45 1 2-3.45-2-1.55c.07-.37.1-.75.1-1.15Z" />
            </svg>
          </button>
        </div>

      </header>


      {/* ================= HERO ================= */}

      <main className="home-new-content">

        <section className="home-new-hero">

          <div className="hero-glow"></div>

          <div className="home-hero-copy">

            <div className="home-status">
              <span></span>
              {copy.status}
            </div>

            <h1>
  {language === "en" ? (
    <>
      Your interview.
      <strong>Your future.</strong>
    </>
  ) : (
    <>
      Tu entrevista.
      <strong>Tu futuro.</strong>
    </>
  )}
</h1>

            <p>{language === "en"
              ? "Prepare for your U.S. citizenship interview with personalized AI practice."
              : "Prepárate para tu entrevista de ciudadanía de EE. UU. con práctica personalizada de IA."}
            </p>

          </div>


          {/* AI ORB */}

          <div className="ai-orb-container">

            <div className="ai-orb-ring ring-one"></div>
            <div className="ai-orb-ring ring-two"></div>
            <div className="ai-orb-ring ring-three"></div>

            <div className="ai-orb">

              <div className="ai-orb-core">
                ✦
              </div>

            </div>

            <div className="ai-orb-label">
              <span></span>
              {copy.aiReady}
            </div>

          </div>


          {/* PRIMARY ACTION */}

          <div className="home-interview-actions" style={{ display: "grid", gap: "12px", width: "100%" }}>
            <button className="home-primary-button home-real-interview-button" onClick={onStartInterview}>
              <span className="home-action-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="12" rx="3"/><path d="m16 10 5-3v10l-5-3z"/></svg>
              </span>
              <div>
                <small>{language === "en" ? "SARAH LIVE VIDEO" : "VIDEO EN VIVO CON SARAH"}</small>
                <strong>{language === "en" ? "REAL INTERVIEW" : "ENTREVISTA REAL"}</strong>
              </div>
              <span className="primary-arrow">→</span>
            </button>
            <button
              className="home-primary-button home-n400-interview-button"
              onClick={onStartN400Interview}
            >
              <span className="home-action-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v5h5M9 12h6M9 16h6"/></svg>
              </span>
              <div>
                <small>{language === "en" ? "FORM N-400 · GUIDED PRACTICE" : "FORMULARIO N-400 · PRÁCTICA GUIADA"}</small>
                <strong>{language === "en" ? "N-400 INTERVIEW" : "ENTREVISTA N-400"}</strong>
              </div>
              <span className="primary-arrow">→</span>
            </button>
            <button
              className="home-primary-button home-civics-live-button"
              onClick={onStartCivicsInterview}
            >
              <span className="home-action-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>
              </span>
              <div>
                <small>{language === "en" ? "CLASSIC SARAH PRACTICE" : "PRÁCTICA CLÁSICA CON SARAH"}</small>
                <strong>{language === "en" ? "CIVICS INTERVIEW" : "ENTREVISTA CÍVICA"}</strong>
              </div>
              <span className="primary-arrow">→</span>
            </button>
            <button
              className="home-primary-button home-immigration-primary-button"
              onClick={onOpenImmigrationHelp}
            >
              <span className="home-action-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 3 20 7v5c0 5-3.4 8-8 9-4.6-1-8-4-8-9V7z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></svg>
              </span>
              <div>
                <small>{language === "en" ? "OFFICIAL U.S. RESOURCES" : "RECURSOS OFICIALES DE EE. UU."}</small>
                <strong>{language === "en" ? "IMMIGRATION HELP" : "AYUDA MIGRATORIA"}</strong>
              </div>
              <span className="primary-arrow">→</span>
            </button>
            <button className="home-primary-button home-podcast-primary-button" onClick={onOpenPodcasts}>
              <span className="home-action-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><rect x="8" y="3" width="8" height="13" rx="4"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>
              </span>
              <div>
                <small><i className="home-podcast-live-dot"></i>{language === "en" ? "LIVE AUDIO · ENGLISH + ESPAÑOL" : "AUDIO EN VIVO · ENGLISH + ESPAÑOL"}</small>
                <strong>{language === "en" ? "LIVE PODCASTS" : "PODCASTS EN VIVO"}</strong>
              </div>
              <span className="primary-arrow">→</span>
            </button>
          </div>

        </section>


        {/* ================= QUICK PRACTICE ================= */}

        <section className="home-new-section">

          <div className="home-section-heading">

            <div>
              <small>{copy.quickPractice}</small>
              <h2>{copy.trainWithAi}</h2>
            </div>

            <span className="section-live">
              <i></i>
              {copy.ready}
            </span>

          </div>


          <div className="home-practice-list">

            <button
              className="practice-feature-card civics-feature civics-image-card"
              onClick={() => onOpenFeature("civics")}
              aria-label={copy.civicsLabel}
            >
              <img src="/civics-128-button.png" alt="" aria-hidden="true" />
              <span className="sr-only">{copy.civicsLabel}</span>
            </button>


            <div className="practice-mini-grid">

              <button
                className="practice-mini-card"
                onClick={() => onOpenFeature("reading")}
              >

                <div className="mini-icon">
                  A
                </div>

                <div>
                  <small>{copy.english}</small>
                  <h3>{copy.reading}</h3>
                </div>

                <span>↗</span>

              </button>


              <button
                className="practice-mini-card"
                onClick={() => onOpenFeature("writing")}
              >

                <div className="mini-icon">
                  ✎
                </div>

                <div>
                  <small>{copy.english}</small>
                  <h3>{copy.writing}</h3>
                </div>

                <span>↗</span>

              </button>

            </div>


          </div>

        </section>


        {/* ================= PREPARATION ================= */}

        <section className="preparation-card">

          <div className="preparation-header">

            <div>
              <small>{copy.preparation}</small>
              <h2>{copy.preparationTitle}</h2>
            </div>

            <div className="preparation-score">
              <strong>{readiness}%</strong>
              <span>{copy.ready}</span>
            </div>

          </div>


          <div className="preparation-progress">

            <div
              className="preparation-progress-fill"
              style={{ width: `${readiness}%` }}
            ></div>

          </div>


          <div className="preparation-items">

            <div>
              <span>{copy.civics}</span>
              <strong>{civicsProgress}%</strong>
            </div>

            <div>
              <span>{copy.english}</span>
              <strong>{englishProgress}%</strong>
            </div>

            <div>
              <span>{copy.interview}</span>
              <strong>{interviewProgress}%</strong>
            </div>

          </div>

          <button
            className="preparation-button"
            onClick={onOpenProgress}
          >
            {copy.viewProgress}
            <span>→</span>
          </button>

        </section>


        {/* ================= USCIS ================= */}

        <section className="home-uscis-card">

          <div className="uscis-card-top">

            <div className="uscis-card-icon">
              U
            </div>

            <div>

              <small>USCIS</small>

              <h2>
                {copy.caseTracker}
              </h2>

            </div>

            <div className="uscis-live uscis-development">
              <span></span>
              {copy.development}
            </div>

          </div>


          <p>{copy.caseBody}</p>


          <button
            className="home-uscis-disabled-button"
            disabled
            aria-disabled="true"
            title={copy.development}
          >
            {copy.checkCase}
            <span aria-hidden="true">🔒</span>
          </button>

        </section>

      </main>


    </div>
  );
}

// Reemplaza la sección del componente RealInterview en tu App.js (el bloque que devuelve la pantalla de entrevista) con este código completamente optimizado y rediseñado:

function RealInterview({ onExit, onComplete, onReview, mode = "full" }) {
  const [questions] = useState(() => {
    const shuffledCivics = [...civicsQuestionBank].sort(() => Math.random() - 0.5);
    if (mode === "civics") return shuffledCivics.slice(0, 10);
    return shuffledCivics.slice(0, 5);
  });

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [answer, setAnswer] = useState("");
  const [answerStatus, setAnswerStatus] = useState("");
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [missedQuestions, setMissedQuestions] = useState([]);
  const [hasRetried, setHasRetried] = useState(false);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [interviewer, setInterviewer] = useState("sarah");
  const recorderRef = useRef(null);
  const completionReportedRef = useRef(false);
  const speechRequestRef = useRef(0);

  const isKevin = interviewer === "kevin";
  const interviewerName = isKevin ? "Kevin" : "Sarah";
  const questionText = (question) => question.question || question.english;
  const questionSpanish = (question) => question.questionSpanish || question.spanish;
  const questionKey = (question) => question.questionId || question.id;
  const addMissedQuestion = (question) => {
    setMissedQuestions((current) => (
      current.some((item) => item.id === questionKey(question))
        ? current
        : [...current, { id: questionKey(question), english: questionText(question) }]
    ));
  };

  useEffect(() => {
    if (mode === "full") emitCompanionState("idle", { duration: 0, silent: true });
  }, [mode]);

  useEffect(() => {
    if (!isInterviewComplete || completionReportedRef.current) return;
    completionReportedRef.current = true;
    onComplete?.({
      score: Math.round((correctAnswers / questions.length) * 100),
      outcome: "completed",
    });
    emitCompanionState("celebration");
  }, [isInterviewComplete, correctAnswers, questions.length, onComplete]);

  const speakQuestion = async (text, onFinished, selectedInterviewer = interviewer) => {
    const requestId = ++speechRequestRef.current;
    const voiceIsKevin = selectedInterviewer === "kevin";
    const finishSpeaking = () => {
      if (requestId !== speechRequestRef.current) return;
      setIsSpeaking(false);
      if (onFinished) onFinished();
    };
    setIsSpeaking(true);
    emitCompanionState("coach", { message: `${voiceIsKevin ? "Kevin" : "Sarah"} is asking the next question.` });
    await speakAppText(text, {
      profile: voiceIsKevin ? "male" : "female",
      rate: voiceIsKevin ? 0.88 : 0.9,
      pitch: voiceIsKevin ? 0.86 : 1.1,
      onEnd: finishSpeaking,
    });
  };

  useEffect(() => {
    if (mode === "full") return undefined;
    const timer = setTimeout(() => {
      speakQuestion(`
        Welcome. Thank you for being here today.
        ${mode === "civics" ? "We are going to begin your civics interview practice." : "We are going to begin the live interview experience."}
        ${questionText(questions[0])}
      `);
    }, 500);

    return () => {
      clearTimeout(timer);
      stopAppSpeech();
    };
  }, [questions, mode]);

  const goToNextQuestion = () => {
    const nextQuestion = currentQuestion + 1;
    if (nextQuestion >= questions.length) {
      setIsSpeaking(true);
      speakQuestion(`Thank you. That concludes this practice interview.`);
      setIsInterviewComplete(true);
      return;
    }

    setCurrentQuestion(nextQuestion);
    setAnswer("");
    setAnswerStatus("");
    setHasRetried(false);

    setTimeout(() => {
      speakQuestion(questionText(questions[nextQuestion]));
    }, 300);
  };

  const handleSkip = () => {
    setIncorrectAnswers((count) => count + 1);
    addMissedQuestion(questions[currentQuestion]);
    setAnswerStatus("incorrect");
    setHasRetried(false);
    emitCompanionResult(false);
    goToNextQuestion();
  };

  const evaluateInterviewAnswer = async (transcript) => {
    setAnswer(transcript);
    setAnswerStatus("evaluating");
    emitCompanionState("thinking");
    try {
      const activeQuestion = questions[currentQuestion];
      if (activeQuestion.questionId) {
        const localResult = evaluateCivicsAnswer(activeQuestion, transcript);
        if (!localResult.needsSemanticReview) {
          setAnswerStatus(localResult.status === "review" ? "incomplete" : localResult.status);
          emitCompanionResult(localResult.status === "correct");
          if (localResult.status === "correct") setCorrectAnswers((count) => count + 1);
          if (localResult.status === "incorrect" && hasRetried) {
            setIncorrectAnswers((count) => count + 1);
            addMissedQuestion(activeQuestion);
          }
          if (localResult.action === "advance") speakQuestion(localResult.feedback, () => goToNextQuestion());
          else if (localResult.action === "review") speakQuestion(`${localResult.feedback}.`, () => goToNextQuestion());
          else if (localResult.action === "retry") speakQuestion(`${localResult.feedback} ${questionText(activeQuestion)}`);
          else if (hasRetried) speakQuestion(`${localResult.feedback} Let's move to the next question.`, () => goToNextQuestion());
          else { setHasRetried(true); speakQuestion(`${localResult.feedback} ${questionText(activeQuestion)}`); }
          return;
        }
      }
      const result = await apiJson("/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: activeQuestion.questionId,
          question: questionText(activeQuestion),
          answer: transcript,
          correctAnswer: activeQuestion.correctAnswer,
        }),
      });

      setAnswerStatus(result.status === "review" ? "incomplete" : result.status);
      emitCompanionResult(result.status === "correct");

      if (result.status === "correct") setCorrectAnswers((count) => count + 1);
      if (result.status === "incorrect" && hasRetried) {
        setIncorrectAnswers((count) => count + 1);
        addMissedQuestion(questions[currentQuestion]);
      }

      const feedback = result.feedback || "";
      if (result.action === "advance") {
        speakQuestion(feedback, () => goToNextQuestion());
      } else if (result.action === "retry") {
        speakQuestion(`${feedback} Please answer the question again. ${questionText(activeQuestion)}`);
      } else if (result.action === "repeat") {
        if (hasRetried) {
          setIncorrectAnswers((count) => count + 1);
          addMissedQuestion(questions[currentQuestion]);
          speakQuestion(`${feedback} Let's move to the next question.`, () => goToNextQuestion());
        } else {
          setHasRetried(true);
          speakQuestion(`${feedback} Let me ask you that again. ${questionText(activeQuestion)}`);
        }
      }
    } catch (error) {
      console.error("Evaluation error:", error);
      setAnswerStatus("error");
    }
  };

  const startListening = async () => {
    try {
      recorderRef.current = await startAudioRecording();
    } catch (error) {
      console.error("Microphone error:", error);
      setAnswerStatus("error");
      return;
    }
    setIsListening(true);
    setIsSpeaking(false);
    setAnswerStatus("");
    emitCompanionState("thinking", { message: "I'm listening. Take your time." });
  };

  const stopListening = async () => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    setIsListening(false);
    if (!recorder) return;

    try {
      const transcript = await transcribeRecording(await recorder.stop());
      if (!transcript) throw new Error("No speech was detected.");
      await evaluateInterviewAnswer(transcript);
    } catch (error) {
      console.error("Interview transcription error:", error);
      setAnswerStatus("error");
    }
  };

  if (isInterviewComplete) {
    const scorePercentage = Math.round(
      (correctAnswers / questions.length) * 100
    );
    const reviewMessage = scorePercentage >= 90
      ? "Strong civics practice. Keep reviewing the questions below so the information stays fresh."
      : scorePercentage >= 70
      ? "You have a solid foundation. Review the questions below, then try another session."
      : "Build confidence one question at a time. Start by reviewing the questions below.";

    return (
      <div className="interview-screen">
        <div className="results-card">
          <div className="results-eyebrow">PRACTICE INTERVIEW COMPLETE</div>
          <h1>Interview Complete</h1>
          <div className="results-score">
            {correctAnswers}
            <span> / {questions.length}</span>
          </div>
          <div className="results-percentage">{scorePercentage}%</div>
          <div className="results-stats">
            <div className="result-stat correct">
              <span>✓</span>
              <strong>{correctAnswers}</strong>
              <small>Correct</small>
            </div>
            <div className="result-stat incorrect">
              <span>✕</span>
              <strong>{incorrectAnswers}</strong>
              <small>Incorrect</small>
            </div>
          </div>
          <p className="results-message">
            {scorePercentage >= 70
              ? "Great job. Keep practicing to build confidence."
              : "Keep practicing. You are making progress."}
          </p>
          <section className="interview-review-plan" aria-label="Your focused review plan">
            <span>YOUR NEXT FOCUS</span>
            <h2>{missedQuestions.length ? `${missedQuestions.length} question${missedQuestions.length === 1 ? "" : "s"} to revisit` : "Keep your momentum"}</h2>
            <p>{missedQuestions.length ? reviewMessage : "You did not skip or miss a question in this session. Try another randomized interview to keep building consistency."}</p>
            {missedQuestions.length > 0 && (
              <ol>
                {missedQuestions.slice(0, 3).map((question) => (
                  <li key={question.id}><span>Q{question.id}</span>{question.english}</li>
                ))}
                {missedQuestions.length > 3 && <li className="interview-review-more">+ {missedQuestions.length - 3} more question{missedQuestions.length - 3 === 1 ? "" : "s"} to review</li>}
              </ol>
            )}
          </section>
          {missedQuestions.length > 0 && (
            <button className="results-focus-button" onClick={() => onReview?.(missedQuestions.map((question) => question.id))}>
              REVIEW MISSED QUESTIONS
            </button>
          )}
          <button
            className="results-button"
            onClick={() => window.location.reload()}
          >
            TRY AGAIN
          </button>
          <button className="results-secondary-button" onClick={onExit}>
            BACK TO HOME
          </button>
        </div>
      </div>
    );
  }

  if (mode === "full") {
    return (
      <div className="interview-screen live-interview-screen live-avatar-only-screen">
        <header className="interview-header">
          <button className="back-button interview-exit-button" onClick={onExit} aria-label="Exit live interview">
            <span>×</span> Exit
          </button>
          <div className="interview-brand">
            <strong>CITIZENSHIP <span>AI</span></strong>
            <small>LIVE N-400 + CIVICS INTERVIEW</small>
          </div>
        </header>
        <main className="interview-content live-avatar-only-content">
          <DidLiveAvatar autoStart />
        </main>
      </div>
    );
  }

  return (
    <div className={`interview-screen live-interview-screen interviewer-${interviewer} ${isSpeaking ? "sarah-speaking-live" : isListening ? "sarah-listening-live" : "sarah-waiting-live"}`}>
      <header className="interview-header">
        <button className="back-button interview-exit-button" onClick={onExit} aria-label="Exit practice interview" title="Exit interview">
          <span aria-hidden="true">×</span>
        </button>
        <div className="interview-brand">
          <strong>CITIZENSHIP <span>AI</span></strong>
          <small>{mode === "civics" ? "LIVE CIVICS INTERVIEW" : "LIVE N-400 + CIVICS INTERVIEW"}</small>
        </div>
        <button
          className="more-button interview-repeat-button"
          onClick={() => speakQuestion(questionText(questions[currentQuestion]))}
          aria-label={`Repeat ${interviewerName}'s question`}
          title="Repeat question"
        >
          ↻
        </button>
      </header>

      <main className="interview-content">
        <section className="sarah-live-stage" aria-label={`${interviewerName}, AI practice interviewer`}>
          <div className="live-stage-media" aria-hidden="true">
            <div className={`live-stage-motion-frame sarah-video-frame ${isKevin ? "kevin-motion-frame" : ""}`}>
              {isKevin ? (
                <>
                  <video
                    src="/kevin-listening.mp4"
                    className="live-sarah-video live-sarah-resting"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    aria-hidden="true"
                  />
                  <video
                    src="/kevin-speaking.mp4"
                    className="live-sarah-video live-sarah-speaking"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    aria-hidden="true"
                  />
                </>
              ) : (
                <>
                  <video
                    src="/sarah-listening.mp4"
                    poster={sarahImage}
                    className="live-sarah-video live-sarah-resting"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    aria-hidden="true"
                  />
                  <video
                    src="/sarah-speaking.mp4"
                    poster={sarahSpeakingImage}
                    className="live-sarah-video live-sarah-speaking"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    aria-hidden="true"
                  />
                </>
              )}
            </div>
            <div className="live-stage-mask"></div>
          </div>

          <div className="live-stage-topbar">
            <div className="live-agent-badge">
              <span className="live-dot"></span>
              <div><strong>{interviewerName} AI</strong><small>Practice interviewer</small></div>
            </div>
            <div className="live-interviewer-selector" role="group" aria-label="Choose your interview officer">
              <button type="button" className={!isKevin ? "active" : ""} aria-pressed={!isKevin} onClick={() => { setInterviewer("sarah"); speakQuestion(questionText(questions[currentQuestion]), undefined, "sarah"); }}>Sarah</button>
              <button type="button" className={isKevin ? "active" : ""} aria-pressed={isKevin} onClick={() => { setInterviewer("kevin"); speakQuestion(questionText(questions[currentQuestion]), undefined, "kevin"); }}>Kevin</button>
            </div>
            <span className="live-practice-badge">INDEPENDENT PRACTICE</span>
          </div>

          <div className="live-stage-presence">
            <span>AI INTERVIEW COACH</span>
            <strong>{interviewerName}</strong>
            <small>{isSpeaking ? "Speaking with you" : isListening ? "Listening to your answer" : "Ready for your response"}</small>
          </div>

          <section className="live-question-card" aria-live="polite">
            <div className="live-question-header">
              <div className="ai-turn-indicator">
                <span className="live-sound-icon">⌁</span>
                {isSpeaking ? `${interviewerName.toUpperCase()} IS SPEAKING` : isListening ? `${interviewerName.toUpperCase()} IS LISTENING` : "YOUR TURN"}
              </div>
              <span>QUESTION {currentQuestion + 1} / {questions.length}</span>
            </div>
            <h2 className="question">{questionText(questions[currentQuestion])}</h2>
            <p className="question-spanish">{questionSpanish(questions[currentQuestion])}</p>
            <div className="live-progress-dots" aria-label={`Question ${currentQuestion + 1} of ${questions.length}`}>
              {questions.map((_, index) => <span key={index} className={index <= currentQuestion ? "active" : ""}></span>)}
            </div>
          </section>

          <div className="live-voice-status" aria-live="polite">
            <div className="live-voice-bars" aria-hidden="true">
              {Array.from({ length: 8 }, (_, index) => <span key={index}></span>)}
            </div>
            <span>{isSpeaking ? `${interviewerName} is speaking…` : isListening ? "Listening… tap again when you finish" : "Tap the microphone when you are ready"}</span>
          </div>
        </section>

        <section className="live-answer-feedback" aria-live="polite">
          {answerStatus === "evaluating" && (
            <div className="ai-thinking-panel">
              <div className="ai-thinking-main">
                <div className="ai-brain">
                  <div className="brain-glow"></div>
                  <span>✦</span>
                </div>
                <div className="ai-thinking-text">
                  <div className="ai-thinking-title">
                    AI IS THINKING<span className="thinking-dots">...</span>
                  </div>
                  <div className="ai-thinking-subtitle">
                    Evaluating response patterns...
                  </div>
                </div>
              </div>
            </div>
          )}

          {answer && (
            <div className={`answer-preview ${answerStatus}`}>
              <span>YOUR INPUT</span>
              <p>{answer}</p>
              <div className="answer-result">
                {answerStatus === "evaluating" && "Evaluating..."}
                {answerStatus === "correct" && "✓ Verified Correct"}
                {answerStatus === "incorrect" && "✕ Needs Improvement"}
                {answerStatus === "incomplete" && "! Incomplete Answer"}
                {answerStatus === "error" && "Evaluation Error"}
              </div>
            </div>
          )}
        </section>

        <section className="live-interview-controls" aria-label="Interview controls">
          <button
            className={`premium-action-button live-mic-button ${isListening ? "listening" : ""}`}
            onClick={isListening ? stopListening : startListening}
            disabled={isSpeaking}
            aria-label={isListening ? "Stop recording answer" : "Start recording answer"}
          >
            <span className="premium-action-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><rect x="8" y="3" width="8" height="13" rx="4"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>
            </span>
            <span className="premium-action-copy">
              <small>{isListening ? "RECORDING" : "YOUR TURN"}</small>
              <strong>{isListening ? "Finish answer" : "Answer"}</strong>
            </span>
            <span className="premium-action-arrow" aria-hidden="true">{isListening ? "■" : "→"}</span>
          </button>
          <button
            className="premium-action-button live-skip-button"
            onClick={handleSkip}
            disabled={isSpeaking || isListening}
          >
            <span className="premium-action-icon" aria-hidden="true">?</span>
            <span className="premium-action-copy">
              <small>NOT SURE</small>
              <strong>I don&apos;t know</strong>
            </span>
            <span className="premium-action-arrow" aria-hidden="true">→</span>
          </button>
          <div className="live-score-summary" aria-label="Current score">
            <span><i className="correct-dot"></i>{correctAnswers} correct</span>
            <span><i className="incorrect-dot"></i>{incorrectAnswers} missed</span>
          </div>
        </section>
      </main>
    </div>
  );
}

function App() {
  // 1. TODOS LOS HOOKS (ESTADOS) VAN AQUÍ ARRIBA SIN EXCEPCIÓN
  const [navigation, setNavigation] = useState(() => createNavigationHistory(
    window.location.hash === "#privacy" ? "settings" : "home"
  ));
  const screen = navigation.current;
  const previousScreen = navigation.entries.at(-1);
  const previousScreenLabel = (fallback = "home") => ({
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
  const [interviewMode, setInterviewMode] = useState("full");
  const [interviewRunId, setInterviewRunId] = useState(0);
  const [civicsIndex, setCivicsIndex] = useState(0);
  const [civicsFlipped, setCivicsFlipped] = useState(false);
  const [civicsStudyMode, setCivicsStudyMode] = useState("study");
  const [studyFeedback, setStudyFeedbackMessage] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(() => readLocalValue("citizenshipai.feedback-sound.v1", "on") !== "off");
  const [civicsFavorites, setCivicsFavorites] = useState(() => {
    const saved = readLocalJson("citizenshipai.civics.favorites.v1", []);
    return Array.isArray(saved) ? saved : [];
  });
  const [civicsMastered, setCivicsMastered] = useState(() => {
    const saved = readLocalJson("citizenshipai.civics.mastered.v1", []);
    return Array.isArray(saved) ? saved : [];
  });
  const [civicsNeedsPractice, setCivicsNeedsPractice] = useState(() => {
    const saved = readLocalJson("citizenshipai.civics.needsPractice.v1", []);
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
  const [onboardingComplete, setOnboardingComplete] = useState(
    () => readLocalValue(ONBOARDING_STORAGE_KEY) === "complete"
  );
  const [accountOpen, setAccountOpen] = useState(false);
  const { session } = useAccount();
  const trackerCopy = CASE_TRACKER_COPY[language];
  
  const [civicsViewed, setCivicsViewed] = useState(() => {
    const saved = readLocalJson("civicsViewed", []);
    return Array.isArray(saved) ? saved : [];
  });
  const [practiceEvents, setPracticeEvents] = useState(() => getPracticeEvents());
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

  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [isReading, setIsReading] = useState(false);
  const [readingIndex, setReadingIndex] = useState(0);
  const readingRecorderRef = useRef(null);
  const [writingAnswer, setWritingAnswer] = useState("");
  const [writingGoodCount, setWritingGoodCount] = useState(0);
  const [writingNeedsPracticeCount, setWritingNeedsPracticeCount] = useState(0);
  const [writingIndex, setWritingIndex] = useState(0);

  const [readingOrder, setReadingOrder] = useState(() =>
    [...readingSentences]
      .map((_, index) => index)
      .sort(() => Math.random() - 0.5)
  );
  const practiceSummary = getPracticeSummary(practiceEvents, civicsViewed, civicsMastered);

  const recordPractice = (event) => {
    setPracticeEvents(recordPracticeEvent(event));
  };

  const navigateTo = (nextScreen, options) => {
    setNavigation((current) => navigateForward(current, nextScreen, options));
  };

  const goBack = (fallbackScreen = "home") => {
    setNavigation((current) => navigateBack(current, fallbackScreen));
  };

  const startAiFeature = (feature, continuation) => {
    requestAiSession(feature, continuation, language);
  };

  const openCoachFrom = () => {
    startAiFeature("coach", () => navigateTo("coach"));
  };

  const startInterview = (mode = "full") => {
    const feature = mode === "full" ? "realInterview" : "classicInterview";
    startAiFeature(feature, () => {
      setInterviewMode(mode);
      setInterviewRunId((current) => current + 1);
      navigateTo("interview");
    });
  };

  const openPracticeModule = (key) => {
    if (key === "interview") {
      startInterview();
      return;
    }
    if (key === "civics") {
      navigateTo("civics");
      return;
    }
    const feature = key === "writing" ? "writing" : key === "coach" ? "coach" : "speaking";
    startAiFeature(feature, () => navigateTo(key === "writing" ? "writing" : key === "coach" ? "coach" : "reading"));
  };

  const recentPractice = [...practiceEvents].slice(-5).reverse();

  // 2. TODOS LOS EFECTOS (USEEFFECT) VAN AQUÍ
  const markCivicsViewed = (index) => {
    setCivicsViewed((current) => {
      if (current.includes(index)) return current;
      const updated = [...current, index];
      saveLocalValue("civicsViewed", JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (screen !== "civics") return;
    const timer = setTimeout(() => {
      setCivicsViewed((current) => {
        if (current.includes(civicsIndex)) return current;
        const updated = [...current, civicsIndex];
        saveLocalValue("civicsViewed", JSON.stringify(updated));
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
  }, [screen, civicsIndex, soundEnabled]);

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

  const nextReadingSentence = () => {
    setReadingIndex((currentIndex) => {
      const nextIndex = currentIndex + 1;
      if (nextIndex >= readingOrder.length) {
        const newOrder = [...readingOrder].sort(() => Math.random() - 0.5);
        setReadingOrder(newOrder);
        return 0;
      }
      return nextIndex;
    });
    setAiMessage("");
  };

  const nextWritingSentence = () => {
    setWritingAnswer("");
    setWritingIndex((currentIndex) => {
      const nextIndex = currentIndex + 1;
      if (nextIndex >= writingSentences.length) return 0;
      return nextIndex;
    });
    setAiMessage("");
  };

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
      const result = localResult.needsSemanticReview
        ? await apiJson("/evaluate-writing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sentenceId: sentence.sentenceId, answer: writingAnswer }),
          })
        : localResult;
      if (result.accuracy === "Excellent" || result.accuracy === "Good") {
        setWritingGoodCount((count) => count + 1);
        playCorrectSound();
        emitCompanionResult(true);
      } else {
        setWritingNeedsPracticeCount((count) => count + 1);
        playIncorrectSound();
        emitCompanionResult(false);
      }
      const resultLabel = result.resultLabel || (result.accuracy === "Excellent" ? "Correcta" : result.accuracy === "Good" ? "Correcta con observaciones" : "Necesita práctica");
      recordPractice({ module: "writing", score: result.score, outcome: resultLabel });
      setAiMessage(`${result.score}% — ${resultLabel}\n\n${result.feedback}`);
      setTimeout(() => {
        nextWritingSentence();
      }, 3000);
    } catch (error) {
      console.error("Writing evaluation error:", error);
      setAiMessage("Unable to evaluate writing.");
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
    setCoachThinking(true);
    try {
      const result = await apiJson("/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: coachHistory }),
      });
      setCoachReply(result.reply || "");
      speakCoachReply(result.reply || "");
      setCoachHistory((current) => [
        ...current,
        { role: "user", content: message },
        { role: "assistant", content: result.reply || "" },
      ]);
      recordPractice({ module: "coach", outcome: "reply" });
    } catch (error) {
      console.error("Coach AI error:", error);
      setCoachReply(error.message || "I'm having trouble connecting right now. Please try again.");
    } finally {
      setCoachThinking(false);
    }
  };

  const startCoachListening = async () => {
    try {
      coachRecorderRef.current = await startAudioRecording();
      setCoachListening(true);
      emitCompanionState("thinking", { message: language === "es" ? "Te escucho." : "I'm listening." });
    } catch (error) {
      console.error("Coach microphone error:", error);
      setCoachReply(error.message || "Please allow microphone access and try again.");
    }
  };

  const stopCoachListening = async () => {
    const recorder = coachRecorderRef.current;
    coachRecorderRef.current = null;
    setCoachListening(false);
    if (!recorder) return;

    try {
      const transcript = await transcribeRecording(await recorder.stop());
      if (!transcript) throw new Error("No speech was detected.");
      await sendCoachMessage(transcript);
    } catch (error) {
      console.error("Coach transcription error:", error);
      setCoachReply(error.message || "I couldn't hear you. Please try again.");
    }
  };

  const startReading = async () => {
    try {
      readingRecorderRef.current = await startAudioRecording();
      setIsAIThinking(true);
      setIsReading(true);
      setAiMessage("Listening to your reading...");
      emitCompanionState("thinking", { message: language === "es" ? "Te escucho. Lee con calma." : "I'm listening. Read at your own pace." });
    } catch (error) {
      console.error("Reading microphone error:", error);
      setIsAIThinking(false);
      setAiMessage(error.message || "Please allow microphone access and try again.");
    }
  };

  const stopReading = async () => {
    const recorder = readingRecorderRef.current;
    readingRecorderRef.current = null;
    setIsReading(false);
    if (!recorder) return;

    try {
      setAiMessage("AI is listening to your reading...");
      const transcript = await transcribeRecording(await recorder.stop());
      if (!transcript) {
        setAiMessage("I couldn't hear your reading. Please try again.");
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
    } catch (error) {
      console.error("Reading AI error:", error);
      setAiMessage(error.message || "Unable to evaluate reading.");
    } finally {
      setIsAIThinking(false);
    }
  };

  const setPreferredLanguage = (nextLanguage) => {
    const value = nextLanguage === "es" ? "es" : "en";
    setLanguage(value);
    saveLocalValue(LANGUAGE_STORAGE_KEY, value);
  };

  const completeOnboarding = () => {
    saveLocalValue(ONBOARDING_STORAGE_KEY, "complete");
    setOnboardingComplete(true);
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

  // 3. LAS CONDICIONES DE RENDERIZADO (IF) VAN AQUÍ ABAJO, NUNCA ANTES DE LOS HOOKS
  if (!onboardingComplete && screen !== "settings") {
    return <Onboarding language={language} onLanguageChange={setPreferredLanguage} onComplete={completeOnboarding} />;
  }

  if (screen === "settings") {
    return <LegalSettings onBack={() => {
      window.history.replaceState(null, "", window.location.pathname);
      goBack("home");
    }} onRestartOnboarding={restartOnboarding} />;
  }

  if (screen === "immigrationHelp") {
    return <ImmigrationHelp language={language} onLanguageChange={setPreferredLanguage} onBack={() => goBack("home")} />;
  }

  if (screen === "podcasts") {
    return <PodcastLibrary onBack={() => goBack("home")} />;
  }

  if (screen === "civicsGuide") {
    return (
      <Suspense fallback={<div className="study-guide-route-loading" role="status">Loading official study guide…</div>}>
        <CivicsStudyGuide language={language} onBack={() => goBack("civics")} />
      </Suspense>
    );
  }

  if (screen === "quiz") {
    return (
      <Suspense fallback={<div className="study-guide-route-loading" role="status">Loading adaptive quiz…</div>}>
        <QuizLearningPath
          key={session?.user?.id || "guest"}
          language={language}
          userKey={session?.user?.id || "guest"}
          onBack={() => goBack("civics")}
          onPracticeComplete={({ score, outcome }) => recordPractice({ module: "quiz", score, outcome, category: "civics" })}
        />
      </Suspense>
    );
  }

  if (screen === "civics") {
    // ... mantén tu código actual de civics aquí o déjalo tal cual lo tienes ...
  }
  if (screen === "practice") {
    // ... mantén tu código actual de practice aquí ...
  }
  if (screen === "english") {
    // ... mantén tu código actual de english aquí ...
  }
  if (screen === "reading") {
    // ... mantén tu código actual de reading aquí ...
  }
  if (screen === "coach") {
    const conversationStarted = coachMode === "conversation";
    return (
      <div className="practice-screen coach-screen coach-video-call-screen">
        <header className="practice-header">
          <button className="back-button" onClick={() => { setCoachMode("welcome"); goBack("english"); }}>← {previousScreenLabel("english")}</button>
          <div className="practice-brand">CITIZENSHIP <span>AI</span></div>
        </header>
        <main className="coach-conversation-content coach-video-call-content">
          <div className="practice-eyebrow">AI ENGLISH COACH · VIDEO PRACTICE</div>
          <div className={"coach-conversation-card coach-video-call-card " + (conversationStarted ? "started" : "ready")}>
            <div className={"coach-conversation-avatar " + (coachSpeaking ? "speaking" : "listening")} aria-label={coachSpeaking ? "Sarah speaking" : "Sarah ready to listen"}>
              <video src="/sarah-listening.mp4" poster={sarahImage} className="coach-avatar-video coach-avatar-listening" autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
              <video src="/sarah-speaking.mp4" poster={sarahSpeakingImage} className="coach-avatar-video coach-avatar-speaking" autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
              <div className="coach-video-call-overlay" aria-hidden="true"></div>
              <div className="coach-video-call-identity"><span></span><div><strong>Sarah AI</strong><small>English conversation coach</small></div></div>
            </div>
            <div className="coach-conversation-status" role="status" aria-live="polite">
              <span></span>
              {!conversationStarted ? "SARAH IS READY" : coachListening ? "LISTENING TO YOU" : coachThinking ? "SARAH IS THINKING" : coachSpeaking ? "SARAH IS SPEAKING" : "CONVERSATION ACTIVE"}
            </div>
            <div className="coach-message">
              <div className="coach-message-label">SARAH</div>
              <div className="coach-message-text">{conversationStarted ? (coachReply || "Hi! I'm Sarah. Let's practice English together. Tell me about yourself.") : "Ready when you are. Start the conversation and practice English with me naturally."}</div>
            </div>
            <div className="coach-response-area">
              {!conversationStarted ? (
                <button className="coach-start-button coach-call-start-button" onClick={() => { setCoachReply(""); setCoachMode("conversation"); speakCoachReply("Hi! I'm Sarah. Let's practice English together. Tell me about yourself."); }} type="button">
                  <span className="coach-call-icon" aria-hidden="true">▶</span>
                  <span className="coach-call-copy"><small>AI ENGLISH COACH</small><strong>Start conversation</strong></span>
                  <span className="coach-call-arrow" aria-hidden="true">→</span>
                </button>
              ) : (
                <>
                  <div className="coach-response-label">YOUR RESPONSE</div>
                  <button className={"coach-mic-button " + (coachListening ? "listening" : "")} onClick={coachListening ? stopCoachListening : startCoachListening} disabled={coachThinking} aria-busy={coachThinking} type="button">
                    <div className="coach-mic-icon-wrapper"><span className="mic-glyph">🎙</span></div>
                    <span className="coach-mic-text">{coachThinking ? "Sarah is preparing a response..." : coachListening ? "Tap again when you finish speaking" : "Tap the microphone to speak"}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }
  // Control de pantallas de la aplicación
  // Control de pantallas de la aplicación
  if (screen === "civics") {
    const isSpanish = language === "es";
    const currentQuestionRecord = civicsQuestionBank[civicsIndex];
    const currentVisual = getCivicsVisual(currentQuestionRecord.questionId);
    const currentQuestion = currentQuestionRecord.question;
    const currentQuestionSpanish = currentQuestionRecord.questionSpanish;
    const currentAnswers = currentQuestionRecord.acceptedAnswers.length ? currentQuestionRecord.acceptedAnswers : [isSpanish ? "La respuesta cambia. Verifica la actualización oficial." : "This answer changes. Check the official update before practicing."];
    const favoriteIndexes = civicsFavorites.filter((index) => index >= 0 && index < civicsQuestionBank.length);
    const visibleIndexes = civicsStudyMode === "favorites" ? favoriteIndexes : civicsQuestionBank.map((_, index) => index);
    const activePosition = Math.max(0, visibleIndexes.indexOf(civicsIndex));
    const studiedPercent = Math.round((civicsMastered.length / civicsQuestionBank.length) * 100);
    const copy = isSpanish ? {
      subtitle: "Domina las preguntas para tu entrevista.", progress: "Progreso", cards: "Tarjetas",
      practice: "Práctica", quiz: "Examen", guide: "Libro", favorites: "Favoritas", reveal: "Toca para ver la respuesta",
      question: "PREGUNTA", answer: "RESPUESTA", need: "Necesito practicar", know: "Ya la sé",
      studied: "estudiadas", mastered: "dominadas", review: "repasar", empty: "Aún no tienes preguntas favoritas.",
      backToQuestion: "Toca para volver a la pregunta", playAudio: "Escuchar pregunta y respuesta",
      source: "Fuente oficial", addFavorite: "Agregar a favoritas", removeFavorite: "Quitar de favoritas",
      soundOn: "Lectura de tarjetas activada", soundOff: "Lectura de tarjetas desactivada",
    } : {
      subtitle: "Master the questions for your interview.", progress: "Study Progress", cards: "Study Cards",
      practice: "Practice", quiz: "Quiz", guide: "Book", favorites: "Favorites", reveal: "Tap to reveal answer",
      question: "QUESTION", answer: "ANSWER", need: "Need Practice", know: "I Know This",
      studied: "studied", mastered: "mastered", review: "review", empty: "You have not saved any favorite questions yet.",
      backToQuestion: "Tap to return to the question", playAudio: "Play question and answer audio",
      source: "Official source", addFavorite: "Add to favorites", removeFavorite: "Remove from favorites",
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
      setCivicsFlipped(false);
      setCivicsIndex(nextIndex);
      markCivicsViewed(nextIndex);
    };

    const updateCivicsCollection = (setter, storageKey, shouldAdd) => {
      setter((current) => {
        const updated = shouldAdd
          ? (current.includes(civicsIndex) ? current : [...current, civicsIndex])
          : current.filter((index) => index !== civicsIndex);
        saveLocalValue(storageKey, JSON.stringify(updated));
        return updated;
      });
    };

    const toggleFavorite = () => {
      const isFavorite = civicsFavorites.includes(civicsIndex);
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
        <header className="practice-header">
          <button className="back-button" onClick={() => goBack("practice")}>
            ← {previousScreenLabel("practice")}
          </button>
          <div className="practice-brand">CITIZENSHIP <span>AI</span></div>
        </header>
        <main className="civics-deck-content">
          <section className="civics-deck-hero" aria-labelledby="civics-deck-title">
            <div className="civics-deck-icon" aria-hidden="true">▤</div>
            <div className="civics-deck-heading">
              <span>CIVICS</span>
              <h1 id="civics-deck-title">128 {isSpanish ? "Preguntas" : "Questions"}</h1>
              <p>{copy.subtitle}</p>
            </div>
            <div className="civics-deck-progress" aria-label={`${copy.progress}: ${studiedPercent}%`}>
              <div><span>{copy.progress}</span><strong>{studiedPercent}%</strong></div>
              <div className="civics-deck-progress-track"><i style={{ width: `${studiedPercent}%` }}></i></div>
            </div>
          </section>

          <nav className="civics-modes" aria-label="Civics study modes">
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
                />
              </section>

              <div className="civics-deck-navigation">
                <button onClick={() => changeCivicsCard(-1)} aria-label="Previous question"><span>←</span>{isSpanish ? "Anterior" : "Previous"}</button>
                <div><strong>{civicsViewed.length} / 128</strong><em>{copy.studied}</em><span>·</span><strong>{civicsMastered.length}</strong><em>{copy.mastered}</em><span>·</span><strong>{civicsNeedsPractice.length}</strong><em>{copy.review}</em></div>
                <button className="next" onClick={() => changeCivicsCard(1)} aria-label="Next question">{isSpanish ? "Siguiente" : "Next"}<span>→</span></button>
              </div>

              {civicsFlipped && <div className="civics-study-feedback" aria-label="Study feedback">
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
            </>
          ) : (
            <section className="civics-favorites-empty"><span>☆</span><p>{copy.empty}</p><button onClick={() => setCivicsStudyMode("study")}>{copy.cards}</button></section>
          )}
        </main>
      </div>
    );
  }

  if (screen === "practice") {
    return (
      <div className="practice-screen">
        <header className="practice-header">
          <button className="back-button" onClick={() => goBack("home")}>
            ← {previousScreenLabel("home")}
          </button>
          <div className="practice-brand">CITIZENSHIP <span>AI</span></div>
        </header>
        <main className="practice-content">
          <div className="practice-eyebrow">AI-POWERED CITIZENSHIP TRAINING</div>
          <h1>Practice.</h1>
          <p className="practice-intro">Choose how you want to prepare for your citizenship interview.</p>
          <div className="practice-options">
            <button className="practice-option" onClick={() => navigateTo("civics")}>
              <div className="practice-option-left">
                <div className="practice-option-icon">◉</div>
                <div className="practice-option-content">
                  <h2>Civics</h2>
                  <p>128 official questions</p>
                </div>
              </div>
              <span className="practice-arrow">→</span>
            </button>
            <button className="practice-option" onClick={() => navigateTo("english")}>
              <div className="practice-option-left">
                <div className="practice-option-icon">A</div>
                <div className="practice-option-content">
                  <h2>English</h2>
                  <p>Reading & writing</p>
                </div>
              </div>
              <span className="practice-arrow">→</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (screen === "english") {
    return (
      <div className="practice-screen">
        <header className="practice-header">
          <button className="back-button" onClick={() => goBack("practice")}>
            ← {previousScreenLabel("practice")}
          </button>
          <div className="practice-brand">CITIZENSHIP <span>AI</span></div>
        </header>
        <main className="practice-content">
          <div className="practice-eyebrow">ENGLISH PREPARATION</div>
          <h1>English.</h1>
          <p className="practice-intro">Practice the English skills needed for your citizenship interview.</p>
          <div className="practice-options">
            <button className="practice-option" onClick={() => startAiFeature("speaking", () => navigateTo("reading"))}>
              <div className="practice-option-left">
                <div className="practice-option-icon">A</div>
                <div className="practice-option-content">
                  <h2>Reading</h2>
                  <p>Practice reading sentences aloud.</p>
                </div>
              </div>
              <span className="practice-arrow">→</span>
            </button>
            <button className="practice-option" onClick={() => startAiFeature("writing", () => navigateTo("writing"))}>
              <div className="practice-option-left">
                <div className="practice-option-icon">✎</div>
                <div className="practice-option-content">
                  <h2>Writing</h2>
                  <p>Practice writing sentences correctly.</p>
                </div>
              </div>
              <span className="practice-arrow">→</span>
            </button>
            <button className="practice-option" onClick={openCoachFrom}>
              <div className="practice-option-left">
                <div className="practice-option-icon">✦</div>
                <div className="practice-option-content">
                  <h2>AI English Coach</h2>
                  <p>Practice real English conversations with AI</p>
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
      <div className="practice-screen">
        <header className="practice-header">
          <button className="back-button" onClick={() => goBack("english")}>
            ← {previousScreenLabel("english")}
          </button>
          <div className="practice-brand">CITIZENSHIP <span>AI</span></div>
        </header>
        <main className="practice-content">
          <div className="practice-eyebrow">ENGLISH · READING</div>
          <h1>Reading.</h1>
          <p className="practice-intro">Read the sentence aloud and practice your English.</p>
          <div className="reading-card">
            <div className="reading-card-heading">
              <span className="reading-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M7 4.5h8.5A2.5 2.5 0 0 1 18 7v12H8a3 3 0 0 1-3-3V6.5a2 2 0 0 1 2-2Z"/><path d="M8 4.5V16h10M10.5 9H15M10.5 12H15"/></svg>
              </span>
              <div>
                <small>ENGLISH PRACTICE</small>
                <div className="reading-label">READ THIS SENTENCE</div>
              </div>
              <span className="reading-card-count">{readingIndex + 1} / {readingSentences.length}</span>
            </div>
            <div className="reading-sentence">{readingSentences[readingIndex].english}</div>
            <div className="writing-spanish">{readingSentences[readingIndex].spanish}</div>
            {aiMessage && (
              <div className="ai-reading-feedback" role="status" aria-live="polite">
                <div className="ai-reading-label">AI HEARD</div>
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
                <small>{isReading ? "RECORDING ACTIVE" : "YOUR TURN"}</small>
                <strong>{isReading ? "Stop & Evaluate" : "Start Reading"}</strong>
              </span>
              <span className="reading-button-arrow" aria-hidden="true">{isReading ? "■" : "→"}</span>
            </button>
          </div>
          <button className="english-coach-secondary" onClick={openCoachFrom} type="button">
            <span className="english-coach-secondary-avatar"><img src={sarahImage} alt="" /></span>
            <span className="english-coach-secondary-copy">
              <small>OPTIONAL CONVERSATION PRACTICE</small>
              <strong>Continue practicing with Sarah</strong>
            </span>
            <span className="english-coach-secondary-arrow" aria-hidden="true">→</span>
          </button>
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
          <div className="writing-ai-brand">CITIZENSHIP <span>AI</span></div>
        </header>
        <main className="writing-ai-content">
          <div className="writing-top-section">
            <div>
              <div className="writing-eyebrow">ENGLISH · WRITING DICTATION</div>
              <h1 className="writing-ai-title">Writing <span>Practice.</span></h1>
              <p className="writing-ai-intro">Listen carefully to Sarah and type the sentence in English.</p>
            </div>
            <div className="writing-ai-badge">
              <div className="writing-ai-badge-icon">✎</div>
              <div>
                <strong>AI AUDIO DICTATION</strong>
                <small>LISTENING & WRITING TEST</small>
              </div>
            </div>
          </div>
          <div className="writing-performance">
            <div className="writing-performance-title">AI PERFORMANCE</div>
            <div className="writing-performance-content">
              <div className="performance-item good">
                <div className="performance-dot"></div>
                <div>
                  <strong>{String(writingGoodCount).padStart(2, "0")}</strong>
                  <span>GOOD</span>
                </div>
              </div>
              <div className="performance-divider"></div>
              <div className="performance-item needs">
                <div className="performance-dot"></div>
                <div>
                  <strong>{String(writingNeedsPracticeCount).padStart(2, "0")}</strong>
                  <span>NEEDS PRACTICE</span>
                </div>
              </div>
            </div>
          </div>
          <div className="writing-question-card">
            <div className="writing-question-header">
              <div className="writing-question-label">
                <span>🔊</span> LISTEN & TYPE WHAT YOU HEAR
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
                <span className="dictation-replay-copy"><small>AUDIO PROMPT</small><strong>Replay Sentence</strong></span>
                <span className="dictation-replay-arrow" aria-hidden="true">→</span>
              </button>
            </div>
            <div className="writing-line"></div>
            <div className="writing-translation-label">
              <span>◎</span> SPANISH TRANSLATION (CONTEXT)
            </div>
            <div className="writing-big-spanish">
              {writingSentences[writingIndex].spanish}
            </div>
          </div>
          <label className="sr-only" htmlFor="writing-practice-answer">
            Type the English sentence you hear
          </label>
          <textarea
            id="writing-practice-answer"
            className="writing-ai-input"
            placeholder="Type what you hear in English..."
            value={writingAnswer}
            aria-busy={isAIThinking}
            onChange={(e) => setWritingAnswer(e.target.value)}
          />
          <button
            className="writing-ai-button"
            onClick={checkWriting}
            disabled={isAIThinking}
          >
            <span className="writing-check-icon" aria-hidden="true">✓</span>
            <span className="writing-check-copy"><small>{isAIThinking ? "AI IS REVIEWING" : "READY TO REVIEW"}</small><strong>{isAIThinking ? "Evaluating..." : "Check Writing"}</strong></span>
            <span className="writing-check-arrow" aria-hidden="true">→</span>
          </button>
          {aiMessage && (
            <div className="writing-ai-evaluation" role="status" aria-live="polite">
              <div className="writing-evaluation-label">AI EVALUATION</div>
              <div className="writing-evaluation-text">{aiMessage}</div>
            </div>
          )}
          <button className="english-coach-secondary" onClick={openCoachFrom} type="button">
            <span className="english-coach-secondary-avatar"><img src={sarahImage} alt="" /></span>
            <span className="english-coach-secondary-copy">
              <small>OPTIONAL CONVERSATION PRACTICE</small>
              <strong>Continue practicing with Sarah</strong>
            </span>
            <span className="english-coach-secondary-arrow" aria-hidden="true">→</span>
          </button>
        </main>
      </div>
    );
  }

  if (screen === "uscisTracker") {
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
                } catch (error) {
                  console.error("Case Tracker error:", error);
                  setUscisError(error.message || "Unable to check case status.");
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
                <div className="uscis-calculated-grid" aria-label="Educational date calculations">
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
    return (
      <div className="app progress-ai-screen">
        <main className="progress-ai-content">
          <div className="progress-ai-header">
            <span>YOUR PERFORMANCE</span>
            <h1>My Progress</h1>
            <p>Track your citizenship preparation with AI.</p>
          </div>
          <section className="progress-ai-overview">
            <div className="progress-ai-score">
              <span>PRACTICE READINESS</span>
              <strong>{practiceSummary.readiness === null ? "—" : `${practiceSummary.readiness}%`}</strong>
              <span className="readiness-level">{({ beginner: "Beginner", in_progress: "In progress", prepared: "Prepared", ready_for_interview: "Ready for interview" })[practiceSummary.level] || "Beginner"}</span>
              <p>{practiceSummary.readiness === null ? "Complete a reading, writing, or interview practice to build your baseline." : "Based only on your measured Citizenship AI practice."}</p>
            </div>
            <div className="progress-ai-bar">
              <div className="progress-ai-fill" style={{ width: `${practiceSummary.readiness || 0}%` }}></div>
            </div>
            <div className="progress-evidence" aria-label="Readiness evidence">
              <div><span>Accuracy</span><strong>{practiceSummary.accuracy === null ? "—" : `${practiceSummary.accuracy}%`}</strong></div>
              <div><span>Coverage</span><strong>{practiceSummary.coverage}%</strong></div>
              <div><span>Confidence</span><strong>{practiceSummary.confidence}</strong></div>
            </div>
            <CategoryMastery metrics={practiceSummary.metrics} />
            {practiceSummary.readinessReasons[0] && <p className="progress-readiness-reason">{practiceSummary.readinessReasons[0]}</p>}
          </section>
          <RetrievalPracticeCard title="Strengthen your weakest area" prompt={practiceSummary.recommended.detail} hint="Try to answer aloud before revealing choices or help." onStart={() => openPracticeModule(practiceSummary.recommended.key)} />
          <section className="progress-recommendation" aria-label="Recommended next practice">
            <span>RECOMMENDED NEXT</span>
            <h2>{practiceSummary.recommended.label}</h2>
            <p>{practiceSummary.recommended.detail}</p>
            <button onClick={() => openPracticeModule(practiceSummary.recommended.key)}>Start practice <span>→</span></button>
          </section>
          <section className="progress-personal-plan" aria-label="Personal study plan">
            <span>PERSONAL STUDY PLAN</span>
            <h2>{practiceSummary.readiness === null ? "Build your first baseline" : "Your next three focus areas"}</h2>
            <p>{practiceSummary.readiness === null ? "Complete these short activities so Citizenship AI can tailor your next recommendation." : "The plan prioritizes areas without a baseline first, then the areas that need the most practice."}</p>
            <ol>
              {practiceSummary.plan.map((item, index) => (
                <li key={item.key}>
                  <span>{index + 1}</span>
                  <button onClick={() => openPracticeModule(item.key)}>
                    <strong>{item.label}</strong>
                    <small>{item.detail}</small>
                  </button>
                </li>
              ))}
            </ol>
          </section>
          <section className="progress-free-credits" aria-label="Unlimited launch access">
            <div>
              <span>LAUNCH ACCESS</span>
              <h2>Unlimited AI practice</h2>
              <p>All practice modes are currently available without limits while subscriptions are being prepared.</p>
            </div>
            <p className="progress-empty-history">No practice limits or payments are active.</p>
          </section>
          <section className="progress-ai-modules">
            <div className="progress-ai-module">
              <div className="progress-module-icon">◎</div>
              <div>
                <span>CIVICS</span>
                <h2>128 Questions</h2>
                <p>{civicsViewed.length} questions completed</p>
              </div>
              <strong>{Math.round((civicsViewed.length / 128) * 100)}%</strong>
            </div>
            {[{ label: "READING", data: practiceSummary.reading }, { label: "WRITING", data: practiceSummary.writing }, { label: "SARAH INTERVIEWS", data: practiceSummary.interview }].map(({ label, data }) => (
              <div className="progress-ai-module progress-ai-module-measured" key={label}>
                <div className="progress-module-icon">✦</div>
                <div>
                  <span>{label}</span>
                  <h2>{data.attempts} practice {data.attempts === 1 ? "session" : "sessions"}</h2>
                  <p>{data.score === null ? "No measured score yet" : `Average practice score: ${data.score}%`}</p>
                </div>
                <strong>{data.score === null ? "—" : `${data.score}%`}</strong>
              </div>
            ))}
          </section>
          <section className="progress-recent-practice" aria-label="Recent practice">
            <div>
              <span>YOUR HISTORY</span>
              <h2>Recent practice</h2>
            </div>
            {recentPractice.length === 0 ? (
              <p className="progress-empty-history">Your completed reading, writing, interview, and coaching sessions will appear here.</p>
            ) : (
              <ul>
                {recentPractice.map((event) => (
                  <li key={`${event.module}-${event.at}`}>
                    <div className="progress-history-icon">{event.module === "interview" ? "✦" : event.module === "writing" ? "✎" : event.module === "reading" ? "A" : "◎"}</div>
                    <div>
                      <strong>{PRACTICE_MODULE_NAMES[event.module]}</strong>
                      <small>{new Date(event.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {event.score === null ? "Completed" : `${event.score}%`}</small>
                    </div>
                    <span className={event.score !== null && event.score >= 70 ? "progress-history-good" : ""}>{event.outcome}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <button className="progress-ai-back" onClick={() => goBack("home")}>
            ← Back
          </button>
        </main>
      </div>
    );
  }

  if (screen === "interview") {
    if (interviewMode === "n400") {
      return (
        <N400InterviewPractice
          key={`n400-${interviewRunId}`}
          onExit={() => goBack("home")}
          onComplete={({ score, outcome }) => recordPractice({ module: "interview", score, outcome })}
          onRestart={() => setInterviewRunId((current) => current + 1)}
        />
      );
    }
    return (
      <RealInterview
        key={`${interviewMode}-${interviewRunId}`}
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
    <Home
      onStartInterview={() => startInterview("full")}
      onStartN400Interview={() => startInterview("n400")}
      onStartCivicsInterview={() => startInterview("civics")}
      onOpenFeature={(feature) => {
        const gatedFeature = feature === "coach" ? "coach" : feature === "writing" ? "writing" : feature === "reading" ? "speaking" : null;
        if (gatedFeature) startAiFeature(gatedFeature, () => navigateTo(feature));
        else navigateTo(feature);
      }}
      onOpenProgress={() => navigateTo("progress")}
      onOpenImmigrationHelp={() => navigateTo("immigrationHelp")}
      onOpenPodcasts={() => navigateTo("podcasts")}
      onOpenAccount={() => setAccountOpen(true)}
      onOpenSettings={() => {
        window.location.hash = "privacy";
        navigateTo("settings");
      }}
      language={language}
      onLanguageChange={setPreferredLanguage}
      practiceSummary={practiceSummary}
    />
    {accountOpen && <AccountSheet language={language} onClose={() => setAccountOpen(false)} />}
    </>
  );
}
export default App;
