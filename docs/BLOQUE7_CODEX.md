# Bloque 7 — Informe educativo de entrevista

Se entrega el paquete acumulado 1–7. Nueva implementación: `src/report/analyzer.mjs` (motor local determinista) y `src/report/ReportView.jsx` (informe descargable TXT) conectado a la entrevista escrita de residencia.

**Evidencia, no acusaciones:** identifica respuestas cortas, expresiones explícitas de incertidumbre y menciones de años diferentes dentro de temas amplios. Dos años distintos NO constituyen automáticamente contradicción; pueden describir eventos distintos. Se conserva el texto de respaldo. No hay puntuación de credibilidad, riesgo de fraude ni predicción de aprobación.

**Privacidad:** procesamiento local sin persistencia; exportación manual TXT; botón de cerrar y borrar. El archivo exportado queda bajo control del usuario y puede contener respuestas personales. No registrar transcripciones en analytics.

**Pendiente para Codex:** el modo Realtime del Bloque 5/6 no genera todavía una transcripción final estructurada confiable para este informe. Capturar eventos de transcripción con consentimiento explícito, mapear turnos a preguntas y ofrecer revisión del usuario antes de analizarlos. No presentar resultados sobre voz si faltan datos o la transcripción es incierta. Incorporar seguridad, autenticación, cifrado y políticas de borrado antes de almacenar datos reales. El análisis semántico avanzado es trabajo futuro y debe mantener evidencias citables y límites de inferencia.

No modificar módulos citizenship/asylum ni el banco USCIS. Tests `npm test`; compilar `npm run build` cuando se instalen dependencias.
