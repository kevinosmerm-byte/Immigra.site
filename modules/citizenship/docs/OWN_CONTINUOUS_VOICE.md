# Motor propio de voz continua

Implementado como una extensión del flujo existente, sin código de LiveKit,
sin sus dependencias y sin un servicio nuevo. No entrena un modelo de IA.
Usa Web Audio/AudioWorklet para audio local y los endpoints existentes para
transcripción y comentarios. Los controles de acceso, cuotas y evaluación
cívica existentes siguen aplicándose.

## Uso

En conversación guiada (coach o entrevista completa), elegir tema, idioma
español/inglés y Sarah/Kevin. Iniciar la conversación y pulsar **Activar voz
continua**. Ese gesto solicita el micrófono; no se abre al entrar a la pantalla.
Una vez conectado, la persona contesta sin volver a pulsar Hablar/Terminar.

- El personaje se puede interrumpir hablando. Un control permite desactivar las
  interrupciones por voz si el altavoz produce activaciones falsas.
- **Pausar voz continua** apaga y libera el micrófono, cancela peticiones del
  cliente y detiene la voz. **Responder por escrito** cambia a la alternativa
  escrita. **Ya terminé** permite cerrar una respuesta antes de la pausa.
- «Pausa» / «stop listening» detiene la captura tras transcribir el comando.
  El botón Pausar es inmediato y no depende del proveedor.
- «Quiero corregir mi respuesta: ...» / «I want to correct my answer: ...»
  sustituye la última respuesta enviada. Sin contenido adicional, permite
  editarla o volver a decirla. Se conserva el punto al que ya había llegado la
  conversación, incluso si se omitieron temas posteriores.
- La alternativa **Grabar una respuesta manualmente** y la entrada escrita
  permanecen disponibles cuando AudioWorklet no funciona o se deniega permiso.

El idioma elegido no cambia al activar voz continua. Se envía explícitamente
a la transcripción y a los comentarios; también se utiliza en preguntas y TTS.
Las voces instaladas dependen del dispositivo.

## Captura y turnos

Una conexión getUserMedia solicita cancelación de eco, reducción de ruido,
ganancia automática y audio mono. El navegador puede no aplicar todos esos
ajustes. AudioWorklet entrega muestras PCM; se conserva un prefijo de hasta
400 ms para no perder el inicio durante la confirmación de voz.

El detector local requiere actividad sostenida (180 ms en espera, 350 ms para
interrumpir), ignora el comienzo del audio del personaje durante 700 ms y espera
2,2 segundos de silencio antes de terminar la respuesta. La opción sin
interrupciones suprime audio durante la voz del personaje y su cola de 250 ms.
Se genera WAV PCM mono de 16 kHz por respuesta y se utiliza /transcribe.

Es segmentación por energía, no un detector semántico ni un modelo que distinga
con certeza voz de ruido. Pausas largas pueden dividir una respuesta; el usuario
puede corregirla, finalizar manualmente o desactivar voz continua. Probar con
altavoz, auriculares y ruido antes de asumir calidad acústica en producción.

El micrófono permanece conectado mientras se analiza una respuesta. Una nueva
intervención cancela el trabajo anterior del cliente y puede reemplazarlo.
Los identificadores de sesión/turno invalidan respuestas tardías; estas no pueden
avanzar una pregunta ni apagar una captura nueva. La aplicación controla la
agenda. Corregir no se interpreta como respuesta a un tema posterior.

## Límites y privacidad

- Máximo de 45 segundos por respuesta. Si se alcanza, se detiene la captura,
  transcribe y presenta el texto para revisión; no lo envía automáticamente
  al modelo como si fuera una respuesta completa.
- Diez turnos de audio y ocho minutos por conexión. El último turno permitido
  se puede completar; no se empieza otro automáticamente. Las cuotas existentes
  del servidor siguen siendo el límite autorizado, aunque se reconecte el cliente.
- Sesenta segundos sin hablar liberan el micrófono sin enviar silencio a la IA.
- Salir, ocultar la página, perder conexión, perder el dispositivo o suspenderse
  el AudioContext pausa la captura. Reanudar requiere otro gesto del usuario.
- Esperas de transcripción/comentarios acotadas; ningún error produce un
  reintento automático. Un fallo pausa el modo continuo y conserva el tema.

No se guardan muestras, WAV, transcripciones ni conversaciones en almacenamiento
local. Los buffers son temporales y acotados. Solo los turnos detectados se envían
al proveedor de transcripción. La conversación y retención externa conservan la
política existente. Cancelar fetch no garantiza que un proveedor ya llamado deje
de procesar o cobrar esa petición.

No añade tarifas LiveKit ni un worker nuevo. Sí utiliza los servicios existentes:
un turno hablado requiere transcripción y una respuesta normal requiere además
comentarios del modelo. Un comando hablado necesita transcripción, aunque después
se resuelva localmente sin llamada al modelo. Silencio o ruido breve ignorado
no genera una petición. No se verificaron tarifas ni ahorro monetario real.

## Verificación y alcance

Pruebas unitarias del detector: silencio, clicks, prefijo, pausas cortas/largas,
interrupciones, cola de reproducción, límites, descartes, WAV y comandos EN/ES.
Chromium con micrófono/proveedores simulados comprueba una única conexión,
corrección, cancelación de comentarios tardíos, permiso tardío, pausa, error
de transcripción y pérdida de conexión.

Se comprobó además el **AudioWorklet real de Chromium** con audio sintético:
dos respuestas separadas generaron WAV y avanzaron usando la misma pista de
audio; Pausar terminó la pista. Se comprueba también la compilación de producción
y el recurso Worklet servido desde el build.

Las llamadas del proveedor se simulan: no se afirma calidad de reconocimiento,
latencia de OpenAI ni fidelidad de voz con personas reales. No se han probado
dispositivos físicos iPhone/Android en esta entrega. El reconocimiento sigue
procesando una grabación por turno; no es transcripción parcial en streaming ni
audio WebRTC. La escucha es continua en el dispositivo, con espera del proveedor
después de cada turno.

Resultado de validación de esta entrega: 258 pruebas aprobadas, cero fallos y
cero omitidas; lint, build, typecheck y verificadores móviles aprobados.
La extracción oficial conserva 128 preguntas y 410 respuestas. La UI se revisó
a 320, 390 y 1280 px en claro/oscuro. Los casos de borde de navegador comprobaron
también el límite de 45 segundos, silencio de un minuto, diez turnos, pagehide,
corrección tras omitir temas y cierre de micrófono sin cortar el mensaje final.

La alternativa [LiveKit](LIVEKIT_CONTINUOUS_VOICE_EVALUATION.md) permanece como
evaluación histórica, no como dependencia de esta implementación.
