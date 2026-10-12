// The application owns the agenda. A language model supplies feedback, never
// the next question or an immigration decision. Session answers are not stored.
export const CONVERSATION_TOPICS = {
  citizenship: {
    label: ["Citizenship", "Ciudadanía"],
    spanishPrompts: [
      "¿Qué te gustaría explicar con más confianza en tu entrevista de ciudadanía?",
      "¿Cómo te presentarías en unas pocas frases?",
      "¿Cómo describirías tu rutina diaria?",
      "¿Cómo explicarías un viaje reciente, o dirías que no has viajado?",
      "¿Cómo pedirías que te expliquen una pregunta que no entiendes?",
      "¿Qué te gustaría practicar más después de esta conversación?",
    ],
    prompts: [
      "What would you like to feel more confident explaining in your citizenship interview?",
      "How would you introduce yourself in a few sentences?",
      "How would you describe your daily routine?",
      "How would you explain a recent trip, or say that you have not traveled?",
      "How would you ask the interviewer to explain a question you do not understand?",
      "What would you like to practice more after this conversation?",
    ],
  },
  asylum: {
    label: ["Asylum", "Asilo"],
    spanishPrompts: [
      "¿Qué parte de hablar en una entrevista te gustaría practicar? Puedes usar un ejemplo ficticio.",
      "¿Cómo te presentarías sin compartir datos que te identifiquen?",
      "¿Cómo contarías un evento sencillo en orden: qué pasó primero, después y al final? No necesitas describir eventos traumáticos.",
      "¿Cómo explicarías que no recuerdas una fecha exacta?",
      "¿Cómo pedirías un descanso o que te expliquen una pregunta?",
      "¿Qué te ayudaría a sentirte más cómodo al hablar la próxima vez?",
    ],
    prompts: [
      "Which part of speaking in an interview would you like to practice? You can use a fictional example.",
      "How would you introduce yourself without sharing identifying details?",
      "How would you put a simple event in order: what happened first, next, and last? You do not need to describe traumatic events.",
      "How would you explain that you do not remember an exact date?",
      "How would you ask for a break or for a question to be explained?",
      "What would help you feel more comfortable speaking next time?",
    ],
  },
  adjustment: {
    label: ["Adjustment of status", "Ajuste de estatus"],
    spanishPrompts: [
      "¿Qué te gustaría practicar cómo explicar en una entrevista de ajuste de estatus?",
      "¿Cómo te presentarías sin compartir identificadores privados?",
      "¿Cómo describirías tu trabajo, estudios o actividades diarias?",
      "¿Cómo explicarías una secuencia de eventos sin inventar fechas que no recuerdas?",
      "¿Cómo pedirías corregir algo que acabas de decir?",
      "¿Qué parte de hablar te gustaría practicar la próxima vez?",
    ],
    prompts: [
      "What would you like to practice explaining in an adjustment-of-status interview?",
      "How would you introduce yourself without sharing private identifiers?",
      "How would you describe your current work, studies, or daily activities?",
      "How would you explain a simple timeline without guessing dates you do not remember?",
      "How would you ask to correct something you just said?",
      "What part of speaking would you like to practice next time?",
    ],
  },
};

const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/[.!?]+$/g, "");

export function conversationCorrection(value) {
  const text = String(value || "").trim();
  const match = /^(?:quiero corregir(?: mi (?:respuesta|ultima respuesta))?|corrijo mi respuesta|i (?:want|need) to correct(?: my (?:answer|last answer))?|correct my (?:answer|last answer))\s*[:,.!-]?\s*/i.exec(text);
  return match ? { answer: text.slice(match[0].length).trim() } : null;
}

export function conversationIntent(value) {
  const text = normalize(value);
  if (/^(?:pause(?: (?:the conversation|listening))?|stop listening|pausa(?:r)?|pausar conversacion|deja de escuchar)$/.test(text)) return "pause";
  if (conversationCorrection(value)) return "correct";
  if (/^(?:(?:please|por favor) )?(?:repeat(?: (?:that|the question))?|say (?:that|it) again|repite(?: la pregunta)?|repita(?: la pregunta)?|otra vez)$/.test(text)) return "repeat";
  if (/^(?:skip(?: (?:this|the question))?|next(?: question)?|pass|i (?:do not|don't) know|i (?:cannot|can't) remember|no se|no recuerdo|no quiero responder|prefiero no responder|omitir|siguiente|pasar)$/.test(text)) return "skip";
  if (/^(?:i (?:do not|don't) understand|what does (?:that|it) mean|can you explain(?: (?:that|it))?|no entiendo|puedes explicar(?: la pregunta)?|explica(?: la pregunta)?)$/.test(text)) return "clarify";
  return "answer";
}

export function defaultPracticeLanguage(topic, language) {
  return language === "es" ? "es" : "en";
}

export function createConversationFlow(topic = "citizenship", language = "en") {
  return { topic: Object.hasOwn(CONVERSATION_TOPICS, topic) ? topic : "citizenship", language: language === "es" ? "es" : "en", index: 0, answered: [], skipped: [], complete: false };
}

export function currentConversationPrompt(flow) {
  const topic = CONVERSATION_TOPICS[flow.topic];
  return flow.complete ? "" : (flow.language === "es" ? topic.spanishPrompts : topic.prompts)[flow.index] || "";
}

export function advanceConversation(flow, skipped = false) {
  if (flow.complete) return flow;
  const index = flow.index + 1;
  return {
    ...flow, index, complete: index >= CONVERSATION_TOPICS[flow.topic].prompts.length,
    answered: skipped ? flow.answered : [...flow.answered, flow.index],
    skipped: skipped ? [...flow.skipped, flow.index] : flow.skipped,
  };
}

// Keep generated feedback separate from the agenda, even if a provider ignores
// the prompt and returns another question. Never retry a paid call to fix this.
export function normalizeCoachFeedback(result = {}, language = "en") {
  const asksForAnswer = sentence => /^(?:please\s+)?(?:tell me|describe|explain|name |can you|could you|would you|do you|have you|are you|what |where |when |how |why |dime|cuentame|describe|explica|puedes|podrias|que |cual |cuando |donde |como )/.test(normalize(sentence));
  const statement = value => typeof value === "string"
    ? value.split(/(?<=[.!?])\s+/).filter(sentence => !sentence.includes("?") && !sentence.includes("¿") && !asksForAnswer(sentence)).join(" ").trim().slice(0, 600)
    : "";
  return {
    reply: statement(result?.reply) || (language === "es" ? "Gracias. Podemos seguir practicando a tu ritmo." : "Thank you. We can keep practicing at your pace."),
    correction: statement(result?.correction),
    encouragement: statement(result?.encouragement),
  };
}

export function boundedPracticeOutcome(status, attempts) {
  return status === "correct" || status === "review" || attempts >= 2 ? "advance" : "retry";
}
