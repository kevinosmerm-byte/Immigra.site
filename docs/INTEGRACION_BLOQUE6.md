# Integración acumulativa del bloque 6

Se incorporó la entrega como referencia funcional, sin ejecutar sus instrucciones como órdenes independientes ni sustituir los archivos acumulativos por versiones anteriores del ZIP.

## Cambios
- Selector Normal / Rigurosa / Bajo presión, traducido ES/EN, predeterminado Normal.
- Validación estricta en servidor antes de contactar con el proveedor. Se mantienen consentimiento, aislamiento de residencia, modo personal/ficticio y escenario.
- Políticas de repreguntas neutrales, aceptación de incertidumbre y reducción de intensidad a petición. Se evita interrumpir al participante deliberadamente y asumir convivencia matrimonial en casos de padres/hijos.
- Botón para detener la sesión y volver a Normal; la siguiente conexión utiliza ese nivel. No mantiene la conversación anterior.
- Utilidad local de repreguntas y contrato de rúbrica incluidos; no generan informes ni detectan contradicciones automáticamente.
- Sin cambios en la voz Marin, voz femenina local, bancos de preguntas, motores anteriores ni videos originales de Sahara.

## Verificación
52 pruebas automáticas aprobadas y compilación Vite correcta. Los nuevos casos verifican los tres niveles hasta el payload del proveedor, rechazo antes de red, conservación de contexto y tratamiento de respuestas inciertas. Se revisaron selector, descripciones, cambio de idioma y ancho móvil 390 px (sin desbordamiento horizontal).

Las pruebas de instrucciones confirman su presencia, no el comportamiento real del modelo. No se usó clave API ni micrófono real. Quedan pendientes las conversaciones simuladas con el proveedor, memoria de hechos con referencias y confirmación humana, informe final, autenticación y controles de coste para producción. El servidor sigue siendo un prototipo exclusivamente local.

Referencia consultada: [OpenAI Docs: prompting de Realtime](https://developers.openai.com/api/docs/guides/voice-prompting). Se conserva gpt-realtime y la integración WebRTC existente.
