import { useMemo, useState } from "react";
import { IMMIGRATION_CATEGORIES, IMMIGRATION_RESOURCES, localizedResource } from "./immigrationResources";

const COPY = {
  en: {
    eyebrow: "OFFICIAL U.S. RESOURCES", title: "Immigration Help", subtitle: "Official immigration tools and resources in one place.",
    search: "What do you need help with?", featured: "Featured tools", all: "All resources", noResults: "No matching resource found. Try a simpler phrase.",
    official: "Official Government Resource", open: "View details", back: "Back", leave: "YOU'RE LEAVING IMMIGRA.SITE",
    leaveText: "You're being redirected to an official U.S. government website.", independent: "Immigra.site is independent and is not affiliated with or endorsed by any U.S. government agency.",
    continue: "Continue to Official Website", cancel: "Cancel", verified: "Last verified", urgent: "NEED URGENT IMMIGRATION HELP?",
    urgentText: "Use official tools to locate a detained person, court information or legal help. Immigra.site does not promise legal representation.",
    educational: "Educational information only — not legal advice.", unavailable: "This resource is currently under review.", home: "Home",
  },
  es: {
    eyebrow: "RECURSOS OFICIALES DE EE. UU.", title: "Ayuda Migratoria", subtitle: "Herramientas y recursos oficiales de inmigración en un solo lugar.",
    search: "¿Con qué necesitas ayuda?", featured: "Herramientas destacadas", all: "Todos los recursos", noResults: "No encontramos un recurso. Intenta una frase más sencilla.",
    official: "Recurso Oficial del Gobierno", open: "Ver detalles", back: "Volver", leave: "ESTÁS SALIENDO DE IMMIGRA.SITE",
    leaveText: "Serás redirigido a un sitio web oficial del gobierno de EE. UU.", independent: "Immigra.site es independiente y no está afiliado ni respaldado por ninguna agencia del gobierno de EE. UU.",
    continue: "Continuar al Sitio Oficial", cancel: "Cancelar", verified: "Última verificación", urgent: "¿NECESITAS AYUDA MIGRATORIA URGENTE?",
    urgentText: "Usa herramientas oficiales para localizar a una persona detenida, información de corte o ayuda legal. Immigra.site no promete representación legal.",
    educational: "Información educativa únicamente — no es asesoría legal.", unavailable: "Este recurso está actualmente bajo revisión.", home: "Inicio",
  },
};

const SEARCH_STOP_WORDS = new Set(["a", "al", "de", "do", "el", "en", "for", "how", "i", "la", "las", "los", "me", "mi", "my", "need", "para", "por", "que", "the", "to", "un", "una", "where", "with", "yo"]);

function normalizeSearch(value) {
  return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]+/g, " ").trim();
}

export default function ImmigrationHelp({ language = "en", onBack, onLanguageChange }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const copy = COPY[language];
  const resources = useMemo(() => IMMIGRATION_RESOURCES.map((item) => localizedResource(item, language)), [language]);
  const normalized = normalizeSearch(query);
  const queryTerms = normalized.split(/\s+/).filter((term) => term.length > 1 && !SEARCH_STOP_WORDS.has(term));
  const filtered = resources.filter((item) => {
    if (item.status !== "active") return false;
    if (category !== "all" && item.category !== category) return false;
    if (!normalized) return true;
    const haystack = normalizeSearch([item.title, item.description, item.agency, ...item.keywords].join(" "));
    return queryTerms.length ? queryTerms.some((term) => haystack.includes(term)) : haystack.includes(normalized);
  });
  const featured = resources.filter((item) => item.featured);

  const openDetail = (item) => { setSelected(item); setLeaving(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const destination = selected ? new URL(selected.official_url).hostname.replace(/^www\./, "") : "";

  if (selected) {
    return (
      <div className="immigration-help-screen">
        <header className="immigration-help-header">
          <button onClick={() => leaving ? setLeaving(false) : setSelected(null)}>← {copy.back}</button>
          <strong>CITIZENSHIP <span>AI</span></strong>
          <button className="immigration-help-language" onClick={() => onLanguageChange(language === "en" ? "es" : "en")}>{language === "en" ? "EN" : "ES"}</button>
        </header>
        <main className="immigration-detail-wrap">
          {leaving ? (
            <section className="immigration-leaving-card" role="dialog" aria-modal="true" aria-labelledby="leaving-title">
              <div className="immigration-leaving-icon">↗</div>
              <span>{copy.eyebrow}</span>
              <h1 id="leaving-title">{copy.leave}</h1>
              <p>{copy.leaveText}</p>
              <div className="immigration-destination">{destination}</div>
              <p className="immigration-independent">{copy.independent}</p>
              <a href={selected.official_url} target="_blank" rel="noopener noreferrer">{copy.continue} <span>→</span></a>
              <button onClick={() => setLeaving(false)}>{copy.cancel}</button>
            </section>
          ) : (
            <section className="immigration-detail-card">
              <div className="immigration-detail-icon">{selected.icon}</div>
              <span className="immigration-agency">{selected.agency}</span>
              <h1>{selected.title}</h1>
              <p>{selected.description}</p>
              {selected.warning && <aside><strong>IMPORTANT / IMPORTANTE</strong><p>{selected.warning}</p></aside>}
              {selected.id === "asylum" && selected.practicePrompts?.length > 0 && <section className="immigration-practice-prompts" aria-labelledby="asylum-practice-title">
                <span>{language === "es" ? "PRÁCTICA EDUCATIVA" : "EDUCATIONAL PRACTICE"}</span>
                <h2 id="asylum-practice-title">{language === "es" ? "Preguntas que debe poder contestar con sus propios hechos" : "Questions to answer using your own facts"}</h2>
                <ol>{selected.practicePrompts.map((prompt) => <li key={prompt}>{prompt}</li>)}</ol>
                <p>{language === "es" ? "No memorice una respuesta ni adapte su historia a estas preguntas. Una decisión requiere un análisis individual de los hechos y la evidencia." : "Do not memorize an answer or reshape your history around these prompts. A decision requires an individual analysis of the facts and evidence."}</p>
              </section>}
              <div className="official-government-badge">✓ {copy.official} · {selected.agency}</div>
              <small>{copy.verified}: {selected.last_verified}</small>
              <button className="immigration-continue" disabled={selected.status !== "active"} onClick={() => setLeaving(true)}>
                {selected.status === "active" ? copy.continue : copy.unavailable} <span>→</span>
              </button>
              <p className="immigration-legal-line">{copy.educational}</p>
            </section>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="immigration-help-screen">
      <header className="immigration-help-header">
        <button onClick={onBack}>← {copy.home}</button>
        <strong>CITIZENSHIP <span>AI</span></strong>
        <button className="immigration-help-language" onClick={() => onLanguageChange(language === "en" ? "es" : "en")}>{language === "en" ? "EN" : "ES"}</button>
      </header>
      <main className="immigration-help-content">
        <section className="immigration-help-hero">
          <span>{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
          <label className="immigration-help-search">
            <span>⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} aria-label={copy.search} />
          </label>
        </section>

        {!query && category === "all" && (
          <section className="immigration-section">
            <div className="immigration-section-heading"><span>{copy.featured}</span><i>6</i></div>
            <div className="immigration-featured-grid">
              {featured.map((item) => <ResourceCard key={item.id} item={item} copy={copy} onOpen={openDetail} featured />)}
            </div>
          </section>
        )}

        <section className="immigration-urgent">
          <span>!</span><div><strong>{copy.urgent}</strong><p>{copy.urgentText}</p></div>
          <div>{["detainee", "find-court", "legal-help"].map((id) => { const item = resources.find((resource) => resource.id === id); return <button key={id} onClick={() => openDetail(item)}>{item.title} →</button>; })}</div>
        </section>

        <section className="immigration-section">
          <div className="immigration-section-heading"><span>{copy.all}</span><i>{filtered.length}</i></div>
          <div className="immigration-category-scroll" aria-label={copy.all}>
            <button className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>{copy.all}</button>
            {IMMIGRATION_CATEGORIES.map(([id, en, es]) => <button key={id} className={category === id ? "active" : ""} onClick={() => setCategory(id)}>{language === "es" ? es : en}</button>)}
          </div>
          {filtered.length ? <div className="immigration-resource-list">{filtered.map((item) => <ResourceCard key={item.id} item={item} copy={copy} onOpen={openDetail} />)}</div> : <div className="immigration-empty">{copy.noResults}</div>}
        </section>
        <p className="immigration-footer-note">{copy.independent} {copy.educational}</p>
      </main>
    </div>
  );
}

function ResourceCard({ item, copy, onOpen, featured = false }) {
  return (
    <button className={featured ? "immigration-resource-card featured" : "immigration-resource-card"} onClick={() => onOpen(item)}>
      <span className="immigration-resource-icon">{item.icon}</span>
      <span className="immigration-resource-copy"><small>{item.agency}</small><strong>{item.title}</strong><p>{item.description}</p><em>✓ {copy.official}</em></span>
      <span className="immigration-resource-arrow">→</span>
    </button>
  );
}
