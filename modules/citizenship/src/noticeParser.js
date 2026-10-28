import { CASE_STAGES } from "../shared/brainProfile.js";

/** Conservative notice parsing. Extraction is a draft; this module never writes storage. */
export const NOTICE_TYPES = Object.freeze(["RECEIPT", "BIOMETRICS", "INTERVIEW", "ADDITIONAL_EVIDENCE", "OATH"]);
export const NOTICE_STAGE = Object.freeze({ RECEIPT: "RECEIPT_RECEIVED", BIOMETRICS: "BIOMETRICS_PENDING", INTERVIEW: "INTERVIEW_SCHEDULED", ADDITIONAL_EVIDENCE: "ADDITIONAL_EVIDENCE", OATH: "OATH_SCHEDULED" });
const LABELS = {
  en: ["Receipt notice", "Biometrics notice", "Interview notice", "Additional evidence notice", "Oath notice"],
  es: ["Aviso de recibo", "Aviso de biometría", "Aviso de entrevista", "Aviso de evidencia adicional", "Aviso de juramento"],
};
export function getNoticeTypeLabel(type, language = "en") {
  const index = NOTICE_TYPES.indexOf(type);
  return index < 0 ? (language === "es" ? "Selecciona el tipo de aviso" : "Choose a notice type") : LABELS[language === "es" ? "es" : "en"][index];
}

export function isCalendarDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return false;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.getUTCFullYear() === Number(match[1]) && date.getUTCMonth() === Number(match[2]) - 1 && date.getUTCDate() === Number(match[3]);
}
const MONTH_NAMES = "january|february|march|april|may|june|july|august|september|october|november|december|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre";
const DATE_PATTERN = `(?:\\d{4}-\\d{2}-\\d{2}|\\d{1,2}[/-]\\d{1,2}[/-]\\d{4}|(?:${MONTH_NAMES})\\s+\\d{1,2},?\\s+\\d{4}|\\d{1,2}\\s+(?:de\\s+)?(?:${MONTH_NAMES})\\s+(?:de\\s+)?\\d{4})`;
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december", "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function normalizeNoticeDate(value) {
  const input = String(value || "").trim().toLowerCase();
  if (isCalendarDate(input)) return input;
  let year, month, day;
  const numeric = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(input);
  // USCIS English notices use month/day/year. Never infer a missing year.
  if (numeric) [, month, day, year] = numeric;
  const words = new RegExp(`^(${MONTH_NAMES})\\s+(\\d{1,2}),?\\s+(\\d{4})$`, "i").exec(input);
  if (words) { month = MONTHS.indexOf(words[1]) % 12 + 1; day = words[2]; year = words[3]; }
  const spanish = new RegExp(`^(\\d{1,2})\\s+(?:de\\s+)?(${MONTH_NAMES})\\s+(?:de\\s+)?(\\d{4})$`, "i").exec(input);
  if (spanish) { day = spanish[1]; month = MONTHS.indexOf(spanish[2]) % 12 + 1; year = spanish[3]; }
  if (!year) return "";
  const result = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return isCalendarDate(result) ? result : "";
}
export function normalizeNoticeTime(value) {
  const input = String(value || "").trim().toLowerCase().replace(/[.]/g, "");
  const match = /^(\d{1,2}):(\d{2})\s*(am|pm)?$/.exec(input);
  if (!match) return "";
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (minutes > 59 || hours > 23 || (match[3] && (hours < 1 || hours > 12))) return "";
  if (match[3]) hours = hours % 12 + (match[3] === "pm" ? 12 : 0);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
function dateAfter(text, label) {
  const match = new RegExp(`(?:${label})\\s*[:#-]?\\s*(?:(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday),?\\s+)?(${DATE_PATTERN})`, "i").exec(text);
  return match ? normalizeNoticeDate(match[1]) : "";
}
function boundedLine(text, label) {
  return new RegExp(`(?:${label})\\s*[:#-]\\s*([^\\n]{1,240})`, "i").exec(text)?.[1]?.trim() || "";
}

export function extractNoticeDraft(input) {
  const text = String(input || "").slice(0, 160_000).replace(/\r\n?/g, "\n");
  let noticeType = "";
  if (/request for (?:additional )?evidence|solicitud de evidencia|\bRFE\b/i.test(text)) noticeType = "ADDITIONAL_EVIDENCE";
  else if (/N[- ]?445|notice of naturalization oath ceremony|oath (?:ceremony|appointment) (?:notice|scheduled)|naturalization ceremony (?:notice|scheduled)|aviso de (?:ceremonia|juramento)/i.test(text)) noticeType = "OATH";
  else if (/naturalization interview|interview (?:appointment|notice|was scheduled|is scheduled)|notice of interview|aviso de entrevista/i.test(text)) noticeType = "INTERVIEW";
  else if (/ASC appointment notice|biometric(?:s)? (?:appointment|notice|was scheduled)|aviso de biometr/i.test(text)) noticeType = "BIOMETRICS";
  else if (/receipt notice|case was received|notice of receipt|aviso de recibo/i.test(text)) noticeType = "RECEIPT";
  const receiptNumber = /(?:receipt\s*(?:number|no\.?|#)|n[uú]mero de recibo)\s*[:#-]?\s*([A-Z]{3}\s?\d{10})\b/i.exec(text)?.[1]?.replace(/\s/g, "").toUpperCase() || "";
  const appointmentDate = dateAfter(text, "appointment date|date (?:and time )?of (?:appointment|interview|ceremony)|interview date|ceremony date|fecha de (?:cita|entrevista|ceremonia)")
    || dateAfter(text, "appear (?:for (?:your )?(?:interview|biometrics|ceremony) )?on|scheduled (?:for|on)|presentarse el");
  const labeledTime = /(?:appointment time|time (?:of|for) (?:appointment|interview|ceremony)|hora de (?:cita|entrevista|ceremonia))\s*[:#-]?\s*(\d{1,2}:\d{2}\s*(?:[ap]\.?m\.?)?)/i.exec(text)?.[1];
  const adjacentTime = appointmentDate ? /(?:\bat\b|\ba las\b)\s+(\d{1,2}:\d{2}\s*[ap]\.?m\.?)/i.exec(text)?.[1] : "";
  const fieldOffice = boundedLine(text, "field office|oficina local");
  const location = boundedLine(text, "appointment location|interview location|ceremony location|lugar de (?:cita|entrevista|ceremonia)");
  const otherForm = /\b(?:I[- ](?:485|130|765|90)|N[- ]600)\b/i.test(text) && !/\bN[- ]?400\b/i.test(text);
  return {
    noticeType,
    noticeDate: dateAfter(text, "notice date|date of notice|fecha del aviso"),
    appointmentDate,
    appointmentTime: normalizeNoticeTime(labeledTime || adjacentTime),
    fieldOffice,
    location,
    receiptNumber,
    deadline: dateAfter(text, "response (?:due date|deadline)|respond by|must (?:be )?received by|fecha l[ií]mite|responda antes del"),
    formType: /\bN[- ]?400\b/i.test(text) ? "N-400" : "",
    warning: otherForm ? "OTHER_FORM" : !noticeType ? "TYPE_NOT_FOUND" : "",
  };
}

function safeLine(value, max = 240) { return Array.from(String(value || ""), char => char.codePointAt(0) < 32 ? " " : char).join("").trim().slice(0, max); }
export function validateNoticeDraft(draft = {}, caseProfile = {}) {
  const errors = {};
  if (!NOTICE_TYPES.includes(draft.noticeType)) errors.noticeType = "NOTICE_TYPE";
  for (const key of ["noticeDate", "appointmentDate", "deadline"]) {
    if (draft[key] && !isCalendarDate(draft[key])) errors[key] = "DATE";
  }
  if (draft.appointmentTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.appointmentTime)) errors.appointmentTime = "TIME";
  if (draft.receiptNumber && !/^[A-Z]{3}\d{10}$/.test(String(draft.receiptNumber).replace(/[\s-]/g, "").toUpperCase())) errors.receiptNumber = "RECEIPT";
  const receipt = String(draft.receiptNumber || "").replace(/[\s-]/g, "").toUpperCase();
  if (receipt && caseProfile.receiptNumber && receipt !== caseProfile.receiptNumber) errors.receiptNumber = "RECEIPT_MISMATCH";
  if (draft.warning === "OTHER_FORM") errors.formType = "OTHER_FORM";
  return errors;
}

/** A historical notice adds evidence without silently undoing a newer confirmed step. */
export function noticeUpdatesCurrentStage(draft = {}, caseProfile = {}) {
  const next = NOTICE_STAGE[draft.noticeType];
  const current = caseProfile.currentStage;
  if (!next) return false;
  if (!CASE_STAGES.includes(current)) return true;
  const noticeDate = isCalendarDate(draft.noticeDate) ? draft.noticeDate : "";
  const currentDate = isCalendarDate(caseProfile.lastConfirmedStatusDate) ? caseProfile.lastConfirmedStatusDate : "";
  if (noticeDate && currentDate && noticeDate < currentDate) return false;
  if (current === "CITIZEN" || current === "OATH_COMPLETED") return false;
  if (noticeDate && currentDate && noticeDate > currentDate) return true;
  if (next === "ADDITIONAL_EVIDENCE") return true;
  if (current === "ADDITIONAL_EVIDENCE") return false;
  return CASE_STAGES.indexOf(next) >= CASE_STAGES.indexOf(current);
}

/** Explicit confirmation is the only route from an extracted draft to a saved case update. */
export function confirmNoticeDraft(draft, caseProfile = {}, { confirmed = false, now = new Date().toISOString() } = {}) {
  if (confirmed !== true) throw new Error("Notice confirmation is required.");
  if (Object.keys(validateNoticeDraft(draft, caseProfile)).length) throw new Error("Review the notice fields before confirming.");
  const id = globalThis.crypto?.randomUUID?.() || `notice-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const notice = {
    id, noticeType: draft.noticeType,
    noticeDate: draft.noticeDate || "", appointmentDate: draft.appointmentDate || "",
    appointmentTime: draft.appointmentTime || "", fieldOffice: safeLine(draft.fieldOffice, 200),
    location: safeLine(draft.location), deadline: draft.deadline || "",
    source: "USCIS_NOTICE", confidence: "USER_CONFIRMED", confirmedAt: now,
  };
  const updatesStage = noticeUpdatesCurrentStage(draft, caseProfile);
  const patch = {
    formType: "N-400",
    ...(updatesStage ? { currentStage: NOTICE_STAGE[draft.noticeType], source: "USCIS_NOTICE", confidence: "USER_CONFIRMED", lastConfirmedStatus: getNoticeTypeLabel(draft.noticeType), lastConfirmedStatusDate: notice.noticeDate || now.slice(0, 10) } : {}),
    notices: [...(caseProfile.notices || []), notice].slice(-100),
    events: [...(caseProfile.events || []), { id: `event-${id}`, eventType: NOTICE_STAGE[draft.noticeType], title: getNoticeTypeLabel(draft.noticeType), eventDate: notice.noticeDate || now.slice(0, 10), source: "USCIS_NOTICE", confidence: "USER_CONFIRMED", createdAt: now }].slice(-100),
  };
  // Full receipt numbers appear only in the private canonical profile, never in notices/events.
  if (draft.receiptNumber) patch.receiptNumber = String(draft.receiptNumber).replace(/[\s-]/g, "").toUpperCase();
  if (notice.fieldOffice && (updatesStage || !caseProfile.fieldOffice)) patch.fieldOffice = notice.fieldOffice;
  if (notice.location && updatesStage) patch.appointmentLocation = notice.location;
  const prefix = { INTERVIEW: "interview", BIOMETRICS: "biometrics", OATH: "oath" }[draft.noticeType];
  if (prefix && notice.appointmentDate && (updatesStage || !caseProfile[`${prefix}Date`])) patch[`${prefix}Date`] = notice.appointmentDate;
  if (prefix && notice.appointmentTime && (updatesStage || !caseProfile[`${prefix}Time`])) patch[`${prefix}Time`] = notice.appointmentTime;
  if (notice.deadline && (updatesStage || !caseProfile.evidenceDeadline)) patch.evidenceDeadline = notice.deadline;
  return patch;
}

/** Reuses the study-guide PDF.js implementation. No upload or raw-document persistence. */
export async function extractNoticePdfText(file) {
  if (!file || (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name || ""))) throw new Error("PDF_ONLY");
  if (file.size > 10 * 1024 * 1024) throw new Error("FILE_TOO_LARGE");
  const [{ GlobalWorkerOptions, getDocument }, worker] = await Promise.all([
    import("pdfjs-dist"), import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  GlobalWorkerOptions.workerSrc = worker.default;
  const task = getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false });
  try {
    const document = await task.promise;
    if (document.numPages > 12) throw new Error("TOO_MANY_PAGES");
    const lines = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const content = await (await document.getPage(pageNumber)).getTextContent();
      lines.push(content.items.map(item => `${item.str || ""}${item.hasEOL ? "\n" : " "}`).join(""));
    }
    const text = lines.join("\n").slice(0, 160_000);
    if (text.trim().length < 25) throw new Error("OCR_UNAVAILABLE");
    return text;
  } finally {
    await task.destroy();
  }
}
