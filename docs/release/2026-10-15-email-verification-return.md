### 🧠 Advanced AI Brain Diagnostic Ledger

* **Target File / Component:** `shared/authentication/callback.mjs`, `shared/navigation/routes.mjs`, `modules/citizenship/src/Account.jsx`, `src/main.jsx`.
* **Deep User Experience Impact (Pros & Cons):**
  * *Pros:* Se conserva la validación del proveedor, el intercambio a cookie segura y el plan de compra elegido.
  * *Friction Points:* El fragmento de un enlace de acceso podía interpretarse como una ruta desconocida. La carga decía solamente que recuperaba sesión y podía esperar una consulta secundaria de la prueba gratuita aun después de verificar una cuenta.
* **Root-Cause Architectural Failure:** El enrutador extraía cualquier fragmento como nombre de módulo. Restaurar una sesión solamente enviaba a Cuenta si el fragmento estaba vacío, lo cual no cubría todos los retornos de autenticación. La condición de carga dependía incondicionalmente de restaurar la sesión de prueba por correo.
* **Production-Grade Implementation:** Se detectan los marcadores de retorno de sesión, código y error sin consumirlos antes que el SDK. El enrutador resuelve esos retornos a Cuenta. Durante la validación aparece «Verificando tu correo…» / «Verifying your email…». Tras resolver la autenticación se navega a Cuenta; un retorno sin sesión presenta el aviso de enlace inválido. El intercambio web conserva la validación del servidor y ahora tiene un límite de espera de diez segundos. Una sesión verificada ya no espera la consulta opcional de prueba gratuita. La selección de plan y parámetros de compra se conservan.

Clasificación implementada, sin almacenar credenciales ni interpretar los marcadores como prueba de identidad:

```js
export function authCallbackKind({hash='',search=''}={}) {
  const fragment = new URLSearchParams(hash.startsWith('#/') ? '' : hash.replace(/^#/, ''));
  const query = new URLSearchParams(search);
  if (fragment.has('error') || fragment.has('error_code') || query.has('error') || query.has('error_code')) return 'error';
  if (fragment.has('access_token') || fragment.has('refresh_token')) return 'session';
  if (query.has('code')) return 'code';
  return null;
}
```

Verificación: 198 pruebas raíz y 303 de Ciudadanía; compilaciones, lint y verificadores estáticos de móvil/iOS/tienda. Cuatro pruebas de regresión cubren reconocimiento de enlaces, errores, rutas normales y conservación del plan. Navegador con SDK real y respuestas controladas: retorno por fragmento en español e inglés, validación demorada, ausencia de «Página no encontrada» durante todos los cambios DOM observados, llegada a Cuenta, recarga, enlace vencido y continuación del plan anual con una sola solicitud a Checkout. La respuesta secundaria de prueba por correo se mantiene pendiente hasta que la cuenta ya está abierta para verificar que no bloquea. Los códigos PKCE se verifican aquí a nivel de enrutamiento; no se afirma haber validado un intercambio PKCE real entre dispositivos.

No se enviaron correos ni se crearon pagos reales. Las demoras de Supabase, red o un arranque del servidor pueden seguir existiendo; se evita el error visual y la espera secundaria innecesaria sin prometer latencia fija. Las advertencias previas de lint y tamaño de chunks permanecen.
