function hasStatus(status, terms) {
  const normalized = (status || "").toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

const COPY = {
  en: {
    general: {
      title: "What does this mean?",
      explanation: "This is the official USCIS status shown above. A status update alone does not predict the outcome of a case.",
      next: "Keep your USCIS contact information current and review any official USCIS notice you receive.",
    },
    rfe: {
      title: "What does this mean?",
      explanation: "A Request for Evidence generally means USCIS is asking for additional information or documents.",
      next: "Read the actual USCIS notice carefully. That notice is the authoritative source for what is requested and any deadline.",
    },
    interview: {
      title: "What does this mean?",
      explanation: "USCIS indicates that an interview has been scheduled or is part of the case process.",
      next: "Use the official interview notice for the date, location, instructions, and documents to bring.",
    },
    biometrics: {
      title: "What does this mean?",
      explanation: "This status refers to a biometrics appointment or related step in the case process.",
      next: "Follow the official USCIS notice for appointment details and instructions.",
    },
    approval: {
      title: "What does this mean?",
      explanation: "USCIS indicates an approval or a related decision update for this case.",
      next: "Review the official USCIS notice. Additional documents or next steps can depend on the form and case.",
    },
    denial: {
      title: "What does this mean?",
      explanation: "USCIS indicates a denial or a related decision update for this case.",
      next: "Review the official USCIS notice for the complete decision and any applicable options. Consider a qualified immigration professional for legal advice.",
    },
  },
  es: {
    general: {
      title: "¿Qué significa esto?",
      explanation: "Este es el estado oficial de USCIS mostrado arriba. Una actualización de estado por sí sola no predice el resultado de un caso.",
      next: "Mantén actualizada tu información de contacto con USCIS y revisa cualquier aviso oficial de USCIS que recibas.",
    },
    rfe: {
      title: "¿Qué significa esto?",
      explanation: "Una Solicitud de Evidencia generalmente significa que USCIS pide información o documentos adicionales.",
      next: "Lee cuidadosamente el aviso real de USCIS. Ese aviso es la fuente autorizada de lo solicitado y de cualquier plazo.",
    },
    interview: {
      title: "¿Qué significa esto?",
      explanation: "USCIS indica que se programó una entrevista o que forma parte del proceso del caso.",
      next: "Usa el aviso oficial de entrevista para la fecha, el lugar, las instrucciones y los documentos que debes llevar.",
    },
    biometrics: {
      title: "¿Qué significa esto?",
      explanation: "Este estado se refiere a una cita de datos biométricos o a un paso relacionado en el proceso del caso.",
      next: "Sigue el aviso oficial de USCIS para los detalles e instrucciones de la cita.",
    },
    approval: {
      title: "¿Qué significa esto?",
      explanation: "USCIS indica una aprobación o una actualización de decisión relacionada con este caso.",
      next: "Revisa el aviso oficial de USCIS. Los documentos o próximos pasos adicionales pueden depender del formulario y del caso.",
    },
    denial: {
      title: "¿Qué significa esto?",
      explanation: "USCIS indica una denegación o una actualización de decisión relacionada con este caso.",
      next: "Revisa el aviso oficial de USCIS para conocer la decisión completa y las opciones aplicables. Considera a un profesional de inmigración calificado para asesoría legal.",
    },
  },
};

export function getCaseGuidance(status, language = "en") {
  const copy = COPY[language === "es" ? "es" : "en"];
  if (hasStatus(status, ["request for evidence", "rfe"])) return copy.rfe;
  if (hasStatus(status, ["interview"])) return copy.interview;
  if (hasStatus(status, ["biometric"])) return copy.biometrics;
  if (hasStatus(status, ["denied", "denial"])) return copy.denial;
  if (hasStatus(status, ["approved", "approval", "card was produced", "document was mailed"])) return copy.approval;
  return copy.general;
}

export function daysSinceOfficialDate(value) {
  if (!value || Number.isNaN(Date.parse(value))) return null;
  const elapsed = Math.floor((Date.now() - new Date(value).getTime()) / (24 * 60 * 60 * 1000));
  return elapsed >= 0 ? elapsed : null;
}

export function formatOfficialDate(value, language = "en") {
  if (!value || Number.isNaN(Date.parse(value))) return "";
  return new Intl.DateTimeFormat(language === "es" ? "es-US" : "en-US", {
    year: "numeric", month: "long", day: "numeric",
  }).format(new Date(value));
}
