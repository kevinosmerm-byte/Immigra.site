# Immigration AI — integración unificada de desarrollo (0.31.0)

## Qué se integró realmente
Una sola aplicación React/Vite, en una dirección local. CitizenshipAI se monta como módulo React; AsiloAI usa un adaptador de su interfaz DOM que limita sus consultas y eventos al módulo; ResidencyAI conserva su motor React. No se usan iframe, enlaces a servidores separados ni reconstrucciones de los evaluadores.

Los originales permanecen en sus directorios anteriores y se verificaron por SHA-256: 414 archivos de CitizenshipAI y 267 de AsiloAI sin cambios. La copia tiene rama `integration/unified-platform` y un commit de respaldo previo a la adaptación. `connected-apps/manifest.json` registra las huellas. Ese nombre identifica el manifiesto histórico, no aplicaciones externas.

## Inventario y conservación

| Dominio | Funciones conservadas | Adaptación |
|---|---|---|
| Ciudadanía | 128 preguntas oficiales, respuestas y evaluador determinista; tarjetas, guía PDF, imágenes, quiz, vocabulario, lectura, escritura, coach, N-400, entrevista cívica, avatar, podcasts, progreso, perfil, perfil cívico, datos dinámicos, avisos y seguimiento USCIS | Se importa App y proveedores originales; rutas bajo /citizenship; recursos con prefijo; CSS limitado al módulo; N-400 usa la llamada compartida |
| Ciudadanía: infraestructura | Supabase, historial/perfil, control de sesiones, cuotas existentes, exportación y eliminación de cuenta, Stripe y webhook, contenedores iOS/Android | Código conservado en la copia; cuenta reutilizada por la plataforma; no se migraron bases de datos ni se activaron pagos |
| Asilo | 320 registros de preguntas, 110 escenarios; country packs; espacios personal/ficticio; fuentes y afirmaciones, fechas y revisiones, seguimientos neutrales, banco, entrevista, informe | Motor core intacto; adaptador de DOM y hash; entrevista adaptativa conectada a CallView |
| Asilo: documentos y voz | Texto, PDF y OCR local, exportación/importación cifrada, borrado, consentimientos, citas y evaluación opcional con IA, voces Kevin/Sahara | Recursos vendor conservados; API bajo /api/asylum; comunicación mediante adaptador y sesión común |
| Residencia | 270 preguntas bilingües, 30 escenarios, cinco relaciones, escritura y voz, Realtime, niveles, informes, memoria revisada, comparación de cónyuges y herramientas locales | Motor intacto; CallView extraído a shared; autorización de backend común opcional |
| Bloques 23–30 | Registro, planificador, documentos temporales, perfiles, actividad, consumo y release gate | Bibliotecas conservadas; no se presentan como nuevas funciones de IA ya conectadas |

Inventario de archivos y documentos: `REPOSITORY_INVENTORY.json`. Se mantienen los README y documentos originales, que describen su versión y pueden contener pendientes o instrucciones de despliegue independientes; este documento describe la integración actual.

## Arquitectura activa
- `apps/main/entry.jsx`: entrada única; `src/main.jsx`: composición y navegación compartida.
- `modules/citizenship`, `modules/asylum`, `modules/residency`: motores y fuentes separados.
- `shared/design-system`: estilos comunes y límites de CSS.
- `shared/navigation`: rutas por módulo.
- `shared/interview-ui`: video, subtítulos, cinco controles, áreas seguras, viewport y confirmación de cierre.
- `shared/authentication`: cuenta Supabase reutilizada y token solo en memoria para APIs locales; cambio de identidad desmonta sesiones locales.
- `shared/subscriptions`: autorización y reserva de cuota, con migración SQL para desarrollo.
- `services/ai`: API única opcional que delega en servicios originales.
- `services/realtime-voice` y `services/reporting`: exportaciones de dominio sin mezclar preguntas ni resultados.

## Llamadas
N-400 y asilo conservan la revisión de la respuesta antes de avanzar; el campo compacto es una alternativa de texto y corrección del dictado. La confirmación para recordar información de N-400 sigue siendo explícita. Omitir y revisar información conocida están disponibles durante la pausa. En asilo, la revisión detallada y la evaluación opcional originales siguen disponibles desde la pausa. El motor no recibe respuestas inventadas ni se reemplaza por un cuestionario nuevo.

La entrevista cívica clásica y el avatar externo conservan sus experiencias originales; su migración audiovisual completa sigue pendiente. La adaptación compartida cubre N-400, asilo adaptativo y residencia Realtime.

## Arranque
Desde la raíz, `node start-all.mjs` o `node serve.mjs`. Abrir http://127.0.0.1:4388. El compilado incluido no necesita instalar dependencias para funciones locales. Para recompilar: `npm ci` y `npm run build`; postinstall instala las dependencias de la copia de CitizenshipAI. Las dependencias de AsiloAI solo son necesarias para regenerar sus recursos vendor (`npm ci --prefix modules/asylum`).

## Cuenta, servidor y límites: preparado, NO activado
Por defecto no se envían solicitudes de IA de pago desde el servidor unificado. La activación requiere `PLATFORM_BACKEND_ENABLED=true`, credenciales propias del entorno de desarrollo y las migraciones de CitizenshipAI más `shared/subscriptions/migration.sql` en una base NUEVA. No aplicar a la base original. Configurar Supabase y Stripe de prueba en `.env` local; no enviar secretos al chat.

La API verifica identidad con Supabase y reserva cuotas de forma atómica antes de las llamadas de pago. Las cuotas nuevas propuestas son por día UTC y módulo: residencia 1 Free/5 Pro; asilo 2 Free/30 Pro; ciudadanía 2 Free/30 Pro adicionales a sus límites originales. El derecho Pro se lee del servidor, nunca del navegador. Si falla la base de datos, se deniega la llamada. La migración SQL no fue ejecutada ni auditada en una base real; no se declara que estos límites ya estén operativos.

Los datos personales de asilo y residencia continúan en memoria o exportación voluntaria; no se añadió almacenamiento cloud de expedientes. Al cambiar de cuenta se reinician los módulos. El código de pagos y perfiles de ciudadanía se conserva; falta validar su ampliación de producto, exportaciones, autorización y aislamiento en un entorno real para los tres módulos. No hay publicación ni cambios en bases originales.

## Pruebas y límites
- 95 pruebas de ImmigrationAI, incluidas rutas, rechazo de permisos/cuotas y hashes de motores originales.
- 231 pruebas de CitizenshipAI; quality (lint, pruebas, build y verificadores de empaquetado) aprobado en la copia.
- 34 pruebas de AsiloAI aprobadas (core, análisis, gateway y voz).
- Build unificado aprobado. Un aviso de tamaño de chunk no impide la compilación.
- Navegador: N-400 inicio, respuesta ficticia, avance, confirmación y resultado; asilo respuesta incierta y seguimiento; residencia escrita con respuesta ficticia, avance y resumen; navegación entre módulos. Se corrigió y volvió a probar el cierre de asilo para evitar confirmación duplicada. Sin micrófono real ni llamadas de pago.
- Cinco controles visibles en la llamada a 320×568; redimensionamiento a formatos móvil, horizontal y escritorio comprobado. No equivale a prueba en un iPhone/Android físico.
- API sin credenciales: estados no disponibles y solicitudes pagadas bloqueadas.

## Pendientes para cumplir TODA la instrucción maestra
1. Validar Supabase/RLS, reserva SQL, concurrencia, cierre de sesión y Stripe en un entorno separado con credenciales de prueba.
2. Completar y verificar el diseño uniforme en todas las pantallas secundarias, temas, traducciones y zoom de texto; migrar entrevistas heredadas restantes sin perder funciones.
3. Probar voz, interrupciones, reconexión, teclado y cambio de orientación con proveedor y dispositivos reales.
4. Regresión funcional de PDF/OCR, importación cifrada, servicios USCIS, avatar externo, audio y cuentas en el conjunto integrado.
5. Configurar los nuevos contenedores, identificadores y permisos de ImmigrationAI para iOS/Android, compilar y validar en dispositivos; los contenedores de CitizenshipAI conservados no son binarios de ImmigrationAI.
6. Revisión de seguridad y gasto antes de cualquier publicación.

Esta es una integración de desarrollo verificable, no una declaración de que todos los criterios de aceptación estén cumplidos.
