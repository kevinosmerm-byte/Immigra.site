# AsiloAI — Cobertura de implementación local

Fecha: 2026-10-07. Alcance exclusivo AsiloAI. CitizenshipAI no se modifica.

**Entrega parcial del producto:** sitio público y aplicación local funcional. No es despliegue de producción ni implementación completa del Master Package. IMPLEMENT_NOW identifica componentes implementados en este ciclo; las limitaciones parciales se indican expresamente.

## Verificación

- 12 pruebas automatizadas del núcleo: PASS (`node --test --test-isolation=none tests/core.test.cjs`).
- QA navegador: selección de práctica personal, aceptación, inicio, respuesta incierta, seguimiento adaptado y reporte; sin errores de consola en ese recorrido.
- 320 preguntas y 110 escenarios disponibles. Todos los 222 archivos del paquete conservados.
- Los 90 benchmarks originales son fixtures descriptivos: NO se afirma que haya una evaluación semántica AI aprobada.

## Cobertura por requisito

### Integridad e inventario
- Estado: ALREADY_EXISTS
- Referencia original: `master-package/00_README/MANIFEST.json; SHA256SUMS.txt`
- Evidencia / alcance: 222 archivos inventariados; 221 hashes actuales coinciden. La lista no incluye su propio hash.
- Ubicación anterior o dependencia: file-inventory.json; validation-results.json

### Banco bilingüe
- Estado: IMPLEMENT_NOW
- Referencia original: `master-package/03_question_bank/question_bank.jsonl; question_bank.csv`
- Evidencia / alcance: dist/package-data.js y dist/master.js: fullBank. 320 registros preservados; no todos activados en entrevista.
- Ubicación anterior o dependencia: 320 registros en paquete y SQLite

### Calidad editorial del banco
- Estado: PENDING_IMPLEMENTATION
- Referencia original: `master-package/03_question_bank/question_bank.jsonl`
- Evidencia / alcance: Revisar variantes como Q0113: pregunta sobre profundizar en un nombre y puntuación anidada. No presentar 320 como 320 conceptos independientes ni como las 200 preguntas curadas de v1.0.
- Ubicación anterior o dependencia: 101 neutral_factual, 11 dynamic_template, 208 controlled_variant

### Casos básicos
- Estado: IMPLEMENT_NOW
- Referencia original: `master-package/04_synthetic_cases/cases`
- Evidencia / alcance: dist/package-data.js: 50 casos básicos en selector.
- Ubicación anterior o dependencia: 50 JSON; 50 casos SQLite

### Casos detallados y narrativas
- Estado: IMPLEMENT_NOW
- Referencia original: `master-package/04_synthetic_cases/detailed_cases; readable_narratives`
- Evidencia / alcance: dist/package-data.js: 60 casos detallados en selector, junto con los 50 básicos.
- Ubicación anterior o dependencia: 60 JSON, narrativas y benchmarks; no están en SQLite

### Country packs
- Estado: ALREADY_EXISTS
- Referencia original: `master-package/05_country_packs`
- Evidencia / alcance: Referencias a casos válidas. La selección de país modifica ficción/contexto; no añade hechos personales.
- Ubicación anterior o dependencia: 7 packs y 6 context_profiles

### Separación personal/synthetic
- Estado: IMPLEMENT_NOW
- Referencia original: `master-package/00_README/CODEX_MASTER_COMMAND.md; 02_database/asiloai_schema.sql`
- Evidencia / alcance: dist/core.js: addSource, addFact, validateGraph, answer, unseal. dist/master.js: dos espacios y controles de sesión.
- Ubicación anterior o dependencia: Diseño propuesto: contratos y repositorios de dominio separados

### Procedencia y Case Graph
- Estado: IMPLEMENT_NOW
- Referencia original: `master-package/07_engines/story_graph_engine.md; 11_api_contracts/case_graph.schema.json`
- Evidencia / alcance: dist/core.js: fuentes y afirmaciones manuales, confirmación/disputa. PARCIAL: no extracción semántica ni grafo completo.
- Ubicación anterior o dependencia: Propuesto: case-domain, sources, facts, revisions

### Topic Coverage
- Estado: IMPLEMENT_NOW
- Referencia original: `master-package/07_engines/topic_coverage_engine.md`
- Evidencia / alcance: dist/core.js: seis temas y estados. PARCIAL: cobertura avanzada pendiente.
- Ubicación anterior o dependencia: Propuesto: motor de cobertura por evidencia y tema

### Question Reasoning
- Estado: IMPLEMENT_NOW
- Referencia original: `master-package/07_engines/question_reasoning_engine.md; 10_tools/demo_question_selector.py`
- Evidencia / alcance: dist/core.js: reglas de seguimiento por tema/incertidumbre/revisión. PARCIAL: no LLM ni razonamiento semántico.
- Ubicación anterior o dependencia: Propuesto: priorizador de ambigüedad, diferencia, incidente, temor actual y cobertura

### Estado de entrevista
- Estado: IMPLEMENT_NOW
- Referencia original: `master-package/07_engines/interview_state_machine.md`
- Evidencia / alcance: dist/core.js y dist/master.js: inicio, respuestas, omisión, pausa con borrador en memoria y límite de 12 turnos.
- Ubicación anterior o dependencia: CitizenshipAI src/n400InterviewEngine.js como patrón

### Safety layer
- Estado: IMPLEMENT_NOW
- Referencia original: `master-package/06_prompts/safety_guardrails.md; sahara_system_prompt.md`
- Evidencia / alcance: dist/core.js: plantillas neutrales y filtro léxico de solicitudes legales. PARCIAL: no clasificador semántico ni garantía de detección universal.
- Ubicación anterior o dependencia: Propuesto: política previa y posterior a generación

### Fictional Practice y selección de país
- Estado: IMPLEMENT_NOW
- Referencia original: `master-package/00_README/README.md; 12_ui_content/ui_copy.md`
- Evidencia / alcance: dist/master.js: selector por país, 110 escenarios y aviso ficticio.
- Ubicación anterior o dependencia: Propuesto: modo ficticio rotulado, biblioteca y sesión synthetic

### Conversación personal sin upload
- Estado: IMPLEMENT_NOW
- Referencia original: `master-package/00_README/README.md`
- Evidencia / alcance: dist/master.js: práctica personal por texto, sin documentos.
- Ubicación anterior o dependencia: Propuesto: extracción por respuestas voluntarias y confirmación

### Use My Story local-first
- Estado: IMPLEMENT_NOW
- Referencia original: `master-package/00_README/CODEX_MASTER_COMMAND.md`
- Evidencia / alcance: dist/master.js: texto/TXT local, fuentes y afirmaciones manuales. PARCIAL: OCR/PDF pendientes.
- Ubicación anterior o dependencia: Propuesto: expediente local cifrado; procesamiento efímero por adaptador

### Parser y documentos
- Estado: PENDING_IMPLEMENTATION
- Referencia original: `master-package/Especificación v1.0 §§14–20,57; paquete 02_database`
- Evidencia / alcance: Crear parser I-589/declaración, referencias de página y OCR si se necesita. Nuevos tipos documentales no deben perderse.
- Ubicación anterior o dependencia: CitizenshipAI src/noticeParser.js: PDF.js y revisión de borrador

### Consistency Engine
- Estado: IMPLEMENT_NOW
- Referencia original: `master-package/07_engines/consistency_engine.md`
- Evidencia / alcance: dist/core.js: comparación de fechas estructuradas y revisión de textos. PARCIAL: análisis narrativo, NEW_INFORMATION y niveles pendientes.
- Ubicación anterior o dependencia: Propuesto: comparación con seis clases y explicación del usuario

### Future Fear Engine
- Estado: PENDING_IMPLEMENTATION
- Referencia original: `master-package/07_engines/future_fear_engine.md`
- Evidencia / alcance: No determinar validez, suficiencia ni scores de temor futuro. Fuente de información reciente debe distinguirse de experiencia personal.
- Ubicación anterior o dependencia: Propuesto: nodos de cobertura y siguientes preguntas neutrales

### Interview Knowledge Retrieval
- Estado: PENDING_IMPLEMENTATION
- Referencia original: `master-package/08_knowledge/source_catalog.json`
- Evidencia / alcance: Verificar y recuperar textos oficiales con versión, fecha y procedencia antes de indexar. No se validó contenido remoto en esta revisión local.
- Ubicación anterior o dependencia: 5 registros de fuentes; no hay corpus recuperable implementado

### Country Context Retrieval
- Estado: PENDING_IMPLEMENTATION
- Referencia original: `master-package/08_knowledge/current_country_context_sources.json`
- Evidencia / alcance: Referencias internas válidas; URLs, títulos y fechas no verificados externamente. Hay un enlace genérico PrintRR: no equivale a referencia documental precisa.
- Ubicación anterior o dependencia: 18 registros, 6 perfiles de contexto

### Contenidos jurídicos internos
- Estado: PENDING_IMPLEMENTATION
- Referencia original: `master-package/01_product; 06_prompts; 07_engines`
- Evidencia / alcance: PACI/Mogharrabi solo como referencia metodológica tras revisión de fuentes; no scores, estrategia ni elegibilidad.
- Ubicación anterior o dependencia: Propuesto: metadatos de cobertura internos, nunca criterio adjudicativo

### Reportes y métricas
- Estado: IMPLEMENT_NOW
- Referencia original: `master-package/09_evaluation/evaluation_rubric.json; v1.0 §§37–39`
- Evidencia / alcance: dist/master.js: reporte local sin puntuaciones jurídicas, turnos, incertidumbre, omisiones y temas.
- Ubicación anterior o dependencia: CitizenshipAI src/ProgressDashboard.jsx; prototipo app.js resumen básico

### Benchmarks y harness
- Estado: PENDING_IMPLEMENTATION
- Referencia original: `master-package/09_evaluation`
- Evidencia / alcance: Son fixtures/descripciones, no 90 pruebas ejecutadas. Crear harness reproducible y evaluaciones humanas/automáticas; cero violaciones observadas no garantiza cero futuro.
- Ubicación anterior o dependencia: 30 benchmarks básicos y 60 detallados con IDs válidos

### Aislamiento Gold Case
- Estado: IMPLEMENT_NOW
- Referencia original: `master-package/00_README/CODEX_DETAILED_CASES_GUIDE.md`
- Evidencia / alcance: scripts/build-data.py: no entrega objetivos ocultos al motor; core no recibe ficha de escenario. Prueba automatizada de campos reservados.
- Ubicación anterior o dependencia: Propuesto: persona/evaluador con gold; entrevistador solo conversación expuesta

### Autenticación
- Estado: PENDING_IMPLEMENTATION
- Referencia original: `master-package/CitizenshipAI src/Account.jsx; server/accountService.js`
- Evidencia / alcance: No conectados al prototipo AsiloAI. Callbacks, producto y almacenamiento seguro propios.
- Ubicación anterior o dependencia: Enlace Supabase, JWT y sesiones existentes en CitizenshipAI

### Sahara/avatar
- Estado: PENDING_IMPLEMENTATION
- Referencia original: `master-package/CitizenshipAI N400InterviewPractice.jsx; DidLiveAvatar.jsx`
- Evidencia / alcance: Desacoplar dominio, estados y roles de simulación. D-ID debe someterse a límites del motor.
- Ubicación anterior o dependencia: Activos Sarah y clips existentes; prototipo reutiliza retrato

### TTS/STT/micrófono
- Estado: PENDING_IMPLEMENTATION
- Referencia original: `master-package/CitizenshipAI audio.js; speech.js; server/server.js`
- Evidencia / alcance: Idioma, duración y consentimiento adaptados. No declarar que audio nunca sale del dispositivo cuando se usa STT externo.
- Ubicación anterior o dependencia: Grabación, TTS Capacitor y transcripción existentes

### Credenciales AI de AsiloAI
- Estado: BLOCKED_DEPENDENCY
- Referencia original: `master-package/Dependencia operativa`
- Evidencia / alcance: Necesarios para llamadas reales. No copiar secretos de CitizenshipAI; simulación determinista puede probar arquitectura sin atribuirle comprensión semántica.
- Ubicación anterior o dependencia: Proyecto/clave y configuración de proveedor aún no conectados

### Pagos y Free/Pro
- Estado: PENDING_IMPLEMENTATION
- Referencia original: `master-package/CitizenshipAI stripeBilling.js; featureAccessConfig.js`
- Evidencia / alcance: Filtrar producto/precio en webhook, derechos separados y límites remotos. No modificar cobros de CitizenshipAI.
- Ubicación anterior o dependencia: Checkout/portal y cuotas existentes

### Compras nativas y restauración
- Estado: PENDING_IMPLEMENTATION
- Referencia original: `master-package/Especificación v1.0 §50; infraestructura móvil`
- Evidencia / alcance: No aparecen implementadas en base auditada. Requieren productos y validación de proveedor antes de pruebas reales.
- Ubicación anterior o dependencia: Contratos pendientes de adaptadores por plataforma

### Ayuda y Find Legal Help
- Estado: PENDING_IMPLEMENTATION
- Referencia original: `master-package/CitizenshipAI ImmigrationHelp.jsx; v1.0 §§41–42`
- Evidencia / alcance: Separar ayuda oficial de servicios comerciales. Verificar enlaces antes de publicar; proveedor y condición profesional visibles.
- Ubicación anterior o dependencia: Directorio existente; prototipo con categorías informativas

### Avisos y aceptaciones
- Estado: IMPLEMENT_NOW
- Referencia original: `master-package/12_ui_content/ui_copy.md; v1.0 §§43–46`
- Evidencia / alcance: dist/master.js: aceptación local explícita antes de practicar y aviso sobre voz del navegador. PARCIAL: versionado legal de producción pendiente.
- Ubicación anterior o dependencia: Textos en paquete, LegalSettings.jsx y prototipo

### USCIS y EOIR
- Estado: PENDING_IMPLEMENTATION
- Referencia original: `master-package/v1.0 §§4–8,26,34–35,60`
- Evidencia / alcance: Ficción/personal es un eje distinto de USCIS/EOIR. No reemplazar preparation_track por fictional; preservar valor legado mediante adaptador y practice_mode.
- Ubicación anterior o dependencia: Motor USCIS y motor EOIR sobre el mismo expediente

### Court Orientation y court_full
- Estado: PENDING_IMPLEMENTATION
- Referencia original: `master-package/v1.0 §§7,26,50`
- Evidencia / alcance: El contrato next_question no enumera todos los modos v1.0. Mantenerlos en modelo/backlog, sin judicial decisions.
- Ubicación anterior o dependencia: Orientation prevista gratuita; court_full futuro

### Navegación/UI y web pública
- Estado: IMPLEMENT_NOW
- Referencia original: `master-package/outputs/asiloai/dist; CitizenshipAI appRoutes.js y CSS`
- Evidencia / alcance: dist/index.html, app.js, master.js y CSS: landing y aplicación adaptables. PARCIAL: prototipo estático, no migrado a React.
- Ubicación anterior o dependencia: Prototipo estático con landing y navegación funcional

### Analytics y logs
- Estado: PENDING_IMPLEMENTATION
- Referencia original: `master-package/CitizenshipAI accountService.js; paquete local-first`
- Evidencia / alcance: Excluir narrativas, respuestas, país de temor y demás hechos sensibles. Telemetría no es almacén de expediente.
- Ubicación anterior o dependencia: Allowlist técnica existente

### Borrado/exportación/retención
- Estado: IMPLEMENT_NOW
- Referencia original: `master-package/v1.0 §§48–49; paquete local-first`
- Evidencia / alcance: dist/core.js: AES-GCM/PBKDF2. dist/master.js: exportar/importar copia cifrada, borrar espacio. Datos de trabajo solo en memoria.
- Ubicación anterior o dependencia: Propuesto: borrado local y de derivados/cachés/jobs/proveedores aplicables

### Migración SQLite/Postgres
- Estado: PENDING_IMPLEMENTATION
- Referencia original: `master-package/02_database/asiloai_schema.sql; plan previo`
- Evidencia / alcance: No ejecutar SQL SQLite como migración Supabase. Diseñar ambos adaptadores sin migrar datos de producción.
- Ubicación anterior o dependencia: SQLite seed educativo; esquema local y backend separados

### Contratos API
- Estado: PENDING_IMPLEMENTATION
- Referencia original: `master-package/11_api_contracts`
- Evidencia / alcance: Añadir tipos por nodo, versiones, owner/domain/case invariants, idiomas/modos completos. Validar input/output, sin exponer internal_reason ni gold.
- Ubicación anterior o dependencia: case_graph schema superficial y next_question contrato descriptivo

### Publicación y dispositivos
- Estado: BLOCKED_DEPENDENCY
- Referencia original: `master-package/CitizenshipAI Render/Cloudflare/Capacitor; prototipo local`
- Evidencia / alcance: Herramientas Sites no disponibles en revisión anterior; hosting/productos propios por configurar. Mantener Android/iPhone/Windows/Mac como requisito.
- Ubicación anterior o dependencia: AsiloAI no publicado ni con backend propio conectado

### No omisión y trazabilidad
- Estado: IMPLEMENT_NOW
- Referencia original: `master-package/00_README/CODEX_MASTER_COMMAND.md`
- Evidencia / alcance: master-package/ preservado; este informe registra las 41 áreas, incluidas pendientes.
- Ubicación anterior o dependencia: coverage-inventory.json; este informe; file-inventory.json

## Dependencias y límites abiertos

- AI/STT, autenticación, pagos y nube requieren implementación de backend y servicios propios de AsiloAI; no se tomaron credenciales de CitizenshipAI.
- Aplicaciones iOS/Android y escritorio empaquetadas, compras nativas y publicación pendientes. La entrega actual es web adaptable.
- Esquema SQLite original preservado, no usado por la app local. Sus referencias entre casos necesitan endurecimiento antes de conectar almacenamiento. No desplegar directamente como backend.
- Importación de vault soporta el grafo local v1 (sin eventos importados). No es importador de la base SQLite del paquete.
- Documentos PDF/OCR, I-589, recuperación contextual, contenido jurídico verificado, directorio legal y motores específicos EOIR pendientes.
- Las fuentes de país se conservan sin afirmar vigencia ni verificación externa.
- Revisión editorial de preguntas, accesibilidad completa, QA móvil ampliado, auditoría de seguridad y validación de producción pendientes.

## Actualización de configuración AI — 2026-10-07

Servicio desplegado con gateway Cloudflare Pages, validación criptográfica Access y cuotas D1. 26 pruebas totales aprobadas, más prueba SQLite de cuotas. Interfaz con vista previa y consentimiento, resultados solo para revisión. Banco ES/EN, video de Sahara y aviso previo obligatorio publicados. Modelo seleccionado; IA desactivada, clave y prueba real pendientes. Access restringe análisis y sesión al propietario. Ver estado operativo en `docs/AI-CONFIGURATION.md`. Esto no completa autenticación pública, sincronización ni aplicaciones nativas.

Prueba real posterior: beta privada activada; OpenAI devolvió tres citas literales (fecha, lugar e incertidumbre) de una fuente sintética. Acceso firmado y reserva D1 completados; ninguna afirmación modificada. Credencial guardada solo como secreto de Cloudflare.

Actualización PDF e interfaz: selector Kevin/Sahara y marco centrado; PDF.js local por página con revisión previa (20 MB, 300 páginas). Pruebas navegador: página 2 extraída y página sin texto preserva borrador. OCR y lectura estructurada I-589 siguen pendientes.
