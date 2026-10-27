import { useEffect, useRef, useState } from "react";
import { apiJson } from "./api.js";
import { speakAppText, stopAppSpeech } from "./speech.js";
import { useVoiceResponse } from "./useVoiceResponse.js";
import { useContinuousVoice } from "./useContinuousVoice.js";
import { advanceConversation, CONVERSATION_TOPICS, conversationCorrection, conversationIntent, createConversationFlow, currentConversationPrompt, defaultPracticeLanguage, normalizeCoachFeedback, PRACTICE_SESSION_LENGTH, PRACTICE_TRACKS, questionIndicesForTrack } from "./conversationFlow.js";
import sarahImage from "./assets/sarah.png";
import "./ConversationPractice.css";
import { chooseInterviewQuestions, markInterviewQuestionReviewed } from "./interviewQuestionMemory.js";
import { ConversationPresentation, OptionalTypedAnswer } from "./InterviewPresentation.jsx";
import { EducationNotice } from "./EducationNotice.jsx";
import { studyGoal } from "../shared/studyPreparation.js";

export function ConversationPractice({ language = "en", initialTopic = "citizenship", userKey = "guest", soundEnabled = true, onBack, onPractice, onComplete }) {
  const es = language === "es";
  const t = (en, spanish) => es ? spanish : en;
  const [practiceTrack, setPracticeTrack] = useState("all");
  const newFlow = (topic, selectedLanguage, track = "all") => createConversationFlow(topic, selectedLanguage, chooseInterviewQuestions(topic, questionIndicesForTrack(topic, track), index => index, userKey).slice(0, PRACTICE_SESSION_LENGTH));
  const [flow, setFlow] = useState(() => newFlow(studyGoal(initialTopic), language));
  const [started, setStarted] = useState(false);
  const [interviewer, setInterviewer] = useState("sarah");
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState("");
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [autoFinish, setAutoFinish] = useState(true);
  const [history, setHistory] = useState([]);
  const [interruptions, setInterruptions] = useState(true);
  const [lastExchange, setLastExchange] = useState(null);
  const [revision, setRevision] = useState(null);
  const active = useRef(false);
  const request = useRef(0);
  const inFlight = useRef(false);
  const speechRequest = useRef(0);
  const controller = useRef(null);
  const completionReported = useRef(false);
  const name = interviewer === "kevin" ? "Kevin" : "Sarah";
  const prompt = currentConversationPrompt(flow);
  const spoken = (en, spanish) => flow.language === "es" ? spanish : en;
  const stopSpeech = () => { speechRequest.current += 1; stopAppSpeech(); setSpeaking(false); };
  const interruptPending = () => {
    request.current += 1; controller.current?.abort(); inFlight.current = false;
    setThinking(false); stopSpeech();
  };
  const speak = async text => {
    const id = ++speechRequest.current;
    if (!soundEnabled || !active.current) return;
    setSpeaking(true);
    try { await speakAppText(text, { profile: interviewer === "kevin" ? "male" : "female", lang: flow.language === "es" ? "es-US" : "en-US" }); }
    finally { if (active.current && id === speechRequest.current) setSpeaking(false); }
  };
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      request.current += 1;
      speechRequest.current += 1;
      controller.current?.abort();
      stopAppSpeech();
    };
  }, []);

  const advance = (response, skipped = false, base = flow, resume = null) => {
    markInterviewQuestionReviewed(base.topic, base.index, userKey);
    const next = resume || advanceConversation(base, skipped);
    setRevision(null);
    continuous.discardTurn();
    setFlow(next);
    setDraft("");
    setFeedback(response);
    setError("");
    const nextPrompt = currentConversationPrompt(next);
    speak([response?.reply, response?.correction, response?.example, next.complete ? spoken("Thank you. This practice is complete. You can come back whenever you are ready.", "Gracias. Esta práctica ha terminado. Puedes volver cuando quieras.") : nextPrompt].filter(Boolean).join(" "));
    if (!skipped) onPractice?.({ module: "coach", outcome: "reply" });
    if (next.complete && !completionReported.current) {
      completionReported.current = true;
      onComplete?.({ score: null, outcome: "completed" });
    }
  };
  const submit = async value => {
    let message = String(value || "").trim().slice(0, 2000);
    if (!message || inFlight.current) return false;
    let base = flow, priorHistory = history, resume = revision?.resumeFlow || null;
    stopSpeech();
    voice.clearError();
    const intent = conversationIntent(message);
    if (intent === "pause") { continuous.pause(); voice.cancel(); return true; }
    if (intent === "correct") {
      const correction = conversationCorrection(message);
      if (!lastExchange) {
        speak(spoken("You can correct your answer to this question.", "Puedes corregir tu respuesta a esta pregunta."));
        return true;
      }
      base = lastExchange.flow; priorHistory = lastExchange.history;
      resume ||= flow;
      setRevision({ resumeFlow: resume });
      setFlow(base); setHistory(priorHistory); setFeedback(null); setError("");
      if (!correction.answer) {
        setDraft(lastExchange.answer);
        speak(spoken("Tell me your corrected answer. We will keep the same topic.", "Dime tu respuesta corregida. Mantendremos el mismo tema."));
        return true;
      }
      message = correction.answer;
    }
    if (base.complete) return false;
    if (intent === "repeat") { speak(prompt); return true; }
    if (intent === "clarify") {
      const reply = spoken("Take your time. A short answer or a fictional example is enough. You can also skip this topic.", "Tómate tu tiempo. Basta una respuesta breve o un ejemplo ficticio. También puedes omitir este tema.");
      setFeedback({ reply, correction: "" });
      speak(reply);
      return true;
    }
    if (intent === "skip") { advance({ reply: spoken("That's okay. Let's move on.", "Está bien. Sigamos."), correction: "" }, true, base, resume); return true; }
    const id = ++request.current;
    inFlight.current = true;
    setThinking(true);
    setError("");
    setDraft(message); // Preserve the transcript for correction/retry if the provider fails.
    const abort = new AbortController();
    controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), 35000);
    try {
      const result = await apiJson("/coach", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: priorHistory, interviewer, guidedPractice: { topic: base.topic, index: base.index, language: base.language } }),
        signal: abort.signal,
      });
      if (!active.current || id !== request.current) return false;
      const response = normalizeCoachFeedback(result, base.language, { question: currentConversationPrompt(base), answer: message, history: priorHistory });
      if (result.educationalReferral === true) {
        setFeedback(response);
        speak(response.reply);
        return true;
      }
      setLastExchange({ flow: base, history: priorHistory, answer: message });
      setHistory([...priorHistory, { role: "assistant", content: currentConversationPrompt(base) }, { role: "user", content: message }, { role: "assistant", content: response.reply }].slice(-18));
      advance(response, false, base, resume);
      return true;
    } catch {
      if (active.current && id === request.current) setError(t("We couldn't get feedback. Your answer is still below: edit it, try again, or move to the next topic.", "No pudimos obtener comentarios. Tu respuesta sigue abajo: corrígela, vuelve a intentar o pasa al siguiente tema."));
      return false;
    } finally {
      clearTimeout(timeout);
      if (active.current && id === request.current) { inFlight.current = false; setThinking(false); }
    }
  };
  const voice = useVoiceResponse({
    turnKey: `${started}:${flow.topic}:${flow.index}`,
    onTranscript: submit, beforeListen: stopSpeech, detectSilence: autoFinish,
    language: flow.language,
  });
  const continuous = useContinuousVoice({
    speaking, language: flow.language, interruptions,
    onInterrupt: interruptPending, onTranscript: submit,
    onDraft: transcript => { setDraft(transcript); setError(t("Your answer reached 45 seconds. Review the text below before sending it.", "Tu respuesta alcanzó 45 segundos. Revisa el texto abajo antes de enviarlo.")); },
  });
  const pauseContinuous = continuous.pause;
  useEffect(() => {
    if (flow.complete) pauseContinuous("complete", { interruptReply: false });
  }, [flow.complete, pauseContinuous]);
  const continuousBusy = ["requesting", "listening", "transcribing"].includes(continuous.phase);
  const busy = thinking || voice.isListening || voice.isTranscribing || continuousBusy;
  const voiceError = voice.error ? t("We couldn't hear your answer. No topic was advanced. Try the microphone again or type below.", "No pudimos escuchar tu respuesta. No avanzamos de tema. Prueba otra vez o escribe abajo.") : "";
  const continuousNotice = {
    unavailable: t("Continuous voice isn't available on this device or microphone permission was denied. Use Speak or type your answer.", "La voz continua no está disponible en este dispositivo o no se permitió el micrófono. Usa Hablar o escribe tu respuesta."),
    transcription: t("We couldn't transcribe that turn. Continuous voice is paused; retry or type without changing the topic.", "No pudimos transcribir ese turno. La voz continua está pausada; reintenta o escribe sin cambiar de tema."),
    empty: t("We didn't hear clear words. Continuous voice is paused. You can retry.", "No escuchamos palabras claras. La voz continua está pausada. Puedes reintentar."),
    idle: t("Microphone paused after a minute without speech.", "Micrófono pausado después de un minuto sin hablar."),
    "turn-budget": t("The ten voice turns for this connection are complete. You can continue by typing.", "Se completaron los diez turnos de voz de esta conexión. Puedes seguir escribiendo."),
    "session-limit": t("Microphone paused at the eight-minute session limit.", "Micrófono pausado al alcanzar ocho minutos de sesión."),
    background: t("Microphone paused when you left the page. Resume when ready.", "Micrófono pausado al salir de la página. Reanuda cuando quieras."),
    offline: t("Microphone paused because the connection was lost. Your topic is unchanged.", "Micrófono pausado porque se perdió la conexión. Tu tema sigue igual."),
    "device-ended": t("The microphone disconnected. Reconnect or type your answer.", "El micrófono se desconectó. Vuelve a conectar o escribe tu respuesta."),
    "audio-suspended": t("Your device paused the audio. Resume continuous voice or type your answer.", "Tu dispositivo pausó el audio. Reanuda la voz continua o escribe tu respuesta."),
  }[continuous.reason];
  const restart = () => {
    completionReported.current = false;
    continuous.pause(); voice.cancel(); stopSpeech();
    setStarted(false); setFlow(newFlow(flow.topic, flow.language, practiceTrack));
    setHistory([]); setLastExchange(null); setRevision(null); setFeedback(null); setDraft(""); setError("");
  };
  return <ConversationPresentation mode={flow.topic} language={language}><div className="practice-screen coach-screen coach-video-call-screen conversation-practice">
    <header className="practice-header">
      <button className="back-button" onClick={onBack}>← {t("Back", "Volver")}</button>
      <div className="practice-brand">CITIZENSHIP <span>AI</span></div>
    </header>
    <main className="coach-conversation-content coach-video-call-content">
      <h1>{t("Practice a conversation", "Practica una conversación")}</h1>
      <p className="conversation-intro">{t("Listen to one question at a time. You can speak, type, pause or skip. Educational practice only: we are not lawyers and do not give legal advice. Always seek authorized professional help for your case.", "Escucha una pregunta a la vez. Puedes hablar, escribir, pausar o saltar. Solo es práctica educativa: no somos abogados ni damos asesoría legal. Siempre busca ayuda profesional autorizada para tu caso.")}</p>
      <details className="conversation-choice-panel"><summary>{t("How practice works and privacy", "Cómo funciona la práctica y privacidad")}</summary>
      <p className="conversation-intro">{t("Practice expressing your own information. This is speaking practice, not an assessment of your case. You may skip any topic or use fictional examples.", "Practica cómo expresar tu propia información. Es práctica de conversación, no una evaluación de tu caso. Puedes omitir cualquier tema o usar ejemplos ficticios.")}</p>
      <p>{t("Reviewed question identifiers help avoid repeats on this device. Your answer text is not saved. After all available questions, another randomized review cycle begins.", "Los identificadores de preguntas repasadas ayudan a evitar repeticiones en este dispositivo. No se guarda el texto de tus respuestas. Al terminar todas las preguntas disponibles, comienza otro repaso en orden aleatorio.")}</p>
      <EducationNotice language={language} compact />
      </details>
      <details className="conversation-choice-panel"><summary>{flow.language === "es" ? "Español" : "English"} · {name} · {t("Change practice options", "Cambiar opciones de práctica")}</summary><div className="conversation-options">
        <label>{t("Topic", "Tema")}<select aria-label={t("Topic", "Tema")} value={flow.topic} disabled={started} onChange={event => (setPracticeTrack("all"), setFlow(newFlow(event.target.value, defaultPracticeLanguage(event.target.value, flow.language))))}>
          {Object.entries(CONVERSATION_TOPICS).map(([key, topic]) => <option key={key} value={key}>{topic.label[es ? 1 : 0]}</option>)}
        </select></label>
        {PRACTICE_TRACKS[flow.topic] && <label>{t("Interview type", "Tipo de entrevista")}<select aria-label={t("Interview type", "Tipo de entrevista")} value={practiceTrack} disabled={started} onChange={event => { setPracticeTrack(event.target.value); setFlow(newFlow(flow.topic, flow.language, event.target.value)); }}>
          {PRACTICE_TRACKS[flow.topic].map(track => <option key={track} value={track}>{({ all: t("General practice", "Práctica general"), affirmative: t("Affirmative asylum", "Asilo afirmativo"), court: t("Immigration court", "Corte de inmigración"), marriage: t("Marriage", "Matrimonio"), parent: t("Parent petition", "Petición de padre o madre"), child: t("Child petition", "Petición de hijo o hija"), other_family: t("Other family relationship", "Otro parentesco") })[track]}</option>)}
        </select></label>}
        <label>{t("Practice language", "Idioma de práctica")}<select aria-label={t("Practice language", "Idioma de práctica")} value={flow.language} disabled={started} onChange={event => setFlow(newFlow(flow.topic, event.target.value, practiceTrack))}>
          <option value="en">English</option><option value="es">Español</option>
        </select></label>
        <label>{t("Practice partner", "Con quién practicas")}<select aria-label={t("Practice partner", "Con quién practicas")} value={interviewer} disabled={busy} onChange={event => { stopSpeech(); setInterviewer(event.target.value); }}>
          <option value="sarah">Sarah</option><option value="kevin">Kevin</option>
        </select></label>
      </div>
      </details>
      {flow.topic === "citizenship" && <p className="conversation-hint">{t("English helps you prepare for citizenship speaking practice. Choose the language you want to use today.", "El inglés ayuda a preparar la práctica oral de ciudadanía. Elige el idioma que quieras usar hoy.")}</p>}
      <div className="coach-conversation-card coach-video-call-card started">
        <div className={`coach-conversation-avatar ${speaking ? "speaking" : "listening"}`} role="img" aria-label={name}>
          <video src={`/${interviewer}-listening.mp4`} poster={interviewer === "sarah" ? sarahImage : undefined} className="coach-avatar-video coach-avatar-listening" autoPlay muted loop playsInline aria-hidden="true" />
          <video src={`/${interviewer}-speaking.mp4`} className="coach-avatar-video coach-avatar-speaking" autoPlay muted loop playsInline aria-hidden="true" />
          <div className="coach-video-call-identity"><div><strong>{name}</strong><small>{t("Conversation practice", "Práctica de conversación")}</small></div></div>
        </div>
        <p className="coach-conversation-status" role="status">{thinking ? t("Thinking about your response…", "Analizando tu respuesta…") : voice.isTranscribing || continuous.phase === "transcribing" ? t("Preparing your words…", "Preparando tus palabras…") : voice.isListening || continuous.phase === "listening" ? t("Listening. Take your time.", "Te escucho. Tómate tu tiempo.") : speaking ? t(`${name} is speaking`, `${name} está hablando`) : continuous.connected ? t("Microphone active. You can speak.", "Micrófono activo. Puedes hablar.") : t("Ready when you are", "Cuando tú quieras")}</p>
        {started && feedback && <div className="conversation-feedback" aria-live="polite"><p>{feedback.reply}</p>{feedback.correction && <p><strong>{t("Improve next time: ", "Qué mejorar: ")}</strong>{feedback.correction}</p>}{feedback.example && <p><strong>{t("Clearer wording using your facts: ", "Ejemplo con tus datos: ")}</strong>{feedback.example}</p>}</div>}
        <div className="coach-message"><div className="coach-message-label">{name.toUpperCase()}</div>
          <p className="coach-message-text" lang={flow.language}>{!started ? t("Choose a topic and start when you are ready.", "Elige un tema y comienza cuando quieras.") : flow.complete ? t("Practice complete. You can start another conversation.", "Práctica completada. Puedes iniciar otra conversación.") : prompt}</p>
        </div>
        <section className="coach-response-area">
          {!started ? <button className="primary-button" onClick={() => { setStarted(true); speak(spoken(`Hi, I'm ${name}. We will practice one topic at a time. You can skip anything. ${prompt}`, `Hola, soy ${name}. Practicaremos un tema a la vez. Puedes omitir cualquier pregunta. ${prompt}`)); }}>{t("Start conversation", "Iniciar conversación")}</button>
          : flow.complete ? <><button className="primary-button" onClick={restart}>{t("Start another conversation", "Iniciar otra conversación")}</button>{lastExchange && <button className="secondary-button" onClick={() => submit("Correct my last answer")}>{t("Correct my last answer", "Corregir mi última respuesta")}</button>}</>
          : <>
            <div className="conversation-continuous">
              <button className="primary-button" type="button" onClick={() => {
                if (continuous.connected || continuous.phase === "requesting") continuous.pause();
                else { voice.cancel(); voice.clearError(); continuous.start(); }
              }} disabled={voice.isListening || voice.isTranscribing || (continuous.phase === "transcribing" && !continuous.connected)} aria-pressed={continuous.connected}>
                {continuous.phase === "requesting" ? t("Cancel microphone request", "Cancelar solicitud de micrófono") : continuous.connected ? t("Pause continuous voice", "Pausar voz continua") : t("Enable continuous voice", "Activar voz continua")}
              </button>
              <p>{t("The microphone stays on between answers. Press Pause to turn it off.", "El micrófono sigue activo entre respuestas. Pulsa Pausar para apagarlo.")}</p>
              <details><summary>{t("Voice options", "Opciones de voz")}</summary>
              <label className="conversation-auto"><input type="checkbox" checked={interruptions} disabled={continuous.connected || continuousBusy} onChange={event => setInterruptions(event.target.checked)} />{t("Let me interrupt by speaking", "Permitir interrumpir con mi voz")}</label>
              <p className="conversation-hint">{t("Continuous voice keeps the microphone active and sends each answer after a pause. Pause to turn it off. If the speaker triggers interruptions, use headphones or turn off voice interruptions.", "La voz continua mantiene el micrófono activo y envía cada respuesta después de una pausa. Pausa para apagarlo. Si el altavoz provoca interrupciones, usa auriculares o desactiva las interrupciones por voz.")}</p>
              </details>
              {continuousNotice && <p role="status">{continuousNotice}</p>}
              {continuous.connected && <button className="secondary-button" type="button" onClick={() => { continuous.pause(); stopSpeech(); }}>{t("Type instead", "Responder por escrito")}</button>}
              {continuous.phase === "listening" && <button className="secondary-button" type="button" onClick={continuous.finishTurn}>{t("I'm finished", "Ya terminé")}</button>}
            </div>
            <details className="conversation-manual"><summary>{t("Record one answer manually", "Grabar una respuesta manualmente")}</summary>
            <label className="conversation-auto"><input type="checkbox" checked={autoFinish} disabled={busy} onChange={event => setAutoFinish(event.target.checked)} />{t("Finish my recording after a pause", "Terminar mi grabación después de una pausa")}</label>
            <p className="conversation-hint">{t("The microphone opens only when you press Speak. You have up to 45 seconds; brief pauses are allowed. In a noisy room, turn off automatic finish.", "El micrófono se abre solo al pulsar Hablar. Tienes hasta 45 segundos y puedes hacer pausas breves. Si hay ruido, desactiva el cierre automático.")}</p>
            <div className="conversation-actions">
              <button className="primary-button" onClick={voice.isListening ? voice.stopListening : voice.startListening} disabled={thinking || voice.isTranscribing || continuous.connected || continuousBusy}>{voice.isListening ? t("I'm finished", "Ya terminé") : t("Speak", "Hablar")}</button>
            </div></details>
            <div className="conversation-actions">
              <button className="secondary-button" onClick={stopSpeech} disabled={!speaking}>{t("Stop speaking", "Detener voz")}</button>
              <button className="secondary-button" onClick={() => speak(prompt)} disabled={busy}>{t("Repeat question", "Repetir pregunta")}</button>
              <button className="secondary-button" onClick={() => advance({ reply: spoken("We can move on.", "Podemos seguir."), correction: "" }, true, flow, revision?.resumeFlow)} disabled={busy}>{t("Next topic", "Siguiente tema")}</button>
              {lastExchange && <button className="secondary-button" type="button" onClick={() => submit("Correct my last answer")} disabled={busy}>{t("Correct my last answer", "Corregir mi última respuesta")}</button>}
            </div>
            {(error || voiceError) && <p className="conversation-error" role="alert">{error || voiceError}</p>}
            <OptionalTypedAnswer language={language}><form onSubmit={event => { event.preventDefault(); submit(draft); }}>
              <label htmlFor="conversation-answer">{t("Type or correct your answer", "Escribe o corrige tu respuesta")}</label>
              <textarea id="conversation-answer" value={draft} maxLength={2000} rows={3} disabled={busy} onFocus={() => { if (continuous.connected) continuous.pause(); stopSpeech(); }} onChange={event => setDraft(event.target.value)} />
              <button className="primary-button" disabled={busy || !draft.trim()}>{t("Send answer", "Enviar respuesta")}</button>
            </form></OptionalTypedAnswer>
            <p>{Math.min(flow.answered.length + flow.skipped.length + 1, flow.order?.length ?? 6)} / {flow.order?.length ?? 6} · {flow.language === "es" ? "Español" : "English"} · {t("One topic at a time", "Un tema a la vez")}</p>
          </>}
        </section>
      </div>
      <p className="conversation-hint">{t("Answers stay in this session. Voice transcription and AI feedback use the existing external services. Do not share private identifiers. These prompts are language exercises, not an official interview question bank.", "Las respuestas permanecen en esta sesión. La transcripción y los comentarios de IA usan los servicios externos existentes. No compartas identificadores privados. Son ejercicios de lenguaje, no un banco oficial de preguntas de entrevista.")}</p>
    </main>
  </div></ConversationPresentation>;
}
