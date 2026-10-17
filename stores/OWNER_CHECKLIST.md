# Pasos del propietario — Kevin Medina

## 1. App Store Connect

1. Abre https://appstoreconnect.apple.com/ → Mis apps → + → Nueva app.
2. Selecciona iOS, nombre Immigra (sujeto a disponibilidad), idioma principal inglés de EE. UU., Bundle ID `us.citizenshipai.app` y un SKU nuevo, por ejemplo `immigra-ios-1` si está libre. Si no aparece el Bundle ID, regístralo primero en Certificates, Identifiers & Profiles de Apple Developer.
3. Usa Educación como categoría principal. Copia los textos en inglés y español del paquete; añade privacidad, soporte y contacto. Completa el teléfono de revisión y los datos fiscales/comerciales directamente en las consolas, sin compartir claves ni documentos en el chat.
4. Revisa los contratos, datos bancarios y fiscales antes de vender suscripciones. Crea un grupo Immigra PRO y los dos productos de `subscriptions.json`. No añadas otra prueba gratuita de tienda sin revisar la política actual de siete días desde el primer uso.
5. Las compras todavía requieren integración StoreKit/validación de servidor/notificaciones/restauración y pruebas Sandbox. Registrar productos por sí solo no activa el pago en la app.
6. Completa privacidad, clasificación de edad y derechos de contenido según la versión final. Suministra una cuenta de revisión con acceso estable; no dependas de una prueba que vence a los siete días.
7. En la Mac o MacinCloud, sigue los pasos de compilación más abajo, selecciona el equipo de Apple y verifica el identificador. Prueba en un iPhone físico. En Xcode: Product → Archive → Organizer → Validate App → Distribute App → App Store Connect/TestFlight. Un ZIP de simulador no puede subirse a App Store Connect.
8. Captura pantallas actuales del iPhone/iPad y sube el build de TestFlight. Comprueba compras/restauración, permisos denegados, acceso, eliminación, audio, segundo plano y falta de red antes de solicitar revisión.

## 2. Google Play Console — cuenta personal

1. Abre https://play.google.com/console/ → Crear app. Nombre Immigra, tipo App y categoría Educación. Elige la disponibilidad/precio de descarga: las suscripciones son productos separados de la descarga.
2. El primer Android App Bundle debe utilizar `us.citizenshipai.app`. Copia las descripciones y el correo `info@immigra.site`; añade privacidad y URL de eliminación de cuenta.
3. Completa verificación de identidad, perfil del desarrollador, verificación de dispositivo y demás tareas que muestre tu consola. Los datos privados y documentos van solamente en la consola oficial.
4. Crea la suscripción `immigra_pro` con planes base `monthly` y `annual` del catálogo. La app aún necesita Play Billing, verificación de compras y notificaciones de servidor, restauración y pruebas de licencia. No habilites venta nativa antes de completar esas partes.
5. Genera un AAB de publicación firmado con tu clave de carga y activa Play App Signing. Conserva una copia privada de la clave/contraseñas; no las subas a Git ni al chat. El APK de depuración generado por este repositorio es solo para probar, no se sube como release.
6. Empieza en Prueba interna. Para cuentas personales creadas después del **13 de noviembre de 2023**, la política consultada exige una prueba cerrada con al menos **12 testers inscritos continuamente durante 14 días**, y luego solicitar acceso a producción. Comprueba la tarea exacta en tu consola; completar el plazo no publica automáticamente.
7. Completa Seguridad de los datos, Acceso a la app, Clasificación de contenido, Público objetivo, Declaración de anuncios, permisos y contacto. Añade instrucciones y una cuenta de revisión con acceso estable. Declara expresamente la IA y la práctica educativa independiente.
8. Revisa el informe previo al lanzamiento, dispositivos de 16 KB de página de memoria cuando corresponda, compras/restauración y eliminación de cuenta. Solo después solicita producción.

Fuente de pruebas personales: https://support.google.com/googleplay/android-developer/answer/14151465?hl=es

## 3. Compilación en tu Mac o MacinCloud

Necesitas acceso legítimo a la Mac remota, Xcode seleccionado, Node 24, Git y tu cuenta de Apple para firmar. El portal de MacinCloud no comparte automáticamente la sesión remota con Codex.

En una terminal de la Mac, usa el repositorio `kevinosmerm-byte/immigration-ai`, rama `design/citizenship-visual`. Si ya existe, revisa el estado de Git y guarda los cambios locales antes de actualizar. En una copia limpia:

```sh
git clone --branch design/citizenship-visual https://github.com/kevinosmerm-byte/immigration-ai.git
cd immigration-ai
npm ci
npm run native:sync:ios
npm run native:build:ios
```

El ZIP creado en `artifacts/native/Immigra-ios-simulator.zip` permite probar en simulador, sin firmar para la tienda. Para firmar, abre el proyecto correcto:

```sh
open modules/citizenship/ios/App/App.xcodeproj
```

Selecciona App → Signing & Capabilities → tu Team. Conserva el Bundle ID. Prueba en dispositivo y usa Archive para TestFlight; no inventes un Team ID ni compartas certificados o claves. Añade `us.citizenshipai.app://auth-callback` a las redirecciones autorizadas de Supabase y prueba el regreso del enlace de acceso en el dispositivo.

Para Android, con Java 21 y SDK Platform 36/Build Tools 36.0.0:

```sh
npm run native:sync:android
npm run native:build:android
```

La salida es `artifacts/native/Immigra-android-debug.apk`. En Android Studio abre `modules/citizenship/android` y usa Generate Signed App Bundle para el AAB cuando estén listas la clave y las pruebas.

## 4. Qué no significa una compilación correcta

No confirma aprobación, compras, precios, restauración, credenciales, redirecciones reales, contratos ni privacidad. No cambies `docs/launch-readiness.json` a verificado sin evidencia de las pruebas externas. Stripe web, Google OAuth web y las compras nativas mantienen verificaciones independientes.
