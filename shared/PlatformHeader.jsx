
const control = "flex! min-h-16! min-w-0! flex-col! items-center! justify-center! gap-1! rounded-xl! border! border-white/20! bg-white/5! px-2! py-2! text-sm! font-semibold! text-slate-100! hover:bg-white/15! focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-sky-300!";

export default function PlatformHeader({ lang, navigate, setLang }) {
  const es = lang === "es";
  const actions = [
    { id: "account", es: "Cuenta", en: "Account", path: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 22c0-10 16-10 16 0" },
    { id: "settings", es: "Ajustes", en: "Settings", path: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M10 2h4l1 3 3 1 3 4-2 2 2 2-3 4-3 1-1 3h-4l-1-3-3-1-3-4 2-2-2-2 3-4 3-1 1-3Z" },
  ];
  return <header className="platform-utility-header sticky! top-0! z-30! border-b! border-white/15! bg-[#030305]/95! text-slate-100! backdrop-blur-md!">
    <div className="mx-auto! grid! max-w-6xl! grid-cols-1! gap-3! px-4! py-3! sm:grid-cols-[minmax(0,1fr)_auto]! sm:items-center!">
      <button type="button" className="flex! min-h-11! items-center! gap-3! border-0! bg-transparent! text-left! text-xl! font-bold! text-slate-100!" onClick={() => navigate("")} aria-label={es ? "Immigra — Inicio" : "Immigra — Home"}><img src="/app-icon-192.png" alt="" width="36" height="36" />IMMIGRA</button>
      <nav className="grid! min-w-0! grid-cols-3! gap-2! sm:min-w-[320px]!" aria-label={es ? "Cuenta, idioma y ajustes" : "Account, language and settings"}>
        {actions.map(action => <button key={action.id} type="button" className={control} aria-label={es ? action.es : action.en} title={es ? action.es : action.en} onClick={() => navigate(action.id)}><svg className="size-6!" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d={action.path}/></svg><span>{es ? action.es : action.en}</span></button>)}
        <button type="button" className={control} title={es ? "Cambiar a inglés" : "Switch to Spanish"} aria-label={es ? "Cambiar a inglés" : "Switch to Spanish"} onClick={() => setLang(es ? "en" : "es")}><svg className="size-6!" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z"/></svg><span>{es ? "ES" : "EN"}</span></button>
      </nav>
    </div>
  </header>;
}
