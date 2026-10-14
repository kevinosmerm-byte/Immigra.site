### 🧠 Advanced AI Brain Diagnostic Ledger

* **Target File / Component:** `src/InterviewPresentation.jsx`, `src/InterviewWorkspace.jsx`, presentación JSX de `src/ConversationPractice.jsx`, clase visual del botón de `src/InterviewAdvanceControls.jsx`, registro Tailwind.
* **Deep User Experience Impact (Pros & Cons):**
  * *Pros:* se conservan la pregunta actual, el entrevistador, la voz y el avance automático existente.
  * *Friction Points:* formulario escrito siempre abierto, opciones y explicaciones extensas antes de empezar, controles pequeños y estilos blancos mezclados con texto claro. Los contadores de práctica estaban ocultos por la hoja de estilos del workspace.
* **Root-Cause Architectural Failure:** presentación acoplada a estilos históricos que fijaban geometría, colores y formularios expandidos. El código de presentación necesitaba distinguir el método principal de respuesta de las opciones avanzadas, sin cambiar el motor de entrevista.
* **Production-Grade Implementation:** capa reusable de presentación y acordeón nativo para respuesta escrita. Control de voz destacado; texto opcional; repetir con icono y etiqueta; instrucciones breves; contadores visibles; opciones de idioma/interlocutor/voz desplegables dentro de la misma pantalla. No se modificaron preguntas, prompts, reconocimiento, síntesis, imágenes/videos, reglas de evaluación, acceso ni peticiones al coach.

## Auditoría de cuatro capas

1. **Experiencia cognitiva y emocional:** una pregunta por turno, indicaciones claras, voz como acción principal y teclado disponible por elección. Los errores, pausa, corrección y omisión existentes siguen disponibles. Aviso educativo breve siempre visible en conversación; explicación completa y enlaces accesibles bajo Cómo funciona la práctica y privacidad. No se añadieron pantallas ni aceptaciones.
2. **Estado y asincronía:** los formularios originales conservan sus valores, límites, onSubmit/onChange y disabled; los callbacks originales siguen controlando voz, repetición, evaluación y avance. `simplifyResponseForms` transforma únicamente la presentación de formularios del workspace, incluyendo fragmentos anidados. Se comparó el bloque de lógica de ConversationPractice con HEAD antes del cambio y permanece idéntico; N400InterviewPractice, servidor/coach, hooks de voz, síntesis y conversationFlow no cambiaron.
3. **Diseño y accesibilidad:** Tailwind, fondo oscuro, foco visible, botones de al menos 48 px (acción de micrófono al menos 64 px), formularios y selectores con texto legible, iconos acompañados de palabras. Se eliminan los fondos blancos de paneles educativos/respuesta dentro de estas vistas. Contadores de civismo verde/rojo; revisados/omitidos del N-400 neutrales para no confundir omisión con respuesta incorrecta.
4. **Resolución y validación:** interfaces de N-400, civismo y conversaciones de ciudadanía/asilo/ajuste mantienen el funcionamiento existente. Las preguntas oficiales no se generan ni se cambian. Responder por escrito, pausar y enviar al coach se comprobaron en el navegador con fixtures de acceso y proveedor; no se rehicieron ni se afirman nuevas pruebas de micrófono físico.

## Colores por módulo

| Módulo | Token existente | Tratamiento |
| --- | --- | --- |
| N-400 / ciudadanía | `--color-primary` #2563A6 | Azul federal, texto blanco. |
| Civismo | `--color-ai` #4DA3E6 | Azul claro, texto oscuro para contraste. |
| Asilo / ajuste de estatus | `--color-navy` #123A63 | Navy del módulo migratorio, texto blanco. |
| Grabación activa | `--color-red` | Indicador rojo, independiente del color del módulo. |

Esta asignación reutiliza BRAND_PALETTE.md; no se inventó una paleta adicional para asilo. El acento se aplica a acciones principales y progreso. La exclusividad del fondo oscuro sigue la preferencia reciente del propietario, sobre las antiguas capas claras.

## Verificación y estado

`npm run quality`: 290 pruebas, lint, compilación y verificaciones técnicas móviles/iOS/metadatos. PDF oficial: 128 preguntas y 410 respuestas. Chromium ES/EN a 320 px: N-400 y civismo ocultan inicialmente la entrada escrita, permiten abrirla y enviar una respuesta usando el handler real, muestran revisión y permiten pausar. Conversaciones: opciones desplegables, selección del tema/idioma, entrada escrita opcional y una petición al coach existente; pruebas para ciudadanía, asilo y ajuste. Se comprobó ausencia de desbordamiento y el fondo oscuro del área de respuesta; capturas revisadas visualmente.

Guardado localmente en `feature/asylum-simple-preparation`; no publicado por instrucción del propietario. Antes de subir en la PC principal, conciliar con la versión allí disponible para preservar la implementación real de Mi expediente y el flujo de entrada preparado.

Componente aplicado (implementación completa):

```jsx
import { Children, cloneElement, isValidElement } from "react";

const MODULES = {
  n400: { color: "var(--color-primary)", ink: "#ffffff", en: "N-400 practice", es: "Práctica N-400" },
  civics: { color: "var(--color-ai)", ink: "#030305", en: "Civics practice", es: "Práctica de civismo" },
  citizenship: { color: "var(--color-primary)", ink: "#ffffff", en: "Citizenship practice", es: "Práctica de ciudadanía" },
  asylum: { color: "var(--color-navy)", ink: "#ffffff", en: "Asylum practice", es: "Práctica de asilo" },
  adjustment: { color: "var(--color-navy)", ink: "#ffffff", en: "Adjustment-of-status practice", es: "Práctica de ajuste de estatus" },
};

export function interviewModule(mode, language = "en") {
  const module = MODULES[mode] || MODULES.citizenship;
  return { style: { "--interview-accent": module.color, "--interview-action-ink": module.ink }, label: language === "es" ? module.es : module.en };
}

export function OptionalTypedAnswer({ children, language = "en" }) {
  return <details className="interview-typed-answer w-full! rounded-2xl! border! border-white/15! bg-white/5! p-4! text-slate-100!">
    <summary className="flex min-h-12 cursor-pointer items-center gap-3 text-lg! font-semibold! text-slate-100! focus-visible:outline-2 focus-visible:outline-sky-300">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-6 shrink-0"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M5 9h2m2 0h2m2 0h2m2 0h2M5 12h2m2 0h2m2 0h2m2 0h2M7 16h10"/></svg>
      {language === "es" ? "Prefiero escribir mi respuesta" : "I prefer to type my answer"}
    </summary>
    <div className="mt-4!">{children}</div>
  </details>;
}

export function simplifyResponseForms(node, language) {
  if (!isValidElement(node)) return node;
  if (node.type === "form") return <OptionalTypedAnswer key={node.key} language={language}>{node}</OptionalTypedAnswer>;
  if (!node.props.children) return node;
  return cloneElement(node, {}, Children.map(node.props.children, child => simplifyResponseForms(child, language)));
}

export const interviewSurface = "bg-[#030305]! text-slate-100! [&_button]:min-h-12! [&_button]:text-base! [&_button]:rounded-xl! [&_button]:px-4! [&_button]:py-3! [&_button]:font-semibold! [&_button]:whitespace-normal! [&_button:focus-visible]:outline-2! [&_button:focus-visible]:outline-offset-2! [&_button:focus-visible]:outline-sky-300! [&_textarea]:w-full! [&_textarea]:min-h-28! [&_textarea]:rounded-xl! [&_textarea]:border-white/20! [&_textarea]:bg-[#030305]! [&_textarea]:p-4! [&_textarea]:text-lg! [&_textarea]:text-slate-100! [&_label]:text-slate-200! [&_.education-notice]:bg-white/5! [&_.education-notice]:text-slate-200! [&_.education-notice]:border-white/15! [&_.education-notice_p]:text-slate-200! [&_.education-notice_a]:text-sky-300! [&_.interview-advance-primary]:bg-[var(--interview-accent)]! [&_.interview-advance-primary]:bg-none! [&_.interview-advance-primary]:text-[var(--interview-action-ink)]! [&_.n400-text-response]:grid! [&_.n400-text-response]:grid-cols-1! [&_.n400-text-response]:gap-3! [&_.primary-button]:bg-[var(--interview-accent)]! [&_.primary-button]:bg-none! [&_.primary-button]:text-[var(--interview-action-ink)]! [&_.live-mic-button]:bg-[var(--interview-accent)]! [&_.live-mic-button]:bg-none! [&_.live-mic-button]:text-[var(--interview-action-ink)]! [&_.live-mic-button]:min-h-16! [&_.live-mic-button.listening]:bg-[var(--color-red)]! [&_.live-mic-button.listening]:text-white!";

export function ConversationPresentation({ children, mode, language }) {
  const module = interviewModule(mode, language);
  return <div style={module.style} className={`conversation-app-presentation ${interviewSurface} [&_.conversation-practice]:bg-[#030305]! [&_.conversation-practice]:text-slate-100! [&_.coach-conversation-content]:max-w-3xl! [&_.coach-conversation-content]:px-4! [&_.coach-conversation-content]:pb-28! [&_.coach-conversation-content]:mx-auto! [&_.coach-conversation-content>h1]:text-2xl! [&_.coach-conversation-content>h1]:text-slate-100! [&_.coach-conversation-content_p]:text-slate-200! [&_.coach-conversation-card]:bg-[#090b12]! [&_.coach-conversation-card]:h-auto! [&_.coach-conversation-card]:min-h-0! [&_.coach-conversation-card]:border-white/15! [&_.coach-message]:bg-white/5! [&_.coach-message-text]:text-2xl! [&_.coach-message-text]:text-slate-100! [&_.conversation-options]:grid-cols-1! [&_.conversation-options_select]:min-h-12! [&_.conversation-options_select]:bg-[#030305]! [&_.conversation-options_select]:text-slate-100! [&_.coach-response-area]:space-y-4! [&_.coach-response-area]:bg-[#090b12]! [&_.coach-response-area]:text-slate-100! [&_.coach-conversation-status]:bg-white/5! [&_.coach-conversation-status]:text-slate-200! [&_.coach-message-text]:max-h-none! [&_.coach-message-text]:overflow-visible! [&_.coach-conversation-content_p]:text-base! [&_.coach-conversation-content_p]:leading-relaxed! [&_.conversation-auto]:text-slate-200! [&_.conversation-choice-panel]:my-4! [&_.conversation-choice-panel]:p-4! [&_.conversation-choice-panel]:border! [&_.conversation-choice-panel]:border-white/15! [&_.conversation-choice-panel]:rounded-xl! [&_.conversation-choice-panel]:bg-white/5! [&_.conversation-options]:grid! [&_.coach-response-area>form]:grid! [&_.coach-response-area>form]:gap-3! [&_summary]:min-h-12! [&_summary]:text-lg! [&_summary]:text-slate-100! [&_.conversation-actions]:grid! [&_.conversation-actions]:grid-cols-2! [&_.conversation-actions]:gap-3! [&_.conversation-actions>button]:w-full! [&_.conversation-actions>button]:min-w-0! [&_.conversation-continuous>button]:min-h-16! [&_.conversation-actions>button:disabled]:opacity-50! [&_.conversation-actions>button]:flex-1! [&_.conversation-actions>button]:text-slate-100! [&_.conversation-actions>button]:bg-white/10! [&_.conversation-feedback]:border-white/15! [&_.conversation-feedback]:bg-white/5! [&_.conversation-options]:gap-3! [&_.practice-header]:bg-[#030305]! [&_.practice-header]:text-slate-100!`}>
    <p className="mx-auto! mt-4! max-w-3xl! border-l-4! border-[var(--interview-accent)]! px-4! py-2! text-lg! font-semibold! text-slate-100!">{module.label}</p>
    {children}
  </div>;
}

```
