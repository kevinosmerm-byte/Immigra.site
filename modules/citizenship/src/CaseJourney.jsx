import { useRef, useState } from "react";
import "./Journey.css";
import {
  CASE_STAGES, JOURNEY_OFFICIAL_LINKS, formatJourneyDate, getJourneyChecklistProgress,
  getJourneyNextStep, getJourneySourceLabel, getJourneyStageLabel,
} from "./caseTracker.js";
import {
  NOTICE_TYPES, NOTICE_STAGE, noticeUpdatesCurrentStage, confirmNoticeDraft, extractNoticeDraft, extractNoticePdfText,
  getNoticeTypeLabel, isCalendarDate, validateNoticeDraft,
} from "./noticeParser.js";

const COPY = {
  en: {
    title: "Your citizenship journey", back: "Back", current: "Your confirmed stage", unknown: "Tell us where you are", unknownText: "Add a confirmed step or review a notice to personalize your preparation.",
    next: "What matters now", estimated: "Preparation guidance · the next step can vary", update: "Update journey", addNotice: "Review a notice", practice: "Continue preparation", documents: "Review your checklist", help: "Explore relevant help",
    official: "Check official USCIS status", processing: "Current USCIS processing information", independent: "Immigra is an independent educational service. Your USCIS notices and official sources control your case instructions.",
    stage: "Confirmed stage", stageHelp: "Choose only a step that actually happened or was confirmed. Not every case follows every step.", confirm: "Confirm update", cancel: "Cancel", saved: "Your journey has been updated. Your preparation will use this information.",
    date: "Date of confirmed update", filing: "N-400 filing date", interview: "Interview date", oath: "Oath date", biometrics: "Biometrics date", time: "Appointment time", office: "Field office", location: "Appointment location", deadline: "Evidence deadline", receipt: "Receipt number (optional)", optional: "Optional details", receiptHelp: "Kept in your private profile. It is not sent to USCIS by this screen.",
    noticeTitle: "Review a USCIS notice", noticeHelp: "Read a PDF with selectable text or enter the details yourself. Check every field against the original notice before confirming.", localOnly: "The file and pasted text stay on this device while you review. Only the structured fields you confirm are saved.", pdf: "Choose a PDF notice", paste: "Or paste the relevant notice text", extract: "Find details", manual: "Enter details manually", extracting: "Reading the notice…", found: "We found these details", type: "Notice type", noticeDate: "Notice date", appointmentDate: "Appointment date", confirmNotice: "Confirm and save details", review: "You can edit any field below. Nothing is saved until you confirm.",
    stagePreview: "After you confirm, your stage will be", historyPreview: "This notice will be added to your history. Your current stage stays", receiptMismatch: "This receipt number differs from your saved case. Check the notice and correct the number before confirming.", noOcr: "This notice needs image recognition, which is not available here. Read the original and enter the details manually.", failed: "We couldn't read this PDF. You can enter its details manually.", tooLarge: "Use a PDF smaller than 10 MB with no more than 12 pages, or enter the details manually.", otherForm: "This appears to describe another form. Use your N-400 notice or enter confirmed N-400 details manually.", notFound: "We couldn't identify the notice type. Choose it and check the details below.", validation: "Review the marked fields. Use valid dates, times and a 13-character receipt number.", saveError: "We couldn't save these details. Please try again.",
    checklist: "Preparation checklist", ready: "ready", suggestions: "Preparation suggestions. Check your appointment notice and current USCIS guidance for the documents required for your case.", unverified: "Current guidance could not be checked here; these are not a verified requirements list.", guidance: "Official guidance", history: "Confirmed history", emptyHistory: "No confirmed events yet. Add your current step when you are ready.", notices: "Confirmed notices", noneNotices: "No notices confirmed yet.", source: "Source", checked: "Last official check", appointment: "Appointment", noAppointment: "No appointment date confirmed here yet.",
  },
  es: {
    title: "Tu camino a la ciudadanía", back: "Volver", current: "Tu etapa confirmada", unknown: "Cuéntanos en qué etapa estás", unknownText: "Agrega un paso confirmado o revisa un aviso para personalizar tu preparación.",
    next: "Lo que importa ahora", estimated: "Orientación de preparación · el próximo paso puede variar", update: "Actualizar mi camino", addNotice: "Revisar un aviso", practice: "Continuar preparación", documents: "Revisar tu lista", help: "Explorar ayuda relevante",
    official: "Consultar estado oficial en USCIS", processing: "Información actual de procesamiento de USCIS", independent: "Immigra es un servicio educativo independiente. Tus avisos de USCIS y las fuentes oficiales determinan las instrucciones de tu caso.",
    stage: "Etapa confirmada", stageHelp: "Elige solo un paso que ocurrió o fue confirmado. No todos los casos siguen todos los pasos.", confirm: "Confirmar actualización", cancel: "Cancelar", saved: "Tu camino se ha actualizado. Tu preparación usará esta información.",
    date: "Fecha de la actualización confirmada", filing: "Fecha de presentación del N-400", interview: "Fecha de entrevista", oath: "Fecha de juramento", biometrics: "Fecha de biometría", time: "Hora de cita", office: "Oficina local", location: "Lugar de cita", deadline: "Plazo de evidencia", receipt: "Número de recibo (opcional)", optional: "Detalles opcionales", receiptHelp: "Se conserva en tu perfil privado. Esta pantalla no lo envía a USCIS.",
    noticeTitle: "Revisar un aviso de USCIS", noticeHelp: "Lee un PDF con texto seleccionable o ingresa los detalles. Compara cada campo con el aviso original antes de confirmar.", localOnly: "El archivo y el texto pegado permanecen en este dispositivo durante la revisión. Solo se guardan los campos estructurados que confirmes.", pdf: "Elegir aviso en PDF", paste: "O pega el texto relevante del aviso", extract: "Buscar detalles", manual: "Ingresar detalles manualmente", extracting: "Leyendo el aviso…", found: "Encontramos estos detalles", type: "Tipo de aviso", noticeDate: "Fecha del aviso", appointmentDate: "Fecha de cita", confirmNotice: "Confirmar y guardar detalles", review: "Puedes editar cualquier campo. No se guarda nada hasta que confirmes.",
    stagePreview: "Después de confirmar, tu etapa será", historyPreview: "Este aviso se agregará al historial. Tu etapa actual sigue siendo", receiptMismatch: "Este número de recibo difiere de tu caso guardado. Revisa el aviso y corrige el número antes de confirmar.", noOcr: "Este aviso necesita reconocimiento de imágenes, que no está disponible aquí. Lee el original e ingresa los detalles manualmente.", failed: "No pudimos leer este PDF. Puedes ingresar sus detalles manualmente.", tooLarge: "Usa un PDF menor de 10 MB y de hasta 12 páginas, o ingresa los detalles manualmente.", otherForm: "Parece corresponder a otro formulario. Usa tu aviso N-400 o ingresa detalles confirmados del N-400 manualmente.", notFound: "No pudimos identificar el tipo de aviso. Selecciónalo y revisa los detalles.", validation: "Revisa los campos marcados. Usa fechas y horas válidas y un número de recibo de 13 caracteres.", saveError: "No pudimos guardar estos detalles. Inténtalo de nuevo.",
    checklist: "Lista de preparación", ready: "listos", suggestions: "Sugerencias de preparación. Revisa tu aviso de cita y la orientación actual de USCIS para los documentos que requiere tu caso.", unverified: "Aquí no se pudo comprobar la orientación actual; esta lista no es una lista verificada de requisitos.", guidance: "Orientación oficial", history: "Historial confirmado", emptyHistory: "Aún no hay eventos confirmados. Agrega tu etapa actual cuando estés listo.", notices: "Avisos confirmados", noneNotices: "Aún no has confirmado avisos.", source: "Fuente", checked: "Última consulta oficial", appointment: "Cita", noAppointment: "Aún no hay una fecha de cita confirmada aquí.",
  },
};
const EMPTY_NOTICE = { noticeType: "", noticeDate: "", appointmentDate: "", appointmentTime: "", fieldOffice: "", location: "", receiptNumber: "", deadline: "", warning: "" };

function manualDraft(profile) {
  const fields = ["filingDate", "interviewDate", "interviewTime", "biometricsDate", "biometricsTime", "oathDate", "oathTime", "evidenceDeadline", "fieldOffice", "appointmentLocation", "receiptNumber"];
  return Object.fromEntries([["currentStage", profile.currentStage || "PREPARING_N400"], ["lastConfirmedStatusDate", ""], ...fields.map(key => [key, profile[key] || ""])]);
}
function newId() { return globalThis.crypto?.randomUUID?.() || `event-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }

export default function CaseJourney({ language = "en", userKey = "guest", caseProfile = {}, n400Profile = {}, onUpdate, onNavigate, onBack }) {
  const copy = COPY[language === "es" ? "es" : "en"];
  const [mode, setMode] = useState("");
  const [manual, setManual] = useState(() => manualDraft(caseProfile));
  const [noticeText, setNoticeText] = useState("");
  const [noticeDraft, setNoticeDraft] = useState(null);
  const [noticeMessage, setNoticeMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const checklistRef = useRef(null);
  const parseRevision = useRef(0);
  const nextStep = getJourneyNextStep(caseProfile, language);
  const checklist = getJourneyChecklistProgress(caseProfile, n400Profile, language);
  const stage = caseProfile.currentStage;
  const scheduledPrefix = stage === "INTERVIEW_SCHEDULED" ? "interview" : stage === "OATH_SCHEDULED" ? "oath" : stage === "BIOMETRICS_PENDING" ? "biometrics" : null;
  const appointmentDate = scheduledPrefix ? caseProfile[`${scheduledPrefix}Date`] : "";
  const appointmentTime = scheduledPrefix ? caseProfile[`${scheduledPrefix}Time`] : "";

  const closeEditor = () => {
    parseRevision.current += 1;
    setMode(""); setNoticeText(""); setNoticeDraft(null); setNoticeMessage(""); setErrors({}); setReading(false);
  };
  const openEditor = nextMode => {
    closeEditor(); setMessage(""); setManual(manualDraft(caseProfile)); setMode(nextMode);
  };
  const savePatch = async patch => {
    setSaving(true); setErrors({});
    try {
      await onUpdate?.(patch);
      closeEditor(); setMessage(copy.saved);
    } catch {
      setMessage(copy.saveError);
    } finally { setSaving(false); }
  };
  const submitManual = event => {
    event.preventDefault();
    const invalid = {};
    for (const key of ["filingDate", "interviewDate", "oathDate", "biometricsDate", "evidenceDeadline", "lastConfirmedStatusDate"]) if (manual[key] && !isCalendarDate(manual[key])) invalid[key] = "DATE";
    for (const key of ["interviewTime", "oathTime", "biometricsTime"]) if (manual[key] && !/^([01]\d|2[0-3]):[0-5]\d$/.test(manual[key])) invalid[key] = "TIME";
    if (manual.receiptNumber && !/^[A-Z]{3}\d{10}$/.test(manual.receiptNumber)) invalid.receiptNumber = "RECEIPT";
    if (!CASE_STAGES.includes(manual.currentStage)) invalid.currentStage = "STAGE";
    if (Object.keys(invalid).length) { setErrors(invalid); return; }
    const now = new Date().toISOString();
    savePatch({ ...manual, formType: "N-400", source: "USER_CONFIRMED", confidence: "USER_CONFIRMED", lastConfirmedStatus: getJourneyStageLabel(manual.currentStage), lastConfirmedStatusDate: manual.lastConfirmedStatusDate || now.slice(0, 10), events: [...(caseProfile.events || []), { id: newId(), eventType: manual.currentStage, title: getJourneyStageLabel(manual.currentStage), eventDate: manual.lastConfirmedStatusDate || now.slice(0, 10), source: "USER_CONFIRMED", confidence: "USER_CONFIRMED", createdAt: now }].slice(-100) });
  };
  const setExtracted = text => {
    const draft = extractNoticeDraft(text);
    setNoticeDraft({ ...draft, receiptNumber: draft.receiptNumber || caseProfile.receiptNumber || "", fieldOffice: draft.fieldOffice || caseProfile.fieldOffice || "" });
    setNoticeText(""); setErrors({});
    setNoticeMessage(draft.warning === "OTHER_FORM" ? copy.otherForm : draft.warning === "TYPE_NOT_FOUND" ? copy.notFound : "");
  };
  const readPdf = async event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const revision = ++parseRevision.current;
    setReading(true); setNoticeMessage(""); setNoticeDraft(null); setErrors({});
    try {
      const text = await extractNoticePdfText(file);
      if (revision === parseRevision.current) setExtracted(text);
    } catch (error) {
      if (revision !== parseRevision.current) return;
      setNoticeDraft({ ...EMPTY_NOTICE, receiptNumber: caseProfile.receiptNumber || "", fieldOffice: caseProfile.fieldOffice || "" });
      setNoticeMessage(error.message === "OCR_UNAVAILABLE" || error.message === "PDF_ONLY" ? copy.noOcr : ["FILE_TOO_LARGE", "TOO_MANY_PAGES"].includes(error.message) ? copy.tooLarge : copy.failed);
    } finally { if (revision === parseRevision.current) setReading(false); }
  };
  const submitNotice = event => {
    event.preventDefault();
    const invalid = validateNoticeDraft(noticeDraft, caseProfile);
    if (Object.keys(invalid).length) { setErrors(invalid); return; }
    savePatch(confirmNoticeDraft(noticeDraft, caseProfile, { confirmed: true }));
  };
  const field = (key, label, value, update, type = "text", maxLength = 200) => <label className="journey-field" key={key}>
    <span>{label}</span>
    <input name={key} type={type} value={value || ""} maxLength={maxLength} autoComplete="off" aria-invalid={Boolean(errors[key])} onChange={event => { update(event.target.value); setErrors(current => ({ ...current, [key]: undefined })); }} />
  </label>;
  const manualField = (key, label, type = "text") => field(key, label, manual[key], value => setManual(current => ({ ...current, [key]: key === "receiptNumber" ? value.toUpperCase().replace(/[\s-]/g, "") : value })), type, key === "receiptNumber" ? 13 : 200);
  const noticeField = (key, label, type = "text") => field(key, label, noticeDraft?.[key], value => setNoticeDraft(current => ({ ...current, [key]: key === "receiptNumber" ? value.toUpperCase().replace(/[\s-]/g, "") : value })), type, key === "receiptNumber" ? 13 : 240);
  const reviewChecklist = () => { if (checklistRef.current) { checklistRef.current.open = true; checklistRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); checklistRef.current.querySelector("summary")?.focus(); } };
  const followNextStep = () => nextStep.destination === "uscisTracker" ? reviewChecklist() : onNavigate?.(nextStep.destination, nextStep.mode ? { mode: nextStep.mode } : undefined);

  return <div className="app journey-screen" data-user-scope={userKey === "guest" ? "guest" : "account"}>
    <header className="practice-header journey-header"><button className="back-button" type="button" onClick={onBack}>← {copy.back}</button></header>
    <main className="journey-main"><EducationNotice language={language} compact />
      <div className="journey-heading"><h1>{copy.title}</h1><p>{copy.independent}</p></div>
      <section className="journey-summary" aria-labelledby="journey-stage-title">
        <span className="journey-eyebrow">{stage ? copy.current : copy.unknown}</span>
        <h2 id="journey-stage-title">{stage ? getJourneyStageLabel(stage, language) : copy.unknownText}</h2>
        {stage && <p className="journey-source">{getJourneySourceLabel(caseProfile.source, caseProfile.confidence, language)}{caseProfile.lastConfirmedStatusDate && ` · ${formatJourneyDate(caseProfile.lastConfirmedStatusDate, language)}`}</p>}
        {scheduledPrefix && <p className="journey-appointment">{appointmentDate ? <><strong>{formatJourneyDate(appointmentDate, language)}</strong>{appointmentTime && ` · ${appointmentTime}`}{caseProfile.fieldOffice && ` · ${caseProfile.fieldOffice}`}</> : copy.noAppointment}</p>}
        {caseProfile.appointmentLocation && scheduledPrefix && <p className="journey-location">{caseProfile.appointmentLocation}</p>}
        {stage === "ADDITIONAL_EVIDENCE" && caseProfile.evidenceDeadline && <p><strong>{copy.deadline}: {formatJourneyDate(caseProfile.evidenceDeadline, language)}</strong></p>}
        <div className="journey-next-step"><h3>{copy.next}: {nextStep.title}</h3><p>{nextStep.description}</p><small>{copy.estimated}</small></div>
        <div className="journey-actions">
          {!mode && <button className="journey-primary" type="button" onClick={stage ? followNextStep : () => openEditor("update")}>{stage ? (nextStep.destination === "uscisTracker" ? copy.documents : nextStep.destination === "immigrationHelp" ? copy.help : copy.practice) : copy.update} →</button>}
          {stage && <button className="journey-secondary" type="button" onClick={() => openEditor("update")}>{copy.update}</button>}
          <button className="journey-secondary" type="button" onClick={() => openEditor("notice")}>{copy.addNotice}</button>
        </div>
      </section>
      {message && <p className="journey-status" role="status">{message}</p>}
      {mode === "update" && <section className="journey-panel" aria-labelledby="journey-edit-title">
        <h2 id="journey-edit-title">{copy.update}</h2><p>{copy.stageHelp}</p>
        <form className="journey-form" onSubmit={submitManual} noValidate>
          <div className="journey-field-grid"><label className="journey-field"><span>{copy.stage}</span><select name="currentStage" value={manual.currentStage} onChange={event => setManual(current => ({ ...current, currentStage: event.target.value }))}>{CASE_STAGES.map(item => <option key={item} value={item}>{getJourneyStageLabel(item, language)}</option>)}</select></label>{manualField("lastConfirmedStatusDate", copy.date, "date")}</div>
          <div className="journey-field-grid">
            {manual.currentStage === "N400_FILED" && manualField("filingDate", copy.filing, "date")}
            {manual.currentStage === "INTERVIEW_SCHEDULED" && <>{manualField("interviewDate", copy.interview, "date")}{manualField("interviewTime", copy.time, "time")}</>}
            {manual.currentStage === "OATH_SCHEDULED" && <>{manualField("oathDate", copy.oath, "date")}{manualField("oathTime", copy.time, "time")}</>}
            {manual.currentStage === "BIOMETRICS_PENDING" && <>{manualField("biometricsDate", copy.biometrics, "date")}{manualField("biometricsTime", copy.time, "time")}</>}
            {manual.currentStage === "ADDITIONAL_EVIDENCE" && manualField("evidenceDeadline", copy.deadline, "date")}
          </div>
          <details><summary>{copy.optional}</summary><div className="journey-field-grid">{manualField("fieldOffice", copy.office)}{manualField("appointmentLocation", copy.location)}{manualField("receiptNumber", copy.receipt)}</div><p className="journey-note">{copy.receiptHelp}</p></details>
          {Object.values(errors).some(Boolean) && <p className="journey-error" role="alert">{errors.receiptNumber === "RECEIPT_MISMATCH" ? copy.receiptMismatch : copy.validation}</p>}
          <div className="journey-actions"><button className="journey-primary" disabled={saving} aria-busy={saving}>{copy.confirm}</button><button className="journey-secondary" type="button" disabled={saving} onClick={closeEditor}>{copy.cancel}</button></div>
        </form>
      </section>}
      {mode === "notice" && <section className="journey-panel" aria-labelledby="journey-notice-title">
        <h2 id="journey-notice-title">{copy.noticeTitle}</h2><p>{copy.noticeHelp}</p><p className="journey-note">{copy.localOnly}</p>
        {!noticeDraft && <div className="journey-form">
          <label className="journey-field"><span>{copy.pdf}</span><input type="file" accept="application/pdf,.pdf,image/png,image/jpeg" disabled={reading} onChange={readPdf} /></label>
          <label className="journey-field"><span>{copy.paste}</span><textarea value={noticeText} maxLength={160000} rows={5} onChange={event => setNoticeText(event.target.value)} disabled={reading} /></label>
          <div className="journey-actions"><button className="journey-primary" type="button" disabled={reading || !noticeText.trim()} onClick={() => setExtracted(noticeText)}>{copy.extract}</button><button className="journey-secondary" type="button" disabled={reading} onClick={() => { setNoticeDraft({ ...EMPTY_NOTICE, receiptNumber: caseProfile.receiptNumber || "", fieldOffice: caseProfile.fieldOffice || "" }); setNoticeText(""); }}>{copy.manual}</button><button className="journey-secondary" type="button" onClick={closeEditor}>{copy.cancel}</button></div>
        </div>}
        {reading && <p role="status" aria-live="polite">{copy.extracting}</p>}
        {noticeMessage && <p className="journey-note" role="status">{noticeMessage}</p>}
        {noticeDraft && <form className="journey-form" onSubmit={submitNotice} noValidate>
          <h3>{copy.found}</h3><p>{copy.review}</p>{noticeDraft.noticeType && <p className="journey-note">{noticeUpdatesCurrentStage(noticeDraft, caseProfile) ? copy.stagePreview : copy.historyPreview}: <strong>{getJourneyStageLabel(noticeUpdatesCurrentStage(noticeDraft, caseProfile) ? NOTICE_STAGE[noticeDraft.noticeType] : caseProfile.currentStage, language)}</strong></p>}
          <div className="journey-field-grid"><label className="journey-field"><span>{copy.type}</span><select name="noticeType" value={noticeDraft.noticeType} aria-invalid={Boolean(errors.noticeType)} onChange={event => { setNoticeDraft(current => ({ ...current, noticeType: event.target.value })); setErrors(current => ({ ...current, noticeType: undefined })); }}><option value="">{getNoticeTypeLabel("", language)}</option>{NOTICE_TYPES.map(type => <option key={type} value={type}>{getNoticeTypeLabel(type, language)}</option>)}</select></label>{noticeField("noticeDate", copy.noticeDate, "date")}{noticeField("appointmentDate", copy.appointmentDate, "date")}{noticeField("appointmentTime", copy.time, "time")}{noticeField("fieldOffice", copy.office)}{noticeField("location", copy.location)}{noticeField("deadline", copy.deadline, "date")}{noticeField("receiptNumber", copy.receipt)}</div>
          {noticeDraft.warning === "OTHER_FORM" && <p className="journey-error" role="alert">{copy.otherForm} <button className="journey-secondary" type="button" onClick={() => { setNoticeDraft({ ...EMPTY_NOTICE, receiptNumber: caseProfile.receiptNumber || "", fieldOffice: caseProfile.fieldOffice || "" }); setNoticeMessage(""); setErrors({}); }}>{copy.manual}</button></p>}
          {Object.values(errors).some(Boolean) && <p className="journey-error" role="alert">{errors.receiptNumber === "RECEIPT_MISMATCH" ? copy.receiptMismatch : copy.validation}</p>}
          <div className="journey-actions"><button className="journey-primary" disabled={saving || noticeDraft.warning === "OTHER_FORM"} aria-busy={saving}>{copy.confirmNotice}</button><button className="journey-secondary" type="button" disabled={saving} onClick={closeEditor}>{copy.cancel}</button></div>
        </form>}
      </section>}
      <details ref={checklistRef} className="journey-panel journey-checklist" open={stage === "INTERVIEW_SCHEDULED" || stage === "OATH_SCHEDULED" || stage === "ADDITIONAL_EVIDENCE"}>
        <summary>{copy.checklist} <span>{checklist.completed}/{checklist.total} {copy.ready}</span></summary>
        <p>{copy.suggestions}</p><p className="journey-note">{copy.unverified}</p>
        <ul>{checklist.items.map(item => <li key={item.id}><label><input type="checkbox" checked={(caseProfile.checklistCompletedIds || []).includes(item.id)} onChange={event => { const ids = new Set(caseProfile.checklistCompletedIds || []); if (event.target.checked) ids.add(item.id); else ids.delete(item.id); onUpdate?.({ checklistCompletedIds: [...ids] }); }} /><span>{item.label}</span></label><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`${copy.guidance}: ${item.label}`}>{copy.guidance}</a></li>)}</ul>
      </details>
      <details className="journey-panel journey-history"><summary>{copy.history} <span>{(caseProfile.events || []).length}</span></summary>{(caseProfile.events || []).length ? <ol>{[...(caseProfile.events || [])].reverse().map(event => <li key={event.id}><strong>{CASE_STAGES.includes(event.eventType) ? getJourneyStageLabel(event.eventType, language) : event.title}</strong><span>{formatJourneyDate(event.eventDate, language)}</span><small>{getJourneySourceLabel(event.source, event.confidence, language)}</small></li>)}</ol> : <p>{copy.emptyHistory}</p>}</details>
      <details className="journey-panel journey-notices"><summary>{copy.notices} <span>{(caseProfile.notices || []).length}</span></summary>{(caseProfile.notices || []).length ? <ul>{[...(caseProfile.notices || [])].reverse().map(notice => <li key={notice.id}><strong>{getNoticeTypeLabel(notice.noticeType, language)}</strong><span>{formatJourneyDate(notice.noticeDate, language)}</span>{notice.appointmentDate && <span>{copy.appointment}: {formatJourneyDate(notice.appointmentDate, language)} {notice.appointmentTime}</span>}{notice.deadline && <span>{copy.deadline}: {formatJourneyDate(notice.deadline, language)}</span>}<small>{getJourneySourceLabel(notice.source, notice.confidence, language)}</small></li>)}</ul> : <p>{copy.noneNotices}</p>}</details>
      <div className="journey-official-links"><a href={JOURNEY_OFFICIAL_LINKS.status} target="_blank" rel="noopener noreferrer">{copy.official}</a><a href={JOURNEY_OFFICIAL_LINKS.processingTimes} target="_blank" rel="noopener noreferrer">{copy.processing}</a><p className="journey-note">{language === "es" ? "Los tiempos públicos de procesamiento son estimaciones, no una fecha personal de cita." : "Public processing times are estimates, not your personal appointment date."}</p></div>
    </main>
  </div>;
}

export { CaseJourney };
import { EducationNotice } from "./EducationNotice.jsx";
