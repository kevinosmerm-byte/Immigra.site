# AsiloAI

Repositorio independiente para el sitio web y la base compartida de las aplicaciones móviles y de escritorio. CitizenshipAI no es una dependencia y no se modifica.

## Ejecutar

Requisitos: Node.js 22 o posterior. PDF.js se instala desde npm para extracción local de texto.

```sh
npm ci
npm run build
npm start
```

Abrir http://127.0.0.1:4173. Para comprobar el núcleo: `npm test`.

## Estructura

- `apps/web/`: sitio de presentación y aplicación web actuales.
- `packages/core/`: lógica compartida de práctica, casos y cifrado.
- `packages/design/`: estilos compartidos; base visual para web y contenedores de apps.
- `apps/mobile/` y `apps/desktop/`: alcance documentado para aplicaciones futuras; no contienen binarios funcionales.
- `master-package/`: paquete original conservado.
- `13_codex_execution/coverage_report.md`: cobertura funcional y pendientes del producto. Sus referencias `dist/` corresponden a archivos generados.
- `dist/`: compilación local, excluida de Git. Publicar solo esta carpeta, nunca la raíz del repositorio.

La app actual es web adaptable. Compartir diseño no equivale a haber implementado aplicaciones nativas. Entrevistas con selección de Kevin o Sahara, banco ES/EN y aviso previo están implementados. La API de extracción de citas está activa en beta privada y validada con una prueba ficticia real. Acceso privado y cuotas: ver `docs/AI-CONFIGURATION.md`. PDF con texto se importa localmente por página; OCR sigue pendiente. Pagos, sincronización y empaquetado móvil/escritorio siguen pendientes. El motor de práctica usa reglas locales.

Los datos del caso permanecen en memoria salvo exportación cifrada. El análisis opcional enviará únicamente el fragmento previsualizado con consentimiento expreso. No subir expedientes, contraseñas, credenciales ni archivos `.asiloai` a Git.

Regenerar el catálogo con `python scripts/build-data.py` y luego `npm run build`.
