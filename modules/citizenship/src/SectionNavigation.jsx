/** Shared, scrollable secondary destinations. Main navigation stays stable. */
export function SectionNavigation({ items, active, onNavigate, language = "en", label }) {
  return <nav className="section-navigation" aria-label={label || (language === "es" ? "Opciones de esta sección" : "Section options")}>
    {items.map(item => <button key={item.id} type="button" aria-current={active === item.id ? "page" : undefined} onClick={() => onNavigate(item.id)}>
      {language === "es" ? item.es || item.label : item.label}
    </button>)}
  </nav>;
}
