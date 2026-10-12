# Conversaciones con Sarah y Kevin

La conversación guiada está disponible desde conversación/coach y es la entrada
por defecto de la entrevista completa. Conserva el avatar D-ID como alternativa
opcional; el agente externo controla su propio diálogo y no recibe estas nuevas
reglas de avance.

Antes de empezar se eligen tema, idioma y Sarah/Kevin. Ciudadanía, asilo y ajuste
de estatus conservan el idioma elegido; cambiar de tema no fuerza inglés.
Actualmente se ofrecen español e inglés. En ciudadanía se explica el objetivo
de practicar inglés, sin imponerlo. Preguntas, voz, transcripción y comentarios
usan el idioma de práctica. La disponibilidad y timbre de las voces dependen
del dispositivo.

## Flujo y límites

- La aplicación controla una agenda breve de seis temas sin repeticiones.
  El modelo recibe la pregunta actual e historial acotado y devuelve comentarios
  estructurados, sin generar la siguiente pregunta. No se añade otro proveedor
  ni un segundo servicio de pago.
- El micrófono se abre al pulsar Hablar. El cierre por pausa es configurable:
  requiere al menos 300 ms de energía de voz y espera 2,8 segundos de silencio.
  Es una estimación por volumen, no detección semántica; el ruido puede afectarla.
  Terminar manualmente sigue disponible. Quince segundos sin voz liberan el
  micrófono sin enviar audio ni avanzar; el límite existente de 45 segundos
  también actualiza la interfaz y procesa la grabación una sola vez.
- Repetir, omitir y «no sé» se resuelven localmente. Los errores del proveedor
  conservan el texto para editar/reintentar o pasar al siguiente tema.
  Grabaciones y transcripciones tardías se invalidan al salir o cambiar de pregunta.
  Las peticiones tienen una espera acotada y no se reintentan automáticamente.
- Las entrevistas cívicas conservan la evaluación determinista y el banco USCIS.
  Dos respuestas incorrectas o incompletas ofrecen repaso y permiten continuar.
  En N-400, una segunda respuesta ambigua permite avanzar sin guardarla como
  Sí/No. El banco N-400 y la entrevista cívica dedicados siguen siendo prácticas
  de preguntas en inglés; el selector bilingüe pertenece a la conversación guiada.
- No se guardan historiales ni audio en almacenamiento local. El modelo ayuda
  a expresarse, no decide elegibilidad, credibilidad o estrategia legal, ni inventa
  relatos de asilo. Los nuevos temas son ejercicios de comunicación, no bancos
  oficiales de entrevista. La política y retención de los proveedores externos
  siguen aplicando.

La extensión posterior añade un [motor propio de escucha continua](OWN_CONTINUOUS_VOICE.md)
con interrupciones por voz, pausa y correcciones, sin LiveKit. La transcripción
continúa siendo por turno y no se utiliza WebRTC. La alternativa manual sigue
permitiendo detener la voz o pulsar Hablar para interrumpirla.

## Motores investigados

Se consultaron los README de los repositorios oficiales mediante su contenido
en GitHub. Las páginas independientes de documentación rechazaron el acceso
desde este entorno con un 403 del proxy.

| Alternativa | Evidencia consultada y encaje |
| --- | --- |
| [LiveKit Agents](https://github.com/livekit/agents) | WebRTC y detección semántica del fin de turno con un modelo transformer. Es la primera opción a evaluar para conversaciones continuas con menos interrupciones. El framework usa Apache-2.0; los modelos de turnos tienen una licencia separada. |
| [Pipecat](https://github.com/pipecat-ai/pipecat) | Framework Python para pipelines de voz/multimodales, transportes WebRTC/WebSocket, integración con proveedores y Silero VAD. Adecuado para combinar transcripción, modelo, síntesis y distintos avatares. |
| [Referencia experimental OpenAI Realtime](https://github.com/openai/openai-realtime-api-beta) | Ejemplos de audio en streaming, VAD e interrupciones. Es un repositorio beta: no se toma como contrato de la API de producción actual. Antes de integrarlo hay que consultar la documentación vigente. |

Estos frameworks resuelven el transporte y los turnos de voz; no aportan por sí
solos un cerebro de entrevistas migratorias validado. La agenda, fuentes oficiales,
memoria de temas y límites de recuperación deben seguir siendo de la aplicación.

Una siguiente etapa debería evaluar LiveKit con el flujo actual como controlador:
idioma explícito, detección semántica, interrupciones, estado de preguntas ya
tratadas y pruebas EN/ES con pausas y ruido. Requiere preparar un servicio de
agentes, autenticación de sesiones, configuración de red/proveedores y mediciones
de latencia/coste. No se instaló ni se activó uno de estos motores en esta entrega.

La [evaluación detallada de voz continua](LIVEKIT_CONTINUOUS_VOICE_EVALUATION.md)
concreta una opción con LiveKit Cloud y el SDK Node, sin migrar la app a Python.

## Validación

Pruebas unitarias de agenda EN/ES, comandos, selección de voces, recuperación
acotada y pausas. Se ejecuta la calidad existente, typecheck y extracción oficial.
Resultado de esta entrega: 247 pruebas aprobadas, cero fallos y cero omitidas;
lint, build, typecheck, verificadores móviles y extracción de 128 preguntas /
410 respuestas oficiales aprobados. Se revisó la interfaz a 320, 390 y 1280 px
en temas claro y oscuro, sin controles recortados ni desbordamiento horizontal.

Chromium con proveedores simulados comprobó elección de idioma/personaje,
avance sin repetir preguntas generadas, omisión sin llamadas de IA, recuperación
de errores, sesión completa/reinicio, silencio inicial, pausa breve/larga, límite
de grabación y permiso tardío tras salir. También comprobó el avance de N-400
ambiguo y civismo incorrecto/incompleto. La simulación verifica flujo y contratos,
no calidad acústica, exactitud de transcripción ni respuestas reales de OpenAI/D-ID.
Las credenciales de esos servicios no están configuradas en este entorno.
