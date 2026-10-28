export const IMMIGRATION_CATEGORIES = [
  ["my-case", "My Case", "Mi Caso"],
  ["court", "Court & EOIR", "Corte y EOIR"],
  ["uscis", "USCIS", "USCIS"],
  ["travel", "Travel & I-94", "Viajes e I-94"],
  ["address", "Address Changes", "Cambios de Dirección"],
  ["forms", "Forms & Fees", "Formularios y Tarifas"],
  ["visas", "Visas & Consular", "Visas y Consular"],
  ["legal", "Legal Help", "Ayuda Legal"],
  ["detention", "Detention Help", "Ayuda por Detención"],
  ["citizenship", "Citizenship", "Ciudadanía"],
];

const verified = "2026-09-19";

export const IMMIGRATION_RESOURCES = [
  {
    id: "uscis-case-status", category: "my-case", agency: "USCIS", icon: "◎", featured: true, sensitive: true,
    title_en: "Check My Case", title_es: "Consultar Mi Caso",
    description_en: "Check a case using the official USCIS case-status tools.",
    description_es: "Consulta un caso mediante las herramientas oficiales de USCIS.",
    warning_en: "Enter your receipt number only on the official USCIS website.",
    warning_es: "Ingresa tu número de recibo solamente en el sitio oficial de USCIS.",
    official_url: "https://www.uscis.gov/tools/checking-your-case-status-online",
    keywords_en: ["case", "receipt", "status", "pending"], keywords_es: ["caso", "recibo", "estatus", "estado"], last_verified: verified, status: "active",
  },
  {
    id: "processing-times", category: "my-case", agency: "USCIS", icon: "◷",
    title_en: "USCIS Processing Times", title_es: "Tiempos de Procesamiento de USCIS",
    description_en: "Review estimated processing times by form, category and office.",
    description_es: "Revisa tiempos estimados por formulario, categoría y oficina.",
    official_url: "https://egov.uscis.gov/processing-times/",
    keywords_en: ["slow", "long", "processing", "delay"], keywords_es: ["demora", "tarda", "procesamiento", "retraso"], last_verified: verified, status: "active",
  },
  {
    id: "uscis-e-request", category: "my-case", agency: "USCIS", icon: "?", sensitive: true,
    title_en: "USCIS e-Request", title_es: "Solicitud Electrónica de USCIS",
    description_en: "Access online inquiry tools. Eligibility depends on the request and case.",
    description_es: "Accede a consultas en línea. La elegibilidad depende de la solicitud y del caso.",
    official_url: "https://www.uscis.gov/e-request",
    keywords_en: ["inquiry", "outside time", "missing notice"], keywords_es: ["consulta", "fuera de tiempo", "aviso"], last_verified: verified, status: "active",
  },
  {
    id: "uscis-account", category: "uscis", agency: "USCIS", icon: "◉", sensitive: true,
    title_en: "USCIS Online Account", title_es: "Cuenta en Línea de USCIS",
    description_en: "Sign in or create an account directly on the official USCIS website.",
    description_es: "Inicia sesión o crea una cuenta directamente en el sitio oficial de USCIS.",
    official_url: "https://myaccount.uscis.gov/",
    keywords_en: ["account", "login", "online"], keywords_es: ["cuenta", "ingresar", "línea"], last_verified: verified, status: "active",
  },
  {
    id: "eoir-case", category: "court", agency: "EOIR / DOJ", icon: "⚖", featured: true, sensitive: true,
    title_en: "Immigration Court Case", title_es: "Caso en Corte de Inmigración",
    description_en: "Check available Immigration Court or BIA case information. The system may not show every case or detail.",
    description_es: "Consulta información disponible de la Corte o BIA. El sistema puede no mostrar todos los casos o detalles.",
    official_url: "https://www.justice.gov/eoir/eoir-case-information",
    keywords_en: ["court", "judge", "hearing", "a-number", "bia"], keywords_es: ["corte", "juez", "audiencia", "número a", "bia"], last_verified: verified, status: "active",
  },
  {
    id: "find-court", category: "court", agency: "EOIR / DOJ", icon: "⌖",
    title_en: "Find Immigration Court", title_es: "Encontrar Corte de Inmigración",
    description_en: "Find an Immigration Court and official contact information.",
    description_es: "Encuentra una Corte de Inmigración y su información oficial de contacto.",
    official_url: "https://www.justice.gov/eoir/immigration-courts",
    keywords_en: ["where court", "court address", "hearing"], keywords_es: ["dónde corte", "dirección corte", "audiencia"], last_verified: verified, status: "active",
  },
  {
    id: "court-payment", category: "court", agency: "EOIR / DOJ", icon: "$", sensitive: true,
    title_en: "Pay Immigration Court Fees", title_es: "Pagar Tarifas de Corte de Inmigración",
    description_en: "Pay eligible EOIR fees directly through the Department of Justice portal. Immigra never processes the payment.",
    description_es: "Paga tarifas elegibles directamente en el portal del Departamento de Justicia. Immigra nunca procesa el pago.",
    official_url: "https://epay.eoir.justice.gov/",
    keywords_en: ["pay", "court fee", "payment"], keywords_es: ["pagar", "tarifa corte", "pago"], last_verified: verified, status: "active",
  },
  {
    id: "change-uscis", category: "address", agency: "USCIS", icon: "⌂", featured: true, sensitive: true,
    title_en: "Change Address with USCIS", title_es: "Cambiar Dirección con USCIS",
    description_en: "USPS forwarding does not necessarily update your address with USCIS.",
    description_es: "El reenvío de USPS no necesariamente actualiza tu dirección con USCIS.",
    official_url: "https://www.uscis.gov/addresschange",
    keywords_en: ["moved", "move", "address", "new home"], keywords_es: ["mudé", "mudanza", "dirección", "domicilio"], last_verified: verified, status: "active",
  },
  {
    id: "change-eoir", category: "address", agency: "EOIR / DOJ", icon: "⌂", sensitive: true,
    title_en: "Change Address with Immigration Court", title_es: "Cambiar Dirección con la Corte de Inmigración",
    description_en: "USCIS and EOIR keep separate records. EOIR-33/IC and EOIR-33/BIA apply to different proceedings.",
    description_es: "USCIS y EOIR mantienen registros separados. EOIR-33/IC y EOIR-33/BIA corresponden a procesos distintos.",
    official_url: "https://www.justice.gov/eoir/update-respondent-or-alien-information",
    keywords_en: ["moved", "court address", "eoir 33"], keywords_es: ["mudé", "dirección corte", "eoir 33"], last_verified: verified, status: "active",
  },
  {
    id: "i94", category: "travel", agency: "CBP", icon: "✈", featured: true, sensitive: true,
    title_en: "I-94 & Travel Information", title_es: "I-94 e Información de Viaje",
    description_en: "Access official CBP I-94 services and available travel information.",
    description_es: "Accede a servicios oficiales de I-94 de CBP e información de viaje disponible.",
    official_url: "https://i94.cbp.dhs.gov/",
    keywords_en: ["i-94", "travel", "history", "entry"], keywords_es: ["i-94", "viaje", "historial", "entrada"], last_verified: verified, status: "active",
  },
  {
    id: "uscis-forms", category: "forms", agency: "USCIS", icon: "▤",
    title_en: "USCIS Forms", title_es: "Formularios de USCIS",
    description_en: "Find current USCIS forms and filing instructions.", description_es: "Encuentra formularios actuales de USCIS e instrucciones de presentación.",
    official_url: "https://www.uscis.gov/forms", keywords_en: ["form", "application", "petition"], keywords_es: ["formulario", "solicitud", "petición"], last_verified: verified, status: "active",
  },
  {
    id: "uscis-fees", category: "forms", agency: "USCIS", icon: "$",
    title_en: "USCIS Filing Fees", title_es: "Tarifas de USCIS",
    description_en: "Review current filing fees on the official USCIS website.", description_es: "Revisa las tarifas actuales en el sitio oficial de USCIS.",
    official_url: "https://www.uscis.gov/forms/filing-fees", keywords_en: ["fee", "cost", "price"], keywords_es: ["tarifa", "costo", "precio"], last_verified: verified, status: "active",
  },
  {
    id: "fee-calculator", category: "forms", agency: "USCIS", icon: "#",
    title_en: "USCIS Fee Calculator", title_es: "Calculadora de Tarifas de USCIS",
    description_en: "Use the official calculator to review applicable form fees.", description_es: "Usa la calculadora oficial para revisar tarifas aplicables.",
    official_url: "https://www.uscis.gov/feecalculator", keywords_en: ["calculator", "fee", "cost"], keywords_es: ["calculadora", "tarifa", "costo"], last_verified: verified, status: "active",
  },
  {
    id: "civil-surgeon", category: "uscis", agency: "USCIS", icon: "+",
    title_en: "Find a Civil Surgeon", title_es: "Encontrar un Médico Autorizado",
    description_en: "Find USCIS-designated civil surgeons for immigration medical examinations.", description_es: "Encuentra médicos autorizados por USCIS para exámenes médicos migratorios.",
    official_url: "https://www.uscis.gov/tools/find-a-civil-surgeon", keywords_en: ["doctor", "medical", "surgeon", "exam"], keywords_es: ["doctor", "médico", "examen", "cirujano"], last_verified: verified, status: "active",
  },
  {
    id: "visa-bulletin", category: "visas", agency: "Department of State", icon: "◫", featured: true,
    title_en: "Visa Bulletin", title_es: "Boletín de Visas",
    description_en: "View the Department of State's monthly Visa Bulletin.", description_es: "Consulta el Boletín de Visas mensual del Departamento de Estado.",
    official_url: "https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html", keywords_en: ["visa bulletin", "priority date", "family petition"], keywords_es: ["boletín visas", "fecha prioridad", "petición familiar"], last_verified: verified, status: "active",
  },
  {
    id: "ceac", category: "visas", agency: "Department of State", icon: "◈", sensitive: true,
    title_en: "CEAC Consular Services", title_es: "Servicios Consulares CEAC",
    description_en: "Access official Department of State consular case services. Never enter State Department credentials in Immigra.", description_es: "Accede a servicios consulares oficiales. Nunca ingreses credenciales del Departamento de Estado en Immigra.",
    official_url: "https://ceac.state.gov/", keywords_en: ["ceac", "consular", "ds-260", "ds-160"], keywords_es: ["ceac", "consular", "ds-260", "ds-160"], last_verified: verified, status: "active",
  },
  {
    id: "legal-help", category: "legal", agency: "EOIR / DOJ", icon: "§", featured: true,
    title_en: "Find Legal Help", title_es: "Buscar Ayuda Legal",
    description_en: "Find official information about pro bono legal-service providers and representation.", description_es: "Encuentra información oficial sobre servicios legales pro bono y representación.",
    official_url: "https://www.justice.gov/eoir/legal-representation-icor", keywords_en: ["lawyer", "attorney", "legal", "pro bono"], keywords_es: ["abogado", "legal", "pro bono", "representación"], last_verified: verified, status: "active",
  },
  {
    id: "avoid-scams", category: "legal", agency: "USCIS", icon: "!",
    title_en: "Avoid Immigration Scams", title_es: "Evitar Fraudes Migratorios",
    description_en: "Learn to recognize scams and unauthorized legal-service providers.", description_es: "Aprende a reconocer fraudes y proveedores de servicios legales no autorizados.",
    official_url: "https://www.uscis.gov/avoid-scams", keywords_en: ["scam", "fraud", "notario"], keywords_es: ["fraude", "estafa", "notario"], last_verified: verified, status: "active",
  },
  {
    id: "detainee", category: "detention", agency: "ICE", icon: "⌕", sensitive: true,
    title_en: "Find a Detained Person", title_es: "Buscar Persona Detenida",
    description_en: "Search the official ICE locator when applicable. Availability depends on custody status and government records.", description_es: "Consulta el localizador oficial de ICE cuando corresponda. La disponibilidad depende de la custodia y los registros gubernamentales.",
    official_url: "https://locator.ice.gov/", keywords_en: ["detained", "detention", "ice", "custody"], keywords_es: ["detenido", "detención", "ice", "custodia"], last_verified: verified, status: "active",
  },
  {
    id: "citizenship-center", category: "citizenship", agency: "USCIS", icon: "★",
    title_en: "USCIS Citizenship Resources", title_es: "Recursos de Ciudadanía de USCIS",
    description_en: "Open official USCIS citizenship information and study resources.", description_es: "Consulta información y materiales oficiales de ciudadanía de USCIS.",
    official_url: "https://www.uscis.gov/citizenship", keywords_en: ["citizenship", "naturalization", "civics"], keywords_es: ["ciudadanía", "naturalización", "cívica"], last_verified: verified, status: "active",
  },
];

export function localizedResource(resource, language) {
  const suffix = language === "es" ? "es" : "en";
  return {
    ...resource,
    title: resource[`title_${suffix}`],
    description: resource[`description_${suffix}`],
    warning: resource[`warning_${suffix}`] || "",
    keywords: resource[`keywords_${suffix}`] || [],
  };
}

// Extend the existing help directory rather than maintain a second knowledge base.
export const JOURNEY_HELP_CATEGORIES = [
  ["before-applying", "Before applying", "Antes de solicitar"],
  ["after-applying", "After applying", "Después de solicitar"],
  ["biometrics", "Biometrics", "Biometría"],
  ["interview-preparation", "Interview preparation", "Preparación de entrevista"],
  ["interview-day", "Interview day", "Día de entrevista"],
  ["after-interview", "After interview", "Después de la entrevista"],
  ["oath", "Oath", "Juramento"],
  ["after-naturalization", "After naturalization", "Después de naturalizarte"],
];
export const JOURNEY_HELP_RESOURCE_IDS = {
  "before-applying": ["n400-guidance", "citizenship-center", "uscis-forms", "uscis-fees", "fee-calculator", "legal-help", "avoid-scams"],
  "after-applying": ["uscis-case-status", "processing-times", "uscis-e-request", "uscis-account", "change-uscis", "naturalization-steps"],
  biometrics: ["naturalization-steps", "uscis-case-status", "uscis-account", "uscis-e-request", "change-uscis"],
  "interview-preparation": ["n400-guidance", "citizenship-center", "naturalization-steps", "i94", "legal-help"],
  "interview-day": ["naturalization-steps", "n400-guidance", "uscis-account", "i94"],
  "after-interview": ["uscis-case-status", "uscis-e-request", "uscis-account", "naturalization-steps", "legal-help"],
  oath: ["naturalization-ceremony", "naturalization-steps", "uscis-case-status", "uscis-account"],
  "after-naturalization": ["new-citizens", "citizenship-center"],
};
export function getJourneyHelpCategory(stage) {
  if (["CITIZEN", "OATH_COMPLETED"].includes(stage)) return "after-naturalization";
  if (["APPROVED", "OATH_SCHEDULED"].includes(stage)) return "oath";
  if (["INTERVIEW_COMPLETED", "ADDITIONAL_EVIDENCE"].includes(stage)) return "after-interview";
  if (stage === "INTERVIEW_SCHEDULED") return "interview-day";
  if (["BIOMETRICS_COMPLETED", "INTERVIEW_PENDING"].includes(stage)) return "interview-preparation";
  if (stage === "BIOMETRICS_PENDING") return "biometrics";
  if (["N400_FILED", "RECEIPT_RECEIVED"].includes(stage)) return "after-applying";
  return "before-applying";
}
export function getContextualHelpResources(stage, language = "en") {
  return JOURNEY_HELP_RESOURCE_IDS[getJourneyHelpCategory(stage)].map(id => IMMIGRATION_RESOURCES.find(item => item.id === id)).filter(Boolean).map(item => localizedResource(item, language));
}
IMMIGRATION_RESOURCES.push(
  {
    id: "n400-guidance", category: "citizenship", agency: "USCIS", icon: "▤", last_verified: null, status: "active",
    title_en: "N-400 Instructions", title_es: "Instrucciones del N-400",
    description_en: "Review the current official instructions for your application and supporting records.",
    description_es: "Revisa las instrucciones oficiales actuales de tu solicitud y registros de apoyo.",
    official_url: "https://www.uscis.gov/sites/default/files/document/forms/n-400instr.pdf",
    keywords_en: ["n-400", "application", "documents", "marriage", "interview"], keywords_es: ["n-400", "solicitud", "documentos", "matrimonio", "entrevista"],
  },
  {
    id: "naturalization-steps", category: "citizenship", agency: "USCIS", icon: "→", last_verified: null, status: "active",
    title_en: "Steps to Naturalization", title_es: "Pasos para la Naturalización",
    description_en: "Review the official overview of biometrics, interview and other steps. Your own notice controls your appointment details.",
    description_es: "Revisa la descripción oficial de biometría, entrevista y otros pasos. Tu propio aviso determina los detalles de tu cita.",
    official_url: "https://www.uscis.gov/citizenship/learn-about-citizenship/10-steps-to-naturalization",
    keywords_en: ["biometrics", "appointment", "interview", "notice", "naturalization"], keywords_es: ["biometría", "cita", "entrevista", "aviso", "naturalización"],
  },
  {
    id: "naturalization-ceremony", category: "citizenship", agency: "USCIS", icon: "▤", last_verified: null, status: "active",
    title_en: "Naturalization Ceremonies", title_es: "Ceremonias de Naturalización",
    description_en: "Read official ceremony information and follow your own oath notice for instructions.",
    description_es: "Lee la información oficial de ceremonias y sigue las instrucciones de tu aviso de juramento.",
    official_url: "https://www.uscis.gov/citizenship/learn-about-citizenship/naturalization-ceremonies",
    keywords_en: ["oath", "ceremony", "n-445", "certificate"], keywords_es: ["juramento", "ceremonia", "n-445", "certificado"],
  },
  {
    id: "new-citizens", category: "citizenship", agency: "USCIS", icon: "▤", last_verified: null, status: "active",
    title_en: "Information for New Citizens", title_es: "Información para Nuevos Ciudadanos",
    description_en: "Find official information about life and next steps after naturalization.",
    description_es: "Encuentra información oficial sobre la vida y los próximos pasos después de naturalizarte.",
    official_url: "https://www.uscis.gov/citizenship/learn-about-citizenship/new-citizens",
    keywords_en: ["new citizen", "passport", "vote", "certificate"], keywords_es: ["nuevo ciudadano", "pasaporte", "voto", "certificado"],
  },
);
