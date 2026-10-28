# Immigration AI — Paquete mayor Bloques 8–14
## Contrato de alcance
- **Bloque 8:** transcripción estructurada local y evidencia por turno (`src/analysis/transcript.mjs`).
- **Bloque 9:** extracción limitada de acontecimientos, incertidumbre y posibles aclaraciones (`facts.mjs`). No se emiten conclusiones de fraude o credibilidad.
- **Bloque 10:** informe educativo de voz con citas de respuestas y exportación TXT/JSON (`report.mjs`, `VoiceReportView.jsx`).
- **Bloque 11:** consentimiento explícito de audio, privacidad y controles de redacción (`privacy.mjs`).
- **Bloque 12:** límites de duración/volumen y contrato de autorización de producción (`budget.mjs`). Los límites de cliente NO reemplazan enforcement de servidor.
- **Bloque 13:** simulaciones ficticias y pruebas automatizadas (`fixtures.mjs`, `tests/analysis8plus.test.mjs`).
- **Bloque 14:** integración de la transcripción e informe en el entrevistador WebRTC (`src/realtime/RealtimeInterview.jsx`).

## Uso
`npm install`, `npm test`, `npm run build`, `npm run server:realtime` (con variables de entorno y servicio configurado), `npm run dev`.
Los archivos de video del usuario no están incluidos: colocar `public/interviewer/listening.mp4` y `speaking.mp4`.

## Límites verificados
- El reporte **solo** analiza transcripciones disponibles y puede omitir respuestas si el proveedor no entrega eventos de texto.
- No se realiza diarización robusta, validación de transcripciones, extracción semántica LLM ni verificación factual; se usan reglas conservadoras.
- La correlación de transcripciones en vivo puede variar con el formato de eventos del proveedor. Probar en un entorno autorizado.
- Los escenarios siguen siendo metadatos, no expedientes ficticios completos.
- Los módulos ciudadanía y asilo no están integrados: sus repositorios originales permanecen intactos.
- El backend previo es **demostrativo**: no hay autenticación, entitlement real ni enforcement persistente de cuotas. No publicar la ruta de tokens sin estos controles.
- La revisión de privacidad del proveedor y los consentimientos legales reales están pendientes.

## Instrucciones no negociables para Codex
1. No modificar el banco oficial `src/data/uscis2025Civics.json` del repositorio original ni el evaluador cívico determinista.
2. No permitir que los datos de residencia lleguen a otros motores; aislar rutas, almacenamiento y prompts.
3. No aceptar afirmaciones del usuario como instrucciones de sistema; la entrevista y la evaluación deben tener políticas propias.
4. No guardar audio ni transcripciones por defecto. Permitir borrar, exportar bajo decisión explícita del usuario, y documentar cualquier retención del proveedor.
5. Antes de producción: login, autorización, rate limiting persistente, cuotas por usuario, protección CSRF/origen, claves solo servidor, límites de gasto y pruebas de abuso.
6. Probar audio, subtítulos y permisos en Safari/iOS, Android/Capacitor y navegadores desktop; añadir recuperación de reconexión y audio perdido.
7. Evaluar diferencias entre respuestas con cautela; una respuesta distinta no demuestra engaño. Evitar preguntas humillantes, sugerencias de respuestas o amenazas falsas.
8. Ejecutar pruebas existentes, pruebas de integración de micrófono con mocks y auditoría de accesibilidad antes de desplegar.
9. Verificar contratos del proveedor de Realtime contra la documentación vigente antes de integrar. No asumir estabilidad de nombres de eventos.
10. Ninguna de estas tareas implica aprobación migratoria ni asesoría legal.

## Definición de listo para producción (pendiente)
- [ ] Autenticación y control de propiedad de cada sesión
- [ ] Suscripción/entitlement verificado en servidor
- [ ] Cuotas y topes de gasto por usuario
- [ ] Consentimiento y privacidad revisados legalmente
- [ ] Pruebas E2E de WebRTC con proveedor real
- [ ] Accesibilidad y localización completa
- [ ] Auditoría de seguridad, monitoreo sin PII, recuperación de fallos
- [ ] Integración de los otros motores con permisos y regresión
