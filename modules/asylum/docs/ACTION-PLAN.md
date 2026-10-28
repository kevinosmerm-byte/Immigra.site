# Plan de acción — AsiloAI

Completado: web adaptable; selector Kevin/Sahara; marco centrado sin recortar el video; banco ES/EN; aviso previo; API OpenAI activa en beta privada, Access y cuotas D1; prueba real con fuente ficticia; selector ES/EN para análisis.

Implementado: PDF.js local, PDF hasta 20 MB/300 páginas, selección y extracción de una página, revisión antes de añadir la fuente. Referencia de archivo y página. PDF escaneado sin texto y protegido se informa explícitamente; no se ejecutan scripts PDF ni se envía el archivo a la nube.

Validación: 26 pruebas automatizadas; en navegador PDF ficticio de dos páginas, extracción de página 2, página sin texto conserva borrador anterior, ambos entrevistadores seleccionables.

Pendientes: revisión visual del PDF junto al texto, soporte ampliado de formularios; cuentas públicas y almacenamiento seguro; sincronización; prueba de micrófono real en dispositivos finales; pagos; apps nativas. No modificar CitizenshipAI.

Verificación en producción: selector Kevin/Sahara visible; PDF ficticio de dos páginas extraído correctamente en asiloai.com, página 2 y referencia conservadas. Ningún documento real fue enviado.

Voz: lectura automática, dictado ES/EN con permiso y evaluación de claridad implementados. Videos de Kevin/Sahara actualizados desde los cuatro archivos del usuario. Ver docs/VOICE-INTERVIEWS.md para compatibilidad y pruebas.

OCR local bilingüe y nuevo retrato de Sahara publicados el 7 de octubre. Ver OCR.md.
