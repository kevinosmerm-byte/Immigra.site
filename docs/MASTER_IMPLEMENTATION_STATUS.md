# Citizenship AI — implementación por fases

Fecha: 2026-09-30. Base inicial: `e6493b6`. Repositorio existente: `origin-main-validation`.

Se verificó un árbol de trabajo limpio antes de editar. No se creó otro proyecto, no se modificaron imágenes ni sus asignaciones, la publicación fue autorizada posteriormente por el usuario. La migración de saved_questions se aplicó en Supabase el 2026-09-30; el despliegue de esta revisión se ejecuta mediante main. La automatización USCIS permanece fuera de este trabajo.

## Resultado y alcance

La navegación final es **Home / Vocabulary / Choose / Connect / PRO**, con etiquetas españolas **Inicio / Vocabulario / Elegir / Conectar / PRO**. La corrección expresa del usuario elimina el elemento “Shows”. Los podcasts conservan su acceso anterior.

Se reutilizaron React/Vite, Express, Capacitor, el banco cívico compuesto, los evaluadores de civismo y Writing, las colecciones locales, el planificador del quiz, Supabase y las rutas de Stripe existentes. El avatar de Real Interview sigue usando el agente remoto D-ID; su conversación interna no se ha reemplazado ni controlado mediante inferencias sobre el DOM.

## Fases y verificaciones

| Fase | Cambios locales | Verificación y límites |
|---|---|---|
| 1. Auditoría | Navegación por pantallas, banco, voz, perfil, almacenamiento, Supabase, cobros y límites revisados. | Base: 125 pruebas y build correctos. |
| 2. Datos cívicos | Registro de versiones, categoría y fuente en el banco existente; rechazo de versiones desconocidas en la consulta. | 125 pruebas y build correctos tras esta fase. No se duplicaron las preguntas. |
| 3–4. Dinámicos y evaluación | Eliminados alias de funcionarios del banco estático; resolutor común con caducidad, fechas ISO y procedencia; evaluación dinámica sin alias obsoletos. El servidor usa pregunta/respuesta canónicas y rechaza identificadores/versiones no soportados. | 129 pruebas y build correctos tras la primera integración. Comprobaciones posteriores cubren cambios de funcionario, ubicación y caducidad. Writing conserva su evaluador probado. |
| 5. Navegación | Barra inferior compartida, estado activo, foco, botones de 56 px de alto, áreas seguras y reserva de espacio medida mediante ResizeObserver. Pro reutiliza el panel de cuenta como pantalla. | 129 pruebas y build correctos inicialmente. Revisados Choose y Connect por separado en navegador. |
| 6. Progreso | Checkpoints por cuenta y versión para tarjetas, modos de quiz, Reading, Writing y entrevista cívica clásica. Migración no destructiva del registro antiguo de tarjetas. Separación de historiales por cuenta. | 134 pruebas y build correctos tras la integración inicial; pruebas adicionales de migración, errores de almacenamiento y aislamiento. No se guardan audio, transcripciones ni respuestas N-400. |
| 7. Acceso y costes | Reutilizados permisos y contabilidad servidor. Política de presentación Free/Pro y límites diarios adicionales: 60 solicitudes Free/promoción y 600 Pro; 2/6 solicitudes de avatar respectivamente. Las cuotas mensuales existentes siguen aplicando. | Pro solo se reconoce para el límite superior a partir de la fuente verificada de sesión del servidor. No se activaron pagos ni anuncios. Límites configurables en `shared/featureAccessConfig.js`. |
| 8. Gate del 70% | `ProgressGate` central: transición, deduplicación por cuenta/módulo/sesión, control de voz activa y omisión de Pro. Integrado en tarjetas, quiz, Vocabulary, Choose, Connect, Reading, Writing y entrevista cívica clásica. | Gate observado al 70% en navegador, continuación exacta 7→8 y sin repetición 8→9. Sin proveedor de anuncios activo, continuar gratis no simula una recompensa. El avatar remoto no expone progreso por pregunta: su gate queda pendiente. |
| 9. Perfil y onboarding | ZIP opcional, versión disponible y práctica inicial en onboarding; My Civics Profile con Census, capital, gobernador y miembros de Congress.gov cuando está configurado. | ZIP no se convierte en distrito por suposición. Se rechazan múltiples coincidencias Census. No se cachea ni guarda la dirección. El flujo actual solicita dirección al no disponer de una tabla ZIP→distritos completa. |
| 10. Home, errores y guardados | Continue Studying, errores compartidos entre tarjetas/quiz/entrevista y Saved Questions. API autenticada para favoritos, cola local y sincronización serializada. | Reanudación real de Vocabulary en pregunta 9/10 tras recargar. Migración SQL nueva preparada, no aplicada. La sincronización remota requiere desplegar servidor y migración. |
| 11. Calidad | Eventos permitidos sin contenido sensible, aviso de progreso no predictivo, privacidad actualizada, limpieza de nuevos datos locales, accesibilidad de la barra y conservación del service worker y recuperación de errores existentes. | Verificación final: **147 pruebas**, lint, build, `verify:mobile`, `verify:ios` y `verify:app-store` correctos. Persiste el aviso previo de bundle principal mayor de 500 kB. No se afirma prueba física de dispositivos ni funcionamiento offline antes de descargar recursos. |

## Fuentes de datos dinámicos

Los cuatro cargos nacionales se comprobaron puntualmente el 30 de septiembre de 2026 en la [Casa Blanca](https://www.whitehouse.gov/administration/), la [oficina del Speaker](https://www.speaker.gov/) y el [Tribunal Supremo](https://www.supremecourt.gov/about/justices.aspx). El roster de los 50 gobernadores se contrastó con la fuente primaria de la [National Governors Association](https://www.nga.org/governors/), que no es una agencia federal.

Los nombres y fechas están centralizados en `src/dynamicCivicsData.js`. Una verificación caduca a los 31 días y el sistema deja de calificar esa respuesta como vigente. No se creó una actualización programada. Las capitales conservan la tabla previa; no se afirma una nueva verificación independiente de esa tabla. El perfil depende de Census y de `CONGRESS_API_KEY` para congresistas. D.C. y territorios necesitan ampliar el modelo de excepciones; no se inventan sus funcionarios.

## Pruebas de interfaz realizadas

- Navegador local en 390×844 y 360×800, y adaptación de escritorio en 1280×900. Son tamaños de viewport, no simuladores nativos.
- Choose abre “Elegir”; Connect abre “Conectar”; cada modo mantiene su checkpoint.
- Vocabulary llega al 70%, continúa sin reinicio y no repite el gate en la siguiente pregunta.
- Recarga de aplicación: Home muestra 80% y reanuda en la pregunta 9/10.
- Pro conserva la barra y muestra que las compras no están activas.
- En 360 px y escritorio no hubo desbordamiento horizontal; botones inferiores de 56 px de alto.
- Una carga limpia no produjo errores React. Durante edición hubo un aviso transitorio de HMR al cambiar dependencias de un efecto; desapareció tras recargar.

## Cobertura de los casos solicitados

| Casos | Evidencia |
|---|---|
| Nuevo / Free / Pro / Free al 70% | Pruebas de estado vacío, política de permisos, cuotas y gate; recorrido real Free en navegador. Pro real autenticado no se ejercitó contra servicios remotos. |
| Ads / desbloqueo Pro / compra / restauración | Se conservan pruebas existentes de entitlements, Stripe y recompensas verificadas. Ads no está activo; restauración nativa se muestra deshabilitada y no simula éxito. Faltan pruebas de tiendas y proveedores reales. |
| Restauración / cerrar y reabrir | Pruebas unitarias de checkpoint/migración y recarga real de Vocabulary. |
| Respuestas múltiples / voz / Writing | Pruebas existentes de variaciones, transcripción textual y contenido frente a formato; no se utilizó micrófono físico. |
| Dinámicos / cambio de funcionario / ubicación | Fixtures del resolutor, expiración, ISO, roster y cambio de perfil. |
| ZIP único / ambiguo | Fixtures de resolución ZIP y rechazo de múltiples resultados Census, incluida normalización de distrito at-large. |
| Errores / guardados | Colección común de errores; pruebas de cola offline, reintento, desmarcado y separación de cuentas. |
| Fallos AI / voz / conexión | Se conserva recuperación existente y se prueban fallos de ubicación/almacenamiento/sincronización. No se provocaron fallos de proveedores pagados. |
| iPhone / Android / safe areas / contenido cubierto | CSS de insets y reserva dinámica de altura, inspección de viewports y verificadores del repositorio; quedan pruebas físicas con teclado, orientación y accesibilidad nativa. |

## Archivos modificados

- Datos/evaluación: `src/civicsVersions.js`, `src/civicsQuestionBank.js`, `src/dynamicCivicsData.js`, `src/civicsAnswerEvaluator.js`, `src/quizLearning.js`.
- Navegación/UI: `src/BottomNavigation.jsx`, `src/App.jsx`, `src/App.css`, `src/QuizLearningPath.jsx`, `src/Account.jsx`, `src/LegalSettings.jsx`.
- Perfil/progreso: `src/MyCivicsProfile.jsx`, `src/civicProfileStorage.js`, `src/progress.js`, `src/savedQuestions.js`.
- Gate/costes: `src/ProgressGate.jsx`, `src/progressGateContext.js`, `src/speech.js`, `shared/learningAccess.js`, `shared/featureAccessConfig.js`.
- Servidor: `server/server.js`, `server/civicLocationService.js`, `server/accountRoutes.js`, `server/accountService.js`.
- Persistencia remota: `supabase/migrations/202609300001_saved_questions.sql`.
- Pruebas nuevas: `tests/ai-daily-limits.test.mjs`, `tests/civics-version-dynamic.test.mjs`, `tests/location-profile.test.mjs`, `tests/progress-gate.test.mjs`, `tests/progress-resume.test.mjs`, `tests/saved-questions-sync.test.mjs`.
- Pruebas adaptadas: `tests/civics-evaluation.test.mjs`, `tests/civics-visual-library.test.mjs`.

## Pendientes y límites antes de publicar

1. **No desplegado:** revisar el diff y autorizar expresamente publicación/migración. La tabla de favoritos tiene RLS y acceso únicamente de servicio; las rutas obtienen el usuario de la sesión autenticada.
2. **D-ID:** integrar un contrato fiable de preguntas, resultados y fin de turno antes de compartir el banco/perfil y activar el gate dentro del agente remoto. No se intercepta ni interrumpe su conversación actual. N-400 permanece separado y no se persisten sus respuestas personales.
3. **Ads y tiendas:** conectar proveedores reales y probar recompensa verificada, compra y restauración. Los adaptadores existentes de cobro y recompensas no se sustituyeron por simulaciones.
4. **Datos:** mantener manualmente las verificaciones; ampliar D.C./territorios y una fuente ZIP→distritos si se desea evitar pedir dirección en casos inequívocos. No se reactivó la automatización USCIS.
5. **Producto/QA:** completar pruebas físicas iOS/Android, compras sandbox y voz real. El perfil nuevo conserva algunos textos en inglés. El progreso y perfil completos son locales por cuenta; únicamente los favoritos tienen sincronización remota nueva.
6. **Rendimiento:** persiste el bundle grande preexistente. Quiz y guía PDF continúan con carga diferida; no se hizo una reescritura de App.jsx ni de la integración del avatar.

Este trabajo deja una implementación local verificable y una lista explícita de dependencias pendientes; no declara terminada la integración completa del avatar remoto ni activada monetización real.

