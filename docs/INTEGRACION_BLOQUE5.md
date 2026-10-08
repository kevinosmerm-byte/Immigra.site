# Integración acumulativa del Bloque 5

Se integraron el gateway de credenciales efímeras y el cliente WebRTC como opción adicional. No se copiaron encima los shells y motores antiguos incluidos en el ZIP. Se conservaron las mejoras y videos de las entregas anteriores.

## Cambios
- server/realtime.mjs: validación de motor, relación, idioma, consentimiento, modo y escenario; instrucciones acotadas; gpt-realtime, Marin, transcripción de entrada y VAD; timeout de proveedor y respuesta limitada a datos públicos.
- server/server.mjs: servidor combinado de dist y API, carga real de .env, escucha en loopback, validación Host/Origin, cabecera, límite de cuerpo y cuatro solicitudes/minuto. No autenticación de producción.
- modules/residency/realtime: controlador WebRTC cancelable y UI bilingüe con consentimiento explícito, estados, subtítulos y videos existentes.
- Residency.jsx/features.js: nueva opción beta desde la configuración, conservando el modo, relación y escenario; la ruta sigue aislada en residencia.
- vite.config.js: proxy /api local; base relativa conservada.
- package.json/package-lock.json: versión 0.5.0 y script server:realtime, sin dependencias nuevas.

## Correcciones respecto al prototipo recibido
Se conservaron el modo ficticio y el escenario; el servidor vuelve a validarlos. Cancelar mientras getUserMedia está pendiente detiene las pistas cuando llegan y no conecta después. Se abortan solicitudes de red al salir y se cierran canal, peer, micrófono y audio. Sin configuración no se solicita micrófono.
La animación de habla usa output_audio_buffer.started/stopped/cleared; response.done no se interpreta como fin de reproducción. Subtítulos de salida usan response.output_audio_transcript.done. La interrupción envía response.cancel seguido de output_audio_buffer.clear. Se habilitó la transcripción de entrada explícitamente.
El retorno de credenciales omite clave permanente, errores del proveedor y datos arbitrarios. La expiración del token limita la ventana de creación, no por sí sola la duración de una sesión ya iniciada.

## Fuentes oficiales consultadas el 8 de octubre de 2026
- WebRTC: https://developers.openai.com/api/docs/guides/voice-webrtc?voice-api=realtime
- Creación de client secrets: https://developers.openai.com/api/reference/resources/realtime/subresources/client_secrets/methods/create
- Eventos de cliente: https://developers.openai.com/api/reference/resources/realtime/client-events
- Eventos de servidor: https://developers.openai.com/api/reference/resources/realtime/server-events

Se mantuvo gpt-realtime indicado en el paquete. La compatibilidad de la cuenta y conexión de producción no se probaron sin credenciales.

## Preservación y resultados
Los bancos, motor local, adaptador, heurística, selección de voz femenina local, estilos de video, colores del shell y MP4 se verificaron por hash. 46 pruebas aprobadas y compilación correcta. UI ES/EN y móvil revisada; WebRTC/proveedor simulados en pruebas. No se hicieron llamadas reales a OpenAI, no se usó hardware de micrófono ni se publicaron archivos.
