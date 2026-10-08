import { useState } from "react";
import { sanitizeBrainProfile, diffBrainProfile } from "../shared/brainProfile.js";
import { isBrainProfileSessionOnly } from "./brainProfileStorage.js";
import "./Profile.css";

const COPY = {
  en: { title: "Your profile", intro: "Share only what helps your preparation. We remember it across practice, your journey and civics.", back: "Back", local: "Saved on this device", privacy: "Your address, dates and confirmed N-400 details stay in this browser unless you choose cloud storage below. Use a private device. Do not enter an A-number, Social Security number or account password.", personal: "Personal details and address", immigration: "Application details", n400: "N-400 context", study: "Minutes available to study each day", firstName: "First name", middleName: "Middle name", lastName: "Last name", dateOfBirth: "Date of birth", streetAddress: "Street address", city: "City", state: "State", zipCode: "ZIP code", greenCardSince: "Permanent resident since", filingDate: "N-400 filing date", receiptNumber: "Receipt number (optional)", fieldOffice: "Field office", interviewDate: "Interview date", interviewTime: "Interview time", oathDate: "Oath date", eligibilityBasis: "Application basis (optional)", empty: "Not provided", yes: "Yes", no: "No", unknown: "Not provided", save: "Save on this device", saved: "Your profile is saved on this device.", civil: "View civic profile", cloud: "Optional cloud profile", cloudCopy: "Save an encrypted copy to your signed-in account. Saving and restoring are manual. Your civic profile and learning progress stay in their existing device storage.", consent: "I agree to store an encrypted copy of my personal details, address, application dates, receipt number, confirmed N-400 details and journey in my account.", cloudSave: "Save encrypted copy", cloudRestore: "Restore cloud copy", cloudDelete: "Delete cloud copy", account: "Open account", remove: "Clear this device profile", restoreConfirm: "Replace this device profile with the cloud copy?", deleteConfirm: "Delete the cloud profile? Your profile on this device will remain.", resetConfirm: "Clear your personal profile, application details and journey from this device? Learning progress and your cloud copy will remain.", residence: "Residence history", travel: "Travel history", employment: "Employment history", add: "Add entry", removeEntry: "Remove entry", address: "Address", country: "Country", departureDate: "Departure date", returnDate: "Return date", employer: "Employer or school", occupation: "Occupation", fromDate: "From date", toDate: "To date", flags: "Use your own confirmed information. Leave an item unprovided if you are unsure.", answerSummary: "confirmed practice answers saved", statuses: { saving: "Saving your secure copy…", saved: "Encrypted cloud copy saved.", restoring: "Restoring your profile…", restored: "Cloud copy restored to this device.", deleting: "Removing your cloud copy…", deleted: "Cloud profile removed. Device profile is unchanged.", sign_in_required: "Sign in to use cloud profile storage.", unavailable: "Secure cloud storage is not available yet. Your profile remains on this device.", error: "We could not update your cloud profile. Please try again.", empty: "There is no saved cloud profile yet.", conflict: "Your profile changed while restoring. Your latest device changes were kept." } },
  es: { title: "Tu perfil", intro: "Comparte solo lo que ayude a prepararte. Lo recordamos en tus prácticas, tu proceso y civismo.", back: "Volver", local: "Guardado en este dispositivo", privacy: "Tu dirección, fechas y datos confirmados del N-400 permanecen en este navegador, a menos que elijas guardarlos en la nube abajo. Usa un dispositivo privado. No ingreses tu número A, número de Seguro Social ni contraseñas.", personal: "Datos personales y dirección", immigration: "Datos de la solicitud", n400: "Contexto del N-400", study: "Minutos disponibles para estudiar cada día", firstName: "Nombre", middleName: "Segundo nombre", lastName: "Apellido", dateOfBirth: "Fecha de nacimiento", streetAddress: "Dirección", city: "Ciudad", state: "Estado", zipCode: "Código postal", greenCardSince: "Residente permanente desde", filingDate: "Fecha de presentación del N-400", receiptNumber: "Número de recibo (opcional)", fieldOffice: "Oficina local", interviewDate: "Fecha de entrevista", interviewTime: "Hora de entrevista", oathDate: "Fecha de juramento", eligibilityBasis: "Base de la solicitud (opcional)", empty: "Sin proporcionar", yes: "Sí", no: "No", unknown: "Sin proporcionar", save: "Guardar en este dispositivo", saved: "Tu perfil está guardado en este dispositivo.", civil: "Ver perfil cívico", cloud: "Perfil en la nube opcional", cloudCopy: "Guarda una copia cifrada en tu cuenta. Guardar y restaurar son acciones manuales. Tu perfil cívico y progreso conservan su almacenamiento actual en el dispositivo.", consent: "Acepto guardar una copia cifrada de mis datos personales, dirección, fechas, número de recibo, datos confirmados del N-400 y proceso en mi cuenta.", cloudSave: "Guardar copia cifrada", cloudRestore: "Restaurar copia", cloudDelete: "Eliminar copia de la nube", account: "Abrir cuenta", remove: "Borrar el perfil del dispositivo", restoreConfirm: "¿Reemplazar el perfil de este dispositivo con la copia de la nube?", deleteConfirm: "¿Eliminar el perfil de la nube? El perfil de este dispositivo permanecerá.", resetConfirm: "¿Borrar tus datos personales, solicitud y proceso de este dispositivo? Tu progreso de estudio y copia de la nube permanecerán.", residence: "Historial de domicilios", travel: "Historial de viajes", employment: "Historial de empleo", add: "Agregar entrada", removeEntry: "Eliminar entrada", address: "Dirección", country: "País", departureDate: "Fecha de salida", returnDate: "Fecha de regreso", employer: "Empleador o escuela", occupation: "Ocupación", fromDate: "Desde", toDate: "Hasta", flags: "Usa tu propia información confirmada. Deja sin proporcionar lo que no sepas.", answerSummary: "respuestas de práctica confirmadas guardadas", statuses: { saving: "Guardando tu copia segura…", saved: "Copia cifrada guardada en la nube.", restoring: "Restaurando tu perfil…", restored: "Copia restaurada en este dispositivo.", deleting: "Eliminando tu copia de la nube…", deleted: "Perfil de la nube eliminado. El perfil del dispositivo permanece.", sign_in_required: "Inicia sesión para guardar tu perfil en la nube.", unavailable: "El almacenamiento seguro en la nube aún no está disponible. Tu perfil permanece en este dispositivo.", error: "No pudimos actualizar el perfil de la nube. Inténtalo de nuevo.", empty: "Todavía no hay un perfil guardado en la nube.", conflict: "Tu perfil cambió durante la restauración. Conservamos los cambios recientes del dispositivo." } },
};
const FLAG_LABELS = {
  en: { married: "Currently married", previously_married: "Previously married", has_children: "Have children", has_travel: "Traveled outside the United States", name_changed: "Changed your legal name", selective_service_applicable: "Selective Service applies to you", served_us_military: "Served in the U.S. military" },
  es: { married: "Actualmente casado/a", previously_married: "Matrimonios anteriores", has_children: "Tienes hijos", has_travel: "Viajaste fuera de Estados Unidos", name_changed: "Cambiaste tu nombre legal", selective_service_applicable: "Te corresponde el Servicio Selectivo", served_us_military: "Serviste en las Fuerzas Armadas de EE. UU." },
};
const HISTORIES = [
  { key: "residenceHistory", title: "residence", fields: ["address", "city", "state", "zipCode", "fromDate", "toDate"] },
  { key: "travelHistory", title: "travel", fields: ["country", "departureDate", "returnDate"] },
  { key: "employmentHistory", title: "employment", fields: ["employer", "occupation", "fromDate", "toDate"] },
];

export function Profile({ language = "en", profile, onUpdate, onBack, onOpenCivicProfile, onOpenAccount, onOpenSettings, cloudStatus = "local", onSaveCloud, onRestoreCloud, onDeleteCloud, onReset }) {
  const [draft, setDraft] = useState(() => sanitizeBrainProfile(profile));
  const [sourceProfile, setSourceProfile] = useState(profile);
  const [saved, setSaved] = useState(false);
  const [consent, setConsent] = useState(false);
  const copy = COPY[language === "es" ? "es" : "en"];
  const busy = ["saving", "restoring", "deleting"].includes(cloudStatus);
  const sessionOnly = isBrainProfileSessionOnly(profile);
  const sessionMessage = language === "es" ? "Este navegador no puede guardar tu perfil. Tus cambios solo permanecen durante esta sesión; se perderán al cerrar o recargar." : "This browser cannot save your profile. Your changes remain only for this session and will be lost when you close or reload.";
  if (sourceProfile !== profile) {
    setSourceProfile(profile);
    setDraft(sanitizeBrainProfile(profile));
    setSaved(false);
    setConsent(false);
  }
  const update = (domain, key, value) => { setDraft(current => ({ ...current, [domain]: { ...current[domain], [key]: value } })); setSaved(false); };
  const field = (domain, key, type = "text", props = {}) => <label className="profile-field" key={key} htmlFor={`profile-${domain}-${key}`}><span>{copy[key]}</span><input id={`profile-${domain}-${key}`} type={type} value={draft[domain]?.[key] || ""} onChange={event => update(domain, key, event.target.value)} maxLength={type === "text" ? 160 : undefined} {...props} /></label>;
  const save = event => {
    event?.preventDefault();
    const next = onUpdate(diffBrainProfile(profile, draft));
    if (next) { setSourceProfile(next); setDraft(next); }
    setSaved(true);
  };
  function updateHistory(key, index, field, value) {
    const entries = [...draft.n400Profile[key]];
    entries[index] = { ...entries[index], [field]: value };
    update("n400Profile", key, entries);
  }
  return <div className="app profile-screen">
    <header className="profile-header"><button type="button" className="profile-tertiary" onClick={onBack}>← {copy.back}</button><span className="practice-brand">CITIZENSHIP <span>AI</span></span></header>
    <main className="profile-content">
      <h1>{copy.title}</h1><p className="profile-intro">{copy.intro}</p>
      <p className="profile-privacy">{copy.privacy}</p>
      {sessionOnly && <p role="status">{sessionMessage}</p>}
      <form onSubmit={save}>
        <label className="profile-field profile-study-time" htmlFor="profile-study-minutes"><span>{copy.study}</span><input id="profile-study-minutes" type="number" min="1" max="120" value={draft.preferences.availableStudyMinutes} onChange={event => update("preferences", "availableStudyMinutes", event.target.value)} /></label>
        <details className="profile-section" open><summary>{copy.personal}</summary><div className="profile-form-grid">
          {field("userProfile", "firstName", "text", { autoComplete: "given-name" })}{field("userProfile", "middleName", "text", { autoComplete: "additional-name" })}{field("userProfile", "lastName", "text", { autoComplete: "family-name" })}{field("userProfile", "dateOfBirth", "date", { autoComplete: "bday" })}
          {field("userProfile", "streetAddress", "text", { autoComplete: "address-line1" })}{field("userProfile", "city", "text", { autoComplete: "address-level2" })}{field("userProfile", "state", "text", { autoComplete: "address-level1" })}{field("userProfile", "zipCode", "text", { autoComplete: "postal-code", inputMode: "numeric", pattern: "[0-9]{5}(-[0-9]{4})?", maxLength: 10 })}
        </div><button type="button" className="profile-tertiary" onClick={onOpenCivicProfile}>{copy.civil} →</button></details>
        <details className="profile-section"><summary>{copy.immigration}</summary><div className="profile-form-grid">
          {field("immigrationProfile", "greenCardSince", "date")}{field("immigrationProfile", "eligibilityBasis")}{field("immigrationProfile", "filingDate", "date")}{field("immigrationProfile", "receiptNumber", "text", { pattern: "[A-Za-z]{3}[0-9]{10}", maxLength: 13, autoComplete: "off" })}{field("immigrationProfile", "fieldOffice")}{field("immigrationProfile", "interviewDate", "date")}{field("immigrationProfile", "interviewTime", "time")}{field("immigrationProfile", "oathDate", "date")}
        </div></details>
        <details className="profile-section"><summary>{copy.n400}</summary><p>{copy.flags}</p><div className="profile-form-grid">
          {Object.entries(FLAG_LABELS[language === "es" ? "es" : "en"]).map(([key, label]) => <label className="profile-field" key={key} htmlFor={`profile-flag-${key}`}><span>{label}</span><select id={`profile-flag-${key}`} value={typeof draft.n400Profile.flags[key] === "boolean" ? String(draft.n400Profile.flags[key]) : ""} onChange={event => update("n400Profile", "flags", { ...draft.n400Profile.flags, [key]: event.target.value === "" ? null : event.target.value === "true" })}><option value="">{copy.unknown}</option><option value="true">{copy.yes}</option><option value="false">{copy.no}</option></select></label>)}
        </div>
          {Object.keys(draft.n400Profile.answers).length > 0 && <p>{Object.keys(draft.n400Profile.answers).length} {copy.answerSummary}</p>}
          {HISTORIES.map(history => <details className="profile-history" key={history.key}><summary>{copy[history.title]}</summary>
            {draft.n400Profile[history.key].map((entry, index) => <div className="profile-history-row" key={index}><div className="profile-form-grid">{history.fields.map(key => <label className="profile-field" key={key} htmlFor={`profile-${history.key}-${index}-${key}`}><span>{copy[key]}</span><input id={`profile-${history.key}-${index}-${key}`} type={key.endsWith("Date") ? "date" : "text"} maxLength={160} value={entry[key] || ""} onChange={event => updateHistory(history.key, index, key, event.target.value)} /></label>)}</div><button type="button" className="profile-tertiary" onClick={() => update("n400Profile", history.key, draft.n400Profile[history.key].filter((_, i) => i !== index))}>{copy.removeEntry}</button></div>)}
            <button className="profile-secondary" type="button" disabled={draft.n400Profile[history.key].length >= 50} onClick={() => update("n400Profile", history.key, [...draft.n400Profile[history.key], {}])}>+ {copy.add}</button>
          </details>)}
        </details>
        <button className="profile-primary" type="submit" disabled={busy}>{copy.save}</button>
        {saved && !sessionOnly && <p role="status">{copy.saved}</p>}
      </form>
      <details className="profile-section profile-cloud"><summary>{copy.cloud}</summary><p>{copy.cloudCopy}</p>
        <label className="profile-consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} disabled={busy} /><span>{copy.consent}</span></label>
        <div className="profile-actions"><button type="button" className="profile-secondary" disabled={!consent || busy} onClick={() => { onUpdate(diffBrainProfile(profile, draft)); onSaveCloud?.(); }}>{copy.cloudSave}</button><button type="button" className="profile-tertiary" disabled={busy} onClick={() => { if (window.confirm(copy.restoreConfirm)) onRestoreCloud?.(); }}>{copy.cloudRestore}</button><button type="button" className="profile-tertiary" disabled={busy} onClick={() => { if (window.confirm(copy.deleteConfirm)) onDeleteCloud?.(); }}>{copy.cloudDelete}</button><button type="button" className="profile-tertiary" onClick={onOpenAccount}>{copy.account}</button></div>
        {copy.statuses[cloudStatus] && <p role="status" aria-live="polite">{copy.statuses[cloudStatus]}</p>}
      </details>
      <button className="profile-tertiary profile-clear" type="button" disabled={busy} onClick={() => { if (window.confirm(copy.resetConfirm)) { onReset?.(); setDraft(sanitizeBrainProfile()); } }}>{copy.remove}</button>
      {onOpenSettings && <button className="profile-tertiary" type="button" onClick={onOpenSettings}>{language === "es" ? "Privacidad y ajustes" : "Privacy and settings"} →</button>}
    </main>
  </div>;
}
