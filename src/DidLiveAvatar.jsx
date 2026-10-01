import { useEffect, useRef, useState } from "react";
import { apiJson } from "./api";
import { startAudioRecording, transcribeRecording } from "./audio";
import { createAvatarPractice, avatarQuestionScript, avatarReviewScript, evaluateAvatarResponse } from "./avatarCivics.js";
import { createDidCivicsSession } from "./didCivicsSession.js";
import sarahImage from "./assets/sarah.png";

const CONSENT_KEY = "citizenshipai.did-official-civics-consent.v1";
function consentSaved() { try { return localStorage.getItem(CONSENT_KEY) === "accepted"; } catch { return false; } }

export function DidLiveAvatar({ autoStart = false, civicProfile, onQuestionResult, onComplete, onExit, language = "en" }) {
  const es = language === "es";
  const t = (en, spanish) => es ? spanish : en;
  const [questions] = useState(() => createAvatarPractice(civicProfile));
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [state, setState] = useState("idle");
  const [busy, setBusy] = useState(false);
  const [talking, setTalking] = useState(false);
  const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState(() => autoStart && !consentSaved());
  const video = useRef(null);
  const transport = useRef(null);
  const recorder = useRef(null);
  const generation = useRef(0);
  const advancing = useRef(false);
  const question = questions[index];
  useEffect(() => { advancing.current = false; }, [index]);

  const disconnect = () => {
    generation.current++;
    recorder.current?.cancel(); recorder.current = null;
    const active = transport.current; transport.current = null;
    active?.disconnect().catch(() => {});
    if (video.current) video.current.srcObject = null;
  };
  useEffect(() => disconnect, []);

  const speak = async text => {
    const active = transport.current;
    if (!active) return;
    const run = generation.current;
    setBusy(true);
    try { await active.speak(text); }
    catch { if (run === generation.current) setMessage(t("Video playback failed. Continue with the text or reconnect.", "No se pudo reproducir el video. Puedes seguir con el texto o reconectar.")); }
    finally { if (run === generation.current) setBusy(false); }
  };

  const connect = async () => {
    disconnect();
    const run = generation.current;
    setNotice(false); setState("connecting"); setMessage(""); setTalking(false); setBusy(false); setRecording(false);
    try {
      const [credentials, sdk] = await Promise.all([apiJson("/avatar/session", { method: "POST" }), import("@d-id/client-sdk")]);
      if (run !== generation.current) return;
      if (!credentials.agentId || !credentials.clientKey) throw new Error("Missing session credentials");
      const session = await createDidCivicsSession(sdk, credentials, {
        onSrcObjectReady(stream) {
          if (run !== generation.current || !video.current) return;
          video.current.srcObject = stream;
          video.current.play().catch(() => { if (run === generation.current) setMessage(t("Press play on the video to enable audio.", "Pulsa reproducir en el video para activar el audio.")); });
        },
        onVideoStateChange(value) { if (run === generation.current) setTalking(value === "START"); },
        onAgentActivityStateChange(value) { if (run === generation.current) setTalking(value === "TALKING"); },
        onConnectionStateChange(value) {
          if (run === generation.current && ["fail", "closed", "disconnected"].includes(value)) {
            setState("error"); setBusy(false); setTalking(false);
            setMessage(t("Video disconnected. Your question is still available.", "Se desconectó el video. Tu pregunta sigue disponible."));
          }
        },
        onError() { if (run === generation.current) setMessage(t("Video is unavailable. You can reconnect.", "El video no está disponible. Puedes reconectar.")); },
      });
      if (run !== generation.current) { await session.disconnect(); return; }
      transport.current = session;
      await session.connect();
      if (run !== generation.current) return;
      setState("active");
      await speak(avatarQuestionScript(question));
    } catch {
      if (run !== generation.current) return;
      disconnect(); setState("error"); setBusy(false);
      setMessage(t("The avatar could not connect in official-question mode. Continue here with text or return to the classic interview.", "No se pudo conectar el avatar al modo de preguntas oficiales. Puedes seguir con texto o volver a la entrevista clásica."));
    }
  };
  useEffect(() => {
    if (!autoStart || !consentSaved()) return;
    const timer = setTimeout(connect, 0);
    return () => clearTimeout(timer);
  }, [autoStart]);

  const submit = () => {
    if (!answer.trim() || result || busy || recording || talking) return;
    const evaluation = evaluateAvatarResponse(question, answer);
    setResult(evaluation);
    const feedback = evaluation.status === "correct" ? "Correct." : evaluation.status === "incomplete" ? `Please give ${question.minimumAnswersRequired} different answers.` : "Let's review the official USCIS answers.";
    if (state === "active") void speak(feedback);
  };
  const toggleRecording = async () => {
    if (recorder.current) {
      const active = recorder.current; recorder.current = null;
      setRecording(false); setBusy(true);
      const run = generation.current;
      try {
        const transcript = await transcribeRecording(await active.stop());
        if (run === generation.current) setAnswer(transcript);
      } catch { if (run === generation.current) setMessage(t("Transcription failed. Type your answer.", "No se pudo transcribir. Escribe tu respuesta.")); }
      finally { if (run === generation.current) setBusy(false); }
    } else {
      const run = generation.current;
      setBusy(true);
      try {
        const active = await startAudioRecording();
        if (run !== generation.current) { active.cancel(); return; }
        recorder.current = active; setRecording(true);
      } catch { if (run === generation.current) setMessage(t("Microphone unavailable. You can type instead.", "No se pudo abrir el micrófono. Puedes escribir.")); }
      finally { if (run === generation.current) setBusy(false); }
    }
  };
  const next = () => {
    if (!result || busy || talking || advancing.current) return;
    advancing.current = true;
    const correct = result.status === "correct";
    const nextScore = score + (correct ? 1 : 0);
    if (result.status !== "review") onQuestionResult?.(question.questionId, correct);
    setScore(nextScore); setAnswer(""); setResult(null);
    if (index + 1 === questions.length) {
      disconnect(); setState("complete");
      onComplete?.({ score: Math.round(nextScore / questions.length * 100), outcome: "completed" });
    } else {
      setIndex(index + 1);
      if (state === "active") void speak(avatarQuestionScript(questions[index + 1]));
    }

  };

  return <section className="did-live-avatar official-avatar" aria-label={t("Civics interview with Sarah", "Entrevista cívica con Sarah")}>
    <div className="official-avatar-heading"><span>USCIS · 2025</span><h1>{t("Practice with Sarah", "Practica con Sarah")}</h1><p>{t("Questions and answers from the official 128-question bank.", "Preguntas y respuestas del banco oficial de 128 preguntas.")}</p></div>
    {notice && <div className="did-live-avatar-notice" role="dialog" aria-modal="true" aria-label={t("Before connecting", "Antes de conectar")}>
      <strong>{t("Before connecting", "Antes de conectar")}</strong>
      <p>{t("D-ID provides Sarah’s video and voice. If you use the microphone, audio is sent to the app’s transcription service. You can type instead. Civics answers are evaluated on your device.", "D-ID reproduce el video y la voz de Sarah. Si usas el micrófono, el audio se envía al servicio de transcripción de la app. Puedes escribir tu respuesta. La evaluación cívica se realiza en tu dispositivo.")}</p>
      <button onClick={() => { setNotice(false); setState("text"); }}>{t("Continue with text", "Continuar con texto")}</button>
      <button onClick={() => { try { localStorage.setItem(CONSENT_KEY,"accepted"); } catch { /* session only */ } void connect(); }}>{t("I understand, connect", "Entendido, conectar")}</button>
    </div>}
    {state === "complete" ? <div className="official-avatar-question"><h2>{t("Practice complete", "Práctica completada")}</h2><p>{score} / {questions.length} {t("correct", "correctas")}</p><button onClick={onExit}>{t("Back", "Volver")}</button></div> : <>
      <div className={`did-live-stage ${state}`}>
        <video ref={video} autoPlay playsInline controls poster={sarahImage} aria-label="Sarah" />
        {state === "connecting" && <span className="official-avatar-connecting">{t("Connecting…", "Conectando…")}</span>}
      </div>
      <div className="official-avatar-question">
        <span>{index + 1} / {questions.length} · #{question.questionId}</span>
        <h2>{question.question}</h2>{es && <p lang="es">{question.questionSpanish}</p>}
        <label htmlFor="avatar-answer">{t("Your answer", "Tu respuesta")}</label>
        <textarea id="avatar-answer" value={answer} onChange={event => setAnswer(event.target.value)} disabled={!!result || busy || recording} maxLength={1000} />
        {!result && <div className="official-avatar-actions"><button disabled={busy || talking || notice} onClick={toggleRecording}>{recording ? t("Finish recording", "Terminar grabación") : t("Use microphone", "Usar micrófono")}</button><button disabled={!answer.trim() || busy || recording || talking || notice} onClick={submit}>{t("Check answer", "Comprobar")}</button></div>}
        {result && <div role="status"><strong>{result.status === "correct" ? t("Correct", "Correcto") : t("Review the official answers", "Repasa las respuestas oficiales")}</strong>
          {result.status !== "correct" && <ul>{question.acceptedAnswers.map(value => <li key={value}>{value}</li>)}</ul>}
          <div className="official-avatar-actions">
            {result.status !== "correct" && <button disabled={busy || talking} onClick={() => setResult(null)}>{t("Try again", "Intentar otra vez")}</button>}
            <button disabled={busy || talking} onClick={next}>{t("Next", "Siguiente")}</button>
          </div>
        </div>}
        {state === "active" && <div className="official-avatar-actions"><button disabled={busy || talking || recording} onClick={() => void speak(avatarQuestionScript(question))}>{t("Repeat question", "Repetir pregunta")}</button>{result && <button disabled={busy || talking} onClick={() => void speak(avatarReviewScript(question))}>{t("Hear answers", "Escuchar respuestas")}</button>}</div>}
      </div>
      <div className="official-avatar-actions">{state !== "connecting" && state !== "active" && <button onClick={() => consentSaved() ? void connect() : setNotice(true)}>{t("Connect video", "Conectar video")}</button>}{["active", "connecting"].includes(state) && <button onClick={() => { disconnect(); setState("text"); setBusy(false); setTalking(false); setRecording(false); }}>{t("Continue without video", "Continuar sin video")}</button>}</div>
    </>}
    {message && <p role="status">{message}</p>}
  </section>;
}
