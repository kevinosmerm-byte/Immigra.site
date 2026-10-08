# Immigration AI — bloques 1 a 30

Proyecto acumulativo React/Vite 0.30.0. Conserva los tres portales, práctica escrita de residencia, informes escritos, voz femenina del navegador, Realtime con Marin, intensidades y videos originales de Sahara completos y sin recorte.

## Abrir la práctica local
Requiere Node.js 22.12+ o 24. Desde esta carpeta:

```sh
node serve.mjs
```

Abre http://127.0.0.1:4388. `dist/` viene compilado. No requiere instalar dependencias para usar este compilado. En Residencia puedes hacer práctica escrita y descargar su informe. En «IA en tiempo real · beta», «Probar revisión con ejemplo ficticio» permite probar los informes de voz sin micrófono ni clave API.

## Activar Realtime local
1. Copia `.env.example` a `.env`.
2. Configura `OPENAI_API_KEY` solo en ese archivo del servidor y `REALTIME_ENABLED=true`. No pegues claves en el navegador, código público ni chat.
3. Ejecuta `node server/server.mjs` o `npm run server:realtime`.
4. Abre http://127.0.0.1:8787 y entra en Residencia → IA en tiempo real.
5. Elige idioma y nivel. Lee el aviso breve y pulsa Comenzar entrevista; esa acción autoriza el audio a OpenAI y el texto local para informe.
6. En Privacidad y opciones puedes desactivar el informe antes de comenzar. Durante la llamada solo aparecen video, estado y cinco controles.
7. Pulsa Finalizar y confirma «Finalizar y revisar». Corrige o excluye turnos, vincula las respuestas a las preguntas, confirma la revisión y genera el informe. TXT y JSON se descargan manualmente.

El servidor escucha solo en 127.0.0.1. Se conserva gpt-realtime y voz Marin (sintética, no clonación). API de pago; la revisión e informe son locales. No hay sincronización labial. Sin configuración no se abre el micrófono.

## Informes y privacidad
- No se graba audio en la aplicación. El audio de Realtime se envía al proveedor, que tiene sus propias políticas de procesamiento y retención.
- Solo se conservan turnos completos para informe cuando se comienza con la opción local habilitada y el aviso de consentimiento visible. Sin ella se muestran únicamente subtítulos recientes en memoria.
- Detener y borrar, salir, ocultar la pestaña o cambiar idioma borra transcripción y revisión locales. «Terminar y revisar» conserva una instantánea exclusivamente en memoria para la revisión solicitada.
- No hay almacenamiento persistente, analytics de transcripciones ni cuentas.
- Los eventos de texto pueden faltar, llegar tarde o estar fuera de orden. Los números T identifican recepción. No se infiere automáticamente qué pregunta responde cada texto.
- La comparación de años usa solo preguntas exactamente repetidas que el usuario haya vinculado. No determina contradicción, credibilidad, fraude, elegibilidad ni probabilidad de aprobación.
- La ocultación opcional, activa por defecto, cubre algunos patrones de SSN, A-number y números largos. No garantiza anonimización. Revisa lo que vas a exportar; nombres y direcciones pueden permanecer.
- Los archivos descargados no se borran al eliminar una sesión. Borrar aquí tampoco solicita eliminación al proveedor.

## Límites y estado
Límite local de 10 minutos, 150 eventos de transcripción y 200.000 caracteres. Texto por turno normalizado hasta 4.000 caracteres; puede recortarse. Al exceder límites se detiene y borra la sesión. Son límites del cliente, no un límite de gasto seguro del servidor.

Backend demostrativo: controles locales de origen, tamaño, frecuencia y claves efímeras; NO autenticación de usuarios, suscripciones, cuotas persistentes ni autorización de producción. `validateAccess` es un contrato de referencia sin conectar al gateway. No está listo para publicación pública.

90 pruebas aprobadas y compilación correcta. Interfaz revisada en ES/EN y tamaño móvil; exportaciones TXT/JSON verificadas con ejemplo ficticio. Captura, eventos, cancelación y límites probados con mocks. Falta probar WebRTC/micrófono con proveedor real y dispositivos Safari/iOS/Android. No se hicieron llamadas API de pago.

## Desarrollo
```sh
npm ci
npm test
npm run build
```
Para desarrollo con API, ejecuta el servidor local y `npm run dev`; Vite redirige `/api` al servidor 8787. Sin API puedes usar solo Vite.

## Historial
Documentación original y notas de integración están en `docs/`. `INTEGRACION_BLOQUES8_14.md` describe esta integración; `PLAN_15_PLUS.md` es una propuesta futura, no funciones implementadas. Ciudadanía y asilo conservan sus portales: sus motores externos no están integrados.

## Bloques 15–22: herramientas locales
En la configuración de Residencia pulsa Herramientas locales: documentos y comparación. Permite pegar texto ya extraído con consentimiento, preparar preguntas por sección y comparar la redacción de respuestas a la misma pregunta con consentimiento de ambos participantes y autorización compartida. No procesa PDF ni imágenes. Los datos desaparecen al salir, ocultar pestaña o cambiar idioma.

Los informes de voz ahora incluyen declaraciones con procedencia solo después de revisión humana. Las bibliotecas de cuotas, políticas y permisos son bases de desarrollo: no activan pagos, login, almacenamiento persistente ni apps nativas. Ver docs/INTEGRACION_BLOQUES15_22.md para estado por bloque. Las notas históricas anteriores describen su versión correspondiente.


## Nueva pantalla de llamada
Diseño a pantalla completa con controles siempre visibles, pausa/reanudación, subtítulos superpuestos, reconexión y confirmación antes de finalizar. Inspirado en la referencia visual aportada. Ver docs/REDISENO_LLAMADA.md para comprobaciones y límites. Los tests y capturas de llamada usan transporte simulado; faltan pruebas de micrófono real y dispositivos físicos.


## Bloques 23�30: bases adicionales
Se incorporan registro de motores, planificador neutral, contenedor temporal de documentos, comparador de actividad, contratos familiares, agregador de consumo y lista de validaciones de publicaci�n. Son bibliotecas de desarrollo; no agregan cuentas, pagos, almacenamiento ni planificaci�n autom�tica a la llamada. Se conserva �ntegra la pantalla de llamada existente, los c�rculos refinados y los videos originales. Estado detallado: docs/INTEGRACION_BLOQUES23_30.md.
