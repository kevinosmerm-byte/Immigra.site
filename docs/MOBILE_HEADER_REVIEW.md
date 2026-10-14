### 🧠 Advanced AI Brain Diagnostic Ledger

* **Target File / Component:** `src/HomeUtilityHeader.jsx`, `src/App.jsx` (cabecera de Inicio), `src/Account.jsx` (botón de cuenta), `src/tailwind.css`.
* **Deep User Experience Impact (Pros & Cons):**
  * *Pros:* accesos de cuenta, idioma y ajustes ya existentes; control semántico por botones y nombres accesibles.
  * *Friction Points:* botones de 34 px en teléfono, iconos sin palabras y muchas reglas de geometría superpuestas en CSS; el encabezado compartía un contenedor con recorte de contenido. El usuario no podía identificar con facilidad las opciones en teléfono. Un tooltip por cursor no resuelve el uso táctil.
* **Root-Cause Architectural Failure:** el diseño anterior dependía de dimensiones pequeñas y CSS acumulado. El encabezado se reemplaza por un componente independiente con geometría adaptativa y posición sticky; se elimina el recorte del contenedor de Inicio que interfería con esa posición. Se conservan todos los handlers existentes de cuenta, ajustes e idioma.
* **Production-Grade Implementation:** cabecera oscura con iconos y etiquetas visibles, dos filas en teléfono, una fila en escritorio y botones de 72 px de alto en móvil (56 px escritorio). Las etiquetas se adaptan a texto ampliado. `title` explica cada acción con cursor; `aria-label`, texto visible y foco marcado cubren teclado y uso táctil. El botón de cuenta conserva su estado de sesión; no se alteran autenticación, facturación, datos personales ni Sarah/Kevin.

## Verificación

`npm run quality`: lint, 290 pruebas, compilación y verificaciones técnicas de preparación móvil/iOS/metadatos. Fuente oficial intacta: 128 preguntas y 410 respuestas verificadas.

Chromium sobre la app completa en ES/EN a 320, 375, 430, 768 y 1440 px: controles dentro de pantalla y visibles; tamaño táctil mayor de 44 px; texto de ayuda; cabecera permanece arriba después de desplazamiento; foco de teclado visible; Enter abre Cuenta; Escape cierra el diálogo; Ajustes navega a su pantalla; cambiar idioma actualiza las etiquetas. Ampliación de fuente raíz al 200% a 320 px: controles permanecen dentro de pantalla. Se revisó visualmente la captura móvil.

## Estado

Guardado en la rama local `feature/asylum-simple-preparation`. No publicado por instrucción del propietario: se revisará junto con el código de la PC principal antes de subir. Esta corrección corresponde a la cabecera de Inicio disponible en este repositorio; no se afirma haber inspeccionado otras versiones de la aplicación que no están disponibles aquí.

Componente completo aplicado:

```jsx
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

```
