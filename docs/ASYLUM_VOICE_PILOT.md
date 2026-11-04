# Piloto local de confirmaciones durante voz

Implementado para pruebas, DESACTIVADO por defecto en cliente y servidor. No publicado. Solo las fixtures inyectan enableVoiceAdaptiveControls en ambos lados; no se acepta autorizacion enviada por el usuario.

Se pausa la voz para seleccionar contexto y confirmar requisitos individuales con controles escritos. Omitir, cancelar/corregir y reanudar son acciones explicitas. Una transcripcion de si nunca confirma contexto. Se conserva consentimiento separado para impacto y retirada. No se infieren hechos ni elegibilidad.

Entradas vinculadas a pregunta y epoca de audio; transcripciones sin inicio capturado o posteriores a pausa/cambio se rechazan. Salidas canceladas identificadas se ignoran. Servidor exige revision vigente y reintentos idempotentes. Microfono simulado deshabilitado durante eleccion.

Recorrido de navegador contra servidor simulado: respuesta ficticia, pausa, transcripcion tardia ignorada, seleccion y confirmacion, reanudacion contextual, correccion/cancelacion y retorno a la misma pregunta base. Eventos de audio sinteticos: no se escucho audio real ni se capturo microfono ni se llamo a proveedor de pago.

Pendiente antes de habilitar: reproduccion/cancelacion real, buffers de dispositivo/proveedor, interrupciones y transcripciones tardias con identificadores reales, ruido y permisos. La simulacion no valida esas propiedades fisicas. Mantener desactivado hasta validacion autorizada.
