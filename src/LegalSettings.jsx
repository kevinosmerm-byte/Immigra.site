import { useEffect, useState } from "react";
import { getCompanionVisibility, setCompanionVisibility } from "./companionEvents.js";
import { THEME_PREFERENCES, THEME_STORAGE_KEY } from "./theme.js";

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
      "It does not provide legal advice, determine immigration eligibility, recommend a legal strategy, prepare or file applications, or represent users before USCIS. AI-generated feedback may contain errors, and simulated practice does not guarantee interview questions or outcomes.",
      "Always verify current requirements directly through official USCIS sources. For advice about your circumstances, forms, eligibility, deadlines, or immigration options, consult a licensed immigration attorney or a Department of Justice-accredited representative.",
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
      "No brinda asesoría legal, no determina elegibilidad migratoria, no recomienda estrategias legales, no prepara ni presenta solicitudes y no representa a usuarios ante USCIS. La IA puede cometer errores y la práctica simulada no garantiza preguntas ni resultados.",
      "Verifica siempre los requisitos vigentes directamente en fuentes oficiales de USCIS. Para recibir orientación sobre tu situación, formularios, elegibilidad, plazos u opciones migratorias, consulta a un abogado de inmigración autorizado o a un representante acreditado por el Departamento de Justicia.",
    ],
  },
};

const legalSections = [
  {
    id: "privacy",
    title: "Privacy Policy",
    content: (
      <>
        <p><strong>Last reviewed: September 20, 2026.</strong> This policy describes the behavior of the current Citizenship AI application build.</p>
        <p>Citizenship AI offers optional email-based accounts through Supabase. When you create an account, Supabase stores your account identifier and email address, and Citizenship AI stores account-level access, AI allowance, reward-credit, subscription-status, and technical usage records needed to operate and protect the service. No payment provider is active in this build, and launch-promotion access may allow you to continue without payment. On this device, the app may also store onboarding completion, language preference, consent choices, viewed civics-question progress, practice results (practice type, score, outcome, and time), and local AI-usage history in your browser&apos;s local storage.</p>
        <p>When you request AI feedback, your practice answer, writing, or active conversation is sent through Citizenship AI&apos;s server to OpenAI to generate that response. When you use voice practice, your recording is sent through Citizenship AI&apos;s server to OpenAI only for the active transcription request. The application is designed not to retain recordings, transcripts, practice answers, or AI conversations after the request completes; third-party provider retention and security practices are governed by their own terms.</p>
        <p>If you choose Live Avatar Beta, Citizenship AI requests a temporary, domain-restricted D-ID session credential from its server. D-ID receives and processes the live session content and any microphone or camera input you choose to provide through its panel. The application does not store the client key; it is used in memory only for the active short-lived session. D-ID's own retention and security practices are governed by its terms.</p>
        <p>Citizenship AI records limited, account-linked product and cost telemetry for service operation, security, allowance enforcement, and financial planning. These records may include an AI feature name, session start/completion/failure, provider and model identifiers, request counts, token totals or transcription duration when a provider returns them, and paywall, subscription, or verified-reward lifecycle events. This telemetry is stored in Supabase and is intentionally designed not to contain complete conversations, recordings, transcripts, practice answers, receipt numbers, or case details. Citizenship AI does not use advertising-tracking analytics in this build.</p>
        <p>If you use Case Tracker, your receipt number is sent to Citizenship AI&apos;s server and then to USCIS only to make that active status request. This build is configured for the USCIS Sandbox, not live Production case data. The application does not save receipt numbers or case details. For security diagnostics, the server may create a short operational log containing the time, Sandbox environment, a masked receipt number, request outcome, and any USCIS trace ID; it does not intentionally log the full receipt number or case response. The site is hosted using Cloudflare Pages and Render; those providers may process standard technical request logs required to operate and secure their services. To protect the service from abuse, the server may temporarily use an IP address to limit excessive requests.</p>
      </>
    ),
  },
  {
    id: "terms",
    title: "Terms of Use",
    content: (
      <>
        <p>Citizenship AI is an independent educational practice tool for people preparing for the U.S. naturalization process. It does not provide legal advice, determine immigration eligibility, recommend a legal strategy, prepare or file applications, or represent users before USCIS or any government agency. Use it only for lawful, personal study. Do not submit sensitive documents, passwords, Social Security numbers, A-Numbers, or other unnecessary personal information.</p>
        <p>Availability, speech recognition, translations, AI feedback, external links, and the USCIS Sandbox connection may be interrupted, incomplete, inaccurate, or outdated. You are responsible for verifying current requirements directly with USCIS before relying on information for an immigration decision.</p>
        <p>Immigration Help is an educational directory of external resources. Listing or linking to a resource does not constitute an endorsement, referral, legal representation, or guarantee of its services. The podcasts are prerecorded educational audio, not live broadcasts or official USCIS programming.</p>
        <p>If you need advice about your circumstances, forms, eligibility, deadlines, evidence, or immigration options, consult a licensed immigration attorney or a representative accredited by the U.S. Department of Justice.</p>
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
        <p>Do not use an AI response as the basis for filing a form, missing a deadline, selecting an immigration benefit, or making another legal decision. Verify the information with USCIS and seek authorized professional help when appropriate.</p>
      </>
    ),
  },
  {
    id: "government",
    title: "Government Affiliation Disclaimer",
    content: (
      <>
        <p>Citizenship AI is not affiliated with, endorsed by, sponsored by, operated by, or a representative of USCIS, the U.S. Department of Homeland Security, or any U.S. government agency.</p>
        <p>Names, links, questions, and information derived from publicly available government sources are used for educational reference. Their availability does not imply government endorsement of Citizenship AI. Not every item found on a government website is necessarily free of third-party rights, and Citizenship AI does not claim that all application content is in the public domain.</p>
        <p>Always verify current immigration information directly with <a href="https://www.uscis.gov/citizenship" target="_blank" rel="noreferrer">official USCIS sources</a>.</p>
      </>
    ),
  },
  {
    id: "sources",
    title: "Information Sources & Professional Help",
    content: (
      <>
        <p>Educational information is drawn from publicly available sources, with priority given to official U.S. government materials. Citizenship AI may summarize, translate, reorganize, or explain that information for study purposes. Summaries and translations may contain errors or become outdated, and the official English-language source controls when requirements or instructions differ.</p>
        <p>For current forms, fees, filing instructions, eligibility rules, deadlines, and case-specific requirements, use <a href="https://www.uscis.gov" target="_blank" rel="noreferrer">USCIS.gov</a>. For legal advice, use a licensed immigration attorney or a Department of Justice-accredited representative. Learn how to find authorized help through <a href="https://www.uscis.gov/avoid-scams/find-legal-services" target="_blank" rel="noreferrer">USCIS legal-services guidance</a>.</p>
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

export function LegalSettings({ onBack, onRestartOnboarding, language = "en", themePreference = "dark", onThemeChange }) {
  const [openSection, setOpenSection] = useState("privacy");
  const [cleared, setCleared] = useState(false);
  const [companionVisible, setCompanionVisible] = useState(getCompanionVisibility);

  useEffect(() => {
    const syncVisibility = (event) => setCompanionVisible(Boolean(event.detail?.visible));
    document.addEventListener("companion:visibility", syncVisibility);
    return () => document.removeEventListener("companion:visibility", syncVisibility);
  }, []);

  const clearLocalData = () => {
    if (!window.confirm("Clear this device's Citizenship AI preferences and civics progress? This cannot be undone.")) return;
    ["civicsViewed", "citizenshipai.onboarding.v1", "citizenshipai.language", THEME_STORAGE_KEY, "citizenshipai.microphone-notice.v1", "citizenshipai.did-avatar-consent.v1", "citizenshipai.practice-events.v1", "citizenshipai.ai-usage.v1", "citizenshipai.ai-sessions.promo.v1", "citizenshipai-companion-visible-v1", "citizenshipai-companion-streak-v1"].forEach((key) => localStorage.removeItem(key));
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
        <section className="appearance-settings" aria-labelledby="appearance-title">
          <div>
            <small>{language === "es" ? "APARIENCIA" : "APPEARANCE"}</small>
            <h2 id="appearance-title">{language === "es" ? "Tema de la aplicación" : "App theme"}</h2>
            <p>{language === "es" ? "Elige una apariencia o usa la configuración de tu dispositivo." : "Choose an appearance or follow your device setting."}</p>
          </div>
          <div className="theme-choice" role="group" aria-label={language === "es" ? "Tema de la aplicación" : "App theme"}>
            {THEME_PREFERENCES.map((value) => {
              const labels = language === "es"
                ? { system: "Sistema", light: "Claro", dark: "Oscuro" }
                : { system: "System", light: "Light", dark: "Dark" };
              const icons = { system: "◐", light: "☀", dark: "☾" };
              return (
                <button
                  key={value}
                  type="button"
                  className={themePreference === value ? "selected" : ""}
                  aria-pressed={themePreference === value}
                  onClick={() => onThemeChange?.(value)}
                >
                  <span aria-hidden="true">{icons[value]}</span>
                  {labels[value]}
                </button>
              );
            })}
          </div>
        </section>
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
            <div className="legal-static-title">Study Companion</div>
            <div className="legal-item-body">
              <p>The companion reacts locally to practice events. It does not receive your answers, recordings, or personal information.</p>
              <button
                className="legal-action-button"
                type="button"
                aria-pressed={companionVisible}
                onClick={() => setCompanionVisible(setCompanionVisibility(!companionVisible))}
              >
                {companionVisible ? "Hide study companion" : "Show study companion"}
              </button>
            </div>
          </article>
          <article className="legal-item open">
            <div className="legal-static-title">Data &amp; Account Controls</div>
            <div className="legal-item-body">
              <p>You can remove local preferences, consent choices, civics progress, on-device practice results, and local AI-usage history from this device below. If you use an optional account, open the Account panel to download your account and technical usage records or permanently delete the cloud account, its AI allowances, and its usage records. Deleting cloud account data does not automatically clear local data from this device.</p>
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
