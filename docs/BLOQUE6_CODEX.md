# Bloque 6 — Entrevista rigurosa y bajo presión

## Alcance entregado
Incluye bloques 1-5 y selección de intensidad **Normal / Rigurosa / Bajo presión** para el entrevistador Realtime de residencia. Se valida la intensidad en servidor, se inyecta una política de repreguntas escépticas y profesionales, y se añade una rúbrica estructurada para futuros informes. Se añade utilidad local de repreguntas neutrales y pruebas unitarias.

## Comportamiento esperado
- Preguntar una cosa a la vez, escuchar la respuesta y recordar la cronología real.
- Rigurosa: profundizar en fechas, lugares, convivencia, impuestos y antecedentes familiares pertinentes.
- Bajo presión: tono firme, cambios de tema y repreguntas difíciles, sin acusaciones inventadas ni amenazas.
- Cuando haya aparente contradicción, preguntar por la secuencia o incertidumbre, nunca declarar fraude.
- Permitir no recordar, omitir y detener. No calificar credibilidad ni probabilidad de aprobación.
- Los niveles se limitan a residencia. No tocar motores originales de asilo y ciudadanía.

## Ejemplo de flujo
Usuario: «Nos casamos en junio de 2023». Más tarde: «Nos mudamos juntos en agosto de 2023».
IA: «Antes mencionó dos fechas distintas para el matrimonio y el comienzo de la convivencia. ¿Dónde vivía cada uno durante ese período?»
**Importante:** esas fechas no son por sí mismas contradictorias; la pregunta es una aclaración.

## Limitaciones y siguiente integración
El proveedor de voz ejecutará estas instrucciones al iniciar sesión, pero no hay motor determinista que garantice que las siga ni sistema persistente de extracción de hechos. `buildReviewRubric()` define un contrato; no se presenta todavía un informe de evaluación en la interfaz realtime. Falta evaluación de comportamiento adversarial con conversaciones simuladas, consentimiento y auditoría de privacidad, autenticación, rate limiting y control de costos. El servidor no debe exponerse públicamente sin esos controles.

## Codex
1. Integrar los cambios de `server/realtime.mjs`, `server/rigor.mjs`, `src/rigor/config.mjs` y el selector visual, preservando feature flags.
2. Añadir memoria de hechos **con referencias a turnos** y validación humana antes de mostrar contradicciones.
3. Implementar informe final que diferencie: hecho declarado / pregunta / posible ambigüedad / aclaración / no evaluado.
4. Validar los tres niveles con casos ficticios, usuarios que no recuerdan fechas y usuarios que piden bajar la intensidad.
5. Mantener claves API en servidor y proteger las sesiones con autenticación, consentimiento, límite de tiempo y presupuesto.
6. Ejecutar `npm test` y `npm run build`; verificar micrófono, WebRTC y videos en navegadores reales.
