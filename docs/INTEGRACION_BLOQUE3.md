# Bloque 3 — integración sobre bloques 1 y 2

## Aportes
Se integró consistency.mjs dentro del módulo existente de residencia. Sus repreguntas se adaptaron para indicar el tema y evitar afirmar que existe una contradicción o que las fechas eran aproximadas.
El adaptador ahora gestiona fases explícitas: preguntas, aclaraciones y finalizado. Hay como máximo dos aclaraciones; responder u omitir la última termina correctamente. Omitir la última pregunta base también aplica la revisión. Terminar anticipadamente conserva lo contestado y muestra resumen.
La interfaz incorpora 12 preguntas por defecto, escenario opcional, progreso separado de aclaraciones y sus respuestas en el resumen. Conserva todas las opciones del Bloque 2.
Las observaciones y la cola interna no se incluyen en lecturas públicas ni exportaciones. El borrado limpia también las aclaraciones.

## Conservación
No se copió encima el shell antiguo incluido en el ZIP: habría perdido las mejoras previas. src/main.jsx, src/modules.js, src/style.css y el motor base de residencia permanecen idénticos a la versión acumulada anterior.
Los bancos del Bloque 3 son idénticos a los del Bloque 2; se conserva una única copia operativa de 270 preguntas y 30 escenarios. No se alteró ningún repositorio externo.
El archivo ImmigrationAI_Bloques1y2.zip sigue disponible. Se guardó un respaldo técnico adicional en work/ImmigrationAI_antes_Bloque3.zip.

## Límites
La comparación de años por categoría es una heurística de solicitud de contexto, no una detección semántica de contradicciones. Las preguntas pueden referirse a eventos diferentes. Solo se ejecuta localmente y no emite una evaluación de credibilidad.
Se mantienen las limitaciones de backend y privacidad de producción descritas en README.md. El consentimiento y las validaciones locales del Bloque 2 se preservaron aunque el prototipo recibido no los incluía.

## Validación
24 pruebas y build correctos. Flujo completo de navegador hasta resumen y formulario móvil sin desbordamiento horizontal. Los archivos preservados se compararon por SHA-256 con la versión anterior.
