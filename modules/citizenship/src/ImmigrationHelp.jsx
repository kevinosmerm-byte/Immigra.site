import {GlassCard} from '../../../shared/design-system/Glass.jsx';
import { useMemo, useRef, useState } from "react";
import { useModalFocus } from "./useModalFocus.js";
import { getJourneyStageLabel } from "./caseTracker.js";
import { IMMIGRATION_CATEGORIES, IMMIGRATION_RESOURCES, JOURNEY_HELP_CATEGORIES, JOURNEY_HELP_RESOURCE_IDS, getJourneyHelpCategory, getContextualHelpResources, localizedResource } from "./immigrationResources";

const COPY = {
  en: {
    eyebrow: "OFFICIAL U.S. RESOURCES", title: "Immigration Help", subtitle: "Official immigration tools and resources in one place.",
    search: "What do you need help with?", featured: "Featured tools", all: "All resources", noResults: "No matching resource found. Try a simpler phrase.",
    official: "Official Government Resource", open: "View details", back: "Back", leave: "YOU'RE LEAVING IMMIGRA",
    leaveText: "You're being redirected to an official U.S. government website.", independent: "Immigra is independent and is not affiliated with or endorsed by any U.S. government agency.",
    continue: "Continue to Official Website", cancel: "Cancel", verified: "Last verified", urgent: "NEED URGENT IMMIGRATION HELP?",
    urgentText: "Use official tools to locate a detained person, court information or legal help. Immigra does not promise legal representation.",
    context: "Help for your journey", stage: "Your stage", directory: "Other resources", notChecked: "Current guidance has not been verified here. Check the official source and your notice.", educational: "Educational information only — not legal advice.", unavailable: "This resource is currently under review.", home: "Home",
  },
  es: {
    eyebrow: "RECURSOS OFICIALES DE EE. UU.", title: "Ayuda Migratoria", subtitle: "Herramientas y recursos oficiales de inmigración en un solo lugar.",
    search: "¿Con qué necesitas ayuda?", featured: "Herramientas destacadas", all: "Todos los recursos", noResults: "No encontramos un recurso. Intenta una frase más sencilla.",
    official: "Recurso Oficial del Gobierno", open: "Ver detalles", back: "Volver", leave: "ESTÁS SALIENDO DE IMMIGRA",
    leaveText: "Serás redirigido a un sitio web oficial del gobierno de EE. UU.", independent: "Immigra es independiente y no está afiliado ni respaldado por ninguna agencia del gobierno de EE. UU.",
    continue: "Continuar al Sitio Oficial", cancel: "Cancelar", verified: "Última verificación", urgent: "¿NECESITAS AYUDA MIGRATORIA URGENTE?",
    urgentText: "Usa herramientas oficiales para localizar a una persona detenida, información de corte o ayuda legal. Immigra no promete representación legal.",
    context: "Ayuda para tu camino", stage: "Tu etapa", directory: "Otros recursos", notChecked: "Aquí no se ha verificado la orientación actual. Consulta la fuente oficial y tu aviso.", educational: "Información educativa únicamente — no es asesoría legal.", unavailable: "Este recurso está actualmente bajo revisión.", home: "Inicio",
  },
};

const SEARCH_STOP_WORDS = new Set(["a", "al", "de", "do", "el", "en", "for", "how", "i", "la", "las", "los", "me", "mi", "my", "need", "para", "por", "que", "the", "to", "un", "una", "where", "with", "yo"]);

function normalizeSearch(value) {
  return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]+/g, " ").trim();
}

export default function ImmigrationHelp({ language = "en", caseProfile = {}, studyGoal = "citizenship", onBack, onLanguageChange, embedded = false }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [journeyCategory, setJourneyCategory] = useState(() => getJourneyHelpCategory(caseProfile.currentStage));
  const [selectedId, setSelectedId] = useState(null);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const leavingOpener = useRef(null);
  const closeLeaving = () => {
    setLeaving(false);
    requestAnimationFrame(() => leavingOpener.current?.focus());
  };
  const leavingModal = useModalFocus(Boolean(leaving && selectedId), closeLeaving);
  const copy = COPY[language === "es" ? "es" : "en"];
  const resources = useMemo(() => IMMIGRATION_RESOURCES.map((item) => localizedResource(item, language)), [language]);
  const selected = resources.find(item => item.id === selectedId) || null;
  const normalized = normalizeSearch(query);
  const queryTerms = normalized.split(/\s+/).filter((term) => term.length > 1 && !SEARCH_STOP_WORDS.has(term));
  const filtered = resources.filter((item) => {
    if (item.status !== "active") return false;
    if (category !== "all" && item.category !== category) return false;
    if (!normalized) return true;
    const haystack = normalizeSearch([item.title, item.description, item.agency, ...item.keywords].join(" "));
    return queryTerms.length ? queryTerms.some((term) => haystack.includes(term)) : haystack.includes(normalized);
  });
  const contextual = useMemo(() => getContextualHelpResources(caseProfile.currentStage, language), [caseProfile.currentStage, language]);
  const journeyResources = (JOURNEY_HELP_RESOURCE_IDS[journeyCategory] || []).map(id => resources.find(item => item.id === id)).filter(Boolean);

  const openDetail = (item) => { setSelectedId(item.id); setLeaving(false); window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); };
  const destination = selected ? new URL(selected.official_url).hostname.replace(/^www\./, "") : "";

  if (selected) {
    return (
      <div className={`immigration-help-screen${embedded ? " immigration-help-embedded" : ""}`}>
        <header className="immigration-help-header" inert={leaving ? true : undefined}>
          <button onClick={() => leaving ? closeLeaving() : setSelectedId(null)}>← {copy.back}</button>
          {!embedded && <strong>IMMIGRA<span>.site</span></strong>}
          {!embedded && <button className="immigration-help-language" onClick={() => onLanguageChange?.(language === "en" ? "es" : "en")}>{language === "en" ? "EN" : "ES"}</button>}
        </header>
        <main className="immigration-detail-wrap">
          {leaving && (
            <section ref={leavingModal} className="immigration-leaving-card" role="dialog" aria-modal="true" aria-labelledby="leaving-title">
              <div className="immigration-leaving-icon">↗</div>
              <span>{copy.eyebrow}</span>
              <h1 id="leaving-title">{copy.leave}</h1>
              <p>{copy.leaveText}</p>
              <div className="immigration-destination">{destination}</div>
              <p className="immigration-independent">{copy.independent}</p>
              <a href={selected.official_url} target="_blank" rel="noopener noreferrer">{copy.continue} <span>→</span></a>
              <button onClick={closeLeaving}>{copy.cancel}</button>
            </section>
          )}
            <section className="immigration-detail-card" hidden={leaving} inert={leaving ? true : undefined}>
              <div className="immigration-detail-icon">{selected.icon}</div>
              <span className="immigration-agency">{selected.agency}</span>
              <h1>{selected.title}</h1>
              <p>{selected.description}</p>
              {selected.warning && <aside><strong>IMPORTANT / IMPORTANTE</strong><p>{selected.warning}</p></aside>}
              <div className="official-government-badge">✓ {copy.official} · {selected.agency}</div>
              {selected.last_verified ? <small>{copy.verified}: {selected.last_verified}</small> : <small>{copy.notChecked}</small>}
              <button className="immigration-continue" disabled={selected.status !== "active"} onClick={event => { leavingOpener.current = event.currentTarget; setLeaving(true); }}>
                {selected.status === "active" ? copy.continue : copy.unavailable} <span>→</span>
              </button>
              <p className="immigration-legal-line">{copy.educational}</p>
            </section>
        </main>
      </div>
    );
  }

  return (
    <div className={`immigration-help-screen${embedded ? " immigration-help-embedded" : ""}`}>
      <header className="immigration-help-header">
        <button className="icon-back-control" onClick={onBack} aria-label={copy.home}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" /></svg></button>
        {!embedded && <strong>IMMIGRA<span>.site</span></strong>}
        {!embedded && <button className="immigration-help-language" onClick={() => onLanguageChange?.(language === "en" ? "es" : "en")}>{language === "en" ? "EN" : "ES"}</button>}
      </header>
      <main className="immigration-help-content">
        <section className="immigration-help-hero">
          <span>{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
          <label className="immigration-help-search">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>
            <input value={query} onChange={(event) => { setQuery(event.target.value); if (event.target.value.trim()) setDirectoryOpen(true); }} placeholder={copy.search} aria-label={copy.search} />
          </label>
        </section>

        {!query && studyGoal !== "citizenship" && <section className="immigration-section" aria-label={copy.context}>
          <h2>{language === "es" ? "Fuentes y orientación profesional" : "Sources and professional guidance"}</h2>
          <p>{language === "es" ? "El objetivo de estudio no determina tu tipo de caso ni elegibilidad. Consulta tus avisos y a un profesional autorizado." : "Your study goal does not determine your case type or eligibility. Check your notices and consult an authorized professional."}</p>
          <div className="immigration-resource-list">{["legal-help", "avoid-scams", ...(studyGoal === "asylum" ? ["eoir-case"] : ["uscis-forms"])].map(id => resources.find(item => item.id === id)).filter(Boolean).map(item => <ResourceCard key={item.id} item={item} copy={copy} onOpen={openDetail} />)}</div>
        </section>}
        {!query && studyGoal === "citizenship" && <section className="immigration-section immigration-contextual-help" aria-labelledby="journey-help-title">
          <div className="immigration-section-heading"><h2 id="journey-help-title">{copy.context}</h2></div>
          <p className="immigration-context-stage">{copy.stage}: {getJourneyStageLabel(caseProfile.currentStage || "PREPARING_N400", language)}</p>
          <div className="immigration-category-scroll" role="group" aria-label={copy.context}>
            {JOURNEY_HELP_CATEGORIES.map(([id, en, es]) => <button key={id} type="button" className={journeyCategory === id ? "active" : ""} aria-pressed={journeyCategory === id} onClick={() => setJourneyCategory(id)}>{language === "es" ? es : en}</button>)}
          </div>
          <div className="immigration-resource-list">{journeyResources.slice(0, 3).map(item => <ResourceCard key={item.id} item={item} copy={copy} onOpen={openDetail} />)}</div>
          {contextual[0] && <p className="immigration-context-stage">{language === "es" ? "Sigue tu aviso y las instrucciones oficiales para tu caso." : "Follow your notice and the official instructions for your case."}</p>}
        </section>}

        <details className="immigration-urgent-details">
          <summary>{copy.urgent}</summary><p>{copy.urgentText}</p>
          <div className="immigration-category-scroll">{["detainee", "find-court", "legal-help"].map(id => { const item = resources.find(resource => resource.id === id); return <button type="button" key={id} onClick={() => openDetail(item)}>{item.title} →</button>; })}</div>
        </details>

        <details className="immigration-section immigration-directory" open={directoryOpen} onToggle={event => setDirectoryOpen(event.currentTarget.open)}>
          <summary>{copy.directory}</summary>
          <div className="immigration-section-heading"><span>{copy.all}</span><i>{filtered.length}</i></div>
          <div className="immigration-category-scroll" aria-label={copy.all}>
            <button className={category === "all" ? "active" : ""} aria-pressed={category === "all"} onClick={() => setCategory("all")}>{copy.all}</button>
            {IMMIGRATION_CATEGORIES.map(([id, en, es]) => <button key={id} className={category === id ? "active" : ""} aria-pressed={category === id} onClick={() => setCategory(id)}>{language === "es" ? es : en}</button>)}
          </div>
          {filtered.length ? <div className="immigration-resource-list">{filtered.map((item) => <ResourceCard key={item.id} item={item} copy={copy} onOpen={openDetail} />)}</div> : <div className="immigration-empty">{copy.noResults}</div>}
        </details>
        <EducationNotice language={language} compact /><p className="immigration-footer-note">{copy.independent} {copy.educational}</p>
      </main>
    </div>
  );
}

function ResourceCard({ item, copy, onOpen, featured = false }) {
  return (
    <GlassCard as="button" className={featured ? "immigration-resource-card featured" : "immigration-resource-card"} onClick={() => onOpen(item)}>
      <span className="immigration-resource-icon">{item.icon}</span>
      <span className="immigration-resource-copy"><small>{item.agency}</small><strong>{item.title}</strong><p>{item.description}</p><em>✓ {copy.official}</em></span>
      <span className="immigration-resource-arrow">{copy.open} <span aria-hidden="true">→</span></span>
    </GlassCard>
  );
}
import { EducationNotice } from "./EducationNotice.jsx";
