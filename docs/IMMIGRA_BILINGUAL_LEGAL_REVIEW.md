### 🧠 Advanced AI Brain Diagnostic Ledger

* **Target File / Component:** `src/LegalSettings.jsx`, `src/LegalSafeguards.jsx`, `src/educationNotice.js`, `src/LegalPracticeDisclosure.jsx`, `server/accountService.js`.
* **Deep User Experience Impact (Pros & Cons):**
  * *Pros:* avisos públicos en español e inglés, ayuda profesional autorizada, información de prueba gratuita y controles locales/nube diferenciados.
  * *Friction Points:* exportación descrita incorrectamente como cifrada; afirmación absoluta de no conservar contenido sin aclarar los reportes voluntarios; promesa de limpieza programada sin evidencia operativa; marca anterior en algunos avisos; ausencia de identificación del responsable y cláusulas expresas de responsabilidad.
* **Root-Cause Architectural Failure:** el cifrado del almacenamiento de perfil se confundía con el formato de exportación descifrado. Los textos bilingües independientes omitían excepciones y dependencias de configuración. La fecha de expiración de un reporte no ejecuta por sí sola su eliminación. Las prácticas y herramientas de organización necesitaban diferenciarse explícitamente de un servicio de asesoría o vigilancia de plazos.
* **Production-Grade Implementation:** componente bilingüe reutilizable integrado en los términos y controles de privacidad; responsable Kevin Medina, propietario y responsable de Immigra; contacto `info@citizenshipai.us`, confirmado por el propietario. Aviso educativo compartido actualizado al 14 de octubre de 2026 y marca Immigra.

| Función | Aclaración en ambos idiomas |
| --- | --- |
| Ciudadanía, asilo, ajuste de estatus | Práctica educativa, sin asesoría, representación, estrategia, determinación de elegibilidad ni relación abogado-cliente. |
| Sarah, Kevin y EVA | Personajes virtuales; resultados y listas no evalúan credibilidad ni aprobación. |
| Voz, lectura, escritura e IA | Solicitudes a proveedores; errores posibles; sistema de voz sujeto a condiciones del dispositivo/navegador. |
| Perfil, avisos y seguimiento | Importación local; revisión de campos; ayudas de organización, sin presentación de formularios ni supervisión legal de plazos. |
| Almacenamiento y exportación | Nube opcional cifrada; navegador no es bóveda; exportación JSON legible sin cifrado. |
| Reportes de IA | Consentimiento expreso; contenido aprobado guardado; vencimiento de 30 días y eliminación dependiente de ejecución de limpieza. |
| Prueba y suscripciones | Siete días desde primer uso; sin tarjeta/cobro automático; renovación de compras aceptadas; borrar cuenta no cancela pagos. |
| Eliminación y privacidad | Controles locales/nube, correo para solicitudes, verificación de titularidad; políticas independientes de proveedores. |
| Responsabilidad | Exclusión limitada por la ley aplicable, sin garantías de resultados; se conservan derechos obligatorios de consumo, privacidad y reembolso. |
| Ejemplos ficticios | Solo para aprender; nunca presentarlos como hechos ante una agencia. |

La redacción no constituye una opinión jurídica ni garantiza validez universal, inmunidad o aprobación por las tiendas. Se recomienda revisión por un abogado habilitado que conozca la jurisdicción del operador y los mercados donde se ofrece el servicio. No se inventaron domicilio, entidad jurídica, jurisdicción, arbitraje ni límites monetarios de responsabilidad.

**Dependencia operativa pendiente:** confirmar ejecución de `supabase/operations/schedule_ai_feedback_cleanup.sql` y comprobar `cron.job`. Las funciones de purga existen; no se verificó acceso administrativo ni ejecución del programador en la base de producción. Antes de declarar cumplimiento de un límite estricto de retención, verificarlo operativamente.

**Validación:** `npm run quality` (285 pruebas, lint, compilación y verificaciones técnicas móvil/iOS/metadatos); extracción de 128 preguntas y 410 respuestas del PDF oficial; Chromium en español e inglés, privacidad pública sin cuenta, identificación, exportación y retención, cláusulas de responsabilidad, acordeón accesible y ausencia de desbordamiento a 320 px. Estas comprobaciones no son aprobación jurídica ni aprobación de App Store/Google Play.

Componente completo aplicado:

```jsx
const safeguards = {
  en: {
    title: "Educational use, warranties and responsibility",
    paragraphs: [
      "Immigra provides educational practice only. We are not lawyers or a law firm. Neither AI responses nor support messages are legal advice or representation, and no attorney-client relationship is created. Always seek case-specific guidance from a licensed immigration attorney or a DOJ-accredited representative acting within their authorized scope.",
      "Sarah, Kevin and EVA are virtual educational characters. Scores, checklists, notice extraction, case-status displays and reminders are study and organizational aids, not legal assessments or a service that monitors your case or deadlines. Immigra does not submit forms, contact agencies on your behalf or guarantee interpreter availability, interview questions, approval or any immigration outcome. Verify official notices, requirements and deadlines with the responsible agency and a qualified professional.",
      "To the extent permitted by applicable law, the service is provided as available without warranties of uninterrupted availability, accuracy, completeness, suitability for a particular purpose or results. To that same extent, Immigra disclaims liability for indirect or consequential losses arising from reliance on educational content, AI errors, translation or transcription errors, interruptions or third-party services. These provisions do not exclude liability or remedies that applicable law does not allow us to exclude, and do not waive mandatory consumer, privacy, refund or other statutory rights.",
      "Practice examples are for learning only. Do not present fictional examples or AI-generated accounts as facts in an actual interview or filing. Do not delay a filing or disregard an official notice because of the app. If a response appears to offer legal advice, stop relying on it, report it using the app and seek authorized professional help.",
    ],
  },
  es: {
    title: "Uso educativo, garantías y responsabilidad",
    paragraphs: [
      "Immigra ofrece exclusivamente práctica educativa. No somos abogados ni un bufete. Ni las respuestas de IA ni los mensajes de soporte constituyen asesoría legal o representación, y no se crea una relación abogado-cliente. Siempre busca orientación específica para tu caso de un abogado de inmigración autorizado o un representante acreditado por el DOJ dentro del alcance de su autorización.",
      "Sarah, Kevin y EVA son personajes educativos virtuales. Los resultados, listas de tareas, extracción de avisos, consultas del estado del caso y recordatorios son ayudas de estudio y organización, no evaluaciones legales ni un servicio que supervise tu caso o tus plazos. Immigra no presenta formularios, no contacta agencias en tu nombre ni garantiza disponibilidad de intérpretes, preguntas de entrevista, aprobación o resultados migratorios. Verifica avisos oficiales, requisitos y plazos con la agencia responsable y un profesional autorizado.",
      "En la medida permitida por la ley aplicable, el servicio se ofrece según su disponibilidad, sin garantías de funcionamiento ininterrumpido, exactitud, integridad, idoneidad para un fin particular o resultados. En esa misma medida, Immigra excluye responsabilidad por pérdidas indirectas o consecuentes derivadas de la confianza en contenido educativo, errores de IA, traducción o transcripción, interrupciones o servicios de terceros. Estas disposiciones no excluyen responsabilidades ni recursos que la ley aplicable no permita excluir, ni implican renunciar a derechos obligatorios de consumo, privacidad, reembolso u otros derechos reconocidos por la ley.",
      "Los ejemplos de práctica son únicamente para aprender. No presentes ejemplos ficticios ni relatos generados por IA como hechos en una entrevista o solicitud real. No retrases una presentación ni ignores un aviso oficial por lo que diga la app. Si una respuesta parece dar asesoría legal, deja de basarte en ella, repórtala mediante la app y busca ayuda profesional autorizada.",
    ],
  },
};

export function LegalSafeguards({ language = "en" }) {
  const copy = safeguards[language === "es" ? "es" : "en"];
  return <section className="my-5 space-y-3 rounded-2xl border border-white/10 bg-[#030305]/90 p-4 text-slate-200 backdrop-blur-md" aria-label={copy.title}>
    <h3 className="text-base font-semibold text-slate-100!">{copy.title}</h3>
    {copy.paragraphs.map((paragraph) => <p className="leading-relaxed text-slate-200!" key={paragraph}>{paragraph}</p>)}
  </section>;
}

export function PrivacyControlsDisclosure({ language = "en" }) {
  const es = language === "es";
  return <section className="mt-5 space-y-3">
    <h3>{es ? "Tus datos y solicitudes de privacidad" : "Your data and privacy requests"}</h3>
    <p>{es ? "Responsable de Immigra: Kevin Medina, propietario y responsable de la aplicación. Contacto para soporte y privacidad:" : "Immigra operator: Kevin Medina, owner and operator of the application. Support and privacy contact:"} <a href="mailto:info@citizenshipai.us">info@citizenshipai.us</a>.</p>
    <p>{es ? "Usa Perfil para revisar o corregir datos y borrar la copia de la nube; Ajustes para borrar datos locales; y Cuenta para exportar registros disponibles o eliminar tu cuenta y sus datos asociados, incluidos reportes de IA. La exportación es un archivo JSON legible, sin cifrado: puede contener datos personales del perfil y debes protegerlo. Borrar la cuenta no cancela una suscripción de Stripe, Apple o Google; cancélala por separado con el proveedor." : "Use Profile to review or correct data and remove the cloud copy; Settings to clear local data; and Account to export available records or delete your account and associated data, including AI reports. The export is a readable, unencrypted JSON file: it may contain personal profile information and you should protect it. Deleting an account does not cancel a Stripe, Apple or Google subscription; cancel separately with the provider."}</p>
    <p>{es ? "Puedes solicitar información sobre el tratamiento de tus datos o ejercer los derechos que te correspondan según la ley aplicable mediante el correo de soporte indicado abajo. Podemos necesitar verificar que la cuenta sea tuya. No envíes contraseñas, documentos migratorios ni detalles sensibles por correo. Ningún sistema garantiza seguridad absoluta. La eliminación en Immigra no implica borrar de inmediato registros que proveedores independientes deban conservar por razones legales, de pago o seguridad conforme a sus propias políticas." : "You can request information about data processing or exercise rights available under applicable law through the support email below. We may need to verify account ownership. Do not email passwords, immigration documents or sensitive details. No system guarantees absolute security. Deletion in Immigra does not mean immediate removal of records independent providers must retain for legal, payment or security purposes under their own policies."}</p>
    <p>{es ? "Servicios externos y sus políticas:" : "External services and their policies:"} <a href="https://openai.com/policies/privacy-policy/" target="_blank" rel="noopener noreferrer">OpenAI</a>, <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Supabase</a>, <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe</a>. {es ? "Las voces del sistema pueden depender de servicios del navegador o dispositivo y sus condiciones. Las compras nativas, si se habilitan, también están sujetas a las políticas de Apple o Google." : "System voices may depend on browser or device services and their terms. Native purchases, if enabled, are also subject to Apple or Google policies."}</p>
  </section>;
}

```
