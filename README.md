# Immigration AI · plataforma unificada de desarrollo 0.31.0

Una sola aplicación con los motores de CitizenshipAI, AsiloAI y ResidencyAI. Los proyectos originales no se modificaron. Esta entrega integra los módulos y las llamadas principales; aún NO cumple todos los criterios de producción de la instrucción maestra.

## Abrir
```sh
node start-all.mjs
```
Abre http://127.0.0.1:4388. El compilado incluido permite práctica local sin instalar dependencias. Los servicios de cuenta y de IA de pago permanecen desactivados por defecto.

## Desarrollo
```sh
npm ci
npm test
npm run build
```
El postinstall instala las dependencias de la copia de CitizenshipAI. Para regenerar vendor PDF/OCR de AsiloAI se requieren también sus propias dependencias. No copiar archivos .env de los originales.

## Estado y evidencia
Consulta [UNIFICACION.md](docs/UNIFICACION.md) para el inventario, arquitectura, pruebas y funciones pendientes. Cuenta y cuotas requieren un nuevo entorno de desarrollo; no ejecutar migraciones en las bases originales. No se realizaron pagos, despliegues ni llamadas a proveedores de IA.

Los motores, preguntas y evaluadores se conservan. Los documentos anteriores en docs describen las entregas históricas 1–30.
