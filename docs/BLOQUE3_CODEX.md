# Bloque 3 — Integración visual y entrevista funcional
Contiene Bloque 1 + datos/motor Bloque 2 integrados en una SPA React/Vite. Residencia es el único motor interactivo; ciudadanía/asilo son portales sin tocar sus repositorios.
`npm install && npm run dev`; `npm test`; `npm run build`.
Incluye 12 preguntas por práctica, selección de parentesco, ES/EN, escenario opcional, respuesta libre, saltar, salir, resumen y borrado en memoria.
Detección heurística muy limitada: años distintos dentro de preguntas de boda/viaje/vivienda pueden generar una repregunta neutral. NO inferir falsedad, no se implementó un análisis semántico completo. Las preguntas de aclaración no deben sugerir respuestas.
Limitaciones: no hay backend, autenticación, audio, suscripciones, IA remota, ni persistencia. No es un producto de producción.
Importante: el motor de preguntas contiene 270 traducciones educativas, no preguntas oficiales. Los 30 escenarios son metadatos ficticios, no relatos completos.
Integración futura: adaptar interfaces sin tocar AGENTS.md ni banco oficial USCIS, introducir feature flags y pruebas de regresión por motor, y auditoría de privacidad antes de habilitar casos personales.
