# Unificación de IMMIGRA.site — 2026-10-27

## Decisión del propietario

El proyecto y repositorio deben identificarse como IMMIGRA.site. Se traslada el código de la versión publicada, incluidas bienvenida cristal y tarjetas de asilo, al repositorio canónico kevinosmerm-byte/Immigra.site.

## Evidencia y estado

- Base canónica anterior: 5569fb6 (aplicación anterior de ciudadanía).
- Fuente publicada: immigration-ai, commit c6251fb, rama design/citizenship-visual.
- Destino preparado: Immigra.site, rama codex/unify-immigra-site, para integrar en main.
- La migración conserva los historiales de ambos repositorios mediante un commit de dos padres; no fuerza ni borra main.
- Solo se actualiza la identidad documental y el nombre del paquete raíz sobre el árbol publicado. Los cambios locales no publicados de Android y los arreglos experimentales de la auditoría antigua no se incorporan silenciosamente.
- Render srv-db4ojnflot8c73ceva8g sigue conectado a immigration-ai/design/citizenship-visual. Esta preparación NO cambia producción.

## Secuencia pendiente para completar la transición

1. Revisar la diferencia contra c6251fb y las verificaciones de esta rama.
2. Integrar la migración en main conservando su historial.
3. Cuando se autorice publicar, cambiar el repositorio/rama del servicio Render existente a Immigra.site/main; conservar variables, dominio, identificador del servicio y comandos verificados. No crear otro backend ni duplicar bases de datos.
4. Verificar versión desplegada, bienvenida, tarjetas de estudio, rutas públicas, acceso y endpoints de salud sin usar datos sensibles.
5. Solo tras confirmar el despliegue, marcar immigration-ai como histórico y desactivar sus automatizaciones de despliegue. No borrarlo.

## Compatibilidad

Conservar los identificadores de Play/App Store, rutas de módulos, claves de almacenamiento y contratos de API. Cambiar esos valores por estética rompería actualizaciones o progreso. El nombre del paquete raíz es immigra-site; no cambia los identificadores móviles.

## Auditoría posterior

La auditoría integral solicitada se realizará sobre este árbol actual, no sobre la versión antigua de ciudadanía. Esta migración no constituye una auditoría funcional completa ni acredita proveedores externos o facturación.

## Verificación de la copia unificada

`npm run build` completado: 254 pruebas raíz y 323 del módulo de ciudadanía, compilación, lint y comprobaciones estáticas móviles/distribución. Se fijó LF para los cinco archivos con hashes de integridad después de reproducir un fallo por conversión CRLF de Windows. No se alteró su contenido ni los hashes esperados. No se ejecutaron pruebas reales de pagos o proveedores.
