# Bloque 5 — Conversación Realtime IA (beta)

Este ZIP contiene **todos los bloques 1–5** y agrega un gateway de token efímero, un cliente WebRTC de audio y una interfaz de video por estado. No cambia repositorios de ciudadanía/asilo.

## Cómo iniciar
1. Instalar Node 22+ y ejecutar `npm install`.
2. Crear `.env` local desde `.env.example`, colocando `OPENAI_API_KEY` solo en servidor (nunca VITE_ ni código cliente).
3. `npm run server:realtime` en una terminal y `npm run dev` en otra.
4. Abrir web en HTTPS o localhost y permitir el micrófono.
5. En Residencia, seleccionar **IA en tiempo real (beta)**.
6. Añadir tus videos `public/interviewer/listening.mp4` y `speaking.mp4` (no recibidos aún).

## Importante: seguridad antes de producción
**NO desplegar este gateway públicamente como está.** La ruta de emisión de tokens no tiene autenticación real, autorización de suscripción ni protección robusta antiabuso. Añadir autenticación verificada en servidor, controles de cuota por usuario, costos, registro de uso sin datos personales, CSRF/origen, rate limiting compartido, monitoreo y consentimiento explícito antes de cualquier despliegue.
La demo no persiste grabaciones ni transcripciones en su propio backend; OpenAI puede procesar audio y aplicar políticas de retención. Revisar términos actuales, configuración de privacidad y consentimiento. No usar con información sensible sin controles adicionales.

## Capacidades y límites
- WebRTC audio bidireccional con proveedor Realtime, si el modelo, endpoint y cuenta permiten conexión.
- La IA recibe instrucciones restringidas a residencia, con contexto de sesión en el proveedor; no tiene acceso automático a formularios o expedientes.
- Audio/video de escucha y habla según eventos del canal de datos; algunos eventos pueden variar según versión del API.
- No existe sincronización labial real. Los videos son bucles visuales y su sonido debe estar silenciado.
- La sesión se pierde al salir; no hay resumen semántico persistente.
- El servicio requiere API paga y conexión de red; no se puede verificar la conexión real sin clave y navegador con micrófono.
- No mezclar con banco cívico ni otros motores. Feature flag, tests de regresión y aprobación antes de integrar a repositorios.

## Próximas tareas para Codex
1. Verificar contra documentación vigente los campos de creación de token efímero y tipos de eventos del Realtime API.
2. Implementar sesión autenticada y pago con límites, sin exponer claves permanentes.
3. Agregar consentimiento antes de encender micrófono, accesibilidad y manejo de errores/renegociación.
4. Implementar resumen educativo basado en transcripciones consentidas, sin juicios de credibilidad ni aprobación.
5. Pruebas manuales Chrome/Safari/Capacitor, red lenta, eco, interrupción, video ausente y desconexión.
6. Controlar tiempos de espera y gasto, cerrar sesiones al salir, eliminar datos según política.
