# Banco de asilo v6: integración local

Base: `0c6d8418425d31650f53ec4888cd8a000d0f9b35` de `kevinosmerm-byte/Immigra.site`.
Preparación local del 3 de noviembre de 2026. Sin commit, push ni despliegue.

## Recorridos implementados

- `#/asylum/full-bank` utiliza 125 preguntas bilingües generales; Venezuela añade cuatro, para un total de 129. Se conservan tres IDs y textos de Venezuela; la cuarta pregunta autónoma tiene un ID nuevo.
- El adaptador `domainBank` usa las 125 preguntas. Si recibe `country: 'Venezuela'`, usa 129. Se verificó el recorrido completo en ambos idiomas, sin respuestas ni datos reales.
- El país se elige explícitamente en preparación y configuración de entrevista. Viaja por el puente del runtime, `ConversationInterview`, ambos transportes y `validateSettings` hasta el banco del servidor. Venezuela activa 129 preguntas; vacío/otros países activa 125. El servidor rechaza valores no permitidos y no infiere país del relato. La selección de estudio sigue siendo independiente de la selección de entrevista.
- Las 42 repreguntas tienen activación voluntaria con confirmación explícita en texto. La voz permanece desactivada; cuatro fichas requieren además dos citas o aceptación explícita de escenarios. Ver `ASYLUM_ADAPTIVE_REVIEW.md` para condiciones y límites.
- El banco JSONL y el runtime heredados permanecen como fuentes históricas; esta integración no actualiza todos los consumidores históricos ni la demostración de preguntas de la página de inicio.

## Recuperación de avance

La migración conserva la clave de sesión existente, retiene únicamente IDs iguales y marca las preguntas nuevas sin avance heredado. Antes de reemplazar la sesión antigua se intenta archivarla en `immigra.asylum-study.legacy-backup.v1`.

Se corrigió un caso del paquete: si falla el archivo por falta de almacenamiento, el respaldo pendiente ahora se conserva en memoria durante cambio de país, reinicio o selección vacía. La sesión antigua no se reemplaza ni elimina hasta poder archivarla. La prueba de regresión reproduce el fallo y la recuperación. No existe una interfaz nueva de restauración; la recuperación del respaldo sigue siendo técnica.

## Validación

- `npm run build`: 383 pruebas raíz y 479 del módulo de ciudadanía, lint, compilaciones y comprobaciones estáticas aprobadas.
- `npm run typecheck --prefix modules/citizenship`: aprobado dentro del alcance del script existente.
- Recorrido completo del adaptador: 125/129 preguntas únicas en español e inglés; finalización sin bucles.
- JSON del banco semánticamente idéntico al archivo del paquete; no se reescribieron preguntas ni metadatos editoriales.
- Navegador sobre la compilación local: 129 Venezuela, 125 Cuba, cambio de idioma sin perder posición, recarga, teclado y pantalla de 390 × 844.
- Migración y almacenamiento denegado/cuota: pruebas sintéticas; no se accedió a almacenamiento de usuarios.

## Límites y revisión pendiente

El JSON conserva metadatos históricos de propuesta, incluidos campos que describen una migración aún no implementada en esa propuesta. Este documento describe el código integrado; el estado editorial no implica publicación ni revisión profesional.

No se realizaron entrevistas con proveedor IA, grabaciones, audición real, pruebas físicas de gestos ni revisión jurídica profesional. La pantalla de tarjetas no ofrece un control de audio en su implementación actual; este cambio no añade uno.

Antes de publicar, revisar el contenido y los bloqueos de `ASYLUM_ADAPTIVE_REVIEW.md`. Las referencias y la revisión profesional pendientes del paquete no se consideran completadas por haber pasado las pruebas de software.

## Continuación: contexto confirmado

La preparación permite elegir Solo escribir. Se implementaron fichas voluntarias en la entrevista de texto, con requisitos individuales, cita exacta, omisión y retirada de consentimiento. Véase `ASYLUM_ADAPTIVE_REVIEW.md`. El controlador del navegador se recuperó reiniciando su sesión; la nueva revisión visual corresponde al componente en un entorno sintético, no a una llamada real.

La revisión completa con proveedor simulado y los controles adicionales de las cuatro fichas están documentados en `ASYLUM_ADAPTIVE_REVIEW.md`.


Actualizacion: piloto de voz con doble habilitacion solo para pruebas; sigue desactivado por defecto. Ver ASYLUM_VOICE_PILOT.md.
