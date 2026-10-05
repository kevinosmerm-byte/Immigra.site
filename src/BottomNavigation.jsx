import { useLayoutEffect, useRef } from "react";
const ITEMS = [
  { id: "home", label: "Home", es: "Inicio", path: "m3 10 7-6a3 3 0 0 1 4 0l7 6M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M9 21v-6a3 3 0 0 1 6 0v6" },
  { id: "practice", label: "Practice", es: "Práctica", path: "M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14" },
  { id: "uscisTracker", label: "Journey", es: "Proceso", path: "M5 5a2 2 0 1 0 0 .1M19 19a2 2 0 1 0 0 .1M7 5h7a4 4 0 0 1 0 8h-4a4 4 0 0 0 0 8h7" },
  { id: "immigrationHelp", label: "Help", es: "Ayuda", path: "M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0" },
  { id: "profile", label: "Profile", es: "Perfil", path: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M5 21v-2a7 7 0 0 1 14 0v2" },
];

const PRACTICE_SCREENS = new Set(["practice", "civics", "civicsGuide", "quiz", "vocabulary", "choose", "connect", "english", "reading", "writing", "coach", "interview", "podcasts", "progress"]);
const PROFILE_SCREENS = new Set(["profile", "civicProfile", "settings", "pro"]);

export function BottomNavigation({ screen, language, onNavigate }) {
  const navigation = useRef(null);
  useLayoutEffect(() => {
    const update = () => document.documentElement.style.setProperty("--global-navigation-height", `${navigation.current?.getBoundingClientRect().height || 80}px`);
    update();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    if (navigation.current) observer?.observe(navigation.current);
    return () => { observer?.disconnect(); document.documentElement.style.removeProperty("--global-navigation-height"); };
  }, []);
  const active = PRACTICE_SCREENS.has(screen) ? "practice" : PROFILE_SCREENS.has(screen) ? "profile" : screen === "uscisSandbox" ? "uscisTracker" : ITEMS.some(item => item.id === screen) ? screen : null;
  return <nav ref={navigation} className="global-bottom-navigation" aria-label={language === "es" ? "Navegación principal" : "Main navigation"}>
    {ITEMS.map(item => <button key={item.id} type="button" aria-current={active === item.id ? "page" : undefined} onClick={() => onNavigate(item.id)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={item.path} /></svg>
      <span>{language === "es" ? item.es : item.label}</span>
    </button>)}
  </nav>;
}
