# Elección explícita antes de impacto — 2026-11-04

Sobre main 1f5e1f7, sin publicar. Resuelve la diferencia documentada anteriormente para las preguntas base 107 y 108.

Texto: antes de mostrar cada pregunta se presenta advertencia bilingüe y dos botones nativos: omitir y continuar, o ver la pregunta opcional. No hay selección previa. Consentimiento limitado a esa pregunta; todavía se puede omitir después. El servidor exige acción estructurada vinculada a pregunta y revisión; texto libre, sí o silencio no autorizan. Esas entradas no se evalúan ni se guardan en historial del servidor. Reintentos idempotentes. La advertencia permanece visible con subtítulos ocultos.

Estudio: tarjeta oculta detrás de advertencia y elección; navegación sigue disponible. Revelación solo en memoria, se reinicia al cambiar de tarjeta, país o sesión. No se persiste consentimiento.

Voz: piloto adaptativo sigue apagado. Como alternativa segura, las dos preguntas base de impacto se excluyen de la entrevista de voz (123 generales, 127 con Venezuela). Texto y estudio conservan 125/129. No se usa transcripción para consentir. Esto no garantiza clasificación de toda pregunta generada a partir de contexto opcional ni sustituye validación de audio real.

Pruebas: 391 raíz y 484 ciudadanía, build, lint y verificaciones estáticas aprobadas. Cinco nuevas pruebas cubren ambos IDs e idiomas, texto no autorizante, revisión incorrecta, duplicados, omisión sin evaluación y exclusión en voz. Recorrido real de componentes/HTTP con proveedor simulado: confirmar por Enter en español, omitir por Enter en inglés con subtítulos ocultos; estudio revelar, avanzar y volver exige nueva elección. No se probó con lector de pantalla físico; se verificaron árbol accesible, etiquetas y teclado. Sin relatos reales ni llamadas pagadas.

Resaltado y tiendas sin diferencias contra HEAD. No commit, push ni deploy. Pendiente revisión del parche y autorización de publicación; voz real sigue pendiente de validación separada.
