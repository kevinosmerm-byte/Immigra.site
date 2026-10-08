# Bloque 4 — integración acumulativa y videos Sahara

Se conservó el shell y el motor acumulado. Se adaptó el aporte de voz al mismo formulario de residencia en lugar de copiar el LiveInterviewer independiente, que no conservaba todos los controles de los bloques anteriores.

## Cambios
- modules/residency/voice: controlador de voz desacoplado, panel React y estilos aislados.
- Residency.jsx: panel opcional conectado al mismo borrador, pregunta, escenario y sesión; aviso de privacidad actualizado.
- src/main.jsx: indicador active para detener voz al abandonar residencia, aunque la sesión siga montada.
- public/interviewer y dist/interviewer: los dos MP4 del usuario copiados sin modificación.
- serve.mjs: MIME video/mp4 para reproducción local.
- package.json/package-lock.json: versión 0.4.0; sin dependencias nuevas.
- README y docs: alcance, uso y límites.

## Controles implementados
Reconocimiento solo con aceptación y acción Dictar. La lectura no inicia micrófono. La transcripción se revisa antes de enviarla al motor. Repetir cancela escucha; dictar cancela lectura; cerrar, pausar, navegar, cambiar idioma/pregunta y desmontar invalidan callbacks anteriores y liberan las APIs. Los errores no bloquean el modo escrito. Los videos son silenciados y respetan movimiento reducido; no prometen sincronización labial.

## Preservación
Bancos, motor base, adaptador de sesión, heurística de años, catálogo de módulos y estilos del shell se compararon por SHA-256 con el Bloque 3. Se preservan ciudadanía/asilo y no se modifican repositorios externos. El ZIP de los bloques 1–3 y un respaldo técnico previo permanecen disponibles.

## Verificación y pendientes
32 pruebas aprobadas, build correcto y revisión de UI, video, alternancia speaking/listening y ancho móvil. Micrófono simulado en pruebas unitarias; no se activó hardware real ni se aceptaron permisos del navegador durante QA.
Pendientes: E2E con audio inyectado, pruebas reales en dispositivos objetivo, backend seguro y proveedor realtime si se desea conversación continua. La configuración actual no incluye claves ni servicios propios de IA.
