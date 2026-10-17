# Verificación de preparación — 16 de octubre de 2026

- `npm run build`: correcto; 215 pruebas del proyecto principal y 319 del módulo Ciudadanía, sin fallos; lint, compilaciones y verificaciones estáticas incluidos.
- `npm run stores:package`: correcto; paquete de textos ES/EN, catálogo propuesto y pasos del propietario generado en `artifacts/Immigra-store-preparation.zip`.
- `npm run verify:ios --prefix modules/citizenship`: correcto; configuración estática, no compilación de Xcode.
- Android: compilación Gradle 9.6.0 completada con JDK 21, SDK 36 y Build Tools 36.0.0. Se verificaron manifiesto, nombre Immigra, aplicación `us.citizenshipai.app`, target API 36 y firma de depuración APK v2.
- APK de prueba: SHA-256 `2b3c953d4e90fdffeae1c66973c64f64e64004ce8fb7f104d274b24a9900b342`. No es un AAB firmado de publicación y no se ha probado en un dispositivo físico.
- iOS: se añadió el paquete Capacitor App que requiere el regreso de autenticación. La compilación Xcode/simulador y la firma para TestFlight no se ejecutaron en este entorno Linux. El workflow nativo ofrece compilación de prueba en un runner Mac separado, pendiente de resultado.
- No se controló la Mac de MacinCloud: no hay herramienta de escritorio remoto conectada a esta sesión.
- No se crearon registros ni productos en App Store Connect/Play Console. No se activaron compras nativas. Contratos, firma, revisión de privacidad, pruebas físicas y acceso estable de revisión siguen pendientes.

Los artefactos se excluyen de Git. El workflow puede regenerarlos. Las verificaciones externas de `docs/launch-readiness.json` no se cambian sin evidencia.
