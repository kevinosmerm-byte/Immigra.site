import { useEffect, useState } from "react";
import { useAccount } from "./accountContext.js";
import { useModalFocus } from "./useModalFocus.js";
import { apiUrl } from "./api.js";
import { stopAppSpeech } from "./speech.js";

export function AiResponseReport({ language, feature }) {
  const { session, aiFeedbackEnabled } = useAccount();
  const [responseText, setResponseText] = useState("");
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [reason, setReason] = useState("incorrect");
  const [status, setStatus] = useState("");
  const es = language === "es";
  const modal = useModalFocus(open, () => setOpen(false));
  useEffect(() => {
    const receive = event => { if (!open && event.detail.feature === feature) { setResponseText(event.detail.text); setStatus(""); setConsent(false); } };
    window.addEventListener("immigra:ai-feedback", receive);
    return () => window.removeEventListener("immigra:ai-feedback", receive);
  }, [open, feature]);
  if (!aiFeedbackEnabled || !responseText) return null;
  const submit = async event => {
    event.preventDefault();
    if (!consent || !responseText.trim() || status === "sending") return;
    setStatus("sending");
    try {
      const result = await fetch(apiUrl("/account/ai-feedback"), { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` }, body: JSON.stringify({ feature, consent, reason, responseText }) });
      if (!result.ok) throw new Error("unavailable");
      setStatus("sent");
    } catch { setStatus("error"); }
  };
  const button = "min-h-11 rounded-xl border border-white/15 px-4 py-3 text-slate-100! disabled:opacity-50";
  return <aside className="mx-auto my-4 max-w-xl px-4"><button type="button" className={button} onClick={() => { stopAppSpeech(); window.dispatchEvent(new Event("immigra:practice-pause")); setOpen(true); }}>{es ? "Reportar respuesta de IA" : "Report AI response"}</button>{open && <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"><section ref={modal} role="dialog" aria-modal="true" aria-labelledby="ai-report-title" className="max-h-[90dvh] w-full max-w-lg overflow-auto rounded-2xl border border-white/10 bg-[#030305] p-6 text-slate-100"><h2 id="ai-report-title" className="mb-4 text-xl text-slate-100!">{es ? "Ayúdanos a revisar esta respuesta" : "Help us review this response"}</h2><form onSubmit={submit}><label className="block" htmlFor="ai-report-reason">{es ? "Motivo" : "Reason"}</label><select id="ai-report-reason" value={reason} onChange={event => setReason(event.target.value)} className="mb-4 min-h-11 w-full rounded-xl border border-white/15 bg-slate-900 p-3 text-slate-100">{["incorrect", "offensive", "legal_advice", "other"].map((value, index) => <option key={value} value={value}>{(es ? ["Información incorrecta", "Contenido ofensivo o inseguro", "Parece asesoría legal", "Otro motivo"] : ["Incorrect information", "Offensive or unsafe content", "Appears to give legal advice", "Other"])[index]}</option>)}</select><label htmlFor="ai-report-text">{es ? "Contenido que deseas compartir" : "Content you want to share"}</label><textarea id="ai-report-text" value={responseText} onChange={event => setResponseText(event.target.value)} maxLength={6000} rows={5} className="mb-4 w-full rounded-xl border border-white/15 bg-slate-900 p-3 text-slate-100" /><label className="mb-4 flex gap-3"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="h-6 w-6 shrink-0" /><span>{es ? "Acepto enviar este contenido y motivo vinculados a mi cuenta para revisión. Puedo borrar datos sensibles antes de enviarlo." : "I agree to send this content and reason, linked to my account, for review. I can remove sensitive details before sending."}</span></label><p className="mb-4 text-sm text-slate-200!">{es ? "No es una consulta legal ni un canal de emergencias. No envíes documentos ni datos de tu caso." : "This is not a legal consultation or an emergency channel. Do not send documents or case details."}</p><div className="flex gap-3"><button type="submit" className={button} disabled={!consent || !responseText.trim() || ["sending", "sent"].includes(status)}>{es ? "Enviar reporte" : "Send report"}</button><button type="button" className={button} onClick={() => setOpen(false)}>{es ? "Cerrar" : "Close"}</button></div>{status && <p role="status" className="mt-3 text-slate-200!">{status === "sent" ? (es ? "Reporte recibido para revisión." : "Report received for review.") : status === "sending" ? (es ? "Enviando…" : "Sending…") : (es ? "No pudimos enviarlo. Inténtalo de nuevo." : "We could not send it. Please try again.")}</p>}</form></section></div>}</aside>;
}
