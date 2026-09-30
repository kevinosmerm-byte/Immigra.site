import { useLayoutEffect, useRef } from "react";
const ITEMS = [
  { id: "home", label: "Home", es: "Inicio", path: "M3 10 12 3l9 7v11h-6v-7H9v7H3Z" },
  { id: "vocabulary", label: "Vocabulary", es: "Vocabulario", path: "M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3ZM12 6v16" },
  { id: "choose", label: "Choose", es: "Elegir", path: "M4 4h16v16H4ZM7 12l3 3 7-7" },
  { id: "connect", label: "Connect", es: "Conectar", path: "M3 6h5v5H3ZM16 13h5v5h-5ZM8 8h8v8" },
  { id: "pro", label: "PRO", es: "PRO", path: "m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" },
];

export function BottomNavigation({ screen, language, onNavigate }) {
  const navigation = useRef(null);
  useLayoutEffect(() => {
    const update = () => document.documentElement.style.setProperty("--global-navigation-height", `${navigation.current?.getBoundingClientRect().height || 80}px`);
    update();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    if (navigation.current) observer?.observe(navigation.current);
    return () => { observer?.disconnect(); document.documentElement.style.removeProperty("--global-navigation-height"); };
  }, []);
  const active = ITEMS.some(item => item.id === screen) ? screen : null;
  return <nav ref={navigation} className="global-bottom-navigation" aria-label={language === "es" ? "Navegación principal" : "Main navigation"}>
    {ITEMS.map(item => <button key={item.id} type="button" aria-current={active === item.id ? "page" : undefined} onClick={() => onNavigate(item.id)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={item.path} /></svg>
      <span>{language === "es" ? item.es : item.label}</span>
    </button>)}
  </nav>;
}
