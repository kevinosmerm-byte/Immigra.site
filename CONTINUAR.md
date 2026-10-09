# Continuar Immigration AI

Estado guardado: 8 de octubre de 2026.
Rama de trabajo: `design/citizenship-visual`.
Repositorio privado: https://github.com/kevinosmerm-byte/immigration-ai

## Abrir en otra computadora

Instala Git y Node.js 22 LTS. Inicia sesión en GitHub con acceso al repositorio.

```sh
git clone https://github.com/kevinosmerm-byte/immigration-ai.git
cd immigration-ai
git checkout design/citizenship-visual
npm ci
npm run build
npm start
```

Abre http://127.0.0.1:4388. Para editar con recarga automática: `npm run dev`.
Abre esta carpeta como proyecto en Codex y pídele leer CONTINUAR.md antes de continuar.

## Qué se conserva

Integración de Ciudadanía, Asilo y Residencia; diseño compartido Liquid Glass; navegación inferior plegable; entrevistas compartidas; iconos locales gratuitos con avisos en public/icons/licencias. Las versiones originales publicadas no se modificaron.

Ciudadanía reutiliza sus servicios de autenticación, perfiles, suscripción y ayuda. No se modificó la base de datos de producción. No hay despliegue automático autorizado.

## Configuración privada

Los archivos .env y las credenciales no se incluyen. Usa .env.example y modules/citizenship/.env.example como referencia. Sin configuración de los proveedores, las funciones remotas no están verificadas ni disponibles necesariamente. No copies claves en mensajes ni las subas al repositorio.

## Validación del último cambio

Compilación raíz correcta. 101 pruebas de plataforma y 231 de Ciudadanía, lint y verificaciones móviles/iOS de metadatos completadas. Inspección visual de iconos en navegador. Las verificaciones de metadatos no equivalen a pruebas en teléfonos físicos.

## Pendiente

Validar micrófono, voz y servicios con configuración real en entorno de pruebas; comprobar iPhone y Android físicos. El avatar D-ID conserva su integración externa y requiere revisión de controles. Mantener los motores de evaluación y las preguntas oficiales. El catálogo visual no significa que todas las secciones se hayan convertido en tarjetas; se sustituyeron los accesos principales existentes.

Priorizar la continuidad funcional. No publicar ni alterar producción sin autorización.
