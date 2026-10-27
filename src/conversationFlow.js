import { asylumPracticeQuestions } from "./data/asylumPracticeQuestions.js";
import { adjustmentPracticeQuestions } from "./data/adjustmentPracticeQuestions.js";

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

// Keep the six legacy prompts at their original indices to preserve v1 review memory.
// New prompts extend the bank; the default conversation length remains six turns.
const PRACTICE_COLLECTIONS = { asylum: asylumPracticeQuestions, adjustment: adjustmentPracticeQuestions };
for (const [topic, bank] of Object.entries(PRACTICE_COLLECTIONS)) {
  const config = CONVERSATION_TOPICS[topic];
  config.prompts.push(...bank.map(item => item.en));
  config.spanishPrompts.push(...bank.map(item => item.es));
}
export const PRACTICE_SESSION_LENGTH = 6;
export const PRACTICE_TRACKS = Object.freeze({
  asylum: ["all", "affirmative", "court"],
  adjustment: ["all", "marriage", "parent", "child", "other_family"],
});
export function getPracticeQuestionMeta(topic, index) {
  if (!Number.isInteger(index) || index < 0) return null;
  if (index < 6) return { id: `LEGACY-${topic}-${index + 1}`, track: "all", category: "communication", provenance: "original-educational" };
  return PRACTICE_COLLECTIONS[topic]?.[index - 6] || null;
}
export function questionIndicesForTrack(topic, track = "all") {
  const config = CONVERSATION_TOPICS[topic];
  if (!config) return [];
  const desired = PRACTICE_TRACKS[topic]?.includes(track) ? track : "all";
  return config.prompts.map((_, index) => index).filter(index => {
    const questionTrack = getPracticeQuestionMeta(topic, index)?.track || "all";
    return topic === "citizenship" || questionTrack === "all" || questionTrack === desired;
  });
}

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

export function createConversationFlow(topic = "citizenship", language = "en", promptOrder) {
  const safeTopic = Object.hasOwn(CONVERSATION_TOPICS, topic) ? topic : "citizenship";
  const order = Array.isArray(promptOrder) ? [...new Set(promptOrder.filter(index => Number.isInteger(index) && index >= 0 && index < CONVERSATION_TOPICS[safeTopic].prompts.length))].slice(0, PRACTICE_SESSION_LENGTH) : null;
  return { topic: safeTopic, language: language === "es" ? "es" : "en", index: order?.[0] ?? 0, answered: [], skipped: [], complete: order?.length === 0, ...(order ? { order } : {}) };
}

export function currentConversationPrompt(flow) {
  const topic = CONVERSATION_TOPICS[flow.topic];
  return flow.complete ? "" : (flow.language === "es" ? topic.spanishPrompts : topic.prompts)[flow.index] || "";
}

export function advanceConversation(flow, skipped = false) {
  if (flow.complete) return flow;
  const position = flow.order ? flow.order.indexOf(flow.index) + 1 : flow.index + 1;
  const complete = position >= (flow.order?.length ?? PRACTICE_SESSION_LENGTH);
  const index = flow.order ? (flow.order[position] ?? flow.index) : position;
  return {
    ...flow, index, complete,
    answered: skipped ? flow.answered : [...flow.answered, flow.index],
    skipped: skipped ? [...flow.skipped, flow.index] : flow.skipped,
  };
}

// The application, not the model, owns the next interview question. Keep
// coaching observational, actionable, and distinct from earlier turns.
const GENERIC_FEEDBACK = /^(?:good job|great job|good answer|great answer|good explanation|well done|very good|excellent|keep going|thanks for sharing|thank you|you did well|nice work|buen trabajo|buena respuesta|muy bien|excelente|bien hecho|sigue así|sigue asi|gracias por compartir|gracias)[.!¡ ]*$/i;

function practiceImprovementFallback(question, answer, language) {
  const es = language === "es";
  const q = normalize(question);
  const words = String(answer || "").trim().split(/\s+/).filter(Boolean);
  if (words.length < 8) return es
    ? "Tu respuesta fue breve. Si recuerdas más, agrega un detalle concreto relacionado con la pregunta; no adivines."
    : "Your answer was brief. If you remember more, add one relevant detail without guessing.";
  if (/\b(when|date|year|month|time|cuando|fecha|ano|mes)\b/.test(q)) return es
    ? "Separa lo que recuerdas con certeza de cualquier fecha aproximada; no inventes una fecha exacta."
    : "Separate what you know for sure from any approximate date; do not invent an exact date.";
  if (/\b(why|reason|because|por que|motivo|razon)\b/.test(q)) return es
    ? "Explica primero lo que sabes directamente y después por qué llegaste a esa conclusión."
    : "Say what you know firsthand before explaining why you reached that conclusion.";
  if (/\b(where|location|place|donde|lugar|ubicacion)\b/.test(q)) return es
    ? "Da primero el lugar que recuerdas y luego un detalle de contexto, solo si lo sabes."
    : "Start with the location you remember, then add context only if you know it.";
  return es
    ? "Organiza tu respuesta en dos partes: el dato principal y un detalle que realmente recuerdes."
    : "Organize your answer into two parts: the main fact and one detail you actually remember.";
}

// Optional context is passed by the live guided interview; legacy un-guided
// callers retain the same three-field response contract.
export function normalizeCoachFeedback(result = {}, language = "en", context = {}) {
  const asksForAnswer = sentence => /^(?:please\s+)?(?:tell me|describe|explain|name |can you|could you|would you|do you|have you|are you|what |where |when |how |why |dime|cuentame|describe|explica|puedes|podrias|que |cual |cuando |donde |como )/.test(normalize(sentence));
  const statement = (value, length = 600) => typeof value === "string"
    ? value.split(/(?<=[.!?])\s+/).filter(sentence => !sentence.includes("?") && !sentence.includes("¿") && !asksForAnswer(sentence)).join(" ").trim().slice(0, length)
    : "";
  const hasContext = Boolean(context.question && context.answer);
  const previous = Array.isArray(context.history) ? context.history.filter(entry => entry?.role === "assistant").slice(-4).map(entry => normalize(entry.content)) : [];
  const overused = value => Boolean(hasContext && value && (GENERIC_FEEDBACK.test(value) || previous.some(entry => entry === normalize(value) || entry.startsWith(normalize(value) + " "))));
  const rawReply = statement(result?.reply, 420);
  const rawCorrection = statement(result?.correction, 420);
  const rawEncouragement = statement(result?.encouragement, 200);
  const reply = !rawReply || overused(rawReply) ? (hasContext
    ? practiceImprovementFallback(context.question, context.answer, language)
    : language === "es" ? "Gracias. Podemos seguir practicando a tu ritmo." : "Thank you. We can keep practicing at your pace.") : rawReply;
  const correction = overused(rawCorrection) || normalize(rawCorrection) === normalize(reply) ? "" : rawCorrection;
  const encouragement = overused(rawEncouragement) || normalize(rawEncouragement) === normalize(reply) ? "" : rawEncouragement;
  const cleaned = { reply, correction, encouragement };
  if (Object.hasOwn(result || {}, "example")) {
    const example = statement(result.example, 350);
    cleaned.example = overused(example) || normalize(example) === normalize(reply) || normalize(example) === normalize(context.answer) ? "" : example;
  }
  return cleaned;
}

export function boundedPracticeOutcome(status, attempts) {
  return status === "correct" || status === "review" || attempts >= 2 ? "advance" : "retry";
}
