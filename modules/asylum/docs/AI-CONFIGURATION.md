# Configuración de IA — AsiloAI

Estado al 2026-10-07: frontend y API desplegados en Cloudflare Pages asiloai, dominio https://asiloai.com. IA activada en beta privada; clave guardada como secreto y prueba real con texto ficticio completada. No se han enviado expedientes a OpenAI.

## Arquitectura

scripts/build.cjs genera dist/_worker.js con worker.mjs, access.mjs y gateway.mjs. _routes.json dirige /api/* al Worker. Publicar exclusivamente dist/.

El gateway verifica firma RS256, emisor, audiencia y vencimiento del JWT de Cloudflare Access. La política AsiloAI owner only protege asiloai.com/api/analyze y asiloai.com/api/session, limitada al correo del propietario. /api/status es público y devuelve disponibilidad sin credenciales. La cookie de Access tiene HTTP Only. No se usa un token compartido en el frontend.

## Producción

- AI_ENABLED: true.
- OPENAI_MODEL: gpt-4.1-mini-2025-04-14.
- ACCESS_TEAM_DOMAIN: https://patient-dream-fabf.cloudflareaccess.com.
- ACCESS_AUD: 69bbaad9d4fe93535082550fa9880199f0c262cbfe0ad447248d84a7cc8de36b.
- AI_USAGE: binding D1 asiloai-ai-usage.
- OPENAI_API_KEY: guardada como secreto en Cloudflare. No incluida en archivos, Git ni chat.

Cambiar variables o bindings requiere otro despliegue. ANALYSIS_TEST_TOKEN se conserva solo para pruebas aisladas del handler, no se configura ni utiliza en el gateway público.

D1 contiene contadores diarios y hash de usuario, sin relatos ni correos. services/analysis/quota.sql define la tabla. Reserva atómica: 10 solicitudes por usuario/día y 100 globales/día UTC. Los intentos fallidos después de reservar también consumen cuota. Es un límite de solicitudes, no un límite monetario contractual. Limpieza de contadores antiguos documentada, todavía no programada.

Proyecto OpenAI independiente: AsiloAI. Formulario de clave preparado con escritura a Responses exclusivamente. El propietario debe generar la clave y guardarla directamente como secreto de Cloudflare. No se reutilizan credenciales de CitizenshipAI.

## Contrato y privacidad

POST /api/analyze: text (máximo 10.000 caracteres), language (es/en), domain (personal/synthetic), source_id, consent=true, consent_version=ai-excerpts-v1. Solo admite origen del sitio y sesión válida. La interfaz muestra el fragmento y exige consentimiento específico para Cloudflare y OpenAI.

Responses usa store:false y salida estructurada. Devuelve citas literales verificadas contra el texto y requires_review=true. No cambia el caso ni evalúa credibilidad, veracidad o elegibilidad. Las categorías pueden contener errores. store:false no garantiza retención cero del proveedor. El código no registra cuerpos ni credenciales; mantener esa restricción al configurar observabilidad.

## Validación y operación

26 pruebas automatizadas aprobadas: firma JWT, origen, cuotas, consentimiento, límites y citas inventadas. Prueba SQLite de reserva/cambio de día aprobada. API publicada respondió ready:false; ruta de sesión mostró Cloudflare Access. Prueba real de extremo a extremo aprobada: sesión privada, reserva de cuota D1 y OpenAI Responses devolvieron fecha, lugar e incertidumbre de una fuente ficticia. Ninguna afirmación del caso fue añadida ni modificada.

1. Completado: OPENAI_API_KEY guardada como secreto.
2. Completado: AI_ENABLED activado y nuevo despliegue publicado.
3. Completado: solicitud autenticada aceptada por el gateway.
4. Completado: fuente ficticia analizada; tres citas literales verificadas, sin modificar afirmaciones.
5. Mantener beta privada hasta completar validación y autorización de usuarios públicos.

Documentación consultada:
https://developers.openai.com/api/docs/guides/structured-outputs
https://developers.openai.com/api/docs/guides/your-data
https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/

