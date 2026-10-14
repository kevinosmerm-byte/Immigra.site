### 🧠 Advanced AI Brain Diagnostic Ledger

* **Target File / Component:** `src/Account.jsx`, `src/api.js`, `src/NativeSubscriptionPanel.jsx`, `server/nativeStoreVerification.js`, `server/nativeStoreService.js`, `app-store/metadata.json`.
* **Deep User Experience Impact (Pros & Cons):**
  * *Pros:* Estudio gratuito accesible, prueba de siete días sin tarjeta, restauración separada de compra, precios de tienda localizados, código de correo dentro de la app y eliminación accesible sin completar onboarding. El usuario confirmó micrófono, voz y permisos.
  * *Friction Points:* Antes, Cuenta llamaba rutas relativas del WebView; las notas de revisión prometían acceso sin cuenta y las compras/restauración nativas estaban deshabilitadas sin implementación. Un usuario que ya había pagado podía volver a intentar comprar tras un error de verificación. Los campos producto/plan del SDK Android no coincidían con su nombre aparente. Se resolvieron esos flujos; todavía faltan cuentas/productos reales de las tiendas.
* **Root-Cause Architectural Failure:** Stripe web no implementa pagos nativos. El WebView no comparte el origen del dominio público, por lo que `/api/account` no basta. Las identidades de tienda no pueden aceptarse como concesiones PRO del cliente. El SDK Android fijado devuelve `identifier` como base plan y `planIdentifier` como producto: usar el orden aparente permite escoger un precio diferente del producto comprado. El borrado de cuenta exigía cancelar primero, creando un bloqueo de privacidad.
* **Production-Grade Implementation:** Código completo en los archivos indicados: origen HTTPS de Immigra para APIs nativas, OTP de correo, compras y restauración con verificación Apple/Google, cuenta UUID vinculada, precios del base plan exacto, referencias cifradas, finalización posterior a verificación, bloqueo de recompra ante validación pendiente, comprobación renovada antes de acceso y eliminación autenticada con aviso sobre cancelación independiente. Las compras permanecen deshabilitadas sin configuración y migración. No hay bypass de revisión ni flags locales que activen PRO.

Las cuatro fases de revisión abarcaron claridad para personas con ansiedad/idioma elegido, estados asíncronos y propiedad de cuenta, componentes oscuros con controles de al menos 44px, y resolución con pruebas relevantes. Se añadió únicamente pausa/liberación de voz al abrir el reporte de IA; la captura y síntesis existentes se conservan. No se sustituyó la fuente oficial de preguntas.

## Evidencia y límites

- `npm run quality`: 285 pruebas aprobadas, 0 fallos, 0 omitidas; lint, build y comprobaciones fundacionales móvil/iOS/metadata aprobadas.
- Typecheck y extracción oficial: 128 preguntas/410 respuestas verificadas.
- PostgreSQL real mediante PGlite: migraciones aplicadas; propiedad única de compra, denegación de lectura al navegador y borrado en cascada comprobados.
- Navegador Chromium con fixtures: ocho estados de acceso premium, actualización de JWT, vencimiento en sesión y estudio gratuito; eliminación pública ES/EN accesible antes de onboarding en 320px; reporte de IA con edición/consentimiento y un único envío. No se contactó a proveedores de pago.
- AudioWorklet: dos turnos sintéticos procesados en Chromium, WAVs y liberación de un único stream comprobados después del cambio de pausa del reporte. No sustituye una prueba física.
- Plugins nativos registrados con Capacitor para Android/iOS. Esto no demuestra que un AAB o archivo iOS esté compilado, firmado o aprobado.
- Las pruebas de mapeo de estados y la librería oficial de Apple no constituyen una transacción sandbox real. Credenciales, productos, raíces de confianza, cuenta de revisión y ciclo de compras deben verificarse antes de habilitar pagos.
- `verify:store-release` retorna estado pendiente por requisitos externos concretos. La información antigua de tiendas se conserva marcada como histórica; las capturas existentes requieren revisión de identidad y actualización desde un dispositivo final.
- No se confirmó desde aquí la relación Cloudflare/immigra.site con este repositorio; guardar una rama GitHub no acredita despliegue en el dominio.

La auditoría npm final reporta 0 avisos tras actualizar dependencias compatibles de carga de archivos/proxy y fijar UUID corregido solo para xcode. Se comprobó que xcode analiza el proyecto real y produce identificadores válidos/únicos. Esta evidencia no sustituye firma ni auditoría del binario final.
