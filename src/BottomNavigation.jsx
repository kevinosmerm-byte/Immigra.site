import { useLayoutEffect, useRef } from "react";
const ITEMS = [
  { id: "home", label: "Home", es: "Inicio", path: "m3 10 7-6a3 3 0 0 1 4 0l7 6M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M9 21v-6a3 3 0 0 1 6 0v6" },
  { id: "vocabulary", label: "Vocabulary", es: "Vocabulario", path: "M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14M6 9l3 1m-3 3 3 1m6-4 3-1m-3 5 3-1" },
  { id: "choose", label: "Choose", es: "Elegir", path: "M20 12v6a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h8M8 11l4 4 9-10" },
  { id: "connect", label: "Connect", es: "Conectar", path: "m10 13 4-4M8 15l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 3 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" },
  { id: "pro", label: "PRO", es: "PRO", path: "m12 3 2.8 6.2L21 7l-2 11H5L3 7l6.2 2.2L12 3ZM6 21h12" },
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
