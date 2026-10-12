// Route clear requests for case-specific legal decisions to professional help.
// This is a conservative product boundary, not a legal classification engine.
export function asksForLegalDecision(value) {
  const text = String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return /\b(?:am i eligible|do i qualify|can i apply for|should i apply for|will my case be approved|will i get asylum|what (?:form|evidence|documents) (?:should|must|do) i (?:file|submit|provide)|should i (?:sign|file|submit|appeal|withdraw)|what is my (?:deadline|filing deadline)|how (?:do|can) i (?:win my case|avoid deportation))\b/.test(text)
    || /\b(?:soy elegible|califico para|puedo solicitar|debo solicitar|aprobaran mi caso|me van a aprobar|que formulario (?:debo|deberia|tengo que) (?:presentar|llenar)|que (?:pruebas|documentos) (?:debo|tengo que) (?:presentar|enviar)|debo (?:firmar|presentar|apelar|retirar)|cual es mi (?:plazo|fecha limite)|como (?:gano mi caso|evito la deportacion))\b/.test(text);
}
