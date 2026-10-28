# Rediseño de entrevista — llamada en vivo (0.22.1)

La entrevista Realtime usa una superficie fija de tres filas: cabecera compacta, video dominante y cinco controles. Inspirada en la referencia aportada por el usuario, conserva los videos reales de Sahara y su encuadre completo. No utiliza un sello oficial ni presenta la práctica como entrevista gubernamental.

## Comportamiento
- Micrófono, repetir, pausar/reanudar, subtítulos y finalizar siempre en la barra inferior, sin menús. SVG accesibles, nombres, estados aria-pressed y objetivos de 48–64 px.
- Cabecera con Sahara, tipo de práctica, cronómetro y estado; video alterna escucha/habla, indicador de procesamiento, pausa y desconexión.
- 100dvh, VisualViewport y safe-area-inset-*; al reducir altura se reducen espacios y video primero. Navegación, pie y menús de la app se ocultan durante llamada.
- Preparación: idioma/nivel, comenzar y aviso breve de consentimiento por acción. Las opciones de privacidad permanecen plegadas antes de iniciar; no aparecen durante la llamada. Informe local habilitado y consentido al pulsar comenzar tras el aviso; puede desactivarse previamente.
- Pausa deshabilita la pista de micrófono, silencia audio y cancela/limpia respuesta y entrada pendientes. Reanudar conserva la sesión y la preferencia de silencio. La pausa no detiene el límite de 10 minutos ni garantiza detener facturación del proveedor.
- Repetir corta la respuesta actual antes de solicitar la repetición. El usuario también puede interrumpir hablando (VAD existente) o con el botón de micrófono.
- Reconectar visible ante error; abre una nueva sesión de proveedor y conserva los turnos locales para revisión. El proveedor no recupera automáticamente contexto anterior. Ocultar pestaña mantiene la política previa de desconectar y borrar datos locales.
- Finalizar abre diálogo nativo accesible con cancelación y restauración de foco. Confirmar cierra micrófono y pasa a VoiceReview existente. Navegar atrás pide confirmación; recargar/cerrar registra beforeunload, sujeto al comportamiento del navegador.
- Denegación de micrófono: explicación breve para habilitarlo en ajustes del sitio y botón para reintentar. Sin credenciales se muestra indisponibilidad y sigue siendo posible finalizar y volver.

## Conservación
No se cambiaron preguntas, evaluación, bancos, lógica de los informes, memoria, niveles, voz Marin o archivos MP4. Se adaptó el transporte solo para pausa/procesamiento y se reorganizó el componente Realtime. La práctica escrita sigue independiente.

## Verificación realizada
77 tests aprobados y compilación Vite correcta. Nuevas pruebas: pausa corta entrada/salida, repetición no actúa en pausa, eventos tardíos no cambian el estado, reanudar respeta silencio y denegación permite reintento sin fuga de pistas.

Vista aislada en work/ (NO incluida en el ZIP) renderizó el componente real con cliente simulado: empezar, silenciar, pausar, reanudar, subtítulos, cancelar finalización, finalizar y acceder a los mismos turnos en revisión. Las capturas entregadas son de esa simulación, sin micrófono ni API.

Tamaños verificados: 320x568, 360x640, 390x844, 568x320, 360x300, 1024x768 y 1440x900. Tras completar resize, los cinco botones estaban dentro del viewport. A 320x568: objetivos de 50x50 px y video de 401 px de altura; documento de 568 px sin scroll. A 360x300: barra visible y video de 191 px. 300 px de altura simula espacio reducido por teclado, no un teclado físico.

Pendiente: Safari/iOS y Android físicos (áreas seguras/teclado/rotación), API y audio reales. No afirmar validación en dispositivos que no se probaron. También siguen vigentes los límites de producción documentados en README.

Referencia técnica: https://developers.openai.com/api/reference/resources/realtime/client-events (response.cancel seguido de output_audio_buffer.clear).
