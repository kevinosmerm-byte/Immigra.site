# Integración acumulativa del Bloque 2

## Preservado
El proyecto continúa en la misma carpeta de trabajo del Bloque 1. El ZIP anterior `ImmigrationAI_Bloque1_Aplicado.zip` permanece como entrega recuperable. Se hizo además una copia técnica previa en work/ImmigrationAI_antes_Bloque2.zip.
`src/modules.js` y `src/style.css` permanecen idénticos: tarjetas, descripciones, colores y estilos del Bloque 1. No se modificaron repositorios externos ni bancos cívicos.

## Agregado
Todo el ZIP del Bloque 2 se conservó bajo modules/residency. Sus datos y motor originales no se reescribieron. Se añadieron adapter.mjs, Residency.jsx, residency.css y pruebas de adaptación.
El adaptador valida consentimiento, escenarios ficticios, relaciones, preguntas en secuencia, límites de texto y referencias de sesión. Selecciona IDs una sola vez para conservar la misma pregunta al traducir. No permite que objetos exportados muten sesiones internas.
El componente permite los flujos local ficticio/personal, borrador, ampliación opcional, omisión, resumen, descarga y borrado.

## Cambios compartidos necesarios para conectar
- src/main.jsx: importar el adaptador visual y mostrarlo solo en residencia; conservar montada la práctica para no perderla al navegar.
- src/features.js: residency_enabled permite volver al portal anterior sin tocar módulos ajenos.
- package.json/package-lock.json: versión 0.2.0, nombre del proyecto acumulado y comando de pruebas conjunto; dependencias sin cambios.
- README.md y dist/: documentación acumulativa y nueva compilación.

Estos cambios de conexión se realizaron como parte de la petición explícita de sumar el Bloque 2 al anterior.

## Seguridad y alcance
Sin almacenamiento persistente, telemetría, endpoints de datos ni llamadas a IA. Los textos del usuario se renderizan como texto mediante React. Las pruebas de acceso cubren instancias locales del adaptador; no equivalen a RLS, cifrado o autorización de backend. Revisión de seguridad de producción pendiente. No se desplegó ni publicó el sitio.
