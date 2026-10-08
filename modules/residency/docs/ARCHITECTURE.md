# Bloque 2 — Motor independiente de residencia
Datos: 5 relaciones × (30 matrimonio o 25 familia) × 2 idiomas = 270 preguntas educativas; 30 escenarios ficticios.
API prevista:
POST /api/residency/sessions {relationshipType, locale, mode, scenarioId}
POST /api/residency/sessions/:id/turns {speaker,text,questionId}
GET /api/residency/questions?relationshipType=&locale=
GET /api/residency/sessions/:id/summary
DELETE /api/residency/sessions/:id
Las rutas requieren sesión autenticada, autorización de propietario, rate limits y engine_id residency en servidor.
NO implementar datos personales persistentes hasta contar con cifrado, RLS, consentimiento y borrado.
El motor es lógica local de referencia, no servidor desplegado ni agente IA conectado.
