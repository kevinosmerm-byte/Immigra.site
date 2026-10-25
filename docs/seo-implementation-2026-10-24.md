# SEO de IMMIGRA — 24 de octubre de 2026

## Alcance y arquitectura

Implementación en el repositorio React 19/Vite existente. Se reutiliza la generación estática de páginas públicas y el servidor `start-all.mjs`; no se migra el router ni se añaden dependencias. No se modifican autenticación, pagos, procesamiento de documentos, preguntas ni entrevistas. Los cambios Android preexistentes quedan fuera de este trabajo.

La web de producción redirige `https://www.immigra.site/` con HTTP 301 a `https://immigra.site/`, que devuelve HTTP 200 (comprobado durante esta tarea). Se conserva el dominio sin www como canónico.

## Páginas

Se amplían las seis páginas ya existentes, evitando duplicados:

| Tema | Inglés canónico | Español canónico | Nuevos alias 301 |
| --- | --- | --- | --- |
| Ciudadanía | /en/citizenship | /ciudadania | /citizenship-interview; /entrevista-ciudadania |
| Asilo | /en/asylum | /asilo | /asylum-interview; /entrevista-asilo |
| Residencia | /en/residency | /residencia | /green-card-interview; /entrevista-residencia |

Cada una incluye título y descripción solicitados, H1, beneficios específicos, proceso de práctica, demostración visual identificada como ilustrativa, tres preguntas frecuentes, enlaces reales al módulo, fuentes oficiales, navegación bilingüe y aviso de independencia. El CTA es «Comenzar a practicar», sin prometer cobros automáticos ni resultados migratorios.

Las 16 páginas públicas incluyen canonical único, OG/Twitter, hreflang recíproco EN/ES y x-default. JSON-LD incluye Organization, WebSite, WebPage y BreadcrumbList; las landings y el inicio incluyen SoftwareApplication. No hay valoraciones, precios ni reseñas inventados. Esto no garantiza resultados enriquecidos ni posicionamiento.

El inicio conserva su diseño React e incorpora enlaces visibles a las seis guías. El build entrega una introducción estática y enlaces dentro de `#root` antes de ejecutar JavaScript. Se conserva el español inicial de la web en sus metadatos; las landings inglesas tienen sus propios metadatos. No se anuncia una segunda homepage inglesa indexable mediante una URL que solo cambie preferencias.

## Indexación y privacidad

Sitemap: solo inicio y páginas públicas canónicas. No incluye alias, rutas hash, perfiles, resultados, declaraciones ni sesiones. Robots permite rastrear contenido público y excluye `/api/`; el servidor añade X-Robots-Tag noindex a API.

Las pantallas de la app bajo hash reciben meta robots noindex/nofollow; al volver al inicio se restaura index/follow. Los fragmentos no llegan al servidor y no pueden excluirse individualmente mediante robots.txt. Esta señal JavaScript NO es una protección de privacidad ni garantiza exclusión de fragmentos: autenticación, autorización y ausencia de datos personales en HTML estático siguen siendo la frontera de seguridad. No se cambia ese control de acceso.

## Medición y Ads

No se detectó GA4/GTM en el código revisado. No se instaló ningún script externo ni se abrió una campaña.

`public/seo-events.mjs` prepara una interfaz con seis eventos: seo_page_view, start_practice_click, registration_begin, registration_complete, interview_start y subscription_paid. Solo despacha eventos locales si una integración establece explícitamente `window.immigraAnalyticsConsent === true`. Únicos atributos permitidos: idioma es/en y módulo citizenship/asylum/residency. Descarta URL, correo, identificadores, respuestas y cualquier otro campo. No almacena datos ni transmite a proveedores.

La vista de landing y sus CTA tienen puntos de emisión conectados. Los otros cuatro eventos quedan preparados para integración en puntos de éxito confirmados; NO se infieren desde visitas, clics o URL de retorno de pago. Antes de activarlos: elegir propiedad GA4/GTM, consentimiento aplicable y conectar una sola integración. Registro completado debe proceder de confirmación real; suscripción pagada, de pago verificado y deduplicado. Nunca enviar declaraciones, documentos, grabaciones, transcripciones ni datos personales a Ads/Analytics.

Para Google Ads usar las URL canónicas de cada idioma/tema como destinos. Configurar campañas, presupuesto y conversiones por separado; validar que el consentimiento y la medición funcionan antes de atribuir resultados. No se crearon anuncios.

## Archivos creados

- shared/seo-pages.mjs — catálogo, hreflang, navegación, datos estructurados.
- scripts/seo-landing.mjs — contenido y HTML estático de las seis páginas.
- public/seo-landing.css — diseño adaptable de las landings.
- public/seo-events.mjs — eventos locales opt-in con atributos permitidos.
- src/seo-document.js — señal robots para rutas internas.
- scripts/verify-seo.mjs — verificación del build y HTTP, sin consultar API de casos.
- tests/seo-pages.test.mjs — metadatos, contenido, schema y privacidad de eventos.
- docs/seo-implementation-2026-10-24.md — este informe.

## Archivos modificados

- scripts/public-pages.mjs — reutiliza las nuevas landings y mejora páginas legales.
- scripts/build-public-pages.mjs — inicio estático y JSON-LD.
- index.html — metadatos de inicio.
- src/ImmigraHome.jsx y src/ImmigraHome.css — enlaces públicos discretos.
- apps/main/entry.jsx — carga la gestión robots.
- start-all.mjs — alias 301 y noindex de API.
- tests/release-security.test.mjs — permite solo JSON-LD no ejecutable y el módulo local de eventos, conservando rechazo de otros scripts.
- scripts/verify-release.mjs — admite la marca IMMIGRA en mayúsculas.

## Validación y pasos manuales

Comandos reproducibles:

```text
npm run build
npm run typecheck --prefix modules/citizenship
node scripts/verify-seo.mjs
node scripts/verify-seo.mjs http://127.0.0.1:5190
```

Resultados: build completo aprobado; 239 pruebas raíz/residencia y 319 pruebas de ciudadanía aprobadas (0 fallos). Lint incluido en `quality` aprobado; typecheck de ciudadanía aprobado. `git diff --check` sin errores. Verificador SEO aprobado sobre archivos y HTTP local: inicio y 16 páginas, canonical, JSON-LD, sitemap, robots y seis redirecciones 301. Se comprobaron visualmente asilo en español, residencia en inglés y pantalla móvil de 390 px sin desbordamiento horizontal, además del regreso al inicio con seis enlaces y cambio de robots. No se realizaron entrevistas con IA, compras ni envío de datos personales.

Después del despliegue, ejecutar `node scripts/verify-seo.mjs https://immigra.site/` para verificar la versión realmente pública. Los cambios SEO de esta tarea no implican un despliegue automático.

1. Publicar el build y confirmar las URL canónicas, HTTP y assets en producción.
2. En Google Search Console, añadir o abrir la propiedad de dominio `immigra.site`.
3. Si no está verificada, obtener de Google el TXT concreto y añadirlo al DNS del dominio. No inventar ni reutilizar un token ajeno. Confirmar la verificación.
4. Enviar `https://immigra.site/sitemap.xml` y revisar su estado.
5. Inspeccionar una URL de cada tema e idioma y solicitar indexación cuando corresponda. Revisar canonical elegido por Google y errores de rastreo.
6. Validar el JSON-LD con Schema Markup Validator y las funciones admitidas con Rich Results Test. El JSON parseable y los tipos válidos no garantizan elegibilidad para resultados enriquecidos.
7. Medir Core Web Vitals con datos reales. Siguen existiendo avisos de tamaño de bundles del proyecto; optimizarlos requiere una tarea independiente y pruebas de navegación para no reintroducir bloqueos por chunks antiguos.

No se registró el dominio en Search Console ni se enviaron anuncios. No hay promesa de indexación o posiciones. Referencia técnica: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics

Observación de regresión: los tres enlaces abren sus módulos reales. En ciudadanía, el encabezado general respetó `lang=es`, pero el módulo conservó textos en inglés de su propia preferencia. No se alteró ese comportamiento interno; conviene unificar la preferencia de idioma en una tarea separada. La comprobación no certifica todos los flujos autenticados ni pagos.
