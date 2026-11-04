# Repreguntas contextuales: estado local

Implementadas las 42 fichas en entrevista de **texto**, mediante selección voluntaria y confirmación estructurada. No hay clasificación automática de hechos ni activación por palabras clave. Voz desactivada tanto en cliente como en servidor.

Cada una de las 42 fichas tiene prerrequisitos individuales bilingües en `adaptive-prerequisites.json`. El apéndice original conserva su estado editorial histórico; este documento describe la implementación actual.

## Recorrido

Después de una respuesta base con evaluación de claridad adecuada, sin aclaración pendiente, aparece una opción cerrada para explorar la respuesta anterior. No es una pregunta obligatoria. El usuario elige la ficha, identifica el origen como experiencia propia, confirma el requisito individual y que la cita exacta expresa ese contexto. Nada está preseleccionado. Relatos de terceros e hipótesis no habilitan las fichas.

La confirmación es una declaración del usuario, no una verificación de la verdad ni una clasificación jurídica. El servidor verifica la cita, la oportunidad vigente y cada confirmación; no deduce el contexto del texto. Una confirmación contradictoria del propio usuario no puede detectarse semánticamente sin interpretar su relato: se muestra la cita y se ofrece cancelar para corregirla. No se presenta esto como detección de contradicciones.

Solo una repregunta contextual por respuesta base. La pregunta base siguiente queda pendiente y se recupera después de responder u omitir. No se evalúa esa repregunta con IA ni se encadena otra aclaración. No vuelve a ofrecerse el mismo ID en la sesión. Acciones repetidas con el mismo identificador son idempotentes.

Las fichas de impacto requieren consentimiento separado; retirada u omisión durante impacto termina la pregunta. Como límite conservador, después de abrir una ficha de impacto no se ofrece otra durante la sesión. También puede deshabilitarse el tema antes de elegir una ficha.

Corregir cancela el contexto y sus confirmaciones; no reescribe ni interpreta retroactivamente la respuesta. Una corrección puede expresarse en un turno posterior, con confirmación nueva. No se conservan citas ni estados nuevos fuera de la sesión efímera existente; no se agregan registros de diagnóstico con contenido.

## Incorporación de las cuatro fichas pendientes

- `IMMIGRA_ASYLUM_ADAPT_PRIOR_STATEMENTS_2`: solo se ofrece cuando existe otra cita de usuario en la misma sesión. Se elige una de las últimas seis citas base, diferente de la respuesta actual. Se exige texto e identificador exactos y confirmación de que ambas citas corresponden al mismo asunto, registro y recuerdo. Se excluyen citas de asistente y respuestas a repreguntas/escenarios. No se deduce una contradicción ni se comprueba la autenticidad del registro.
- `IMMIGRA_ASYLUM_ADAPT_HYPOTHETICAL_RETURN_1` y `_2`: muestran previamente escenarios fijos versionados, declinables y expresamente hipotéticos. No hay oferta real, garantía, procedimiento ni decisión de autoridades. El servidor exige aceptación explícita de la versión y antepone el escenario a la pregunta.
- `IMMIGRA_ASYLUM_ADAPT_RETURNEE_EVIDENCE_1`: usa únicamente una comparación ficticia, sin atribuir casos, fuentes ni afirmaciones a inmigración y sin dar por sentadas seguridad o comparabilidad. También requiere aceptación separada del escenario versionado.

Las fichas siguen dependiendo de una elección voluntaria; no se seleccionan ni se confirman automáticamente a partir del relato.

## Voz: continúa desactivada

El flujo actual procesa transcripciones finales como respuestas, no como un protocolo de consentimiento vinculado a una ficha, cita y versión de escenario. Un «sí» aislado, una corrección o una transcripción tardía no constituyen una confirmación inequívoca. Faltan estados separados de confirmación/omisión, lectura y devolución del contexto, cancelación de voz en curso al retirar consentimiento, manejo comprobado de errores de transcripción y pruebas de ruido, interrupciones y repetición en ambos idiomas. Se conservan los bloqueos de cliente y servidor, incluso ante una petición estructurada falsificada desde una sesión de voz. No se realizaron pruebas de audición ni micrófono real.

## Validación

Pruebas de todas las fichas habilitadas en español e inglés; falta de consentimiento, cita alterada, oportunidad caducada, terceros, hipótesis, detención al salir, afiliación atribuida, omisión, corrección, duplicados, cierre de impacto y exclusión de voz. Integración del servidor y transporte con proveedores simulados. Los casos negativos prueban que el texto por sí solo no activa nada; no prueban comprensión semántica automática.

Revisión visual del componente real en un entorno sintético independiente, escritorio y 390 × 844: controles inicialmente vacíos, terceros bloqueados, confirmación, cancelación y omisión. Las capturas están identificadas como prueba sintética; no son una entrevista real con IA. La continuación descrita abajo amplía esa revisión al recorrido completo con proveedor simulado; siguen pendientes proveedor real y dispositivo físico.

Sin push ni despliegue. No se utilizaron relatos reales, credenciales ni datos de usuarios.

La preparación real compilada también se revisó en navegador: selección de Solo escribir y Venezuela visibles, sin iniciar proveedor ni enviar relatos. Resultado final: 383 pruebas raíz y 479 de ciudadanía; compilación, lint y tipos existentes aprobados.

## Recorrido completo comprobado

Se ejecutaron los componentes reales `AsylumPreparation`, puente del runtime, `ConversationInterview`, `CallView`, transporte HTTP y motor de servidor en un entorno local aislado. El acceso y el proveedor fueron fixtures sintéticos; no se cambiaron controles productivos, ni se consultó OpenAI, ni se utilizaron relatos reales. No equivale a validar autenticación, cuotas o un proveedor en producción.

Se verificaron selección de Venezuela/texto (129 preguntas en servidor), respuestas, selección de dos citas, confirmaciones, escenario con aceptación separada, una sola pregunta contextual visible, respuesta incierta/omisión, retorno a la misma pregunta base y cierre con resumen en 390 × 844. La traza `asylum-full-flow-trace.json` registra solo acciones, IDs y estados del ensayo, sin relatos.

Se corrigieron codificación UTF-8 de las etiquetas nuevas, texto del modo de conversación y recuento/diagnósticos: una repregunta fija no cuenta como evaluación de IA. El resumen sintético final muestra dos respuestas y una evaluación simulada. Compilación completa: 383 pruebas raíz y 479 de ciudadanía aprobadas; lint y tipos existentes aprobados. Pruebas focalizadas adicionales incluidas.

Límites: la confirmación no verifica la verdad, no determina elegibilidad y no detecta semánticamente contradicciones. La maquetación se probó con componentes reales y estilos locales en un harness; siguen pendientes proveedor real, autenticación productiva y dispositivo físico. Nada publicado.


Actualizacion: piloto de voz con doble habilitacion solo para pruebas; sigue desactivado por defecto. Ver ASYLUM_VOICE_PILOT.md.
