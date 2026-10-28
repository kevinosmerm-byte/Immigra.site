# Integración acumulativa 1–30 · versión 0.30.0

El paquete recibido se integra sobre la versión 0.22.1, sin reemplazar motores, informes, consentimiento, voz ni pantalla de llamada. La estructura src del paquete se adapta a modules/residency para mantener aislamiento.

| Bloque | Resultado | Límite |
|---|---|---|
| 23 | src/integration/registry.mjs registra los tres motores y rechaza cruces | Registro consultable, no conexión a repos externos |
| 24 | intelligence/turnPlanner.mjs propone aclaraciones con IDs de evidencia, límite por dificultad y preguntas previas | Biblioteca sin conectar al proveedor; conserva lógica actual de entrevista |
| 25 | Se mantiene CallView y la experiencia ya implementada | No se sustituye por placeholders del paquete |
| 26 | documents/vault.mjs conserva hasta 20 registros en memoria con propietario, lista y borrado | Contrato; no UI nueva, autenticación, PDF ni almacenamiento cifrado |
| 27 | report/progress.mjs compara cantidades de actividad educativa de informes suministrados | Sin historial persistente ni puntuación de credibilidad |
| 28 | accounts/family.mjs exige consentimiento booleano explícito; compartir desactivado por defecto | Sin cuentas ni base de datos |
| 29 | admin/usage.mjs suma cantidades finitas de residencia y exige cinco permisos booleanos | No está conectado al gateway; sin cobros ni control durable de gasto |
| 30 | platform/releaseGate.mjs enumera validaciones pendientes | Autodeclaración de checklist, no auditoría ni autorización para publicar |

## Ajustes de integración
- El planificador conserva reviewClaims actual: solo compara años de respuestas vinculadas a la misma pregunta y fuente. No mezcla eventos distintos ni convierte ejemplos ficticios en hechos personales.
- La dificultad limita las aclaraciones; se rechazan contadores negativos o no enteros.
- Consentimiento y puertas de acceso requieren true explícito, no cadenas de texto.
- El registro rechaza nombres heredados del prototipo de objetos.
- El contenedor copia el documento entrante para evitar cambios indirectos desde el objeto original. El propietario suministrado es una condición local, no una identidad autenticada.
- Consumo ignora otras áreas y normaliza valores negativos/no finitos.

## Validación
90 pruebas aprobadas, incluidas las 77 anteriores y 13 nuevas de contratos, aislamiento, propiedad, capacidad, límites, evidencia y consentimiento. Compilación de producción verificada. No se cambió CSS ni disposición en esta integración; se mantienen las verificaciones visuales previas, realizadas con transporte simulado.

Sin llamadas de pago ni pruebas con proveedor o teléfonos físicos. Ciudadanía y asilo continúan sin motores externos integrados. No se activaron pagos, login, procesamiento de PDF ni despliegue público. La guía original se conserva en BLOQUES23_30_ORIGINAL.md como referencia, no como evidencia de funcionalidades conectadas.
