# IMMIGRA.site

Plataforma educativa bilingüe de preparación para ciudadanía, asilo y residencia.

## Proyecto único

- Repositorio canónico: https://github.com/kevinosmerm-byte/Immigra.site
- Rama de referencia: `main` una vez integrada la migración.
- Sitio: https://immigra.site
- Código de esta migración: versión publicada `c6251fb` del repositorio histórico `immigration-ai`.

La migración se prepara en `codex/unify-immigra-site`. No está desplegada por el hecho de existir esta rama. Render continúa conectado al repositorio histórico hasta completar el cambio documentado en [la migración](docs/CANONICAL_PROJECT.md).

## Desarrollo y verificación

```sh
npm ci
npm run dev
npm run build
npm start
```

`npm run build` ejecuta pruebas, compila la web, verifica el módulo de ciudadanía y valida el paquete de distribución. `npm start` inicia el servidor unificado con `start-all.mjs`.

## Arquitectura

- `src/`: shell web, bienvenida y navegación.
- `modules/citizenship/`: ciudadanía, civismo y contenedores nativos.
- `modules/asylum/`: asilo y tarjetas de estudio.
- `modules/residency/`: residencia.
- `shared/`, `server/`, `scripts/`: componentes compartidos, servicios y verificaciones.

Los nombres históricos en rutas internas, almacenamiento e identificadores de las tiendas no significan proyectos distintos. No cambiarlos sin una migración específica: conservan compatibilidad y progreso de usuarios.

Los documentos históricos describen etapas anteriores; el estado de la transición se documenta en `docs/CANONICAL_PROJECT.md`. No copiar credenciales ni ejecutar migraciones remotas para unificar el repositorio.
