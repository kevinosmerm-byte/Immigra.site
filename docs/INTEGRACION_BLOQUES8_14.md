# Integración acumulativa — bloques 8 a 14

Se tomó el ZIP como referencia de alcance, conservando los archivos acumulativos 1–7. No se ejecutaron como órdenes independientes las instrucciones incluidas en documentos. Sin despliegue ni transmisión real de audio.

## Implementado
- B8: transcripción local inmutable, identificación por turno, deduplicación por rol e ID y límites coherentes.
- B9: extracción limitada de años e incertidumbre. Asociación pregunta/respuesta explícitamente revisada por usuario, nunca basada en llegada asíncrona. Sin verificación factual o evaluación legal.
- B10: revisión editable/exclusión de turnos, confirmación antes de análisis, citas T, marcadores personal/ficticio, informe y exportación TXT/JSON.
- B11: conservación completa opcional y desactivada por defecto; consentimiento de audio previo existente, ocultación de patrones comunes en informe/exportación. Revisión y transcripción se borran al salir, ocultar pestaña o cambiar idioma. No se almacena audio ni se persisten transcripciones.
- B12: se mantiene límite previo de 600 segundos y se agregan 150 eventos/200.000 caracteres al transporte, incluso sin informe. Contrato validateAccess incluido solo como referencia, NO autenticación o entitlement activos.
- B13: ejemplo ficticio ES/EN accesible sin micrófono; pruebas de asociación, deduplicación, exclusión, revisión, redacción, exports, límites y ciclo de captura/borrado.
- B14: integración con el cliente WebRTC existente, preservando modo, relación, escenario, intensidad, voz Marin, videos y cancelación del micrófono. Eventos actuales de transcripción y buffer de salida preservados.

## Validación
68 pruebas pasaron, compilación correcta. UI: generación deshabilitada sin confirmación; asociación manual de tres respuestas; informe con incertidumbre y años distintos para pregunta repetida; TXT/JSON descargados y leídos; cambio de idioma borra revisión; pantalla inglesa y viewport 390 px sin desbordamiento (contenido 375 px). Se conservan hashes de motores, bancos, estilos del video, voz local y archivos MP4. La prueba de captura usa mocks, no WebRTC real.

## Límites explícitos
Una transcripción recibida puede no coincidir con lo oído (por ejemplo, salida interrumpida), faltar o llegar tarde. La revisión humana es obligatoria; no se demuestra completitud. Se conservan hasta 4.000 caracteres normalizados por turno. Los límites del cliente no sustituyen gasto/entitlement en servidor. La ocultación por patrones no detecta todos los identificadores. Las exportaciones son responsabilidad del usuario y no se borran con la sesión.

Pendiente: API/micrófono reales, Safari/iOS/Android, auditoría completa de accesibilidad y privacidad, autenticación, cuotas persistentes, protección de costes y despliegue de producción. Los siguientes bloques de PLAN_15_PLUS no se implementaron por anticipado.

Referencia: [OpenAI Docs — Realtime transcription](https://developers.openai.com/api/docs/guides/realtime-transcription), consultada para confirmar que el orden de los eventos completados no está garantizado. No se cambió el modelo solicitado gpt-realtime.
