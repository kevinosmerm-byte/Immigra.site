# Integración acumulativa — bloques 15–22

Entrega 0.22.0, sumada a la integración 1–14. El ZIP se trató como referencia de producto y código, no como autorización para publicar, abrir servicios externos o realizar cobros. Se conservan Sahara, videos originales, Marin, voz local, intensidades, práctica escrita e informes con revisión humana.

## Alcance implementado
- B15: memoria de declaraciones conectada exclusivamente a transcripciones de residencia revisadas. Referencias de turno, fuente ficticia/personal y certeza de la expresión, nunca veracidad. No se crean claims con transcripción sin revisar.
- B16: módulo de política y aclaración neutral incluido y probado. Las comparaciones de años requieren misma pregunta explícita y fuente; no mezclan acontecimientos solo por tema. Los topes locales 1/3/4 son un contrato; no se impuso un contador determinista al proveedor Realtime.
- B17/22: detección visible de APIs del navegador. No equivale a permiso concedido, prueba de audio, compilación nativa ni compatibilidad certificada.
- B18: pantalla local para texto ya extraído, consentimiento, límites y preguntas por sección con evidencia. Sin PDF, OCR, cargas de archivos ni análisis semántico. Se excluye el tipo I-589 de esta herramienta de residencia para mantener el alcance.
- B19: declaraciones con procedencia en informe de voz y exportación JSON; observaciones avanzadas de referencia incluidas en JSON. Comparación local de la misma pregunta entre dos participantes, dos consentimientos estrictos y autorización para mostrar resultados compartidos. No hay autenticación que pruebe la identidad de participantes: interfaz de práctica conjunta local.
- B20: planes y cálculo de cuotas como biblioteca de referencia. Sin cobros, Stripe, webhooks reales ni cuotas durables. Rechaza niveles inválidos, incluyendo claves de prototipo.
- B21: contrato de autorización y utilidades en server/contracts, fuera del bundle cliente. No conectado al gateway como supuesto login. La redacción por patrones no garantiza ausencia de PII; no se registran transcripciones.

## Integración y privacidad
Flags residency_tools_enabled y residency_memory_enabled permiten desactivar las nuevas rutas de residencia. Entrada desde configuración de residencia: Herramientas locales: documentos y comparación. Ninguna herramienta envía texto a terceros. Al salir, ocultar pestaña o cambiar idioma se limpian datos y consentimientos. Cambiar texto invalida resultados; retirar consentimiento borra su texto.

El informe de voz mantiene ocultación por patrones en declaraciones y preguntas antes de exportar. La memoria es efímera, no una base de datos. Los archivos descargados permanecen en el dispositivo.

## Verificación
75 pruebas aprobadas; compilación correcta. Casos nuevos: revisión previa obligatoria, fuente ficticia, misma pregunta/fuente, límites y consentimiento de documentos, comparación con consentimiento doble/compartido, IDs duplicados, cuotas y contratos de permisos. Se verificaron formularios en español, borrado al cambiar al inglés, resultados con datos ficticios y viewport móvil 390 px sin desbordamiento. Los motores y MP4 anteriores se verificaron por hashes.

No se usaron API de pago ni micrófono real. Siguen pendientes login, almacenamiento seguro/RLS, cuotas y gastos persistentes, facturación, PDF/OCR seguro, apps nativas, dispositivos reales, auditorías de accesibilidad/privacidad y producción. El servidor sigue limitado a localhost; no se publicó.
