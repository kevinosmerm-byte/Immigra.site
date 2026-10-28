# Interacciones de entrevista centradas en la respuesta — 2026-10-28

Base: `c5825e4f2f532dee38f40dcb6966d84070f384a5`, repositorio canónico IMMIGRA.site. Cambio local preparado para revisión; no publicado ni desplegado.

## Adaptación a lo existente

- Mismo recorrido, controles, pantalla de llamada, desplegable de última evaluación y resumen final. No se añadieron botones, páginas o navegación.
- El entrevistador reconoce una cita completa de la respuesta actual y continúa con la pregunta principal o una aclaración pertinente. El consejo de expresión queda en la evaluación educativa existente, no se lee como palabras de un funcionario.
- El evaluador recibe pregunta actual + respuesta actual + historial separado. Su instrucción pide una observación específica y una mejora útil cuando existe, sin elogios vacíos ni inventar una deficiencia. Ya no obliga a recitar tres etiquetas por turno.
- Se incorporaron **13 preguntas neutras bilingües seleccionadas** del kit revisado, con filtros conservadores de admisión y elección restringida por esquema. El banco principal de cada módulo mantiene autoridad. No se copiaron indiscriminadamente las 54 preguntas ni se activaron hipótesis sobre documentos, denuncias o evidencia.
- Una aclaración dinámica por concepto, sin cadenas de aclaraciones de aclaraciones. Asilo/residencia ya no exigen alegar una contradicción para aclarar una ambigüedad. N-400 conserva su seguimiento determinista y repetición segura de una pregunta sí/no no interpretada.
- «No recuerdo» completo tiene aceptación acotada; una narración con un detalle incierto se analiza sin borrar el resto. Las expresiones inciertas siguen sin confirmarse como hechos del perfil.
- `turnId` asocia subtítulos, solicitud y revisión. Dos respuestas idénticas a preguntas diferentes ya no comparten por error el mismo feedback.
- El resumen final muestra pregunta y respuesta correspondientes y recupera una observación útil para la próxima práctica, sin puntuaciones de credibilidad, verdad, aprobación o elegibilidad.

## Evidencia y seguridad

Las citas deben pertenecer al enum construido de respuestas reales completas o frases completas, además de pasar la comprobación literal. No basta encontrar una subcadena que omita una negación. El reconocimiento hablado no recorta citas largas; una aclaración genérica que necesita señalar una expresión exige una cita completa mostrable (≤240 caracteres). No se inventan documentos, viajes, relaciones ni hechos. Los filtros léxicos son conservadores y el prompt exige confirmar pertinencia contra la respuesta: **no constituyen una prueba semántica de verdad ni garantizan que el modelo nunca se equivoque**.

El coach no produce testimonio alternativo ni fortalece frases tentativas; orienta orden y claridad con los detalles expresados. No se levantó la prohibición general de inventar respuestas modelo. Civismo conserva preguntas, respuestas y evaluación determinista sin consumo del evaluador personal.

No se cambian autenticación, cobros, cuotas, claves de almacenamiento, persistencia ni analytics. Sesiones continúan efímeras y `store:false`. No se añaden relatos migratorios a telemetría. Ejercicios hipotéticos siguen deshabilitados hasta contar con un consentimiento adecuado en la experiencia existente.

Presupuesto Responses normal: 1.100 tokens de salida. Para una transcripción larga sin una frase corta que pueda citarse íntegra, el límite aumenta solo en ese caso, con máximo 3.000, para no dejar una respuesta válida sin evidencia representable. No se realizaron llamadas pagadas durante esta implementación.

## Verificación local

- `npm run build`: aprobado, 281 pruebas raíz y 323 del módulo ciudadanía; incluye build de ambas apps, quality/lint y verificaciones estáticas mobile, iOS, App Store y release.
- Revisión independiente: 59 pruebas focalizadas aprobadas; hallazgos de citas largas, substrings que omiten negación, incertidumbre coloquial y guardrail de ciudadanía corregidos.
- `git diff --check`: limpio.
- Advertencias existentes: variables no utilizadas en `modules/citizenship/src/App.jsx`, chunks grandes y configuración npm `http-proxy`. Sin errores bloqueantes.
- No se han validado llamadas reales al proveedor, voz/micrófono reales, latencia ni pertinencia semántica con una evaluación humana de conversaciones reales. La prueba visual local con respuestas simuladas se intentó pero Chromium no arrancó por restricciones de sockets del sandbox; la escalación acotada falló antes de iniciar. No se completaron aserciones ni capturas de navegador. No se alteraron permisos ni se intentó eludir restricciones.

Para revisión antes de publicar: comprobar texto y voz con casos ficticios en español/inglés, pausas durante audio, omisión, repetición, reconexión, errores y doble envío. La publicación requiere autorización aparte.
