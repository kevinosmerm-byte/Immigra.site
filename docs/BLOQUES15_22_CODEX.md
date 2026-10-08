# Immigration AI — Gran bloque 15–22, handoff Codex
## Evaluación de arquitectura
El paquete previo contiene un prototipo React/Vite y una demo WebRTC con credenciales efímeras. NO equivale a una app lista para producción: la ruta de credenciales no tiene login y cuotas durables. El sistema de entrevistas de voz requiere pruebas con proveedor real, y la detección semántica avanzada no está implementada.
**No despliegues públicamente el endpoint de sesiones de audio sin autenticación, entitlement verificado y rate limits durables.**

## Entregables por bloque
15. `src/intelligence/memory.mjs`: claims tipados con procedencia y certeza, revisión heurística limitada de años, borrado local.
16. `src/intelligence/interviewer.mjs`: políticas de rigor, límites de repreguntas, preguntas de aclaración neutrales, prompts por idioma.
17. `src/platform/capabilities.mjs`: detección de capacidades y checklist móvil; el WebRTC de los bloques anteriores sigue siendo prototipo.
18. `src/documents/ingest.mjs`: ingestión de **texto ya extraído**, consentimiento y preguntas ancladas en secciones. NO parser PDF/OCR implementado.
19. `src/intelligence/advancedReport.mjs`: informe con procedencia de observaciones; `spouseComparison.mjs`: comparación literal de respuestas con consentimiento de ambos, no detección de fraude.
20. `src/billing/entitlements.mjs`: planes y cálculo local de cuotas. NO pasarela ni webhooks reales.
21. `src/security/access.mjs`: contrato de autorización, IDs aleatorios, redacción básica de logs, recibo de consentimiento. NO reemplaza auth, cifrado o RLS reales.
22. `src/platform/capabilities.mjs`: checklist web/iOS/Android. NO compilaciones nativas verificadas.

## Instrucciones prioritarias para Codex
1. Trabajar en rama aislada. Respetar AGENTS.md del repo citizenshipai y su fuente oficial `src/data/uscis2025Civics.json`; no alterar evaluación cívica determinista.
2. Integrar nuevas APIs **solo en residencia**, detrás de feature flags. No reutilizar transcripciones ni prompts entre módulos.
3. Conectar memoria de claims a eventos de transcripción final, con identificadores de turno, fuente y grados de certeza. No inferir hechos desde respuestas sin revisar. Solicitar consentimiento antes de documentos.
4. La IA debe ser rigurosa, no humillante; puede preguntar de nuevo, cambiar de tema y pedir detalles, pero no inventar inconsistencias ni sugerir historias falsas.
5. Para documentos, utilizar extracción confiable por tipo, antivirus, límites de tamaño, eliminación de metadatos y pruebas de contenido malicioso; separar texto de documentos de instrucciones de sistema.
6. Implementar auth real (p. ej. Supabase Auth), RLS, propiedad de sesión, eliminación, política de retención, cifrado y registros sin PII.
7. Integrar facturación Stripe en servidor, webhooks con firma, eventos idempotentes, límites durables por usuario, control de concurrencia, topes de gasto y métricas.
8. Hacer pruebas de audio en dispositivos reales, recuperación de interrupciones, permisos, latencia, captions, video states y accesibilidad.
9. No prometer que la sincronización de video coincide con fonemas; solo se alterna por estado de escucha/habla.
10. El reporte no evalúa credibilidad ni probabilidad de aprobación. Mostrar evidencia textual, fuente y advertencias.
11. Incluir entrevista cruzada opcional con consentimiento de **ambos** cónyuges y autorización para ver resultados compartidos.
12. NO hacer commit, deploy o modificar repos originales sin autorización.

## Criterios de aceptación antes de producción
- [ ] Auth y RLS validados con tests de acceso cruzado
- [ ] Cuotas, pagos, webhooks y límites de gastos comprobados en servidor
- [ ] Consentimiento, borrado, privacidad y retención revisados
- [ ] Integración IA semántica y evaluaciones con escenarios ficticios
- [ ] Documentos PDF reales procesados con seguridad
- [ ] Pruebas de voz y video en web, iOS y Android
- [ ] Pruebas de regresión de ciudadanía y asilo
- [ ] Revisión legal y de accesibilidad
