import { useState, useEffect, useRef } from "react";
import "./App.css";
import sarahImage from "./assets/sarah.png";
import sarahSpeakingImage from "./assets/sarah-speaking.png";
import kevinImage from "./assets/kevin-cinematic.png";
import { civicsQuestions } from "./questions";
import { acceptedAnswers } from "./answers";
import { civicsAnswers } from "./civicsAnswers";
import { civicsQuestionsSpanish } from "./civicsQuestionsSpanish";
import { apiJson } from "./api";
import { startAudioRecording, transcribeRecording } from "./audio";
import { LegalSettings, Onboarding } from "./LegalSettings";
import { getPracticeEvents, getPracticeSummary, recordPracticeEvent } from "./progress";
import { FREE_AI_LIMITS, canUseAiFeature, getAiUsageSummary, recordAiUsage } from "./access";
import { daysSinceOfficialDate, formatOfficialDate, getCaseGuidance } from "./caseTracker";import { DidLiveAvatar } from "./DidLiveAvatar";


const ONBOARDING_STORAGE_KEY = "citizenshipai.onboarding.v1";
const LANGUAGE_STORAGE_KEY = "citizenshipai.language";
const PRACTICE_MODULE_NAMES = {
  reading: "Reading practice",
  writing: "Writing practice",
  interview: "Sarah interview",
  coach: "Sarah coaching",
};
const AI_FEATURE_NAMES = {
  reading: "Reading evaluation",
  writing: "Writing evaluation",
  coach: "Sarah coaching",
  interview: "Sarah interview",
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
];const writingSentences = [
  {
    english: "Adams was President.",
    spanish: "Adams fue Presidente."
  },
  {
    english: "Lincoln was President.",
    spanish: "Lincoln fue Presidente."
  },
  {
    english: "Washington was President.",
    spanish: "Washington fue Presidente."
  },
  {
    english: "Washington was the Father of Our Country.",
    spanish: "Washington fue el Padre de Nuestro País."
  },
  {
    english: "The President lives in the White House.",
    spanish: "El Presidente vive en la Casa Blanca."
  },
  {
    english: "The President lives in Washington.",
    spanish: "El Presidente vive en Washington."
  },
  {
    english: "Citizens can vote.",
    spanish: "Los ciudadanos pueden votar."
  },
  {
    english: "Citizens have rights.",
    spanish: "Los ciudadanos tienen derechos."
  },
  {
    english: "Citizens pay taxes.",
    spanish: "Los ciudadanos pagan impuestos."
  },
  {
    english: "People have the right to vote.",
    spanish: "Las personas tienen el derecho de votar."
  },
  {
    english: "People are free.",
    spanish: "Las personas son libres."
  },
  {
    english: "We have freedom of speech.",
    spanish: "Tenemos libertad de expresión."
  },
  {
    english: "Congress meets in Washington.",
    spanish: "El Congreso se reúne en Washington."
  },
  {
    english: "Senators work in Congress.",
    spanish: "Los senadores trabajan en el Congreso."
  },
  {
    english: "The United States is a country.",
    spanish: "Los Estados Unidos es un país."
  },
  {
    english: "The United States has fifty states.",
    spanish: "Los Estados Unidos tiene cincuenta estados."
  },
  {
    english: "Washington is the capital.",
    spanish: "Washington es la capital."
  },
  {
    english: "The capital is Washington, D.C.",
    spanish: "La capital es Washington, D.C."
  },
  {
    english: "The American flag is red, white, and blue.",
    spanish: "La bandera estadounidense es roja, blanca y azul."
  },
  {
    english: "The flag is red, white, and blue.",
    spanish: "La bandera es roja, blanca y azul."
  },
  {
    english: "The Civil War was a war.",
    spanish: "La Guerra Civil fue una guerra."
  },
  {
    english: "The Civil War was during Lincoln's time.",
    spanish: "La Guerra Civil fue durante la época de Lincoln."
  },
  {
    english: "American Indians lived here.",
    spanish: "Los indígenas americanos vivieron aquí."
  },
  {
    english: "The United States is north of Mexico.",
    spanish: "Los Estados Unidos está al norte de México."
  },
  {
    english: "Canada is north of the United States.",
    spanish: "Canadá está al norte de los Estados Unidos."
  },
  {
    english: "Mexico is south of the United States.",
    spanish: "México está al sur de los Estados Unidos."
  },
  {
    english: "Washington is in the United States.",
    spanish: "Washington está en los Estados Unidos."
  },
  {
    english: "California is a state.",
    spanish: "California es un estado."
  },
  {
    english: "Alaska is a state.",
    spanish: "Alaska es un estado."
  },
  {
    english: "Delaware is a state.",
    spanish: "Delaware es un estado."
  },
  {
    english: "New York City is a city.",
    spanish: "Nueva York es una ciudad."
  },
  {
    english: "The President can vote.",
    spanish: "El Presidente puede votar."
  },
  {
    english: "People can vote.",
    spanish: "Las personas pueden votar."
  },
  {
    english: "People want freedom.",
    spanish: "Las personas quieren libertad."
  },
  {
    english: "Citizens want freedom.",
    spanish: "Los ciudadanos quieren libertad."
  },
  {
    english: "The government is here.",
    spanish: "El gobierno está aquí."
  },
  {
    english: "The government can help people.",
    spanish: "El gobierno puede ayudar a las personas."
  },
  {
    english: "The President is elected.",
    spanish: "El Presidente es elegido."
  },
  {
    english: "The President was elected.",
    spanish: "El Presidente fue elegido."
  },
  {
    english: "We elect the President.",
    spanish: "Elegimos al Presidente."
  },
  {
    english: "We vote for the President.",
    spanish: "Votamos por el Presidente."
  },
  {
    english: "People vote in November.",
    spanish: "Las personas votan en noviembre."
  },
  {
    english: "The first President was Washington.",
    spanish: "El primer Presidente fue Washington."
  },
  {
    english: "Lincoln was the second President.",
    spanish: "Lincoln fue el segundo Presidente."
  },
  {
    english: "The largest state is Alaska.",
    spanish: "El estado más grande es Alaska."
  },
  {
    english: "The dollar bill is money.",
    spanish: "El billete de dólar es dinero."
  },
  {
    english: "The United States has one hundred Senators.",
    spanish: "Los Estados Unidos tiene cien senadores."
  },
  {
    english: "We celebrate Independence Day.",
    spanish: "Celebramos el Día de la Independencia."
  },
  {
    english: "We celebrate Thanksgiving.",
    spanish: "Celebramos el Día de Acción de Gracias."
  },
  {
    english: "We celebrate Presidents' Day.",
    spanish: "Celebramos el Día de los Presidentes."
  },
  {
    english: "We celebrate Memorial Day.",
    spanish: "Celebramos el Día de los Caídos."
  }
];
function Home({
  onStartInterview,
  onStartCivicsInterview,
  onOpenPractice,
  onOpenFeature,
  onOpenProgress,
  onOpenSettings,
  language,
  onLanguageChange,
}) {
  return (
    <div className="app home-ai">

      {/* ================= HEADER ================= */}

      <header className="home-new-header">

        <div className="home-new-brand">
          <span className="brand-main">CITIZENSHIP</span>
          <span className="brand-ai">AI</span>
        </div>

        <div className="language-selector">
          <button
            className="home-language"
            onClick={() => onLanguageChange(language === "en" ? "es" : "en")}
            aria-label="Change preferred language"
          >
            {language === "en" ? "EN" : "ES"}
            <span>⌄</span>
          </button>
          <button className="home-settings-button" onClick={onOpenSettings} aria-label="Open Legal and Privacy Settings">⚙</button>
        </div>

      </header>


      {/* ================= HERO ================= */}

      <main className="home-new-content">

        <section className="home-new-hero">

          <div className="hero-glow"></div>

          <div className="home-hero-copy">

            <div className="home-status">
              <span></span>
              AI-POWERED CITIZENSHIP TRAINING
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
              AI READY
            </div>

          </div>


          {/* PRIMARY ACTION */}

          <div className="home-interview-actions" style={{ display: "grid", gap: "12px", width: "100%" }}>
            <button className="home-primary-button" onClick={onStartInterview}>
              <div>
                <small>{language === "en" ? "SARAH LIVE VIDEO" : "VIDEO EN VIVO CON SARAH"}</small>
                <strong>{language === "en" ? "REAL INTERVIEW" : "ENTREVISTA REAL"}</strong>
              </div>
              <span className="primary-arrow">→</span>
            </button>
            <button
              className="home-primary-button home-civics-live-button"
              onClick={onStartCivicsInterview}
              style={{ background: "linear-gradient(135deg, #0b78d0, #5b55e7)" }}
            >
              <div>
                <small>{language === "en" ? "CLASSIC SARAH PRACTICE" : "PRÁCTICA CLÁSICA CON SARAH"}</small>
                <strong>{language === "en" ? "CIVICS INTERVIEW" : "ENTREVISTA CÍVICA"}</strong>
              </div>
              <span className="primary-arrow">→</span>
            </button>
          </div>

        </section>


        {/* ================= QUICK PRACTICE ================= */}

        <section className="home-new-section">

          <div className="home-section-heading">

            <div>
              <small>QUICK PRACTICE</small>
              <h2>Train with AI</h2>
            </div>

            <span className="section-live">
              <i></i>
              READY
            </span>

          </div>


          <div className="home-practice-list">

            <button
              className="practice-feature-card civics-feature"
              onClick={() => onOpenFeature("civics")}
            >

              <div className="feature-icon">
                ◎
              </div>

              <div className="feature-text">
                <small>CIVICS</small>
                <h3>128 Questions</h3>
                <p>Master the questions for your interview.</p>
              </div>

              <span className="feature-arrow">
                →
              </span>

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
                  <small>ENGLISH</small>
                  <h3>Reading</h3>
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
                  <small>ENGLISH</small>
                  <h3>Writing</h3>
                </div>

                <span>↗</span>

              </button>

            </div>


            <button
              className="coach-feature-card"
              onClick={() => onOpenFeature("coach")}
            >

              <div className="coach-feature-avatar">

                <img
                  src={sarahImage}
                  alt="Sarah"
                />

              </div>

              <div className="coach-feature-text">

                <small>AI ENGLISH COACH</small>

                <h3>
                  Practice English with Sarah
                </h3>

                <p>
                  Improve your confidence through conversation.
                </p>

              </div>

              <span className="feature-arrow">
                →
              </span>

            </button>

          </div>

        </section>


        {/* ================= PREPARATION ================= */}

        <section className="preparation-card">

          <div className="preparation-header">

            <div>
              <small>YOUR PREPARATION</small>
              <h2>Keep moving forward.</h2>
            </div>

            <div className="preparation-score">
              <strong>0%</strong>
              <span>READY</span>
            </div>

          </div>


          <div className="preparation-progress">

            <div
              className="preparation-progress-fill"
              style={{ width: "0%" }}
            ></div>

          </div>


          <div className="preparation-items">

            <div>
              <span>Civics</span>
              <strong>0%</strong>
            </div>

            <div>
              <span>English</span>
              <strong>0%</strong>
            </div>

            <div>
              <span>Interview</span>
              <strong>0%</strong>
            </div>

          </div>

          <button
            className="preparation-button"
            onClick={onOpenProgress}
          >
            VIEW PROGRESS
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
                Case Tracker
              </h2>

            </div>

            <div className="uscis-live">
              <span></span>
              USCIS SANDBOX
            </div>

          </div>


          <p>Practice checking a status response through the USCIS API Sandbox.</p>


          <button
            onClick={() => onOpenFeature("uscisTracker")}
          >
            CHECK CASE STATUS
            <span>→</span>
          </button>

        </section>


        {/* ================= AI TIP ================= */}

        <section className="home-ai-tip">

          <div className="tip-symbol">
            ✦
          </div>

          <div>

            <small>AI COACHING</small>

            <h3>
              Build confidence one answer at a time.
            </h3>

            <p>
              Practice regularly and let AI identify
              the areas that need more attention.
            </p>

          </div>

        </section>

      </main>


      {/* ================= BOTTOM NAV ================= */}

      <nav className="home-new-nav">

        <button className="home-nav-item active">

          <span>⌂</span>
          <strong>Home</strong>

        </button>


        <button
          className="home-nav-item"
          onClick={onOpenPractice}
        >

          <span>◎</span>
          <strong>Practice</strong>

        </button>


        <button
          className="home-nav-item"
          onClick={onOpenProgress}
        >

          <span>◌</span>
          <strong>Progress</strong>

        </button>


        <button
          className="home-nav-item"
          onClick={() => onOpenFeature("coach")}
        >

          <span>✦</span>
          <strong>Coach</strong>

        </button>

      </nav>

    </div>
  );
}

// Reemplaza la sección del componente RealInterview en tu App.js (el bloque que devuelve la pantalla de entrevista) con este código completamente optimizado y rediseñado:

const n400InterviewQuestions = [
  { id: "n400-name", type: "n400", english: "Please state your full legal name.", spanish: "Indique su nombre legal completo.", correctAnswer: "A clear answer that matches the applicant's own Form N-400 information." },
  { id: "n400-address", type: "n400", english: "What is your current home address?", spanish: "¿Cuál es su domicilio actual?", correctAnswer: "A clear answer that matches the applicant's own Form N-400 information." },
  { id: "n400-residence", type: "n400", english: "How long have you lived at your current address?", spanish: "¿Cuánto tiempo ha vivido en su domicilio actual?", correctAnswer: "A clear answer based on the applicant's own history and Form N-400." },
  { id: "n400-travel", type: "n400", english: "Have you taken any trips outside the United States during the last five years?", spanish: "¿Ha realizado viajes fuera de Estados Unidos durante los últimos cinco años?", correctAnswer: "A clear and complete answer based on the applicant's own travel history and Form N-400." },
  { id: "n400-oath", type: "n400", english: "Are you willing to take the Oath of Allegiance to the United States?", spanish: "¿Está dispuesto a prestar el Juramento de Lealtad a Estados Unidos?", correctAnswer: "A direct answer that reflects the applicant's own understanding and intent." },
];

function RealInterview({ onExit, onComplete, onReview, mode = "full" }) {
  const [questions] = useState(() => {
    const shuffledCivics = [...civicsQuestions].sort(() => Math.random() - 0.5);
    if (mode === "civics") return shuffledCivics.slice(0, 10);
    return [...n400InterviewQuestions, ...shuffledCivics.slice(0, 5)];
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
  const interviewerImage = isKevin ? kevinImage : sarahImage;
  const interviewerSpeakingImage = isKevin ? kevinImage : sarahSpeakingImage;

  const addMissedQuestion = (question) => {
    setMissedQuestions((current) => (
      current.some((item) => item.id === question.id)
        ? current
        : [...current, { id: question.id, english: question.english }]
    ));
  };

  useEffect(() => {
    if (!isInterviewComplete || completionReportedRef.current) return;
    completionReportedRef.current = true;
    onComplete?.({
      score: Math.round((correctAnswers / questions.length) * 100),
      outcome: "completed",
    });
  }, [isInterviewComplete, correctAnswers, questions.length, onComplete]);

  const speakQuestion = (text, onFinished, selectedInterviewer = interviewer) => {
    const requestId = ++speechRequestRef.current;
    window.speechSynthesis.cancel();
    const voiceIsKevin = selectedInterviewer === "kevin";
    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter((v) => v.lang.startsWith("en"));
    const americanEnglishVoices = englishVoices.filter((v) => /^en-US$/i.test(v.lang));
    const preferredVoice = voiceIsKevin
      ? americanEnglishVoices.find((v) => /david|mark|guy|ryan|christopher|matthew|joey|fred|alex/i.test(v.name))
        || americanEnglishVoices[0]
        || englishVoices[0]
      : englishVoices.find((v) => /female|zira|samantha|aria|jenny|susan/i.test(v.name))
        || englishVoices[0];

    const voice = new SpeechSynthesisUtterance(text);
    voice.lang = "en-US";
    voice.rate = voiceIsKevin ? 0.88 : 0.9;
    voice.pitch = voiceIsKevin ? 0.86 : 1.1;

    if (preferredVoice) {
      voice.voice = preferredVoice;
    }

    let finished = false;
    const finishSpeaking = () => {
      if (finished || requestId !== speechRequestRef.current) return;
      finished = true;
      setIsSpeaking(false);
      if (onFinished) onFinished();
    };

    voice.onstart = () => setIsSpeaking(true);
    voice.onend = () => finishSpeaking();
    voice.onerror = () => finishSpeaking();

    window.speechSynthesis.speak(voice);

    const estimatedTime = Math.max(3000, text.length * 70);
    setTimeout(() => {
      finishSpeaking();
    }, estimatedTime);
  };

  useEffect(() => {
    if (mode === "full") return undefined;
    const timer = setTimeout(() => {
      speakQuestion(`
        Welcome. Thank you for being here today.
        ${mode === "civics" ? "We are going to begin your civics interview practice." : "We are going to practice Form N-400 questions followed by civics questions."}
        ${questions[0].english}
      `);
    }, 500);

    return () => {
      clearTimeout(timer);
      window.speechSynthesis.cancel();
    };
  }, [questions]);

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
      speakQuestion(questions[nextQuestion].english);
    }, 300);
  };

  const handleSkip = () => {
    setIncorrectAnswers((count) => count + 1);
    addMissedQuestion(questions[currentQuestion]);
    setAnswerStatus("incorrect");
    setHasRetried(false);
    goToNextQuestion();
  };

  const evaluateInterviewAnswer = async (transcript) => {
    setAnswer(transcript);
    setAnswerStatus("evaluating");
    try {
      const result = await apiJson("/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questions[currentQuestion].english,
          answer: transcript,
          correctAnswer: questions[currentQuestion].correctAnswer || acceptedAnswers[questions[currentQuestion].id],
        }),
      });

      setAnswerStatus(result.status);

      if (result.status === "correct") setCorrectAnswers((count) => count + 1);
      if (result.status === "incorrect" && hasRetried) {
        setIncorrectAnswers((count) => count + 1);
        addMissedQuestion(questions[currentQuestion]);
      }

      const feedback = result.feedback || "";
      if (result.action === "advance") {
        speakQuestion(feedback, () => goToNextQuestion());
      } else if (result.action === "retry") {
        speakQuestion(`${feedback} Please answer the question again. ${questions[currentQuestion].english}`);
      } else if (result.action === "repeat") {
        if (hasRetried) {
          setIncorrectAnswers((count) => count + 1);
          addMissedQuestion(questions[currentQuestion]);
          speakQuestion(`${feedback} Let's move to the next question.`, () => goToNextQuestion());
        } else {
          setHasRetried(true);
          speakQuestion(`${feedback} Let me ask you that again. ${questions[currentQuestion].english}`);
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
        <button className="back-button interview-exit-button" onClick={onExit} aria-label="Exit practice interview">
          <span>×</span> Exit
        </button>
        <div className="interview-brand">
          <strong>CITIZENSHIP <span>AI</span></strong>
          <small>{mode === "civics" ? "LIVE CIVICS INTERVIEW" : "LIVE N-400 + CIVICS INTERVIEW"}</small>
        </div>
        <button
          className="more-button interview-repeat-button"
          onClick={() => speakQuestion(questions[currentQuestion].english)}
          aria-label={`Repeat ${interviewerName}'s question`}
          title="Repeat question"
        >
          ↻
        </button>
      </header>

      <main className="interview-content">
        <section className="sarah-live-stage" aria-label={`${interviewerName}, AI practice interviewer`}>
          <div className="live-stage-media" aria-hidden="true">
            <div className={`live-stage-motion-frame ${isKevin ? "kevin-motion-frame" : ""}`}>
              <img
                src={interviewerImage}
                alt=""
                className="live-sarah-image live-sarah-resting"
              />
              <img
                src={interviewerSpeakingImage}
                alt=""
                className="live-sarah-image live-sarah-speaking"
              />
            </div>
            <div className="live-stage-mask"></div>
          </div>

          <div className="live-stage-topbar">
            <div className="live-agent-badge">
              <span className="live-dot"></span>
              <div><strong>{interviewerName} AI</strong><small>Practice interviewer</small></div>
            </div>
            <div className="live-interviewer-selector" role="group" aria-label="Choose your interview officer">
              <button type="button" className={!isKevin ? "active" : ""} aria-pressed={!isKevin} onClick={() => { setInterviewer("sarah"); speakQuestion(questions[currentQuestion].english, undefined, "sarah"); }}>Sarah</button>
              <button type="button" className={isKevin ? "active" : ""} aria-pressed={isKevin} onClick={() => { setInterviewer("kevin"); speakQuestion(questions[currentQuestion].english, undefined, "kevin"); }}>Kevin</button>
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
            <h2 className="question">{questions[currentQuestion].english}</h2>
            <p className="question-spanish">{questions[currentQuestion].spanish}</p>
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
            className={`mic-button live-mic-button ${isListening ? "listening" : ""}`}
            onClick={isListening ? stopListening : startListening}
            disabled={isSpeaking}
            aria-label={isListening ? "Stop recording answer" : "Start recording answer"}
          >
            <span>🎙</span>
          </button>
          <button
            className="skip-button live-skip-button"
            onClick={handleSkip}
            disabled={isSpeaking || isListening}
          >
            I don&apos;t know / Skip
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
  const [screen, setScreen] = useState(() =>
    window.location.hash === "#privacy" ? "settings" : "home"
  );
  const [coachMode, setCoachMode] = useState("welcome");
  const [interviewMode, setInterviewMode] = useState("full");
  const [civicsIndex, setCivicsIndex] = useState(0);
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
  const trackerCopy = CASE_TRACKER_COPY[language];
  
  const [civicsViewed, setCivicsViewed] = useState(() => {
    const saved = readLocalJson("civicsViewed", []);
    return Array.isArray(saved) ? saved : [];
  });
  const [practiceEvents, setPracticeEvents] = useState(() => getPracticeEvents());
  const [aiUsage, setAiUsage] = useState(() => getAiUsageSummary());
  const [usageLimitFeature, setUsageLimitFeature] = useState(null);

  const [coachListening, setCoachListening] = useState(false);
  const [coachHistory, setCoachHistory] = useState([]);
  const [coachReply, setCoachReply] = useState("");
  const [coachThinking, setCoachThinking] = useState(false);
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
  const practiceSummary = getPracticeSummary(practiceEvents, civicsViewed);

  const recordPractice = (event) => {
    setPracticeEvents(recordPracticeEvent(event));
  };

  const canStartAiFeature = () => true;

  const recordAiFeatureUsage = (feature) => {
    setAiUsage(recordAiUsage(feature));
  };

  const startInterview = (mode = "full") => {
    setInterviewMode(mode);
    if (!canStartAiFeature("interview")) return;
    recordAiFeatureUsage("interview");
    setScreen("interview");
  };

  const openPracticeModule = (key) => {
    if (key === "interview") {
      startInterview();
      return;
    }
    setScreen(key === "civics" ? "civics" : key === "writing" ? "writing" : "reading");
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
      window.speechSynthesis.cancel();
      const speech = new SpeechSynthesisUtterance(
        civicsQuestions[civicsIndex].english
      );
      speech.lang = "en-US";
      speech.rate = 0.88;
      speech.pitch = 1;
      speech.volume = 1;
      window.speechSynthesis.speak(speech);
    }, 300);

    return () => {
      clearTimeout(timer);
      window.speechSynthesis.cancel();
    };
  }, [screen, civicsIndex]);

  // Funciones auxiliares de soporte...
  const playCorrectSound = () => {
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
    if (!canStartAiFeature("writing")) return;
    setIsAIThinking(true);
    setAiMessage("AI is evaluating your writing...");
    try {
      const result = await apiJson("/evaluate-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentence: writingSentences[writingIndex].english,
          answer: writingAnswer,
        }),
      });
      if (result.accuracy === "Excellent" || result.accuracy === "Good") {
        setWritingGoodCount((count) => count + 1);
      } else {
        setWritingNeedsPracticeCount((count) => count + 1);
      }
      recordAiFeatureUsage("writing");
      recordPractice({ module: "writing", score: result.score, outcome: result.accuracy });
      setAiMessage(`${result.score}% — ${result.accuracy}\n\n${result.feedback}`);
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

  const speakCoachReply = (text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.rate = 0.92;
    speech.pitch = 1.05;
    speech.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice =
      voices.find(
        (voice) =>
          voice.lang.startsWith("en") &&
          /female|zira|samantha|aria|jenny|susan/i.test(voice.name)
      ) || voices.find((voice) => voice.lang.startsWith("en"));
    if (femaleVoice) speech.voice = femaleVoice;
    window.speechSynthesis.speak(speech);
  };

  const sendCoachMessage = async (message) => {
    if (!canStartAiFeature("coach")) return;
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
      recordAiFeatureUsage("coach");
      recordPractice({ module: "coach", outcome: "reply" });
    } catch (error) {
      console.error("Coach AI error:", error);
      setCoachReply(error.message || "I'm having trouble connecting right now. Please try again.");
    } finally {
      setCoachThinking(false);
    }
  };

  const startCoachListening = async () => {
    if (!canStartAiFeature("coach")) return;
    try {
      coachRecorderRef.current = await startAudioRecording();
      setCoachListening(true);
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
    if (!canStartAiFeature("reading")) return;
    try {
      readingRecorderRef.current = await startAudioRecording();
      setIsAIThinking(true);
      setIsReading(true);
      setAiMessage("Listening to your reading...");
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
      } else {
        playIncorrectSound();
      }
      recordAiFeatureUsage("reading");
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
    setScreen("home");
    setOnboardingComplete(false);
  };

  // 3. LAS CONDICIONES DE RENDERIZADO (IF) VAN AQUÍ ABAJO, NUNCA ANTES DE LOS HOOKS
  if (!onboardingComplete && screen !== "settings") {
    return <Onboarding language={language} onLanguageChange={setPreferredLanguage} onComplete={completeOnboarding} />;
  }

  if (screen === "settings") {
    return <LegalSettings onBack={() => {
      window.history.replaceState(null, "", window.location.pathname);
      setScreen("home");
    }} onRestartOnboarding={restartOnboarding} />;
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
    if (coachMode === "conversation") {
      return (
        <div className="practice-screen coach-screen">
          <header className="practice-header">
            <button className="back-button" onClick={() => setCoachMode("welcome")}>
              ← Coach
            </button>
            <div className="practice-brand">CITIZENSHIP <span>AI</span></div>
          </header>
          <main className="coach-conversation-content">
            <div className="practice-eyebrow">AI ENGLISH COACH</div>
            <div className="coach-conversation-card">
              <div className="coach-conversation-avatar">
                <img src={sarahImage} alt="Sarah" />
              </div>
              <div className="coach-conversation-status">
                <span></span> SARAH IS READY
              </div>
              <div className="coach-message">
                <div className="coach-message-label">SARAH</div>
                <div className="coach-message-text">
                  Hi! I'm Sarah. Let's practice English together. Tell me about yourself.
                </div>
              </div>
              <div className="coach-response-area">
                {coachReply && (
                  <div className="coach-ai-reply">
                    <div className="coach-ai-reply-label">SARAH</div>
                    <div className="coach-ai-reply-text">{coachReply}</div>
                  </div>
                )}
                <div className="coach-response-label">YOUR RESPONSE</div>
                <button
                  className={`coach-mic-button ${coachListening ? "listening" : ""}`}
                  onClick={coachListening ? stopCoachListening : startCoachListening}
                  disabled={coachThinking}
                  type="button"
                >
                  <div className="coach-mic-icon-wrapper">
                    <span className="mic-glyph">🎙</span>
                  </div>
                  <span className="coach-mic-text">
                    {coachListening ? "Tap again when you finish speaking" : "Tap the microphone to speak"}
                  </span>
                </button>
              </div>
            </div>
          </main>
        </div>
      );
    }
    return (
      <div className="practice-screen coach-screen">
        <header className="practice-header">
          <button className="back-button" onClick={() => setScreen("practice")}>
            ← Practice
          </button>
          <div className="practice-brand">CITIZENSHIP <span>AI</span></div>
        </header>
        <main className="coach-content">
          <div className="practice-eyebrow">AI ENGLISH COACH</div>
          <h1>Speak with confidence.</h1>
          <p className="practice-intro">Practice real English conversations with your AI coach.</p>
          <div className="coach-card">
            <div className="coach-avatar">
              <img src={sarahImage} alt="AI English Coach" />
            </div>
            <div className="coach-status">
              <span className="coach-status-dot"></span> AI COACH READY
            </div>
            <h2>Hi, I'm Sarah.</h2>
            <p>Let's practice English together.</p>
            <button
              className="coach-start-button"
              onClick={() => setCoachMode("conversation")}
            >
              Start Conversation
            </button>
          </div>
        </main>
      </div>
    );
  }
  // Control de pantallas de la aplicación
  // Control de pantallas de la aplicación
  if (screen === "civics") {
    const currentQuestion = civicsQuestions[civicsIndex].english;
    const currentQuestionSpanish = civicsQuestionsSpanish[civicsIndex];
    const currentAnswers = civicsAnswers[civicsIndex];

    return (
      <div className="practice-screen civics-screen">
        <header className="practice-header">
          <button className="back-button" onClick={() => setScreen("practice")}>
            ← Practice
          </button>
          <div className="practice-brand">CITIZENSHIP <span>AI</span></div>
        </header>
        <main className="civics-content">
          <div className="practice-eyebrow">CIVICS STUDY</div>
          <h1>Civics.</h1>
          <p className="practice-intro">Read and listen to the 2025 civics questions.</p>
          <div className="civics-card">
            <div className="civics-card-top">
              <div className="civics-question-number">
                QUESTION {String(civicsIndex + 1).padStart(2, "0")}<span> / 128</span>
              </div>
              <div className="civics-ai-status">
                <span className="civics-ai-dot"></span> ENGLISH AUDIO
              </div>
            </div>
            <div className="civics-question-section">
              <div className="civics-language-label">ENGLISH</div>
              <h2 className="civics-question-english">{currentQuestion}</h2>
            </div>
            <div className="civics-divider"></div>
            <div className="civics-question-section spanish">
              <div className="civics-language-label">ESPAÑOL</div>
              <p className="civics-question-spanish">{currentQuestionSpanish}</p>
            </div>
            <div className="civics-divider"></div>
            <div className="civics-answer-section">
              <div className="civics-language-label">ACCEPTABLE ANSWERS</div>
              <div className="civics-answers">
                {currentAnswers.map((answer, index) => (
                  <span key={index} className="civics-answer">{answer}</span>
                ))}
              </div>
            </div>
            <div className="civics-divider"></div>
            <div className="civics-navigation">
              <button
                className="civics-nav-button"
                onClick={() => {
                  setCivicsIndex((currentIndex) =>
                    currentIndex <= 0 ? civicsQuestions.length - 1 : currentIndex - 1
                  );
                }}
              >
                ← <span>Previous</span>
              </button>
              <div className="civics-progress">
                {String(civicsIndex + 1).padStart(2, "0")}<span> / 128</span>
              </div>
              <button
                className="civics-nav-button next"
                onClick={() => {
                  setCivicsIndex((currentIndex) => {
                    const nextIndex =
                      currentIndex >= civicsQuestions.length - 1 ? 0 : currentIndex + 1;
                    markCivicsViewed(nextIndex);
                    return nextIndex;
                  });
                }}
              >
                <span>Next</span> →
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (screen === "practice") {
    return (
      <div className="practice-screen">
        <header className="practice-header">
          <button className="back-button" onClick={() => setScreen("home")}>
            ← Home
          </button>
          <div className="practice-brand">CITIZENSHIP <span>AI</span></div>
        </header>
        <main className="practice-content">
          <div className="practice-eyebrow">AI-POWERED CITIZENSHIP TRAINING</div>
          <h1>Practice.</h1>
          <p className="practice-intro">Choose how you want to prepare for your citizenship interview.</p>
          <div className="practice-options">
            <button className="practice-option" onClick={() => setScreen("civics")}>
              <div className="practice-option-left">
                <div className="practice-option-icon">◉</div>
                <div className="practice-option-content">
                  <h2>Civics</h2>
                  <p>128 official questions</p>
                </div>
              </div>
              <span className="practice-arrow">→</span>
            </button>
            <button className="practice-option" onClick={() => setScreen("english")}>
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
          <button className="back-button" onClick={() => setScreen("practice")}>
            ← Practice
          </button>
          <div className="practice-brand">CITIZENSHIP <span>AI</span></div>
        </header>
        <main className="practice-content">
          <div className="practice-eyebrow">ENGLISH PREPARATION</div>
          <h1>English.</h1>
          <p className="practice-intro">Practice the English skills needed for your citizenship interview.</p>
          <div className="practice-options">
            <button className="practice-option" onClick={() => setScreen("reading")}>
              <div className="practice-option-left">
                <div className="practice-option-icon">A</div>
                <div className="practice-option-content">
                  <h2>Reading</h2>
                  <p>Practice reading sentences aloud.</p>
                </div>
              </div>
              <span className="practice-arrow">→</span>
            </button>
            <button className="practice-option" onClick={() => setScreen("writing")}>
              <div className="practice-option-left">
                <div className="practice-option-icon">✎</div>
                <div className="practice-option-content">
                  <h2>Writing</h2>
                  <p>Practice writing sentences correctly.</p>
                </div>
              </div>
              <span className="practice-arrow">→</span>
            </button>
            <button className="practice-option" onClick={() => setScreen("coach")}>
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
          <button className="back-button" onClick={() => setScreen("english")}>
            ← English
          </button>
          <div className="practice-brand">CITIZENSHIP <span>AI</span></div>
        </header>
        <main className="practice-content">
          <div className="practice-eyebrow">ENGLISH · READING</div>
          <h1>Reading.</h1>
          <p className="practice-intro">Read the sentence aloud and practice your English.</p>
          <div className="reading-card">
            <div className="reading-label">READ THIS SENTENCE</div>
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
              {isReading ? "⏹ Stop & Evaluate" : "🎙 Start Reading"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (screen === "coach") {
    if (coachMode === "conversation") {
      return (
        <div className="practice-screen coach-screen">
          <header className="practice-header">
            <button className="back-button" onClick={() => setCoachMode("welcome")}>
              ← Coach
            </button>
            <div className="practice-brand">CITIZENSHIP <span>AI</span></div>
          </header>
          <main className="coach-conversation-content">
            <div className="practice-eyebrow">AI ENGLISH COACH</div>
            <div className="coach-conversation-card">
              <div className="coach-conversation-avatar">
                <img src={sarahImage} alt="Sarah" />
              </div>
              <div className="coach-conversation-status">
                <span></span> SARAH IS READY
              </div>
              <div className="coach-message">
                <div className="coach-message-label">SARAH</div>
                <div className="coach-message-text">
                  Hi! I'm Sarah. Let's practice English together. Tell me about yourself.
                </div>
              </div>
              <div className="coach-response-area">
                {coachReply && (
                  <div className="coach-ai-reply">
                    <div className="coach-ai-reply-label">SARAH</div>
                    <div className="coach-ai-reply-text">{coachReply}</div>
                  </div>
                )}
                <div className="coach-response-label">YOUR RESPONSE</div>
                <button
                  className={`coach-mic-button ${coachListening ? "listening" : ""}`}
                  onClick={coachListening ? stopCoachListening : startCoachListening}
                  disabled={coachThinking}
                  type="button"
                >
                  <div className="coach-mic-icon-wrapper">
                    <span className="mic-glyph">🎙</span>
                  </div>
                  <span className="coach-mic-text">
                    {coachListening ? "Tap again when you finish speaking" : "Tap the microphone to speak"}
                  </span>
                </button>
              </div>
            </div>
          </main>
        </div>
      );
    }
    return (
      <div className="practice-screen coach-screen">
        <header className="practice-header">
          <button className="back-button" onClick={() => setScreen("practice")}>
            ← Practice
          </button>
          <div className="practice-brand">CITIZENSHIP <span>AI</span></div>
        </header>
        <main className="coach-content">
          <div className="practice-eyebrow">AI ENGLISH COACH</div>
          <h1>Speak with confidence.</h1>
          <p className="practice-intro">Practice real English conversations with your AI coach.</p>
          <div className="coach-card">
            <div className="coach-avatar">
              <img src={sarahImage} alt="AI English Coach" />
            </div>
            <div className="coach-status">
              <span className="coach-status-dot"></span> AI COACH READY
            </div>
            <h2>Hi, I'm Sarah.</h2>
            <p>Let's practice English together.</p>
            <button
              className="coach-start-button"
              onClick={() => setCoachMode("conversation")}
            >
              Start Conversation
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
          <button className="writing-back-button" onClick={() => setScreen("english")}>
            ← <span>English</span>
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
                  window.speechSynthesis.cancel();
                  const utterance = new SpeechSynthesisUtterance(writingSentences[writingIndex].english);
                  utterance.lang = "en-US";
                  utterance.rate = 0.85;
                  window.speechSynthesis.speak(utterance);
                }}
                type="button"
              >
                <span className="speaker-icon">🔊</span>
                <span>Click to Replay Audio</span>
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
            <span>✓</span>
            {isAIThinking ? "Evaluating..." : "Check Writing"}
          </button>
          {aiMessage && (
            <div className="writing-ai-evaluation" role="status" aria-live="polite">
              <div className="writing-evaluation-label">AI EVALUATION</div>
              <div className="writing-evaluation-text">{aiMessage}</div>
            </div>
          )}
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
          <button className="uscis-tracker-back" onClick={() => setScreen("home")}>
            {trackerCopy.back}
          </button>
        </main>
      </div>
    );
  }

  if (screen === "free-limit") {
    const feature = usageLimitFeature || "coach";
    const limit = FREE_AI_LIMITS[feature];
    const continueFreePractice = () => {
      // Payments are not enabled yet. Keep the Pro message visible without
      // turning it into a dead end for a learner who needs to keep practicing.
      setUsageLimitFeature(null);
      setScreen(feature === "interview" ? "interview" : feature === "coach" ? "coach" : feature === "writing" ? "writing" : "reading");
    };
    return (
      <div className="app access-limit-screen">
        <main className="access-limit-card">
          <div className="access-limit-orb">✦</div>
          <p className="settings-eyebrow">FREE PRACTICE CREDIT</p>
          <h1>You&apos;ve used this week&apos;s {AI_FEATURE_NAMES[feature].toLowerCase()} credits.</h1>
          <p>Your Free plan includes {limit} {AI_FEATURE_NAMES[feature].toLowerCase()} {limit === 1 ? "session" : "sessions"} each week. Civics study remains available anytime.</p>
          <div className="access-limit-note"><span>PRO ACCESS · COMING SOON</span><p>Pro access is being prepared for learners who want more AI practice. Until subscriptions are available, you can continue practicing at no cost. It is not a legal service or an immigration benefit.</p></div>
          <button type="button" className="access-limit-primary" onClick={continueFreePractice}>Continue practicing for free <span>→</span></button>
          <button className="access-limit-secondary" onClick={() => setScreen("civics")}>Continue with Civics</button>
          <button className="access-limit-back" onClick={() => setScreen("home")}>← Back to Home</button>
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
              <p>{practiceSummary.readiness === null ? "Complete a reading, writing, or interview practice to build your baseline." : "Based only on your measured Citizenship AI practice."}</p>
            </div>
            <div className="progress-ai-bar">
              <div className="progress-ai-fill" style={{ width: `${practiceSummary.readiness || 0}%` }}></div>
            </div>
          </section>
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
          <button className="progress-ai-back" onClick={() => setScreen("home")}>
            ← Back to Home
          </button>
        </main>
      </div>
    );
  }

  if (screen === "interview") {
    return (
      <RealInterview
        mode={interviewMode}
        onExit={() => setScreen("home")}
        onComplete={({ score, outcome }) => recordPractice({ module: "interview", score, outcome })}
        onReview={(questionIds) => {
          const firstMissedIndex = civicsQuestions.findIndex((question) => question.id === questionIds[0]);
          if (firstMissedIndex >= 0) setCivicsIndex(firstMissedIndex);
          setScreen("civics");
        }}
      />
    );
  }

  return (
    <Home
      onStartInterview={() => startInterview("full")}
      onStartCivicsInterview={() => startInterview("civics")}
      onOpenPractice={() => setScreen("practice")}
      onOpenFeature={(feature) => setScreen(feature)}
      onOpenProgress={() => setScreen("progress")}
      onOpenSettings={() => {
        window.location.hash = "privacy";
        setScreen("settings");
      }}
      language={language}
      onLanguageChange={setPreferredLanguage}
    />
  );
}
export default App;
