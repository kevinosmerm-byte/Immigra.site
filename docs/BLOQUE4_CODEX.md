# BLOQUE 4 — Voz y videos del entrevistador
Este paquete contiene los bloques 1-3 y añade un modo de voz experimental en Residencia.

## Agregar los videos existentes
Coloca exactamente estos archivos en `public/interviewer/`:
- `listening.mp4` — video en bucle del entrevistador escuchando
- `speaking.mp4` — video en bucle del entrevistador hablando
Se alternan al cambiar el estado `listening`/`speaking`. El video está silenciado; el sonido procede del sintetizador de voz.
No se han recibido los archivos originales, por lo que se muestra un avatar de reserva.

## Qué está implementado
Web Speech API SpeechRecognition (si el navegador lo permite), síntesis de voz speechSynthesis, subtítulos, pregunta siguiente, repetir, silenciar, interrumpir mientras habla, estado visual, finalización y borrado de memoria.
Entrevistas de residencia: 12 preguntas de la base bilingüe, una por vez. La memoria se limita a la sesión del navegador.
**NO** es audio bidireccional continuo ni Realtime API; la conversación es por turnos. No se promete latencia baja ni sincronía labial real.
**NO** existe todavía agente semántico LLM en tiempo real. El prototipo usa secuencia de preguntas y la revisión heurística anterior.
No ingresar información sensible: el reconocimiento del navegador puede usar servidores de terceros.

## Para Codex: producción
1. Mantener aislados ciudadanía/asilo; no modificar sus motores.
2. Reemplazar Web Speech API por un proveedor realtime mediante tokens efímeros creados en backend; NUNCA exponer claves en cliente.
3. VAD, cancelación de respuesta, barge-in, manejo de eco, reconexión, audio por WebRTC y latencia.
4. La IA debe conservar contexto de la sesión y preguntar neutralmente sin inventar hechos; no predecir aprobación ni asesorar jurídicamente.
5. Consentimiento explícito, aviso de terceros, cifrado, políticas de retención/borrado, controles de acceso, límites de costo y auditoría.
6. Evaluar iOS Safari y Capacitor Android/iOS por separado: Web Speech API no es uniforme y puede requerir integración nativa.
7. Implementar tests E2E con micrófono simulado y prueba manual de permisos y errores.
8. Nunca afirmar que el video está sincronizado labialmente con TTS. Si se desea lip sync, integrar solución autorizada específica.

## Ejecución
`npm install`, `npm test`, `npm run dev`, `npm run build`.
