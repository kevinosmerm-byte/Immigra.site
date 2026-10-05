# CitizenshipAI — informe de implementación

Fecha: 5 de octubre de 2026. Repositorio: `kevinosmerm-byte/citizenshipai`. Alcance: aplicar la instrucción maestra suministrada por el usuario sobre la aplicación existente.

Este informe registra la implementación verificada. Tras revisarla, el usuario autorizó publicarla; la entrega usa el remoto `main` y sus integraciones existentes de Cloudflare Pages y Render. No se activaron cobros ni se aplicaron migraciones en un servicio remoto. El informe anterior queda en [el archivo histórico](history/20260930_MASTER_IMPLEMENTATION_STATUS.md); sus afirmaciones de despliegue corresponden únicamente a aquel trabajo.

## EXISTING SYSTEMS REUSED

React/Vite, Express, Supabase y autenticación verificable del servidor; banco USCIS 2025, IDs e imágenes; resolutor/evaluador cívico determinista; progreso, checkpoints, favoritos y planificador; motores N-400 y entrevista; PDF.js y su worker; servicio OAuth USCIS; recursos de ayuda, tema, mascota, cuotas, Stripe y adaptadores nativos. [Auditoría y mapa de reutilización](MASTER_IMPLEMENTATION_AUDIT.md).

## EXISTING SYSTEMS MODIFIED

`App.jsx` conecta los dominios y reordena Inicio/Práctica. Se ampliaron perfil cívico, respuestas dinámicas, aprendizaje, entrevistas, recorrido, ayuda, navegación, podcasts, configuración y servidor. Los aliases de facturación permiten que el proxy Vite llegue a las rutas existentes; ambos webhooks preservan el cuerpo original para verificar firmas.

## NEW SYSTEMS CREATED

Una capa de orquestación `brain.js`, una vista de Perfil y un esquema compartido validado, Journey y extracción de campos de avisos, caché/estado de proveedores, estilos compartidos y helpers de sincronización. Amplían los almacenes y motores existentes: no hay un segundo banco, planificador, progreso, autenticación ni tracker independiente.

## DATABASE CHANGES

Se amplía `user_profiles` con datos cifrados de usuario/preferencias. Se añaden `immigration_profiles`, `n400_profiles` y `case_profiles`, con propietario y fechas. Las funciones atómicas guardan/borran los cuatro dominios. RLS impide acceso directo de navegador; las rutas derivan el propietario del JWT. Borrar la cuenta elimina también estos dominios. El progreso y perfil cívico mantienen sus almacenes existentes.

## MIGRATIONS

`supabase/migrations/202610050001_brain_profiles.sql` preparada y probada dos veces en PostgreSQL aislado mediante PGlite: sintaxis/idempotencia, escritura atómica, rechazo de sobres inválidos sin cambios parciales, permisos/RLS, borrado de perfil y cascada al borrar la cuenta. **No aplicada a Supabase remoto**. [Configuración y límites de almacenamiento](PROFILE_STORAGE.md).

## DATA PROVIDERS

| Proveedor | Integración y estado real |
| --- | --- |
| Census | Geocodifica la dirección reutilizada; no supone un distrito por ZIP. Fixtures de ambigüedad/distrito cero pasan. Conectividad oficial bloqueada por el proxy actual. |
| Congress.gov | Miembros actuales, cámara y metadatos de fuente; requiere clave del servidor. Documentación oficial verificada vía su repositorio. No probado con credenciales reales. |
| Open States / Plural | Legisladores estatales por coordenadas, incluyendo Nebraska. No se usa para gobernadores. Documentación oficial inspeccionada; falta clave real. |
| Gobernador | Adaptador para un feed HTTPS gubernamental/NGA explícito; no se identificó ni validó un feed compatible. Se conserva el roster NGA con su fecha real del 30/09/2026. |
| Google Civic | Su discovery oficial actual tiene divisions/elections y carece de representatives/representativeInfoByAddress. No se integra un endpoint retirado ni se exige una clave innecesaria. |
| USCIS | Contrato CaseStatusProvider manual por defecto y adaptador OAuth existente. Sandbox se marca prueba y no actualiza casos reales. Consulta pública, protecciones y condiciones no verificadas por bloqueo de red; enlaces oficiales y avisos confirmados funcionan como alternativa. |

La caché acotada usa hashes de ubicaciones, comparte peticiones en curso y conserva datos verificados con sus fechas originales ante fallos. ProviderHealth queda en el servidor. Caché y salud son locales al proceso, no almacenamiento distribuido. [Contratos, fuentes y evidencia](CIVIC_PROVIDERS.md).

## ENVIRONMENT VARIABLES

Nuevos requisitos: `PROFILE_ENCRYPTION_KEY` (32 bytes aleatorios codificados base64, solo servidor), `OPENSTATES_API_KEY` y el opcional `GOVERNOR_DATA_URL` únicamente si existe un feed real validado. Se reutilizan `CONGRESS_API_KEY`, configuración Supabase y sus claves privadas/públicas, así como las integraciones opcionales OpenAI, USCIS, D-ID y Stripe. No se inventaron credenciales ni se incluyeron valores secretos.

El borrador del entorno conserva instalación y preset de gestores de paquetes; actualiza las instrucciones y añade requisitos sin valores. Propone acceso limitado a `geocoding.geo.census.gov`, `api.congress.gov`, `v3.openstates.org`, `www.uscis.gov`, `egov.uscis.gov` y `www.nga.org`. Guardado confirmado; **no aplicado ni publicado**. Para activarlo: revisar y guardar los cambios en los ajustes del entorno y publicar el entorno. Las variables inspeccionadas de estos servicios están ausentes en el proceso actual.

## CIVIC BRAIN STATUS

Brain comparte perfil personal, migratorio, N-400, cívico, caso, aprendizaje, idioma y preferencias. La dirección existente se reutiliza y se detectan sus cambios centralmente. Una dirección nueva suspende funcionarios del distrito anterior hasta resolver la nueva geografía; las respuestas estatales se conservan solo cuando la ubicación permite reutilizarlas. Las preguntas no consultan proveedores por tarjeta. Los datos disponibles no se ocultan únicamente por antigüedad, conforme a AGENTS.md; su procedencia y fecha siguen visibles.

## CASE JOURNEY STATUS

Etapas canónicas, hechos confirmados, eventos, próximos pasos estimados, citas, listas y avance documental. Las fechas compartidas se reutilizan entre Perfil y Journey. Un aviso antiguo o con recibo diferente no debe hacer retroceder el caso. PDF con texto se procesa localmente y produce un borrador editable; solo Confirmar guarda campos seleccionados. Cancelar no guarda. PDF escaneado/imagen requiere ingreso manual: **OCR no configurado**. No se retiene el archivo ni su texto original. Los promedios de procesamiento son recursos generales, nunca fechas personales.

## LEARNING ENGINE STATUS

El plan diario depende de etapa, cita, minutos disponibles, preguntas pendientes, errores, temas débiles y conceptos N-400 omitidos. Reutiliza el planificador existente; distingue NEW/LEARNING/WEAK/STRONG/MASTERED y exige evidencia independiente para dominio. Una fecha de entrevista confirmada cambia la preparación aunque la etapa anterior siga guardada: esta recomendación se identifica como estimada, sin convertirla en un estado USCIS. Después de entrevista/juramento, una fecha histórica no dispara urgencia.

## INTERVIEW STATUS

N-400 reutiliza intenciones, variantes y seguimientos del banco existente, con referencias del perfil confirmado. Recordar una respuesta requiere acción explícita; los cambios estructurados invalidan respuestas antiguas correspondientes. Los conceptos omitidos alimentan el repaso sin guardar transcripciones ni respuestas privadas en progreso. Entrevista cívica local adapta preguntas y evalúa de forma determinista sin consumir IA; no duplica intentos del quiz. Voz sigue siendo opcional y solicita autorización al activarla.

D-ID tiene consentimiento y controles EN/ES, foco del diálogo, errores comprensibles y alternativa local funcional. Se probaron recuperación y consentimiento con respuestas controladas; **el proveedor real no se verificó**. La sesión remota no se presenta como evaluador local ni como entrevista garantizada.

## HELP/CHECKLIST STATUS

Ayuda se ordena por etapa y conserva el directorio existente en una sección desplegable. Listas condicionadas por datos confirmados y avisos, persistencia de elementos completados y avance documental. Enlaces USCIS disponibles; no se inventa una fecha de verificación de requisitos que no se pudieron recuperar. Las listas son orientación de preparación y remiten al aviso individual y fuente oficial. Diálogo externo con Tab/Shift-Tab/Escape y retorno de foco.

## NAVIGATION CHANGES

Cinco destinos principales: **Inicio / Práctica / Mi proceso / Ayuda / Perfil**. Herramientas secundarias en navegación desplazable y bloques desplegables. Todos los destinos anteriores siguen accesibles; USCIS Sandbox queda separado del recorrido real. Hash routes admiten enlaces directos, atrás/adelante, alias de privacidad y modos de entrevista, con fallback seguro para rutas desconocidas.

## BUTTON/DESIGN SYSTEM CHANGES

Tokens y estilos compartidos, superficies tranquilas, jerarquía tipográfica, botones compactos con targets de al menos 44 px, foco visible, estados deshabilitados/carga y movimiento reducido. Iconos principales de una familia SVG; colores y contraste EN/ES en claro/oscuro. Se corrigieron espacios vacíos excesivos, encabezados cortados, columnas y texto estrechos. Mascota en flujo normal, contextual y oculta en formularios/diálogos/práctica inmersiva. Mini podcast en flujo normal, sin tapar controles.

## MOBILE RESULTS

Viewports 320, 360, 375, 390 y 414 px, EN/ES, claro/oscuro. Se verificaron rutas, textos, targets, carga, imágenes y ausencia de desbordamiento horizontal. Flujos con perfil guardado, etapa/cita, listas, avisos, quiz, dictado y ajustes. Son pruebas Chromium de viewport; no afirman teclado/micrófono físico ni ejecución nativa en iOS/Android.

## TABLET RESULTS

768 y 820 px en vertical; 1024×768 en horizontal. Rejillas minmax y navegación adaptada; sin columnas inutilizables o contenido fuera de viewport. Flujos interactivos vertical/horizontal incluidos.

## DESKTOP RESULTS

1024, 1280 y 1440 px; contenido con ancho máximo y navegación lateral a partir del breakpoint. No se conserva un formato móvil ampliado artificialmente. Revisión visual de rutas y estados adicionales.

## ENGLISH RESULTS

Controles, instrucciones, estados y rutas verificados. El texto oficial de preguntas/respuestas y ejercicios de inglés sigue siendo inglés. No se modificaron JSON/PDF oficiales ni IDs estables.

## SPANISH RESULTS

Navegación, Inicio, Perfil, Journey, avisos, ayuda, práctica, entrevistas, voz/avatar, podcasts y ajustes traducidos, incluidos labels accesibles. Políticas de privacidad, términos, IA, independencia y fuentes tienen contenido español suplementario. Las preguntas oficiales y ejercicios de idioma mantienen su inglés de práctica, distinguiéndolo de las instrucciones en español.

## SCREENS AUDITED

22 rutas de `src/appRoutes.js`: home, practice, uscisTracker, immigrationHelp, profile, settings, civicProfile, pro, podcasts, civicsGuide, quiz, vocabulary, choose, connect, civics, english, reading, writing, coach, uscisSandbox, progress e interview. La entrevista se prueba en modos full/civics/n400: 24 combinaciones de ruta/modo. También onboarding, cuenta, detalles de ayuda, consentimiento, tarjetas adelante/atrás, resultados y mini reproductor. [Matriz y hallazgos de interfaz](MASTER_UI_QA.md).

## ISSUES FOUND

Información compartida incoherente entre vistas; respuestas N-400 guardadas prevalecían sobre nuevos datos estructurados; funcionarios anteriores seguían disponibles tras mudanza; cachés de cuentas inactivas podían recuperar datos después de borrar. UI tenía controles sin traducción/labels, contraste deficiente, tarjetas interactivas anidadas, elementos superpuestos, encabezados y espacios excesivos. Alias de facturación devolvía 404 vía proxy. Subtítulo de guía indicaba 88 páginas aunque el PDF real tiene 19.

## ISSUES FIXED

Sincronización de fechas/oficina/recibo, ediciones mínimas de Perfil, invalidación selectiva de respuestas N-400 conservando cada respuesta recién confirmada, limpieza de todas las cuentas en memoria y bloqueo de restauraciones en curso al borrar; sincronización/gate geográfico central; contexto de entrevista y conteo único. Se corrigieron controles y contenido bilingües, foco/diálogos, botón nativo de girar tarjeta, jerarquía de CTA, contraste, medidas y flujo del layout. Proxy de cobros/webhook y metadatos correctos de la guía. Los errores de almacenamiento muestran explícitamente que los cambios durarán solo la sesión. Los fallos de proveedores se registran sin sus payloads privados; un error al abrir el puerto ya no anuncia un inicio exitoso.

## TESTS

Validación final: **231/231 pruebas del repositorio PASS, 0 fallos y 0 omitidas**. `npm run quality` incluye lint, tests, build y verificadores estáticos mobile/iOS/App Store; todos pasan. `npm run typecheck` pasa. Extracción PDF `--check`: **128 preguntas y 410 respuestas oficiales**; JSON/PDF e IDs originales sin cambios. La preparación posterior para publicar actualiza únicamente los metadatos Node del paquete raíz en el lockfile; conserva todas las versiones e integridades de dependencias.

Interfaz: **960/960** combinaciones de 24 rutas/modos × 10 anchos × EN/ES × claro/oscuro; **96/96** análisis axe de las rutas a 390 px. **120/120** comprobaciones interactivas; 6/6 de mini podcast, 10/10 de políticas EN/ES y 12/12 de onboarding con accesibilidad. La matriz conserva los fallos iniciales y documenta rechecks posteriores en su anexo. Cuatro comprobaciones finales de navegador verifican Profile→Civic en EN/ES: invalidación inmediata de funcionarios anteriores, una consulta compartida, ninguna consulta por pregunta y guardado explícito de ubicación aunque falle el proveedor.

Pruebas adicionales de Journey: PDF real con texto, cancelar, editar/confirmar, recarga, fallback escaneado, 320 px y ayuda por etapa; diálogo con teclado. N-400/civismo/avatar: reutilización y guardado explícito, sin A-number, sin doble conteo ni evaluación mediante IA, consentimiento/foco/error/alternativa local. SQL cifrado/RLS en PostgreSQL aislado. Regresiones de borrado entre cuentas, restauración pendiente, fechas compartidas, confirmación→merge→guardado→lectura N-400 y cancelación de consultas incluso durante el hash de la dirección. La revisión independiente también reprodujo la carrera en Chromium con un hash diferido: cerrar el editor, borrar datos y completar el hash mantiene el perfil eliminado y genera cero consultas cívicas.

Smoke final de API y proxy: salud, HTML/React, civismo correcto/incompleto/incorrecto y rechazo de IDs inválidos PASS. Public-config 200; cloud profile y Checkout 503 por configuración ausente, webhook sin firma 400 y ubicación inválida 400: rutas existentes responden sin fabricar disponibilidad. La matriz intensa alcanzó temporalmente los límites del API local; la verificación funcional se repitió después de reiniciar el proceso propio.

Evidencia de esta sesión: `/workspace/.citizenshipai-cloud/master-quality-final.log`, reportes Journey/interview/avatar en ese directorio y JSON/screenshots en `/workspace/.citizenshipai-qa/artifacts/`. Las herramientas Playwright/axe y PGlite se instalaron fuera del checkout, sin añadir dependencias al producto. Son evidencia de la sesión; una nueva clonación requiere preparar de nuevo esas herramientas.

## BUILD STATUS

**Build Vite de producción PASS después de los últimos cambios.** Persiste advertencia de chunks grandes heredada. Typecheck cubre Brain con JSDoc y rutas y sus imports; no afirma conversión o tipado estricto de toda la aplicación JavaScript. Los verificadores móviles son estáticos y no sustituyen builds firmados o pruebas físicas.

## BLOCKERS

- Supabase remoto y clave de cifrado ausentes: migración y guardado/restauración real en nube pendientes.
- APIs cívicas: claves y acceso de red publicados pendientes; feed real de gobernador no disponible.
- USCIS público: flujo/protecciones/condiciones no verificables con la red actual; API Production requiere concesión y endpoints oficiales reales. Manual y avisos confirmados siguen disponibles.
- OCR: no hay proveedor/motor configurado; escaneados se resuelven mediante edición manual.
- OpenAI/voz y D-ID reales, Stripe, compras/restauraciones y dispositivos nativos: requieren configuración y verificaciones de sus respectivos servicios. No se fabricó éxito ni se activaron cobros.
- Bundle grande heredado y caché de proveedor local al proceso: límites documentados, sin impedir la práctica local.

## Publicación autorizada

El usuario autorizó la publicación después de la revisión. `.node-version` fija Node 24, CI lee esa versión e incluye typecheck, y Render declara Node 24. El paquete y lockfile requieren Node >=22.13, acorde a las dependencias existentes; no se actualizaron sus versiones. Se repite instalación con `npm ci` y calidad antes de enviar los cambios.

La vía de entrega es un push normal y de avance directo a `main`, sin forzar ni crear otro servicio. El acceso Git al repositorio funciona. Las consultas HTTP al sitio de producción, Render y la API de GitHub reciben `403 Forbidden` del proxy del entorno; esto impide confirmar aquí los estados y el SHA de los despliegues. Un push confirmado no equivale a un despliegue terminado. Las integraciones y la migración opcionales conservan los límites indicados arriba.

La publicación del entorno de Codex es una acción del producto: el borrador guardado no se convierte automáticamente en una versión activa por publicar el código en GitHub.

## Seguimiento de las 24 fases

| Fases | Resultado |
| --- | --- |
| 1–5 Audit/inventarios/reuse | Completados antes de implementar; mapa y contratos en auditoría. |
| 6 Brain | Contexto único derivado y APIs puras de plan/acción. |
| 7 Database | Esquema, cifrado, rutas y SQL probado localmente; deployment externo pendiente. |
| 8 Providers | Adaptadores conectados y fixtures; límites de conectividad/credenciales arriba. |
| 9 Civic Brain | Reutilización de dirección, fuentes y respuestas dinámicas compartidas. |
| 10 Case Journey | Etapas/eventos/estimaciones/avisos confirmados. |
| 11 N-400 | Perfil confirmado e intenciones existentes conectados. |
| 12 Learning | Planificador, progreso y debilidades existentes reutilizados. |
| 13 Interview | Contexto personal y evaluación local adaptativa; remoto con límites explícitos. |
| 14 Daily plan | Etapa/cita/minutos/errores y próximos pasos determinan prioridad. |
| 15–16 Help/checklists | Contextuales, persistentes y con fuentes/fechas honestas. |
| 17 Navigation | Cinco destinos y acceso secundario progresivo. |
| 18 Design | Sistema compartido y mascota contextual. |
| 19–22 Screen/responsive/devices/languages | Matriz 960/960, axe 96/96, flujos y revisión visual M/T/D EN/ES. |
| 23 Checks | 231 tests, lint, typecheck, build, verificadores y extracción oficial PASS. |
| 24 Report | Este documento y anexos; los bloqueos externos no se declaran completados. |
