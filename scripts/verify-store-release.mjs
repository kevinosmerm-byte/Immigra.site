import { readFile, access } from "node:fs/promises";
import { getNativeStoreConfiguration } from "../server/nativeStoreVerification.js";
const metadata = JSON.parse(await readFile("app-store/metadata.json", "utf8"));
const blockers = [];
for (const field of ["contactName", "contactPhone"]) if (!metadata.review[field] || /TO ENTER|MUST ENTER/i.test(metadata.review[field])) blockers.push(`Completar review.${field} con datos del propietario.`);
const config = getNativeStoreConfiguration();
if (!config.apple.enabled) blockers.push("Configurar productos/credenciales Apple y habilitar compras después de las pruebas.");
if (!config.google.enabled) blockers.push("Configurar producto/base plans/credenciales Google y habilitar compras después de las pruebas.");
for (const [label, path] of [["AAB firmado", process.env.ANDROID_RELEASE_AAB], ["Archivo iOS validado", process.env.IOS_RELEASE_ARCHIVE]]) {
  try { if (!path) throw new Error("missing"); await access(path); }
  catch { blockers.push(`${label}: no hay artefacto indicado para verificar en este entorno.`); }
}
let evidence = {};
if (process.env.STORE_REVIEW_EVIDENCE_FILE) {
  try { evidence = JSON.parse(await readFile(process.env.STORE_REVIEW_EVIDENCE_FILE, "utf8")); }
  catch { blockers.push("No se pudo leer la evidencia local de revisión."); }
}
for (const field of ["signingValidated", "privacyAndSdkReviewed", "ageRatingsCompleted", "screenshotsCurrent", "reviewAccountVerified", "immigraDomainVerified", "sandboxPurchaseLifecyclePassed", "aiFeedbackProcessReady"]) {
  if (evidence[field] !== true) blockers.push(`Confirmación pendiente en las consolas o dispositivos: ${field}.`);
}
console.log(JSON.stringify({ submissionReady: blockers.length === 0, userReportedPassed: ["microphone", "voice", "permissions"], blockers }, null, 2));
process.exitCode = blockers.length ? 1 : 0;
