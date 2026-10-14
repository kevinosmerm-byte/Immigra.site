# Immigra: preparación de tiendas

Revisión: 14 de octubre de 2026. Textos y checklist específicos de Google Play: [google-play/SUBMISSION_CHECKLIST.md](../google-play/SUBMISSION_CHECKLIST.md). Este repositorio prepara Immigra; no acredita publicación ni aprobación de las tiendas.

## Identidad y estado

- Nombre público: **Immigra**. Dominio: **https://immigra.site**.
- Identificador nativo conservado: **us.citizenshipai.app**. No obliga a usar Citizenship AI como nombre comercial. El propietario confirmó que todavía no publicó la app ni creó suscripciones.
- Los iconos y capturas anteriores siguen siendo material de CitizenshipAI. Deben revisarse y capturarse desde el binario final de Immigra antes de subirlos; no se presentan como capturas actuales.
- El correo existente `info@citizenshipai.us` se conserva porque no se ha confirmado otro buzón. Verificar que recibe mensajes antes de enviarlo como soporte; no se inventa una dirección de Immigra.
- El usuario confirmó que micrófono, voz y permisos funcionan. Es evidencia informada por el usuario; no sustituye la prueba de compras nativas incorporadas después de esa comprobación.

## Productos propuestos para crear

| Tienda | Producto | Plan |
| --- | --- | --- |
| Apple | `immigra.pro.monthly` | Renovación mensual |
| Apple | `immigra.pro.annual` | Renovación anual |
| Google Play | `immigra_pro` | Base plan `monthly` |
| Google Play | `immigra_pro` | Base plan `annual` |

Estos identificadores son una propuesta para configurar en las consolas, no productos ya registrados. En Apple, ambos productos deben pertenecer al mismo grupo de suscripciones. En Google, crear dos base plans auto-renovables en el mismo producto. No añadir otra prueba gratuita ni ofertas introductorias: Immigra ya concede siete días sin tarjeta desde el primer uso, sin conversión automática a pago. El cliente muestra precios localizados de la tienda, no precios de Stripe. El análisis de precios es una recomendación; este trabajo no cambia los importes web existentes.

## Configuración antes de habilitar compras

1. Aplicar `supabase/migrations/202610140001_native_store_purchases.sql` en el mismo proyecto que usa Render, después de las migraciones existentes. Almacena referencias cifradas y obliga a propietario único; RLS impide acceso directo del navegador. El borrado de cuenta elimina también esos registros.
2. En Render, configurar los nombres documentados en `.env.example`. **Nunca** poner claves Apple, certificados de firma, JSON de Google, tokens de compra o claves de cifrado en variables `VITE_*`, Git o el chat.
3. Apple: crear una clave de App Store Server API, guardar el archivo privado en el servidor, configurar issuer/key/app ID y certificados raíz oficiales descargados desde Apple PKI. Usar un servicio aislado Sandbox para pruebas y Production para el servicio de producción; no conceder acceso real con tokens de prueba. Una compilación nativa de pruebas puede seleccionar `VITE_NATIVE_API_BASE_URL` para el backend HTTPS aislado. El valor predeterminado es https://immigra.site/api. La verificación comprueba firma/cadena de certificados, aplicación, producto, propietario UUID, estado actual, revocación y vencimiento. Permitir acceso saliente al App Store Server API y OCSP oficial en el servidor.
4. Google: vincular una cuenta de servicio a Play Console con acceso a las suscripciones de esta app. Configurar `GOOGLE_APPLICATION_CREDENTIALS` como archivo privado del servidor; la API usa el permiso `androidpublisher`. Activar compras de prueba únicamente en el entorno de pruebas. El servidor comprueba producto/base plan, token, propietario, estado y vencimiento.
5. Permitir los orígenes nativos necesarios en `CORS_ORIGIN`: `capacitor://localhost` para iOS y `https://localhost` para Android, además de `https://immigra.site`. No usar comodines.
6. En Supabase, configurar el correo OTP para incluir `{{ .Token }}` y permitir `https://immigra.site` como destino de autenticación. El panel admite código de correo para iniciar sesión dentro de la app sin depender del enlace abierto en otro navegador. Verificar el envío del código con la configuración real.
7. Confirmar que el proyecto Cloudflare de `immigra.site` usa este repositorio y que `/api` llega al Render correcto. Sin esa conexión, las llamadas nativas no pueden funcionar; publicar a GitHub no confirma este vínculo.
8. Activar `NATIVE_BILLING_ENABLED=true` únicamente cuando schema/productos/credenciales y pruebas estén preparados. `/native-billing/config` mantiene las compras deshabilitadas si falta configuración o migración.

## Comportamiento implementado

- Compra mensual/anual, restauración y gestión mediante `@capgo/native-purchases`; no hay Stripe Checkout en la app nativa.
- Precio Android vinculado al base plan correcto, excluyendo ofertas introductorias. No se cobra de nuevo al restaurar.
- Compra vinculada al UUID de la cuenta mediante appAccountToken/obfuscated account ID. El backend verifica con las tiendas; una bandera local o una respuesta del plugin no concede PRO.
- La transacción se finaliza/confirma después de verificarla en el servidor. Una compra pendiente no se confirma ni concede acceso.
- Referencias almacenadas con AES-256-GCM; acceso de backend únicamente. Revalidación de suscripciones antes de acceso premium, con caché de hasta 60 segundos; cuando el proveedor falla, el acceso nativo falla cerrado. No se depende de flags del cliente ni de notificaciones sin firma.
- La verificación en uso detecta renovaciones y revocaciones al volver a practicar. No se han configurado webhooks/RTDN de tiendas ni emails de facturación; Apple y Google gestionan los cobros aun si la app no se abre. No anunciar una integración operativa de notificaciones.
- Eliminación disponible dentro de Cuenta y desde `https://immigra.site/#deleteAccount`, también sin onboarding. Requiere autenticación/confirmación; no exige cancelar primero. Se explica que eliminar la cuenta **no cancela cobros** y cómo cancelar con el proveedor. Los datos locales se borran aparte en Ajustes.
- Avisos educativos: no somos abogados, no damos asesoría legal, no somos USCIS y siempre recomendamos ayuda profesional autorizada.

## Reportes de respuestas de IA

La app permite reportar una respuesta incorrecta, ofensiva/insegura o que parezca asesoría legal sin salir de la interfaz. La persona revisa/edita el contenido y confirma que desea enviarlo: no se guardan automáticamente conversaciones ni respuestas personales. Se pausa la captura de voz al abrir el reporte. Solo cuentas autenticadas pueden enviarlo; los registros tienen RLS, propietario y borrado en cascada.

La migración incluye `ai_feedback_reports` y `purge_expired_ai_feedback()`. En Supabase, configurar una tarea periódica que ejecute esa función para retirar reportes con vencimiento de 30 días; cada ejecución elimina hasta 500. Revisar el volumen para programar ejecuciones suficientes, acceso del personal autorizado y seguimiento de reportes antes del envío a tiendas. La limpieza también se ejecuta al recibir otro reporte, pero eso no sustituye el scheduler en períodos sin actividad. Este entorno no configuró un scheduler remoto ni una cuenta de personal que atienda esos reportes.

## Validación pendiente de las consolas y del propietario

- Apple Developer y Play Console: cuentas, contratos, identidad, impuestos y cobros; completar contactos reales.
- Crear productos, precios y disponibilidad regional; no inventar IDs de productos ya creados.
- Revisores: cuenta de prueba autenticada y acceso premium vigente durante la revisión, entregados en las consolas, nunca en Git. Las notas antiguas de acceso promocional sin cuenta ya no corresponden a esta versión.
- Declaraciones App Privacy/Data safety deben incluir compras, cuentas, uso técnico y perfiles opcionales. Identificar el procesamiento de OpenAI/Supabase y demás proveedores de la versión enviada. Registrar prácticas reales de retención y respaldos, no prometer borrar registros externos a Immigra.
- Google: URL pública de eliminación, clasificación, contenido generado por IA/medidas de seguridad, contenido educativo independiente, y requisitos de pruebas exigidos por la cuenta. Consultar la consola vigente; no asumir que una cuenta nueva queda exenta.
- Apple: App Privacy, clasificación, privacidad del SDK y required-reason APIs del binario final, export compliance y capturas actuales. No inferir aprobación de una expresión regular que comprueba archivos.
- Android: compilar APK de prueba y AAB firmado; configurar y custodiar la clave de subida. iOS: equipo Apple/Xcode, firma, archivo validado y TestFlight. No hay evidencia de paquetes firmados subidos en este entorno.
- Sandbox: compra aprobada/cancelada/pendiente, restauración en otro dispositivo de la misma cuenta, denegación en cuenta ajena, renovación, cancelación con acceso hasta vencimiento, grace/hold, reembolso/revocación, pérdida de red durante validación y borrado de cuenta. Confirmar que una restauración nunca genera otra compra.

## Comandos

`npm run quality`, `npm run typecheck`, extracción del PDF y pruebas nativas del backend se ejecutan aquí. `npx cap sync android` y `npx cap sync ios` registran plugins y empaquetan el bundle actual; no equivalen a compilar/firmar. `npm run verify:store-release` admite `ANDROID_RELEASE_AAB`, `IOS_RELEASE_ARCHIVE` y un archivo local JSON señalado por `STORE_REVIEW_EVIDENCE_FILE` con las confirmaciones `signingValidated`, `privacyAndSdkReviewed`, `ageRatingsCompleted`, `screenshotsCurrent`, `reviewAccountVerified`, `immigraDomainVerified` , `sandboxPurchaseLifecyclePassed` y `aiFeedbackProcessReady`. Solo registrar como true comprobaciones realizadas; no equivale a aprobación de las tiendas. Informa bloqueos de envío y sale con código 1 mientras falten los requisitos finales. No eliminar esos bloqueos para producir un resultado verde.

Antes de la migración nueva, `aiFeedbackEnabled` permanece false y el botón de reporte no se muestra. Las compras nativas también permanecen deshabilitadas si falta schema/configuración. El backend acepta los orígenes propios https://immigra.site, capacitor://localhost y https://localhost, además de la lista CORS configurada; esto no concede acceso a IA sin JWT/sesión autorizada.
