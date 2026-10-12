import { useEffect, useState } from "react";
import { getCompanionVisibility, setCompanionVisibility } from "./companionEvents.js";
import { THEME_PREFERENCES, THEME_STORAGE_KEY, APPEARANCE_STORAGE_KEY } from "./theme.js";
import { DEFAULT_TEST_VERSION, TEST_VERSIONS } from "./civicsVersions.js";
import { normalizeZipCode } from "./civicProfile.js";
import { CurrentPracticeDisclosure, LegalDocumentsIntroduction } from "./LegalPracticeDisclosure.jsx";
import { EDUCATION_NOTICE } from "./educationNotice.js";

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
      "We are not lawyers or a law firm. Using this app does not create an attorney-client relationship. It does not provide legal advice, determine immigration eligibility, recommend a legal strategy, prepare or file applications, or represent users before USCIS. AI-generated feedback may contain errors, and simulated practice does not guarantee interview questions or outcomes.",
      "We always recommend case-specific guidance about forms, eligibility, deadlines and options from a licensed immigration attorney or a DOJ-accredited representative acting within their authorized scope. Verify current requirements directly through official USCIS sources.",
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
      "No somos abogados ni un bufete. Usar esta app no crea una relación abogado-cliente. No brinda asesoría legal, no determina elegibilidad migratoria, no recomienda estrategias legales, no prepara ni presenta solicitudes y no representa a usuarios ante USCIS. La IA puede cometer errores y la práctica simulada no garantiza preguntas ni resultados.",
      "Siempre recomendamos consultar sobre tu caso, formularios, elegibilidad, plazos y opciones a un abogado de inmigración autorizado o un representante acreditado por el Departamento de Justicia dentro del alcance de su autorización. Verifica los requisitos vigentes en fuentes oficiales de USCIS.",
    ],
  },
};

const legalSections = [
  { id: "education", title: "Educational use and current features", content: <CurrentPracticeDisclosure /> },
  {
    id: "privacy",
    title: "Privacy Policy",
    content: (
      <>
        <p>{EDUCATION_NOTICE.en.short}</p>
        <p><strong>Last reviewed: October 12, 2026.</strong> This policy describes the behavior of the current Citizenship AI application build.</p>
        <p>Citizenship AI offers optional email-based accounts through Supabase. When you create an account, Supabase stores your account identifier and email address, and Citizenship AI stores account-level access, AI allowance, reward-credit, subscription-status, and technical usage records needed to operate and protect the service. Launch-promotion access may allow you to continue without payment. When web subscriptions are made available, Stripe processes checkout, payment details, and subscription management under its own privacy practices; Citizenship AI receives customer, subscription, status, and billing-period identifiers needed to provide access, but does not receive or store complete card numbers. On this device, the app may also store the last PRO recommendation date to avoid repeated notices, onboarding completion, language preference, consent choices, viewed civics-question progress, practice results (practice type, score, outcome, and time), and local AI-usage history in your browser&apos;s local storage.</p>
        <p>Learning checkpoints and your civic profile are saved on this device, separately for each signed-in account. Saved question identifiers can synchronize to your account when cloud storage is available; failed updates remain queued locally. Your optional personal profile remembers only information you enter or explicitly confirm, including your address, application dates, receipt number, relevant N-400 answers and histories, confirmed notice fields, journey events and document-checklist completion. These details are stored in this browser by default and can be reused in practice, civics and journey preparation. Browser storage is not an encrypted vault; use a private device and clear your profile when appropriate. A-numbers, original notices, recordings and documents are not stored in the profile.</p>
        <p>Cloud profile storage is a separate optional action. The Profile screen asks you to agree before sending a snapshot to your signed-in account. The server encrypts personal, immigration, N-400 and journey data before saving it in Supabase; cloud saving is unavailable if secure server configuration is missing. Saving and restoring are manual. You may restore a saved copy, remove the cloud profile while keeping the device profile, export account data, or delete the cloud account. Civic and learning profiles retain their existing device storage and are not included in this cloud snapshot.</p>
        <p>My Civics Profile sends the address you enter or already saved in your personal profile through our server to the U.S. Census Geocoder for the current lookup. A plain street address is not used as a server cache key. The civic profile keeps your ZIP, state, verified districts, public officials, sources and verification dates. Congress.gov supplies federal member data; configured geographic providers may supply state officials. Your saved address is reused so you do not need to provide it again.</p>
        <p>Civics questions and accepted English answers in the study bank come from the supplied USCIS 2025 list of 128 questions. Card, quiz and classic civics grading use deterministic rules rather than AI-generated answers. Optional writing or conversation feedback may send your submitted text through Citizenship AI&apos;s server to OpenAI. When you use voice practice, your recording is sent through Citizenship AI&apos;s server to OpenAI only for the active transcription request. The application server is designed not to retain recordings, transcripts or AI conversations after the request completes. Interview answers remain only in the active page and are not saved to your personal profile. Reviewed or skipped question and concept identifiers are stored on this device, separately by account and practice topic, to avoid repetition. New practice sessions randomize pending questions; after the available bank is exhausted, learners may review it again. Information you enter separately in Profile follows the profile-storage rules above. Scores and checkpoints may be retained as described above; third-party provider retention and security practices are governed by their own terms.</p>
        <p>Continuous voice opens the microphone only when you enable it. It buffers audio temporarily on the device and sends detected answers to OpenAI for transcription in your chosen language. The microphone remains active between turns until you pause, leave or hide the page, or reach a session limit. Pausing stops the microphone; requests already sent may still be processed under the provider's policies. You can use manual recording or typing instead. Audio and session conversations are not saved in browser storage. The preparation guide stores only your study goal and fixed checklist identifiers, separately by account, not legal questions, evidence or case narratives. These preferences may be included only in a profile snapshot you explicitly save to the cloud.</p>
        <p>The current interview screens use application-controlled practice with Sarah or Kevin and do not open external D-ID avatar sessions. Spoken playback uses voices available on your browser or device; transcription and AI feedback are separate provider requests and may be unavailable.</p>
        <p>Citizenship AI records limited, account-linked product and cost telemetry for service operation, security, allowance enforcement, and financial planning. These records may include an AI feature name, session start/completion/failure, provider and model identifiers, request counts, token totals or transcription duration when a provider returns them, and paywall, subscription, or verified-reward lifecycle events. This telemetry is stored in Supabase and is intentionally designed not to contain complete conversations, recordings, transcripts, practice answers, receipt numbers, or case details. Citizenship AI does not use advertising-tracking analytics in this build.</p>
        <p>Your journey stores only stages, events and notice fields you confirm. Notice text is processed in the browser, and extracted fields are reviewed before saving; the original document is not retained. An optional configured USCIS API sends your receipt number through our server to USCIS only for an active status request. Sandbox responses are labeled test data and are not saved as real case events. The official USCIS link works independently of this integration. Receipt numbers, addresses, private N-400 answers and notice content are excluded from product analytics and ordinary application logs. Hosting providers may process standard technical request logs, and the server temporarily uses request identifiers for rate limits.</p>
      </>
    ),
  },
  {
    id: "terms",
    title: "Terms of Use",
    content: (
      <>
        <p>Citizenship AI is an independent educational study and communication tool for citizenship, asylum and adjustment-of-status practice. We are not lawyers or a law firm, and using this app does not create an attorney-client relationship. It does not provide legal advice, determine immigration eligibility, recommend a legal strategy, prepare or file applications, or represent users before USCIS or any government agency. Use it only for lawful, personal study. Do not submit sensitive documents, passwords, Social Security numbers, A-Numbers, or other unnecessary personal information.</p>
        <p>Availability, speech recognition, translations, AI feedback, external links, and the USCIS Sandbox connection may be interrupted, incomplete, inaccurate, or outdated. Verify current instructions with the agency responsible for your notice and always seek guidance from a licensed immigration attorney or a DOJ-accredited representative acting within their authorized scope for decisions about your case.</p>
        <p>Immigration Help is an educational directory of external resources. Listing or linking to a resource does not constitute an endorsement, referral, legal representation, or guarantee of its services. The podcasts are prerecorded educational audio, not live broadcasts or official USCIS programming.</p>
        <p>If paid web subscriptions become available, the price and billing period are shown before purchase and payment is processed by Stripe. An offered trial shows its duration and first billing date before you subscribe; subscriptions renew automatically at the displayed price and interval unless canceled. You can manage or cancel a web subscription through the account billing portal. Cancellation stops future renewals and does not ordinarily refund time already purchased except where required by law. Purchases made through Apple or Google, if offered, are billed and managed under that store&apos;s terms and tools.</p>
        <p>We always recommend seeking help about your case from a licensed immigration attorney or a representative accredited by the U.S. Department of Justice acting within their authorized scope. The app cannot advise about your circumstances, forms, eligibility, deadlines, evidence or immigration options.</p>
      </>
    ),
  },
  {
    id: "ai",
    title: "AI Disclaimer",
    content: (
      <>
        <p>AI-generated feedback can be incomplete, incorrect, or outdated. It is provided to help you practice communication, English and civics concepts, not to assess legal eligibility, predict an interview outcome, or replace professional advice. We are not lawyers and AI feedback is not legal advice. We always recommend a licensed immigration attorney or a DOJ-accredited representative acting within their authorized scope for case-specific guidance.</p>
        <p>Simulated interviews and practice questions do not guarantee the questions an immigration officer will ask or the result of a citizenship, asylum or adjustment-of-status application or interview.</p>
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
        <p>For current forms, fees, filing instructions, eligibility rules, deadlines, and case-specific requirements, use <a href="https://www.uscis.gov" target="_blank" rel="noreferrer">USCIS.gov</a>. We are not lawyers and do not provide legal advice. We always recommend a licensed immigration attorney or a Department of Justice-accredited representative acting within their authorized scope for case-specific help. For immigration court information, review your notices and the <a href="https://www.justice.gov/eoir" target="_blank" rel="noopener noreferrer">official EOIR resources</a>. Learn how to find authorized help through <a href="https://www.uscis.gov/avoid-scams/find-legal-services" target="_blank" rel="noreferrer">USCIS legal-services guidance</a>.</p>
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

function SpanishPrivacyPolicy() {
  return <>
    <p>{EDUCATION_NOTICE.es.short}</p>
    <p><strong>Última revisión: 12 de octubre de 2026.</strong> Esta política describe la versión actual de Citizenship AI.</p>
    <p>Las cuentas por correo son opcionales y usan Supabase, que guarda tu identificador de cuenta y correo. La aplicación guarda datos necesarios de acceso, límites de IA, créditos, suscripciones y uso técnico. Si están disponibles los pagos web, Stripe procesa los pagos y Citizenship AI recibe identificadores y estados de la suscripción, sin guardar números completos de tarjetas.</p>
    <p>Este navegador guarda preferencias, consentimiento, progreso cívico, resultados de práctica y puntos para continuar. Los perfiles cívicos y de estudio se separan por cuenta. Los identificadores de preguntas favoritas pueden sincronizarse y los cambios pendientes se conservan para reintentar.</p>
    <p>Tu perfil personal opcional conserva solo datos que ingresas o confirmas: dirección, fechas de la solicitud, número de recibo, respuestas e historiales relevantes del N-400, campos confirmados de avisos, eventos y lista de documentos. Se guardan en este navegador y se reutilizan para preparar tus prácticas y proceso. El almacenamiento del navegador no es una bóveda cifrada: usa un dispositivo privado y borra el perfil cuando corresponda. No guardamos números A, documentos originales, grabaciones ni avisos originales en el perfil.</p>
    <p>Guardar el perfil en la nube es una acción separada y opcional. La pantalla Perfil solicita tu consentimiento antes de enviar una copia a tu cuenta. El servidor cifra los datos personales, migratorios, del N-400 y del proceso antes de guardarlos en Supabase. Si no hay configuración segura, no se guardan en la nube. Guardar y restaurar son acciones manuales. Puedes restaurar una copia, eliminar el perfil de la nube conservando el local, exportar tus datos o eliminar la cuenta. El perfil cívico y el progreso conservan su almacenamiento actual en el dispositivo.</p>
    <p>El perfil cívico reutiliza tu dirección guardada o la que ingresas y la envía mediante nuestro servidor al Geocodificador del Censo para verificar tu ubicación. No usamos la dirección completa como clave de caché del servidor. El perfil cívico conserva código postal, estado, distritos verificados, funcionarios públicos, fuentes y fechas de verificación. Congress.gov proporciona datos federales; proveedores geográficos configurados pueden proporcionar funcionarios estatales.</p>
    <p>Las preguntas cívicas y respuestas aceptadas en inglés provienen de la lista USCIS 2025 de 128 preguntas. La evaluación cívica es determinista. Las prácticas opcionales de escritura o conversación pueden enviar el texto a OpenAI mediante nuestro servidor. Las grabaciones de voz se envían únicamente para la transcripción activa. El servidor no conserva grabaciones, transcripciones ni conversaciones después de la solicitud. Las respuestas de entrevistas quedan solo en la página activa y no se guardan en tu perfil. Se guardan identificadores de preguntas y conceptos repasados u omitidos, separados por cuenta y tema, para evitar repeticiones. Al volver se eligen preguntas pendientes en orden aleatorio; al terminar el banco disponible puedes repasarlo de nuevo. Los proveedores externos aplican sus propias políticas.</p>
    <p>La voz continua abre el micrófono solo cuando la activas. Conserva audio temporalmente en el dispositivo y envía las respuestas detectadas a OpenAI para transcribirlas en el idioma elegido. El micrófono permanece activo entre turnos hasta que pauses, salgas u ocultes la página, o alcances un límite de sesión. Pausar detiene el micrófono; una solicitud ya enviada puede seguir procesándose según la política del proveedor. Puedes grabar manualmente o escribir. El audio y las conversaciones de sesión no se guardan en el almacenamiento del navegador. La guía de preparación guarda solo tu objetivo de estudio e identificadores de tareas, separados por cuenta; no guarda preguntas legales, pruebas ni relatos del caso. Esas preferencias pueden incluirse únicamente en una copia del perfil que decidas guardar en la nube.</p>
    <p>Las pantallas actuales usan entrevistas controladas por la aplicación con Sarah o Kevin y no abren sesiones externas del avatar D-ID. La reproducción de voz utiliza las voces disponibles en tu navegador o dispositivo; la transcripción y los comentarios de IA son solicitudes separadas a un proveedor y pueden no estar disponibles.</p>
    <p>Los registros técnicos y de uso vinculados a tu cuenta pueden incluir función, inicio y fin de sesión, proveedor, modelo, cantidad de solicitudes, tokens, duración de transcripción y eventos de suscripción. No contienen conversaciones, grabaciones, transcripciones, respuestas privadas, recibos ni datos del caso. Esta versión no usa analítica de seguimiento publicitario.</p>
    <p>Tu proceso conserva solo etapas, eventos y campos de avisos que confirmas. El texto del aviso se procesa en el navegador y los campos extraídos se revisan antes de guardar; el documento original no se conserva. Una integración USCIS opcional y configurada envía el recibo únicamente para la consulta activa. Los resultados Sandbox son datos de prueba y no se guardan como eventos reales. Puedes usar el enlace oficial sin esta integración. Los recibos, direcciones, respuestas privadas y avisos quedan fuera de los registros ordinarios y analítica. Los proveedores de alojamiento pueden procesar registros técnicos estándar y el servidor usa identificadores temporales para limitar solicitudes.</p>
  </>;
}

function SpanishLegalContent({ id }) {
  if (id === "education") return <CurrentPracticeDisclosure language="es" />;
  if (id === "privacy") return <SpanishPrivacyPolicy />;
  if (id === "terms") return <>
    <p>Citizenship AI es una herramienta educativa independiente de estudio y comunicación para prácticas de ciudadanía, asilo y ajuste de estatus. No somos abogados ni un bufete, y usar esta app no crea una relación abogado-cliente. No brinda asesoría legal, no determina elegibilidad migratoria, no recomienda estrategias legales, no prepara ni presenta solicitudes y no representa a usuarios ante USCIS ni ninguna agencia gubernamental. Úsala únicamente para el estudio personal y lícito. No envíes documentos sensibles, contraseñas, números de Seguro Social, números A ni información personal innecesaria.</p>
    <p>La disponibilidad, el reconocimiento de voz, las traducciones, los comentarios de IA, los enlaces externos y la conexión USCIS Sandbox pueden interrumpirse o contener información incompleta, inexacta o desactualizada. Verifica las instrucciones vigentes con la agencia responsable de tu aviso y busca siempre orientación de un abogado de inmigración autorizado o un representante acreditado por el DOJ dentro del alcance de su autorización para decisiones sobre tu caso.</p>
    <p>Ayuda migratoria es un directorio educativo de recursos externos. Incluir un recurso o enlace no constituye respaldo, recomendación profesional, representación legal ni garantía de sus servicios. Los podcasts son audios educativos pregrabados, no transmisiones en vivo ni programas oficiales de USCIS.</p>
    <p>Si se ofrecen suscripciones web de pago, el precio y el período de facturación aparecen antes de comprar y Stripe procesa el pago. Si se ofrece una prueba, su duración y primera fecha de cobro aparecen antes de suscribirte; la suscripción se renueva automáticamente al precio e intervalo mostrados salvo que la canceles. Puedes administrar o cancelar la suscripción web desde el portal de facturación de tu cuenta. Cancelar detiene las renovaciones futuras y, por lo general, no reembolsa el tiempo ya comprado, salvo cuando lo exija la ley. Las compras mediante Apple o Google, si se ofrecen, se facturan y administran conforme a los términos y herramientas de esa tienda.</p>
    <p>Siempre recomendamos buscar ayuda para tu caso de un abogado de inmigración autorizado o un representante acreditado por el Departamento de Justicia de Estados Unidos dentro del alcance de su autorización. La app no puede asesorarte sobre tu situación, formularios, elegibilidad, plazos, evidencia u opciones migratorias.</p>
  </>;
  if (id === "ai") return <>
    <p>Los comentarios generados por IA pueden ser incompletos, incorrectos o desactualizados. Sirven para practicar cómo expresarte, inglés y conceptos de civismo, no para evaluar elegibilidad legal, predecir el resultado de una entrevista ni sustituir asesoría profesional. No somos abogados y los comentarios de IA no constituyen asesoría legal. Siempre recomendamos consultar a un abogado de inmigración autorizado o a un representante acreditado por el DOJ dentro del alcance de su autorización para la orientación específica de tu caso.</p>
    <p>Las entrevistas simuladas y preguntas de práctica no garantizan las preguntas que hará un funcionario de inmigración ni el resultado de una solicitud o entrevista de ciudadanía, asilo o ajuste de estatus.</p>
    <p>No uses una respuesta de IA como fundamento para presentar un formulario, dejar pasar un plazo, elegir un beneficio migratorio ni tomar otra decisión legal. Verifica la información con USCIS y busca ayuda profesional autorizada cuando corresponda.</p>
  </>;
  if (id === "government") return <>
    <p>Citizenship AI no está afiliada, respaldada, patrocinada ni operada por USCIS, el Departamento de Seguridad Nacional de Estados Unidos ni ninguna agencia del gobierno estadounidense, y no representa a esas entidades.</p>
    <p>Los nombres, enlaces, preguntas e información de fuentes gubernamentales públicas se utilizan como referencia educativa. Su disponibilidad no implica respaldo gubernamental de Citizenship AI. No todos los materiales de un sitio gubernamental están necesariamente libres de derechos de terceros, y Citizenship AI no afirma que todo el contenido de la aplicación sea de dominio público.</p>
    <p>Verifica siempre la información migratoria vigente directamente en las <a href="https://www.uscis.gov/citizenship" target="_blank" rel="noreferrer">fuentes oficiales de USCIS</a>.</p>
  </>;
  return <>
    <p>La información educativa proviene de fuentes públicas, dando prioridad a los materiales oficiales del gobierno de Estados Unidos. Citizenship AI puede resumir, traducir, reorganizar o explicar esa información para estudiar. Los resúmenes y traducciones pueden contener errores o desactualizarse; la fuente oficial en inglés prevalece si difieren los requisitos o instrucciones.</p>
    <p>Para formularios, tarifas, instrucciones de presentación, reglas de elegibilidad, plazos y requisitos específicos de tu caso, consulta <a href="https://www.uscis.gov" target="_blank" rel="noreferrer">USCIS.gov</a>. No somos abogados ni brindamos asesoría legal. Siempre recomendamos buscar ayuda de un abogado de inmigración autorizado o un representante acreditado por el Departamento de Justicia dentro del alcance de su autorización para tu caso. Para información de tribunales de inmigración, revisa tus avisos y los <a href="https://www.justice.gov/eoir" target="_blank" rel="noopener noreferrer">recursos oficiales de EOIR</a>. Aprende a encontrar ayuda autorizada en la <a href="https://www.uscis.gov/avoid-scams/find-legal-services" target="_blank" rel="noreferrer">guía de servicios legales de USCIS</a>.</p>
  </>;
}

export function Onboarding({ language, onLanguageChange, onComplete }) {
  const [step, setStep] = useState(0);
  const [zipCode, setZipCode] = useState("");
  const [initialPractice, setInitialPractice] = useState("home");
  const copy = COPY[language];

  return (
    <div className="app onboarding-screen">
      <main className="onboarding-card" aria-labelledby="onboarding-title">
        <div className="onboarding-brand">CITIZENSHIP <span>AI</span></div>
        <div className="onboarding-progress" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step + 1} aria-label={language === "es" ? `Paso ${step + 1} de 3` : `Step ${step + 1} of 3`}>
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
            <label>{language === "es" ? "Versión disponible" : "Available test version"}<select value={DEFAULT_TEST_VERSION} disabled><option value={DEFAULT_TEST_VERSION}>{TEST_VERSIONS[DEFAULT_TEST_VERSION].label}</option></select></label>
            <label>{language === "es" ? "ZIP Code (opcional)" : "ZIP Code (optional)"}<input inputMode="numeric" autoComplete="postal-code" maxLength={5} value={zipCode} onChange={event => setZipCode(event.target.value.replace(/\D/g, ""))} /></label>
            <label>{language === "es" ? "¿Por dónde quieres empezar?" : "Where would you like to start?"}<select value={initialPractice} onChange={event => setInitialPractice(event.target.value)}><option value="home">{language === "es" ? "Inicio" : "Home"}</option><option value="civics">{language === "es" ? "Civismo" : "Civics"}</option><option value="vocabulary">{language === "es" ? "Vocabulario" : "Vocabulary"}</option></select></label>
            <button className="onboarding-primary" onClick={() => setStep(2)}>{copy.continue} <span>→</span></button>
          </section>
        )}
        {step === 2 && (
          <section>
            <p className="settings-eyebrow">{copy.important}</p>
            <h1 id="onboarding-title">{copy.legal}</h1>
            <LegalNotice copy={copy} />
            <button className="onboarding-primary" onClick={() => onComplete({ zipCode: normalizeZipCode(zipCode), initialPractice })}>{copy.understand} <span>→</span></button>
          </section>
        )}
      </main>
    </div>
  );
}

export function LegalSettings({ onBack, onRestartOnboarding, language = "en", themePreference = "light", onThemeChange, initialSection = "education" }) {
  const [openSection, setOpenSection] = useState(initialSection);
  const [cleared, setCleared] = useState(false);
  const [companionVisible, setCompanionVisible] = useState(getCompanionVisibility);
  const spanishTitles = { education: "Uso educativo y funciones actuales", privacy: "Política de privacidad", terms: "Términos de uso", ai: "Aviso sobre la IA", government: "Aviso de independencia gubernamental", sources: "Fuentes y ayuda profesional" };

  useEffect(() => {
    const syncVisibility = (event) => setCompanionVisible(Boolean(event.detail?.visible));
    document.addEventListener("companion:visibility", syncVisibility);
    return () => document.removeEventListener("companion:visibility", syncVisibility);
  }, []);

  const clearLocalData = () => {
    if (!window.confirm(language === "es" ? "¿Borrar preferencias, perfiles personales, proceso y progreso de Citizenship AI de este dispositivo? La copia de la nube permanece. Esta acción no se puede deshacer." : "Clear Citizenship AI preferences, personal profiles, journey and learning progress from this device? Your cloud copy will remain. This cannot be undone.")) return;
    Object.keys(localStorage).filter(key => key.startsWith("citizenshipai.")).forEach(key => localStorage.removeItem(key));
    ["civicsViewed", "citizenshipai.onboarding.v1", "citizenshipai.language", THEME_STORAGE_KEY, APPEARANCE_STORAGE_KEY, "citizenshipai.microphone-notice.v1", "citizenshipai.did-avatar-consent.v1", "citizenshipai.practice-events.v1", "citizenshipai.ai-usage.v1", "citizenshipai.ai-sessions.promo.v1", "citizenshipai-companion-visible-v1", "citizenshipai-companion-streak-v1"].forEach((key) => localStorage.removeItem(key));
    window.dispatchEvent(new Event("citizenshipai:local-data-cleared"));
    setCleared(true);
};

  return (
    <div className="app settings-screen">
      <header className="settings-header">
        <button className="back-button" onClick={onBack}>{language === "es" ? "← Volver al inicio" : "← Back to Home"}</button>
        <div className="practice-brand">CITIZENSHIP <span>AI</span></div>
      </header>
      <main className="settings-content">
        <p className="settings-eyebrow">{language === "es" ? "AJUSTES" : "SETTINGS"}</p>
        <h1>{language === "es" ? "Legal y privacidad" : "Legal & Privacy"}</h1>
        <p className="settings-intro">{language === "es" ? "Consulta cómo funciona la aplicación y cómo se usan tus datos. Los avisos completos están disponibles en español e inglés." : "Review how the app works and how your data is used."}</p>
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
        <p className="settings-public-link">{language === "es" ? "Enlace público de privacidad:" : "Public policy link:"} <a href="#privacy">citizenshipai.us/#privacy</a></p>
        <LegalDocumentsIntroduction language={language} />
        <section className="legal-accordion" aria-label={language === "es" ? "Documentos legales y de privacidad" : "Legal and privacy documents"}>
          {legalSections.map((section) => {
            const isOpen = openSection === section.id;
            return (
              <article key={section.id} className="legal-item">
                <button onClick={() => setOpenSection(isOpen ? "" : section.id)} aria-expanded={isOpen} aria-controls={`legal-${section.id}`}>
                  <span>{language === "es" ? spanishTitles[section.id] : section.title}</span><span aria-hidden="true">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && <div id={`legal-${section.id}`} className="legal-item-body" lang={language}>{language === "es" ? <SpanishLegalContent id={section.id} /> : section.content}</div>}
              </article>
            );
          })}
          <article className="legal-item open">
            <div className="legal-static-title">{language === "es" ? "Compañero de estudio" : "Study Companion"}</div>
            <div className="legal-item-body">
              <p>{language === "es" ? "El compañero reacciona a las actividades de práctica en este dispositivo. No recibe tus respuestas, grabaciones ni información personal." : "The companion reacts locally to practice events. It does not receive your answers, recordings, or personal information."}</p>
              <button
                className="legal-action-button"
                type="button"
                aria-pressed={companionVisible}
                onClick={() => setCompanionVisible(setCompanionVisibility(!companionVisible))}
              >
                {language === "es" ? (companionVisible ? "Ocultar compañero de estudio" : "Mostrar compañero de estudio") : (companionVisible ? "Hide study companion" : "Show study companion")}
              </button>
            </div>
          </article>
          <article className="legal-item open">
            <div className="legal-static-title">{language === "es" ? "Controles de datos y cuenta" : "Data & Account Controls"}</div>
            <div className="legal-item-body">
              <p>{language === "es" ? "Puedes borrar preferencias, consentimiento, perfil personal, datos confirmados del proceso y progreso de este dispositivo. En Perfil puedes borrar la copia de la nube por separado. En Cuenta puedes descargar datos de cuenta, perfil cifrado guardado y uso técnico, o eliminar permanentemente la cuenta y sus datos. Eliminar datos de la nube no borra automáticamente los datos de este dispositivo." : "You can remove preferences, consent choices, personal profiles, confirmed journey details and study progress from this device. Profile lets you remove only the cloud copy. The Account panel exports account records, the explicitly saved encrypted profile and technical usage, or permanently deletes your cloud account and its data. Removing cloud data does not automatically clear this device."}</p>
              <button className="legal-action-button" onClick={clearLocalData}>{language === "es" ? "Borrar datos locales" : "Clear local app data"}</button>
              {cleared && <p className="legal-success" role="status">{language === "es" ? "Datos locales borrados. La bienvenida aparecerá en el próximo inicio." : "Local data was cleared. Onboarding will appear on your next launch."}</p>}
            </div>
          </article>
          <article className="legal-item open">
            <div className="legal-static-title">{language === "es" ? "Contacto y soporte" : "Contact / Support"}</div>
            <div className="legal-item-body"><p>{language === "es" ? "Para preguntas sobre soporte, privacidad, accesibilidad o datos, escribe a" : "For support, privacy, accessibility, or data questions, contact"} <a href="mailto:info@citizenshipai.us">info@citizenshipai.us</a>.</p><p>{language === "es" ? "Este correo atiende soporte de la aplicación, privacidad y accesibilidad. No ofrece consultas legales ni representación. No somos abogados; siempre recomendamos buscar ayuda de un abogado de inmigración autorizado o un representante acreditado por el DOJ dentro del alcance de su autorización para tu caso. No envíes expedientes, pruebas ni datos sensibles por correo de soporte." : "This address handles application support, privacy and accessibility. It does not provide legal consultations or representation. We are not lawyers; we always recommend a licensed immigration attorney or a DOJ-accredited representative acting within their authorized scope for help with your case. Do not email case files, evidence or sensitive details to support."}</p></div>
          </article>
        </section>
        <button className="settings-secondary-button" onClick={onRestartOnboarding}>{language === "es" ? "Revisar la información de bienvenida" : "Review first-launch information again"}</button>
      </main>
    </div>
  );
}
