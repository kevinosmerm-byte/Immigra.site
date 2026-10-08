# Voz y revisión de respuestas

Las preguntas se leen automáticamente al abrir cada turno. El video elegido usa el clip speaking durante la lectura y listening durante la respuesta. Los cuatro clips fueron copiados de los archivos proporcionados por el usuario; no se modificaron originales.

El micrófono requiere la autorización del usuario en el aviso y el permiso del navegador. Web Speech Recognition transcribe ES/EN; depende del navegador y de su proveedor, puede enviar audio a ese proveedor y no garantiza funcionamiento offline ni compatibilidad universal. Sin soporte o con permiso denegado se conserva la respuesta escrita. No se guardan grabaciones. Reconocimiento detenido al salir, ocultar la pestaña o terminar. Límite de 90 segundos por activación; se puede volver a activar.

La transcripción es editable. Evaluar respuesta con IA exige confirmar el envío de pregunta y respuesta a Cloudflare/OpenAI. Usa /api/analyze con task=interview_feedback y consent_version=interview-feedback-v1; conserva Access, cuota diaria y store:false. La salida solo contiene observaciones ancladas en citas literales: detalle concreto, incertidumbre válida o referencia ambigua. No hay puntuación, valoración de credibilidad, elegibilidad ni predicción legal.

33 pruebas automatizadas aprobadas, incluidas secuencia voz-micrófono, cancelación, transcripción tardía, consentimiento y rechazo de citas inventadas. Lectura automática inicial y siguiente pregunta comprobadas en navegador. El dictado con voz real necesita prueba en el dispositivo del usuario; no se capturó audio personal durante la verificación.

Documentación: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition

Prueba real en producción aprobada: respuesta ficticia evaluada por OpenAI, devolvió detalle concreto e incertidumbre con citas literales; texto original sin cambios. Micrófono desactivado durante esta prueba para evitar capturar audio personal.
## Actualización de personajes
Sahara es la acompañante personal en bienvenida e inicio; Kevin es el único entrevistador de práctica. Se sustituyeron ambos MP4 de Sahara por Sahara Speaking.mp4 y Sahara no speaking (2).mp4 entregados por el usuario. El reproductor no usa foto poster. Prueba local: bienvenida reproduce speaking y entrevista reproduce Kevin sin poster; 33 tests pasan.
## Voces por personaje
Kevin selecciona una voz masculina y Sahara una femenina. Se prioriza el idioma solicitado; si el dispositivo solo tiene voces de otro idioma, se conserva el género y se informa que el acento depende de esa voz. No se cambia artificialmente el tono para simular género. En el dispositivo de prueba: Microsoft David y Microsoft Zira (en-US). La selección usa nombres reconocidos porque Web Speech no expone género. 34 pruebas pasan. Referencia Windows: https://support.microsoft.com/en-us/accessibility/windows/narrator/appendix-a-supported-languages-and-voices
