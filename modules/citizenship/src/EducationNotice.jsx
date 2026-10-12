import { AUTHORIZED_HELP_URL, EDUCATION_NOTICE } from "./educationNotice.js";
import "./EducationNotice.css";

export function EducationNotice({ language = "en", compact = false }) {
  const copy = EDUCATION_NOTICE[language === "es" ? "es" : "en"];
  return <aside className={`education-notice ${compact ? "is-compact" : ""}`} aria-label={copy.title}>
    {!compact && <h2>{copy.title}</h2>}
    <p>{compact ? copy.short : copy.full}</p>
    <div className="education-notice-links">
      <a href="#/settings">{copy.legal}</a>
      <a href={AUTHORIZED_HELP_URL} target="_blank" rel="noopener noreferrer">{copy.help} ↗</a>
    </div>
  </aside>;
}
