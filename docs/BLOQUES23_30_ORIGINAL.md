# Immigration AI — Gran bloque 23–30 | Instrucciones para Codex

## Estado verificable
Este ZIP es acumulativo 1–30. La app shell incorpora acceso desde **Residencia** a una pantalla de llamada compacta. No está conectada a los repos originales CitizenshipAI/AsiloAI. El entrevistador WebRTC continúa requiriendo credenciales, proveedor real y videos aportados por el usuario.

## Alcance
23. `src/integration/registry.mjs`: tres motores registrados, fronteras de datos y estado honesto de integración. **Ciudadanía y asilo NO integrados**.
24. `src/intelligence/turnPlanner.mjs`: planificador determinista y neutral de aclaraciones fundamentadas. **No es memoria semántica de modelo conectada en vivo**.
25. `src/realtime/RealtimeInterview.jsx` + `src/style.css`: pantalla tipo llamada, video dominante, cinco controles visibles en una sola vista (micrófono, repetir, pausar, subtítulos, finalizar), confirmación al terminar y subtítulos superpuestos. `src/main.jsx` enlaza la pantalla desde Residencia. Los videos son placeholders hasta proporcionar MP4.
26. `src/documents/vault.mjs`: contenedor temporal en memoria, validación de propiedad, borrado. **No hay almacenamiento cifrado ni procesamiento de PDF**.
27. `src/report/progress.mjs`: comparativa educativa de actividad de sesiones, sin puntaje de credibilidad.
28. `src/accounts/family.mjs`: contratos de consentimiento para perfiles; **no hay login ni base de datos conectada**.
29. `src/admin/usage.mjs`: suma de consumo y puerta de acceso; **no hay Stripe, webhooks ni controles de gasto durables**.
30. `src/platform/releaseGate.mjs`: bloquea la declaración de producción hasta validar controles críticos. **No se hicieron pruebas en teléfonos reales**.

## Requisito prioritario de UI (obligatorio)
Al iniciar una entrevista se debe parecer a una videollamada: video/imagen del entrevistador ocupa el espacio principal; header mínimo y cinco controles esenciales fijos abajo. Sin scroll para activar micrófono, repetir, pausar, activar subtítulos o terminar. Antes de entrar: configuración y consentimiento. Durante la llamada: no mostrar instrucciones largas, barras de navegación ni paneles secundarios. Probar 320x568, 375x667, 390x844, 430x932, landscape y zoom de texto; `100dvh`, safe-area y teclado. Verificar que todos los botones tengan área táctil >=44px y accesibilidad. El diseño de ejemplo es una referencia; ajustarlo según las pruebas.

## Orden recomendado
1. Clonar los repos privados reales en ramas separadas y leer sus AGENTS.md, sin alterar la base oficial de 128 preguntas ni los motores actuales.
2. Integrar adaptadores de cada motor con API tipada y aislamiento estricto. No copiar preguntas de un motor al otro.
3. Agregar auth real, RLS, autorización de sesión y límites de uso en backend antes de exponer `/api/realtime/session`.
4. Vincular el planificador contextual a turnos de transcripción con IDs, evidencia, fuente y consentimientos; distinguir hechos confirmados de inferencias.
5. Implementar upload seguro de PDF, validación, antivirus, extracción de texto y borrado. Prohibir instrucciones de sistema desde documentos.
6. Conectar pagos Stripe por SDK oficial, firma de webhook, idempotencia, cuotas durables y topes de gasto.
7. Pruebas reales de WebRTC, pausa/reconexión, audio, videos, subtítulos y tamaños móviles; hacer revisión de accesibilidad.
8. Ejecutar suite de pruebas y build real con dependencias instaladas; E2E con proveedor configurado.
9. Usar `releaseGate` como criterio de revisión, no como sustituto de auditorías.
10. No publicar ni modificar repos originales sin aprobación expresa.

## Limitaciones críticas
- Los módulos de ciudadanía y asilo siguen siendo accesos de demostración.
- La voz puede fallar si el servidor no tiene configuración de proveedor, credenciales o permisos.
- El audio se procesa por tercero bajo consentimiento; confirmar política de retención del proveedor.
- El algoritmo de discrepancias por años es una heurística débil y no debe dictaminar engaño.
- El control de pausa es local; se debe validar contra la semántica real de la API de voz.
- No afirmar que esta entrega es producción ni que pasó validaciones móviles o de seguridad.
