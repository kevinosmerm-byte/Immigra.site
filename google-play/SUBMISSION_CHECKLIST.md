# Immigra: Google Play

Usar `metadata.json` para textos EN/ES. Preparación común, productos y variables: [IMMIGRA_STORE_RELEASE.md](../docs/IMMIGRA_STORE_RELEASE.md). Esto no confirma que exista una app en Play Console ni un AAB firmado.

## Antes del envío

1. Registrar/verificar la cuenta del propietario y completar contratos, impuestos y cobros cuando corresponda. Confirmar que la cuenta puede distribuir y vender suscripciones.
2. Crear la app **Immigra**, paquete `us.citizenshipai.app`, categoría Education. Verificar nombre disponible, países, público objetivo y formulario de clasificación. No inventar respuestas de edad ni omitir contenido de asilo, conversación o IA.
3. Crear `immigra_pro` con base plans auto-renovables `monthly` y `annual`; establecer precios/regiones y activar las pruebas de licencia. No añadir una segunda prueba automática: los siete días de Immigra no requieren tarjeta ni se convierten en pago.
4. Vincular API/cuenta de servicio con permisos mínimos para verificar las suscripciones. Preparar un backend sandbox separado, sin conceder acceso de producción con tokens de prueba.
5. Generar/sincronizar bundle actual, compilar AAB, firmar y custodiar la clave de subida. Configurar Play App Signing. Revisar versión, SDK objetivo/API exigida por la consola vigente y compatibilidad de Billing Library/plugins del binario. El código apunta a API 36, pero una regex no certifica el binario ni las exigencias vigentes.
6. Entregar capturas reales actualizadas, icono, gráfico de funciones y derechos de todos los recursos. Las imágenes anteriores de CitizenshipAI no prueban que la ficha de Immigra esté lista.
7. Publicar política y eliminación en `https://immigra.site/#privacy` y `https://immigra.site/#deleteAccount`. Verificar que abren sin login/onboarding, que la eliminación se completa tras autenticar al propietario y que el dominio conecta con el backend correcto.
8. Completar Data safety con la versión efectiva: correo/identificador de cuenta, datos opcionales de perfil, compras, interacción técnica, texto y audio procesados, reportes consentidos y cualquier cámara/avatar habilitado. Diferenciar almacenamiento local, envío a proveedores, cifrado y retención. No declarar “sin recopilación” porque se usa un plan gratuito. No adivinar si cada tratamiento cuenta como recopilación/compartición según las excepciones y definiciones de la consola.
9. Completar App access: estudio gratuito sin cuenta, funciones premium con cuenta. Entregar acceso al revisor que permita practicar durante la revisión sin pedirle una tarjeta ni obligarlo a comprar. Credenciales solo en la consola; no añadirlas a Git.
10. Verificar compras/cancelación/pendiente/restauración, renovación, grace/hold, revocación y propietario en sandbox. Confirmar que el reporte de IA funciona dentro de la app, que existe personal autorizado que lo revisa y que la limpieza programada de reportes está instalada. La app no anuncia garantía de aprobación migratoria ni asesoría legal ni afiliación con USCIS.
11. Ejecutar prueba interna y revisión de estabilidad. Si la cuenta requiere prueba cerrada previa a producción, completar el número de participantes y duración que indique Play Console; no asumir que está exenta. Revisar Pre-launch report, accesibilidad y cualquier declaración adicional solicitada.

## Evidencia aceptada y pendiente

El propietario confirmó micrófono, voz y permisos funcionando. No se repiten como un bloqueo desconocido. Las nuevas compras y restauración todavía no tienen una transacción sandbox real, y este entorno no contiene un AAB firmado/subido ni credenciales de Play Console.

Verificaciones del repositorio: `npm run quality`, `npm run verify:store-release`. La primera valida código y bases de metadatos; la segunda informa requisitos finales pendientes. La aprobación solo puede emitirla Google tras revisar el binario y la cuenta.

Fuentes oficiales para revisar requisitos vigentes en la cuenta: https://play.google.com/console/about/ , https://developer.android.com/google/play/billing , https://support.google.com/googleplay/android-developer/answer/13327111 y https://play.google.com/about/developer-content-policy/ . Los textos actuales de esos sitios no se verificaron desde este entorno.
