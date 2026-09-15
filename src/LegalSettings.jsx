import { useState } from "react";

const COPY = {
  en: {
    welcome: "Welcome to Citizenship AI",
    choose: "Choose your preferred language",
    english: "English",
    spanish: "Español",
    continue: "Continue",
    howItWorks: "Practice with purpose.",
    howCopy: "Study civics, practice English reading and writing, and rehearse a simulated interview. AI feedback is educational practice support—not an immigration decision.",
    legal: "Before you begin",
    understand: "I Understand & Continue",
    started: "GET STARTED",
    important: "IMPORTANT INFORMATION",
    features: ["Civics study and explanations", "English reading and writing practice", "AI-supported practice feedback"],
    legalNotice: [
      "Citizenship AI is an independent educational practice tool. It is not affiliated with, endorsed by, or operated by USCIS or any U.S. government agency.",
      "It does not provide legal advice. AI-generated feedback may contain errors. Practice questions and simulated interviews do not guarantee what an immigration officer will ask or the outcome of a naturalization application or interview.",
      "Verify current immigration requirements through official USCIS sources.",
    ],
  },
  es: {
    welcome: "Bienvenido a Citizenship AI",
    choose: "Elige tu idioma preferido",
    english: "English",
    spanish: "Español",
    continue: "Continuar",
    howItWorks: "Practica con propósito.",
    howCopy: "Estudia civismo, practica lectura y escritura en inglés y ensaya una entrevista simulada. Los comentarios de IA son apoyo educativo, no una decisión migratoria.",
    legal: "Antes de comenzar",
    understand: "Entiendo y continúo",
    started: "COMENZAR",
    important: "INFORMACIÓN IMPORTANTE",
    features: ["Estudio y explicaciones de civismo", "Práctica de lectura y escritura en inglés", "Comentarios de práctica asistidos por IA"],
    legalNotice: [
      "Citizenship AI es una herramienta educativa independiente para practicar. No está afiliada, respaldada ni operada por USCIS ni por ninguna agencia del gobierno de Estados Unidos.",
      "No brinda asesoría legal. Los comentarios generados por IA pueden contener errores. Las preguntas de práctica y las entrevistas simuladas no garantizan lo que preguntará un oficial de inmigración ni el resultado de una solicitud o entrevista de naturalización.",
      "Verifica los requisitos migratorios vigentes mediante fuentes oficiales de USCIS.",
    ],
  },
};

const legalSections = [
  {
    id: "privacy",
    title: "Privacy Policy",
    content: (
      <>
        <p><strong>Last reviewed: September 15, 2026.</strong> This policy describes the behavior of the current Citizenship AI application build.</p>
        <p>Citizenship AI does not create user accounts and this codebase does not include a database. The app stores only your onboarding completion, language preference, microphone-disclosure choice, viewed civics-question progress, and on-device practice results (practice type, score, outcome, and time) in your browser&apos;s local storage. It does not store your raw answers or audio recordings for this progress feature. You can clear that data from Data &amp; Account Controls below.</p>
        <p>When you request AI feedback, your practice answer, writing, or active conversation is sent through Citizenship AI&apos;s server to OpenAI to generate that response. When you use voice practice, your recording is sent through Citizenship AI&apos;s server to OpenAI only for the active transcription request. The application is designed not to retain recordings, transcripts, practice answers, or AI conversations after the request completes; third-party provider retention and security practices are governed by their own terms.</p>
        <p>If you use Case Tracker, your receipt number is sent to Citizenship AI&apos;s server and then to USCIS only to make that active status request. The application is designed not to save receipt numbers. The site is hosted using Cloudflare Pages and Render; those providers may process standard technical request logs required to operate and secure their services. To protect the service from abuse, the server may temporarily use an IP address to limit excessive requests. This codebase does not implement application analytics or advertising tracking.</p>
      </>
    ),
  },
  {
    id: "terms",
    title: "Terms of Use",
    content: (
      <>
        <p>Citizenship AI is an independent educational practice tool for people preparing for the U.S. naturalization process. Use it only for lawful, personal study. Do not submit sensitive documents, passwords, Social Security numbers, A-Numbers, or other unnecessary personal information.</p>
        <p>Availability, speech recognition, AI feedback, and the USCIS Sandbox connection may be interrupted or inaccurate. You are responsible for verifying current requirements and for deciding whether to seek advice from a qualified immigration professional.</p>
      </>
    ),
  },
  {
    id: "ai",
    title: "AI Disclaimer",
    content: (
      <>
        <p>AI-generated feedback can be incomplete, incorrect, or outdated. It is provided to help you practice English and civics concepts, not to assess legal eligibility, predict an interview outcome, or replace professional advice.</p>
        <p>Simulated interviews and practice questions do not guarantee the questions an immigration officer will ask or the result of any naturalization application or interview.</p>
      </>
    ),
  },
  {
    id: "government",
    title: "Government Affiliation Disclaimer",
    content: (
      <>
        <p>Citizenship AI is not affiliated with, endorsed by, sponsored by, operated by, or a representative of USCIS, the U.S. Department of Homeland Security, or any U.S. government agency.</p>
        <p>Always verify current immigration information directly with <a href="https://www.uscis.gov/citizenship" target="_blank" rel="noreferrer">official USCIS sources</a>.</p>
      </>
    ),
  },
];

function LegalNotice({ copy }) {
  return (
    <div className="onboarding-legal-copy">
      {copy.legalNotice.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    </div>
  );
}

export function Onboarding({ language, onLanguageChange, onComplete }) {
  const [step, setStep] = useState(0);
  const copy = COPY[language];

  return (
    <div className="app onboarding-screen">
      <main className="onboarding-card" aria-labelledby="onboarding-title">
        <div className="onboarding-brand">CITIZENSHIP <span>AI</span></div>
        <div className="onboarding-progress" aria-label={`Step ${step + 1} of 3`}>
          {[0, 1, 2].map((item) => <span className={item <= step ? "active" : ""} key={item} />)}
        </div>
        {step === 0 && (
          <section>
            <p className="settings-eyebrow">{copy.started}</p>
            <h1 id="onboarding-title">{copy.welcome}</h1>
            <p className="onboarding-intro">{copy.choose}</p>
            <div className="language-choice-grid">
              <button className={language === "en" ? "selected" : ""} onClick={() => onLanguageChange("en")} aria-pressed={language === "en"}><strong>EN</strong>{copy.english}</button>
              <button className={language === "es" ? "selected" : ""} onClick={() => onLanguageChange("es")} aria-pressed={language === "es"}><strong>ES</strong>{copy.spanish}</button>
            </div>
            <button className="onboarding-primary" onClick={() => setStep(1)}>{copy.continue} <span>→</span></button>
          </section>
        )}
        {step === 1 && (
          <section>
            <p className="settings-eyebrow">CITIZENSHIP AI</p>
            <h1 id="onboarding-title">{copy.howItWorks}</h1>
            <p className="onboarding-intro">{copy.howCopy}</p>
            <ul className="onboarding-feature-list">
              <li><span>◎</span> {copy.features[0]}</li>
              <li><span>✎</span> {copy.features[1]}</li>
              <li><span>✦</span> {copy.features[2]}</li>
            </ul>
            <button className="onboarding-primary" onClick={() => setStep(2)}>{copy.continue} <span>→</span></button>
          </section>
        )}
        {step === 2 && (
          <section>
            <p className="settings-eyebrow">{copy.important}</p>
            <h1 id="onboarding-title">{copy.legal}</h1>
            <LegalNotice copy={copy} />
            <button className="onboarding-primary" onClick={onComplete}>{copy.understand} <span>→</span></button>
          </section>
        )}
      </main>
    </div>
  );
}

export function LegalSettings({ onBack, onRestartOnboarding }) {
  const [openSection, setOpenSection] = useState("privacy");
  const [cleared, setCleared] = useState(false);

  const clearLocalData = () => {
    if (!window.confirm("Clear this device's Citizenship AI preferences and civics progress? This cannot be undone.")) return;
    ["civicsViewed", "citizenshipai.onboarding.v1", "citizenshipai.language", "citizenshipai.microphone-notice.v1", "citizenshipai.practice-events.v1"].forEach((key) => localStorage.removeItem(key));
    setCleared(true);
  };

  return (
    <div className="app settings-screen">
      <header className="settings-header">
        <button className="back-button" onClick={onBack}>← Back to Home</button>
        <div className="practice-brand">CITIZENSHIP <span>AI</span></div>
      </header>
      <main className="settings-content">
        <p className="settings-eyebrow">SETTINGS</p>
        <h1>Legal &amp; Privacy</h1>
        <p className="settings-intro">Permanent access to the information that governs how this practice tool works.</p>
        <p className="settings-public-link">Public policy link: <a href="#privacy">citizenshipai.us/#privacy</a></p>
        <section className="settings-notice" aria-label="Important disclaimer"><span>i</span><p>Independent educational practice only. Not legal advice and not a USCIS or U.S. government service.</p></section>
        <section className="legal-accordion" aria-label="Legal and privacy documents">
          {legalSections.map((section) => {
            const isOpen = openSection === section.id;
            return (
              <article key={section.id} className="legal-item">
                <button onClick={() => setOpenSection(isOpen ? "" : section.id)} aria-expanded={isOpen} aria-controls={`legal-${section.id}`}>
                  <span>{section.title}</span><span aria-hidden="true">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && <div id={`legal-${section.id}`} className="legal-item-body">{section.content}</div>}
              </article>
            );
          })}
          <article className="legal-item open">
            <div className="legal-static-title">Data &amp; Account Controls</div>
            <div className="legal-item-body">
              <p>This version has no user accounts and no server-side account data to download or delete. You can remove local preferences, civics progress, and on-device practice results from this device.</p>
              <button className="legal-action-button" onClick={clearLocalData}>Clear local app data</button>
              {cleared && <p className="legal-success" role="status">Local data was cleared. Onboarding will appear on your next launch.</p>}
            </div>
          </article>
          <article className="legal-item open">
            <div className="legal-static-title">Contact / Support</div>
            <div className="legal-item-body"><p>For support, privacy, accessibility, or data questions, contact <a href="mailto:info@citizenshipai.us">info@citizenshipai.us</a>.</p></div>
          </article>
        </section>
        <button className="settings-secondary-button" onClick={onRestartOnboarding}>Review first-launch information again</button>
      </main>
    </div>
  );
}
