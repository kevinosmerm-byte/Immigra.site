# Instrucción ejecutiva para Codex
Trabajar SOLO en modules/residency o paquete de motor de residencia. Nunca modificar citizenship ni asylum.
No cambiar banco oficial de 128 preguntas, AGENTS.md, evaluador cívico ni branding actual de CitizenshipAI.
Integrar con shell Bloque 1 a través de adaptador y feature flag residency_enabled. Toda modificación a componente compartido exige autorización.
No convertir escenarios ficticios en afirmaciones personales. No ofrecer asesoría legal.
Implementar flujo: selección relación -> idioma y modo ficticio/personal -> preguntas adaptativas -> resumen educativo.
Priorizar diseño accesible y neutral. Incluir pruebas de aislamiento, borrado, control de acceso y revisión de seguridad antes de despliegue.
La lógica de detección semántica IA está especificada pero NO implementada aquí; conectar después con controles de privacidad.
