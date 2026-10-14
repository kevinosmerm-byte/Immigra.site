import { AccountButton } from "./Account.jsx";

const control = "flex! min-h-18! sm:min-h-14! min-w-0! w-full! flex-col! sm:flex-row! items-center! justify-center! gap-1! sm:gap-2! rounded-xl! border! border-white/15! bg-white/5! px-2! py-3! text-sm! font-semibold! text-slate-100! hover:bg-white/15! focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-sky-300!";

export function HomeUtilityHeader({ children, language = "en", onOpenAccount, onLanguageChange, onOpenSettings }) {
  const es = language === "es";
  const account = es ? "Cuenta" : "Account";
  const settings = es ? "Ajustes" : "Settings";
  const settingsDescription = es ? "Abrir ajustes legales y de privacidad" : "Open Legal and Privacy Settings";
  const languageDescription = es ? "Cambiar idioma preferido a inglés" : "Change preferred language to Spanish";
  return <header className="home-utility-header sticky! top-0! z-40! grid! w-full! grid-cols-1! items-center! gap-3! border-b! border-white/10! bg-[#030305]/95! px-4! py-3! backdrop-blur-md! sm:grid-cols-[minmax(0,1fr)_auto]! sm:px-6!">
    <div className="min-w-0 text-slate-100 [&_.home-new-brand]:justify-start! [&_.home-brand-wordmark]:text-slate-100! [&_.home-brand-wordmark_strong]:text-sky-300!">{children}</div>
    <nav aria-label={es ? "Cuenta, idioma y ajustes" : "Account, language and settings"} className="grid min-w-0 grid-cols-3 gap-2 sm:min-w-[320px]">
      <AccountButton language={language} onClick={onOpenAccount} label={account} className={`${control} [&_svg]:size-5! [&_svg]:shrink-0!`} />
      <button type="button" className={control} onClick={() => onLanguageChange(es ? "en" : "es")} aria-label={languageDescription} title={languageDescription}>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z"/></svg><span>{es ? "ES" : "EN"}</span>
      </button>
      <button type="button" className={control} onClick={onOpenSettings} aria-label={settingsDescription} title={settingsDescription}>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="m10 3-1 3-3 1-3 3 2 2-2 2 3 3 3 1 1 3h4l1-3 3-1 3-3-2-2 2-2-3-3-3-1-1-3h-4Z"/></svg><span className="min-w-0 max-w-full wrap-anywhere">{settings}</span>
      </button>
    </nav>
  </header>;
}
