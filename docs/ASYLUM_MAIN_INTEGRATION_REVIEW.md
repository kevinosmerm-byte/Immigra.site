# Integración de asilo sobre main — 2026-11-04

Base verificada: 1f5e1f74393b56e4dfb57552357c0ca93f2c69cf. Copia aislada asylum-main-review (HEAD separado). Sin commit, push ni despliegue. El checkout asylum-v6 y el trabajo ajeno se conservan.

Aplicación sin conflictos del paquete previo. Los nueve archivos cambiados entre 0c6d841 y main permanecen idénticos a main en Git: resaltado N-400, pruebas asociadas, portada y enlaces de tiendas. Dependencias mediante junctions a instalaciones existentes; package-lock sin cambios. No se copian dependencias al entregable.

Validación nueva: npm run build aprobado (386 pruebas raíz y 484 ciudadanía, lint, compilación y comprobaciones estáticas de distribución). Typecheck existente de ciudadanía aprobado; su alcance no cubre todo el JavaScript del proyecto. git diff --check sin errores. Las capturas y pruebas de audio del paquete anterior son antecedentes, no nuevas pruebas visuales de este main.

Revisión del contenido: 125 preguntas bilingües generales y cuatro Venezuela; instrucciones educativas no oficiales, no inventar detalles, admitir desconocimiento y distinguir observación de hipótesis. Las preguntas Venezuela son condicionales y no afirman novedades políticas verificadas. No se realiza una validación jurídica ni de hechos actuales.

Repreguntas: 42 fichas con requisitos individuales, cita exacta, origen personal explícito, ninguna inferencia por palabras clave. Una contextual por respuesta, sin evaluación de elegibilidad, sin encadenar aclaraciones. Impacto requiere consentimiento separado y retirada persistente en la sesión. Comparación de registros exige dos citas autorizadas; escenarios fijos requieren aceptación versionada y se identifican como hipotéticos. Las pruebas negativas cubren detención al salir, afiliación atribuida, terceros, correcciones y duplicados. Las confirmaciones son declaraciones del usuario, no comprobaciones semánticas de verdad o consistencia.

Riesgos y pendientes: las preguntas BASE sobre efectos físicos/emocionales se presentan como opcionales y permiten omitir, pero no tienen el consentimiento separado aplicado a las REPREGUNTAS. Revisar esa diferencia antes de aprobar publicación si se exige consentimiento previo para todo el tema. Los escenarios base se rotulan hipotéticos; solo los adaptativos tienen aceptación versionada. No se modificó silenciosamente el banco aprobado durante esta integración.

Voz: piloto desactivado por defecto en constructor servidor y cliente, sin activación desde llamadas productivas. Solo fixtures pueden habilitar ambos. Falta validar micrófono, reproducción/cancelación, buffers e interrupciones con proveedor real autorizado. Las pruebas simuladas no validan audio físico. No se accedió a relatos, cuentas ni datos reales y no se hicieron llamadas pagadas.

Siguiente paso: revisar estas diferencias de consentimiento, revisar el parche contra main y autorizar publicación por separado. Si main cambia, revalidar antes de publicar. Mantener voz desactivada hasta validación real.


Actualización: la diferencia de consentimiento en las dos preguntas base se resolvió. Ver ASYLUM_BASE_IMPACT_REVIEW.md para alcance, exclusión temporal en voz y pruebas.
