### 🧠 Advanced AI Brain Diagnostic Ledger

* **Target File / Component:** `src/AsylumPreparation.jsx`, `src/storyImport.js`, `src/storyPreparationApi.js`, `shared/storyPractice.js`, `server/storyPractice.js`, nueva ruta `/story/prepare`.
* **Deep User Experience Impact (Pros & Cons):**
  * *Pros:* dos pasos visibles en una pantalla; PDF/TXT desde un solo botón; análisis automático después de elegir archivo; alternativa de texto y práctica sin documento; idioma e interlocutor con opciones grandes; confirmación breve con un botón para hablar; resumen y correcciones opcionales.
  * *Friction Points:* la captura original dividía PDF, revisión y autorización entre controles y pantallas. El código de esa pantalla no está en las siete ramas disponibles; este reemplazo es un componente preparado, todavía no conectado a la navegación de producción.
* **Root-Cause Architectural Failure:** importación y consentimiento fragmentados, selección de PDF separada del control principal y salida hacia Inicio antes de iniciar práctica. El diseño nuevo conserva una única autorización explícita junto a los controles de importación y mantiene lectura, análisis y recuperación dentro de la misma pantalla.
* **Production-Grade Implementation:** componente modular con entrega `onStart({ language, interviewer, text, analysis, signal })`; no modifica la implementación de Sarah/Kevin. Cliente autenticado y servicio de análisis independientes, límites estrictos, fuentes citadas verificadas y estado temporal sin guardar la historia en navegador ni base de datos. Implementación del cliente:

```javascript
import { apiFetch } from "./api.js";
import { readStoryRequest } from "../shared/storyPractice.js";

export async function prepareStoryWithAi({ signal, ...input }) {
  const source = readStoryRequest(input);
  const response = await apiFetch("/story/prepare", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...source, consent: true }), signal,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error([401, 403].includes(response.status) ? "ACCESS_REQUIRED" : "STORY_SERVICE_UNAVAILABLE");
  return payload;
}

```

## Diagnóstico de las cuatro capas

1. **Experiencia cognitiva:** texto breve, botones de al menos 64 px y letra de 18 px, iconos acompañados por palabras, colores azul/verde con texto explícito de selección/resultado, errores comprensibles con salida alternativa. El idioma y entrevistador aparecen en una línea con Cambiar; no es obligatorio abrirla. Resumen y revisión opcionales. Se puede practicar sin revelar experiencias traumáticas.
2. **Estado y asincronía:** generación de operaciones y AbortController invalidan resultados tardíos. Cancelar y desmontar no permiten actualizar la pantalla con análisis viejo. Cambiar texto o idioma invalida el resumen anterior. La extracción recorre todas las páginas; no recorta silenciosamente un documento demasiado largo. Las páginas sin texto suficiente requieren otro PDF o texto pegado. El proveedor puede continuar una solicitud ya enviada aunque se cancele su espera en el navegador.
3. **Diseño y accesibilidad:** fondo oscuro, paneles transparentes, contraste, foco visible, estados anunciados, botones con nombres y figuras decorativas. Tailwind registrado explícitamente. Se corrige el efecto del reset global de márgenes/rellenos mediante utilidades importantes dentro del componente, sin alterar los estilos ni la voz de los entrevistadores. Verificado a 320 px.
4. **Resolución y límites:** el endpoint nuevo usa el acceso autorizado de coach, sus interruptores y los límites de solicitudes existentes; exige consentimiento verdadero, idioma válido y texto completo limitado a 40.000 caracteres. No guarda la fuente. Las citas deben existir en el texto y las preguntas no pueden repetirse. Las instrucciones prohíben asesoría legal y valoración de elegibilidad, credibilidad o resultados. La comprobación de citas no garantiza exactitud total del resumen generado; siempre se puede revisarlo.

## Conexión pendiente en la PC principal

No se añadió un enlace ni ruta nueva al App actual: falta localizar el código real de Mi expediente para sustituir ese paso de entrada. No se cambiaron `ConversationPractice.jsx`, los hooks de micrófono, la síntesis, los temas ni el endpoint `/coach` existente.

Al integrar:

- Montar `AsylumPreparation` en el lugar del asistente de carga actual; cambiar de cuenta debe desmontarlo para descartar la historia anterior.
- Obtener acceso mediante `requestAiSession("coach", continuation, language)` antes del análisis o del inicio de práctica. Si no se autoriza, devolver `ACCESS_REQUIRED` sin enviar contenido ni navegar. El análisis reutiliza el servicio OpenAI existente, sujeto a prueba/suscripción y a su costo por solicitud.
- Pasar el idioma y el entrevistador elegidos al mecanismo existente de apertura de Sarah/Kevin. El callback debe respetar `signal.aborted` antes de abrir la entrevista. La vista solo entrega el contexto de preparación; no modifica voces, preguntas o personalidad del entrevistador.
- Usar `prepareStoryWithAi` para el análisis. El archivo original no sale del dispositivo; el texto sí se envía al servidor/OpenAI con autorización visible. El host no debe persistir la historia o el análisis sin un consentimiento distinto y sin actualizar el aviso de privacidad.
- Actualizar los avisos bilingües para describir explícitamente el análisis de historia antes de activar esta función en producción.
- Verificar el enlace final y los permisos de acceso con esa versión real antes de publicar. No se hicieron llamadas de pago a OpenAI durante estas pruebas.

## Verificación realizada

`npm run quality`: 290 pruebas aprobadas, lint, compilación y comprobaciones técnicas móviles/iOS/metadatos. Fuente oficial intacta: 128 preguntas y 410 respuestas verificadas contra el PDF. Chromium con el componente real en ES/EN: PDF legible de dos páginas, un único envío autorizado, idioma y Kevin seleccionados entregados al callback, texto completo de ambas páginas, pantallas de 320 px, objetivos táctiles de 64 px y tipografía de botones de 18 px. También PDF escaneado rechazado sin llamar IA, práctica sin documento sin análisis, cancelación de respuesta tardía, reintento e invalidación al editar. Respuestas del proveedor simuladas en pruebas; no se afirma validación con un modelo remoto real ni integración final con la pantalla de producción. API local: solicitud sin sesión devuelve 403 ai_session_required.

**Estado:** preparado y guardado localmente; no publicado, por instrucción del propietario. Pendiente integrar con el código de Mi expediente disponible en la PC principal.
