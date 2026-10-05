import { CASE_STAGES } from "../shared/brainProfile.js";
export { CASE_STAGES };

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

/** One journey model shared by Home, study orchestration and the existing tracker. */
export const JOURNEY_OFFICIAL_LINKS = Object.freeze({
  status: "https://egov.uscis.gov/",
  processingTimes: "https://egov.uscis.gov/processing-times/",
  naturalization: "https://www.uscis.gov/citizenship/learn-about-citizenship/10-steps-to-naturalization",
  interview: "https://www.uscis.gov/citizenship/learn-about-citizenship/the-naturalization-interview",
  n400Instructions: "https://www.uscis.gov/sites/default/files/document/forms/n-400instr.pdf",
  oath: "https://www.uscis.gov/citizenship/learn-about-citizenship/naturalization-ceremonies",
  afterNaturalization: "https://www.uscis.gov/citizenship/learn-about-citizenship/new-citizens",
});

const STAGE_LABELS = {
  en: ["Preparing your N-400", "N-400 filed", "Receipt received", "Biometrics pending", "Biometrics completed", "Waiting for an interview", "Interview scheduled", "Interview completed", "Approved", "Oath scheduled", "Oath completed", "U.S. citizen", "Additional evidence requested"],
  es: ["Preparando tu N-400", "N-400 presentada", "Recibo recibido", "Biometría pendiente", "Biometría completada", "Esperando entrevista", "Entrevista programada", "Entrevista completada", "Aprobado", "Juramento programado", "Juramento completado", "Ciudadano de EE. UU.", "Evidencia adicional solicitada"],
};
const NEXT_STAGE = {
  PREPARING_N400: "N400_FILED", N400_FILED: "RECEIPT_RECEIVED", RECEIPT_RECEIVED: "BIOMETRICS_PENDING",
  BIOMETRICS_PENDING: "BIOMETRICS_COMPLETED", BIOMETRICS_COMPLETED: "INTERVIEW_PENDING",
  INTERVIEW_PENDING: "INTERVIEW_SCHEDULED", INTERVIEW_SCHEDULED: "INTERVIEW_COMPLETED",
  INTERVIEW_COMPLETED: "APPROVED", APPROVED: "OATH_SCHEDULED", OATH_SCHEDULED: "OATH_COMPLETED",
  OATH_COMPLETED: "CITIZEN",
};

export function getJourneyStageLabel(stage, language = "en") {
  const index = CASE_STAGES.indexOf(stage);
  return index < 0 ? (language === "es" ? "Etapa sin confirmar" : "Stage not confirmed") : STAGE_LABELS[language === "es" ? "es" : "en"][index];
}

export function getJourneySourceLabel(source, confidence, language = "en") {
  const es = language === "es";
  if (source === "USCIS_NOTICE" && confidence === "USER_CONFIRMED") return es ? "Aviso de USCIS · confirmado por ti" : "USCIS notice · confirmed by you";
  if (source === "OFFICIAL_USCIS" && confidence === "OFFICIAL_USCIS") return es ? "Fuente oficial de USCIS" : "Official USCIS source";
  if (confidence === "ESTIMATED" || source === "ESTIMATED") return es ? "Orientación estimada" : "Estimated guidance";
  if (confidence === "USER_CONFIRMED" || source === "USER_CONFIRMED") return es ? "Confirmado por ti" : "Confirmed by you";
  return es ? "Sin verificar" : "Unverified";
}

export function getJourneyNextStep(caseProfile = {}, language = "en") {
  const es = language === "es";
  const stage = CASE_STAGES.includes(caseProfile.currentStage) ? caseProfile.currentStage : "PREPARING_N400";
  const rows = {
    PREPARING_N400: ["Prepare your application", "Review the current N-400 instructions and information you have provided.", "Organize your application information.", "foundations", "immigrationHelp"],
    N400_FILED: ["Build your study foundation", "Keep your filing records and review notices when they arrive.", "Keep a copy of your filing confirmation.", "foundations", "civics"],
    RECEIPT_RECEIVED: ["Keep your receipt and begin practice", "USCIS may schedule biometrics or reuse existing biometrics. Follow the notice for your case.", "Keep your receipt notice accessible.", "foundations", "civics"],
    BIOMETRICS_PENDING: ["Prepare for biometrics", "Follow your appointment notice, including any instructions about rescheduling.", "Review the appointment details and identification requested in your notice.", "foundations", "uscisTracker"],
    BIOMETRICS_COMPLETED: ["Keep preparing for the interview", "The next update may concern your interview. An appointment date is confirmed only by USCIS.", "Review your N-400 information and start English practice.", "interview", "practice"],
    INTERVIEW_PENDING: ["Practice your N-400 and English", "An interview date has not been confirmed here. Use this time to strengthen your preparation.", "Review your application and organize interview documents.", "interview", "interview", "n400"],
    INTERVIEW_SCHEDULED: ["Prepare for your interview", "Use your appointment notice for the exact time, location and instructions.", "Review your documents, N-400 information, civics and English.", "focused_interview", "interview", "n400"],
    INTERVIEW_COMPLETED: ["Review the interview result", "Follow any written USCIS instructions. An interview alone does not establish approval.", "Keep your interview result and any requested evidence.", "maintenance", "uscisTracker"],
    APPROVED: ["Prepare for your oath", "USCIS will provide ceremony instructions. Approval alone does not mean you have taken the oath.", "Keep your decision notice and watch for ceremony information.", "oath", "uscisTracker"],
    OATH_SCHEDULED: ["Get ready for your ceremony", "Follow your oath notice and complete any questions requested in that notice.", "Review your ceremony documents and notice instructions.", "oath", "uscisTracker"],
    OATH_COMPLETED: ["Review your naturalization documents", "Check your certificate and follow official guidance for new citizens.", "Keep your certificate secure and review official next steps.", "new_citizen", "immigrationHelp"],
    CITIZEN: ["Explore your next steps as a citizen", "Use official guidance for passports, voting and updating government records.", "Keep your naturalization documents secure.", "new_citizen", "immigrationHelp"],
    ADDITIONAL_EVIDENCE: ["Review the requested evidence", "Your actual notice controls the requested documents and deadline. Consider qualified legal help if needed.", "Prepare only the evidence requested for your case.", "evidence", "uscisTracker"],
  };
  const spanish = {
    PREPARING_N400: ["Prepara tu solicitud", "Revisa las instrucciones actuales del N-400 y la información que has proporcionado.", "Organiza la información de tu solicitud."],
    N400_FILED: ["Construye tu base de estudio", "Conserva tus registros de presentación y revisa los avisos cuando lleguen.", "Conserva una copia de tu confirmación de presentación."],
    RECEIPT_RECEIVED: ["Conserva tu recibo y comienza a practicar", "USCIS puede programar biometría o reutilizar datos existentes. Sigue el aviso de tu caso.", "Ten tu aviso de recibo a mano."],
    BIOMETRICS_PENDING: ["Prepárate para la biometría", "Sigue tu aviso de cita, incluidas las instrucciones para reprogramarla.", "Revisa los detalles y la identificación que solicita tu aviso."],
    BIOMETRICS_COMPLETED: ["Sigue preparándote para la entrevista", "La próxima actualización puede ser sobre tu entrevista. Solo USCIS confirma una fecha de cita.", "Revisa tu información N-400 y comienza a practicar inglés."],
    INTERVIEW_PENDING: ["Practica tu N-400 e inglés", "Aquí aún no hay una fecha de entrevista confirmada. Aprovecha este tiempo para prepararte.", "Revisa tu solicitud y organiza los documentos de entrevista."],
    INTERVIEW_SCHEDULED: ["Prepárate para tu entrevista", "Usa tu aviso de cita para la hora, el lugar y las instrucciones exactas.", "Revisa tus documentos, información N-400, civismo e inglés."],
    INTERVIEW_COMPLETED: ["Revisa el resultado de la entrevista", "Sigue las instrucciones escritas de USCIS. La entrevista por sí sola no establece una aprobación.", "Conserva el resultado y cualquier solicitud de evidencia."],
    APPROVED: ["Prepárate para tu juramento", "USCIS te dará instrucciones para la ceremonia. La aprobación no significa que ya hayas jurado.", "Conserva tu aviso de decisión y espera información de la ceremonia."],
    OATH_SCHEDULED: ["Prepárate para tu ceremonia", "Sigue tu aviso de juramento y completa las preguntas solicitadas en ese aviso.", "Revisa tus documentos de ceremonia y las instrucciones del aviso."],
    OATH_COMPLETED: ["Revisa tus documentos de naturalización", "Comprueba tu certificado y sigue la orientación oficial para nuevos ciudadanos.", "Guarda tu certificado de forma segura y revisa los próximos pasos oficiales."],
    CITIZEN: ["Explora tus próximos pasos como ciudadano", "Usa la orientación oficial sobre pasaportes, voto y actualización de registros.", "Conserva tus documentos de naturalización en un lugar seguro."],
    ADDITIONAL_EVIDENCE: ["Revisa la evidencia solicitada", "Tu aviso determina los documentos y el plazo. Considera ayuda legal calificada si la necesitas.", "Prepara únicamente la evidencia solicitada para tu caso."],
  };
  const [title, description, preparation] = es ? spanish[stage] : rows[stage];
  return { stage, nextLikelyStage: NEXT_STAGE[stage] || null, confidence: "ESTIMATED", title, description, preparation, studyFocus: rows[stage][3], destination: rows[stage][4], mode: rows[stage][5] || null };
}

/** Suggestions, not a verified requirements list. The user's actual notice controls. */
export function getJourneyChecklist(caseProfile = {}, n400Profile = {}, language = "en") {
  const es = language === "es";
  const stage = caseProfile.currentStage || "PREPARING_N400";
  const flags = { ...n400Profile, ...(n400Profile.flags || {}) };
  const answers = n400Profile.answers || {};
  const items = [];
  const add = (id, en, spanish, sourceUrl = JOURNEY_OFFICIAL_LINKS.n400Instructions, reason = null) => items.push({ id, label: es ? spanish : en, sourceUrl, verifiedAt: null, preparationSuggestion: true, reason });
  if (["CITIZEN", "OATH_COMPLETED"].includes(stage)) {
    add("certificate_review", "Review and safely store your naturalization certificate", "Revisa y guarda tu certificado de naturalización", JOURNEY_OFFICIAL_LINKS.afterNaturalization);
    add("new_citizen_guidance", "Review official next steps for new citizens", "Revisa los próximos pasos oficiales para nuevos ciudadanos", JOURNEY_OFFICIAL_LINKS.afterNaturalization);
    return items;
  }
  if (["APPROVED", "OATH_SCHEDULED"].includes(stage)) {
    add("oath_notice", "Review your oath appointment notice", "Revisa tu aviso de cita de juramento", JOURNEY_OFFICIAL_LINKS.oath);
    add("oath_notice_questions", "Complete any questions and gather items requested by your oath notice", "Completa las preguntas y reúne lo solicitado en tu aviso de juramento", JOURNEY_OFFICIAL_LINKS.oath);
    add("oath_green_card", "Check your notice's instructions for your Permanent Resident Card", "Revisa las instrucciones del aviso sobre tu tarjeta de residente permanente", JOURNEY_OFFICIAL_LINKS.oath);
    return items;
  }
  if (stage === "ADDITIONAL_EVIDENCE") {
    add("evidence_notice", "Read the requested evidence and deadline in your notice", "Lee la evidencia solicitada y el plazo de tu aviso");
    add("evidence_records", "Gather only the documents requested for your case", "Reúne solo los documentos solicitados para tu caso");
    add("evidence_copy", "Keep a copy of your response and delivery confirmation", "Conserva una copia de tu respuesta y confirmación de entrega");
    return items;
  }
  if (stage === "BIOMETRICS_PENDING") {
    add("biometrics_notice", "Review your biometrics appointment notice", "Revisa tu aviso de cita biométrica", JOURNEY_OFFICIAL_LINKS.naturalization);
    add("biometrics_id", "Gather the identification requested in your appointment notice", "Reúne la identificación solicitada en tu aviso de cita", JOURNEY_OFFICIAL_LINKS.naturalization);
    return items;
  }
  if (["PREPARING_N400", "N400_FILED", "RECEIPT_RECEIVED"].includes(stage)) {
    add("n400_instructions", "Review the current N-400 instructions", "Revisa las instrucciones actuales del N-400");
    add("n400_records", "Organize the records relevant to your application", "Organiza los registros relevantes para tu solicitud");
    if (stage !== "PREPARING_N400") add("filing_record", "Keep your filing confirmation and receipt notice", "Conserva tu confirmación de presentación y aviso de recibo");
    return items;
  }
  add("interview_notice", "Review your interview appointment notice", "Revisa tu aviso de cita de entrevista", JOURNEY_OFFICIAL_LINKS.interview);
  add("permanent_resident_card", "Prepare your Permanent Resident Card", "Prepara tu tarjeta de residente permanente", JOURNEY_OFFICIAL_LINKS.interview);
  add("state_id", "Review identification requested in your notice, such as a state-issued ID", "Revisa la identificación solicitada en tu aviso, como una identificación estatal", JOURNEY_OFFICIAL_LINKS.interview);
  add("passports", "Review your current and expired passports and travel documents", "Revisa tus pasaportes actuales y vencidos y documentos de viaje", JOURNEY_OFFICIAL_LINKS.interview);
  if (flags.married === true || flags.eligibilityBasis === "MARRIAGE" || n400Profile.eligibilityBasis === "MARRIAGE") add("marriage_documents", "Review marriage documents relevant to your application", "Revisa los documentos matrimoniales relevantes para tu solicitud", undefined, "marriage");
  const confirmedYes = value => /^(yes|sí|si)$/i.test(String(value || "").trim());
  if (flags.previously_married === true || flags.divorced === true || confirmedYes(answers.P_PRIOR_MARRIAGES)) add("prior_marriage_documents", "Review records ending any prior marriages", "Revisa los registros que finalizaron matrimonios anteriores", undefined, "prior_marriage");
  if (flags.name_changed === true || flags.name_change_requested === true || confirmedYes(answers.P_ID_NAME_CHANGE)) add("name_change_documents", "Review any legal name-change documentation", "Revisa la documentación de cambio de nombre legal", undefined, "name_change");
  if (flags.has_travel === true || (Array.isArray(n400Profile.travelHistory) && n400Profile.travelHistory.length > 0)) add("travel_records", "Review your travel dates and relevant travel records", "Revisa tus fechas y registros de viaje relevantes", undefined, "travel");
  if (caseProfile.evidenceDeadline || (caseProfile.notices || []).some(notice => notice.noticeType === "ADDITIONAL_EVIDENCE" && notice.confirmedAt)) add("requested_evidence", "Review additional evidence specifically requested by USCIS", "Revisa la evidencia adicional solicitada específicamente por USCIS", undefined, "requested_evidence");
  return items;
}

export function getJourneyChecklistProgress(caseProfile = {}, n400Profile = {}, language = "en") {
  const items = getJourneyChecklist(caseProfile, n400Profile, language);
  const completedIds = new Set(Array.isArray(caseProfile.checklistCompletedIds) ? caseProfile.checklistCompletedIds : []);
  return { items, completed: items.filter(item => completedIds.has(item.id)).length, total: items.length };
}

/** Date-only fields are calendar dates, so do not shift them through UTC. */
export function formatJourneyDate(value, language = "en") {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return formatOfficialDate(value, language);
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (date.getFullYear() !== Number(match[1]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3])) return "";
  return new Intl.DateTimeFormat(language === "es" ? "es-US" : "en-US", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

export const getCaseStageLabel = getJourneyStageLabel;
