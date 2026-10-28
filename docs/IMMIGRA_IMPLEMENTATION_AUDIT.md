# Auditoría de implementación — 2026-10-27

Base: `immigration-ai`, rama desplegada `design/citizenship-visual`, commit `f4e2e76`. Render `srv-db4ojnflot8c73ceva8g` sirve frontend y API mediante `start-all.mjs`; no hay evidencia de que Cloudflare Pages sea el origen activo. Configuración de cuenta Cloudflare pendiente de acceso, sin cambios.

| Área | Estado inicial / evidencia |
|---|---|
| Bienvenida | Implementada y publicada; refinamiento de cristal y eliminación del foco automático locales, aprobados por el usuario. |
| Ayuda y portada | Limpieza local solicitada; conservar directorio y avisos legales, sin restaurar bloque eliminado. |
| Asilo lectura | Parcial: full-bank existe, pero usa categoría/búsqueda, no selección de país ni libro. 320 preguntas base + suplementos + revisión. |
| D-ID | Pendiente: CTA Beta presente. Rama fix/remove-citizenship-live-avatar-beta-20261027 apunta a 3cecb01 sin cambio específico. |
| Residencia | Filtrado existente por ruta MATRIMONIO / HIJO_A_PADRES / PADRES_A_HIJOS en aosEngine; no sustituir. |
| Memoria | Claves de módulo/tema existentes. Auditar agotamiento de subconjuntos antes de cambiar. |
| Civismo | 128 preguntas oficiales 2025 preservadas. No existe banco 2008 integrado: no afirmar cobertura de ambas versiones. |
| PR original #4 | Fusionado, SHA 5569fb68be8fb78607d03c4fc8d45a23f6d5fb80 confirmado vía GitHub. Quality del merge y 3 predecesores success; fallo histórico 467fad5 pendiente de diagnóstico. No importar a ciegas. |
| SEO | Verificador HTTP pasó inicio + 16 páginas, schema, sitemap, robots y redirecciones el 27/10. Search Console y campañas requieren inspección de cuenta. |
| Ads | Implementación previa consentida; auditar sin enviar eventos/pagos ficticios. |
| Base de pruebas | npm test: 250/250, cero fallos. |

Rama work/immigra-site-improvements tiene cambios de navegación y workflow no integrados; no fusionarla sin evaluar sus diferencias con las decisiones actuales. Android y archivos de release preexistentes quedan fuera del PR.

Fuente de regla de examen: https://www.govinfo.gov/content/pkg/FR-2025-09-18/pdf/2025-18050.pdf (antes de 20/10/2025: 2008; desde esa fecha: 2025). No se cambian preguntas oficiales ni se sustituye 2008 por 2025.

No desplegar esta rama. Pruebas reales de pagos, voz, proveedores y dispositivos físicos no se deducen del build.

## Resultado de esta entrega

- Libro de estudio en `#/asylum/full-bank`: selección inicial de país, una pregunta grande, anterior/siguiente, flechas y gesto horizontal; bloqueo breve de doble avance y movimiento reducido. Usa 320 preguntas base, 6 suplementos y 16 de revisión (342 para Venezuela; 338 para otras selecciones). ES/EN conserva la pregunta por ID durante la sesión. No captura respuestas, micrófono ni llamadas de IA. Los países sin preguntas específicas usan el banco general, sin inventar contexto nacional.
- Retirados el recurso «Avatar en vivo · Beta» y el montaje automático D-ID. Se conserva el proveedor sin exponer ese acceso y las entrevistas estándar N-400/cívicas.
- Corregido el reinicio de memoria: un subconjunto agotado conserva los IDs revisados de otras rutas del mismo banco. Prueba de regresión incluida.
- Evaluador conversacional instruido para devolver Entendido/Aclarar/Estructura, basado en la respuesta actual y sin ejemplos biográficos inventados. Se conserva el esquema validado, citas exactas, límites, sesiones y selección de seguimiento por el motor. La respuesta de incertidumbre mantiene su tratamiento especial. Falta evaluación humana con proveedor real; las pruebas automatizadas no certifican la calidad de una respuesta generada en vivo.
- Conservados los ajustes solicitados de bienvenida (vidrio, sin autofocus del título/marco azul), footer unificado y ocultación de los seis enlaces promocionales. El directorio de Ayuda original permanece; no se reintrodujo el bloque eliminado por el usuario.

## Bancos y alcance pendiente

`IMMIGRA_BANK_COMPARISON.md` contiene los 233 IDs originales y candidatos existentes. Comparación exacta: 0/106 asilo y 1/127 residencia. La similitud léxica es una señal para revisión semántica, no una decisión automática de importación. No se importaron ni eliminaron preguntas sin resolver la equivalencia y vía. La integración completa de esas 233 preguntas NO se declara terminada.

Civismo contiene 128 preguntas de 2025; no existe implementación 2008 en esta copia. No se sustituyó la fuente oficial ni se inventaron respuestas. El soporte 2008 queda pendiente de incorporar su fuente verificada, selección de versión y pruebas. No se certifican voz en iPhone/Android, compras reales ni revisión de tiendas mediante una compilación web.

## SEO y cuentas: evidencia del 27 de octubre

- `node --use-system-ca scripts/verify-seo.mjs https://immigra.site` pasa: homepage, 16 páginas, schema, sitemap, robots, HTTP y redirecciones.
- Search Console: sitemap leído el 27/10, procesado correctamente, 17 páginas descubiertas. Informe de indexación actualizado al 22/10: 1 indexada, 3 con redirección; ejemplos `https://www.immigra.site/`, `http://immigra.site/`, `http://www.immigra.site/`. Son variantes del dominio canónico, no tres servicios inexistentes. Validación ya iniciada el 27/10; no se inició otra.
- Google Ads: único grupo de recursos activo de IMMIGRA con URL final `https://immigra.site/`; todavía no hay destinos separados por servicio. Propuesta para revisión: `/ciudadania`, `/asilo`, `/residencia` y equivalentes `/en/citizenship`, `/en/asylum`, `/en/residency`. No se modificó la campaña.
- Ads señala limitación por «Publicidad electoral en los Estados Unidos», un anuncio rechazado y medición incompleta. La causa concreta de política requiere revisión de los recursos por Google; no se atribuye con certeza a una imagen ni se promete aprobación. Hay textos que conviene revisar: «Pass ... On The First Try» y «Green Card Test».
- Código: una etiqueta AW-17910999514 en páginas públicas elegibles tras consentimiento, separada de la SPA; confirmación de pago verificado con ID de transacción. No se encontró un identificador GA4 G- en el código auditado. No se añadió otra etiqueta ni se enviaron conversiones ficticias.

## CI y verificaciones

`npm run build` completó 250 pruebas de plataforma y 323 de Ciudadanía, lint, ambas compilaciones, verificaciones móvil/iOS/metadatos y release estático. Tras ajustar el prompt: 250 pruebas de plataforma nuevamente aprobadas. Build de vista previa aprobado después de corregir el alcance CSS del libro. Vista escritorio y emulación 390×844 verificadas; cambio ES/EN conservó Q0002. No equivale a prueba en dispositivo físico.

Workflow original fallido 40508066117: anotaciones públicas señalan `account-foundation.test.mjs:264` (2 frente a 3) y `expanded-interview-bank.test.mjs:14` (longitud >15). No era un error de despliegue de este repositorio. Último workflow original 40521591511 sobre el merge PR4 terminó success. Avisos adicionales de Node20 en actions v4 y hooks/Fast Refresh; no se modificó ese repositorio externo.

## Archivos y revisión

- `modules/asylum/AsylumStudyBook.jsx`, `Module.jsx`, `shared/design-system/asylum-study-book.css`: nueva vista de lectura.
- `modules/citizenship/PlatformHome.jsx`, `src/App.jsx`: retirada de acceso Beta.
- `modules/citizenship/src/interviewQuestionMemory.js` y pruebas: reinicio acotado; prueba de entrada N-400 adaptada al retiro de D-ID.
- `services/ai/interview-engine.mjs`: instrucciones de feedback estructurado.
- `src/welcome/WelcomeExperience.jsx`, `welcome.css`, `src/ImmigraHome.jsx`, `src/main.jsx`: ajustes visuales y footer solicitados.
- `scripts/audit-bilingual-banks.mjs`, ambos informes: comparación reproducible y evidencia.

No se incluyen cambios locales ajenos de Android, archivos de releases ni `.gitignore`. No se despliega ni fusiona este PR. Pendientes externos/editoriales quedan identificados para revisión, no ocultos como finalizados.
