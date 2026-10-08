ASILOAI — versión local 0.3

Abrir dist/index.html en un navegador para explorar. Para probar cifrado y voz se recomienda localhost mediante Python: python -m http.server 4173 --bind 127.0.0.1 --directory dist
Luego abrir http://127.0.0.1:4173

Incluye sitio de presentación, práctica guiada por reglas ES/EN, 320 preguntas, 110 casos ficticios, fuentes TXT locales, afirmaciones con procedencia, revisión de fechas y copias cifradas. Los datos se pierden al recargar salvo que exportes.

No hay AI conectada, cuentas, pagos, OCR/PDF ni apps nativas. Consulta 13_codex_execution/coverage_report.md para cobertura completa y pendientes. CitizenshipAI no fue modificado.

Regenerar datos: python scripts/build-data.py
Pruebas: node --test --test-isolation=none tests/core.test.cjs
