import test from "node:test";
import assert from "node:assert/strict";
import { advanceConversation, boundedPracticeOutcome, CONVERSATION_TOPICS, conversationIntent, createConversationFlow, currentConversationPrompt, defaultPracticeLanguage, normalizeCoachFeedback } from "../src/conversationFlow.js";
import { createVoiceTurn } from "../src/voiceTurn.js";
import { selectVoiceIndex } from "../src/voiceProfiles.js";

for (const topic of Object.keys(CONVERSATION_TOPICS)) {
  for (const language of ["en", "es"]) {
    test(`${topic}/${language}: answers and skips finish without repeating a topic`, () => {
      let flow = createConversationFlow(topic, language);
      const prompts = new Set();
      for (let i = 0; i < 6; i++) {
        assert.equal(flow.complete, false);
        const prompt = currentConversationPrompt(flow);
        assert.ok(prompt);
        assert.ok(!prompts.has(prompt));
        prompts.add(prompt);
        flow = advanceConversation(flow, i % 2 === 0);
      }
      assert.equal(flow.complete, true);
      assert.equal(currentConversationPrompt(flow), "");
      assert.equal(flow.answered.length, 3);
      assert.equal(flow.skipped.length, 3);
      assert.equal(advanceConversation(flow), flow);
    });
  }
}

test("the selected language is preserved in every topic, including citizenship", () => {
  for (const topic of Object.keys(CONVERSATION_TOPICS)) {
    assert.equal(defaultPracticeLanguage(topic, "es"), "es");
    assert.equal(defaultPracticeLanguage(topic, "en"), "en");
    assert.match(currentConversationPrompt(createConversationFlow(topic, "es")), /^¿/);
    assert.doesNotMatch(currentConversationPrompt(createConversationFlow(topic, "en")), /^¿/);
  }
});

test("repeat, uncertainty and skip commands work in either language without mistaking answers for commands", () => {
  for (const text of ["Repeat the question.", "Repite la pregunta", "Say that again"]) assert.equal(conversationIntent(text), "repeat");
  for (const text of ["I don't know", "No sé", "No quiero responder", "Next question"]) assert.equal(conversationIntent(text), "skip");
  for (const text of ["No entiendo", "I don't understand"]) assert.equal(conversationIntent(text), "clarify");
  for (const text of ["I don't know the date but it was last year", "No, nunca", "I live in Madrid", "The officer said repeat the question"]) assert.equal(conversationIntent(text), "answer");
});

test("generated repeated questions cannot replace the application's agenda", () => {
  assert.deepEqual(normalizeCoachFeedback({ reply: "Good explanation. What is your name?", correction: "Try a shorter sentence.", encouragement: "Keep going!" }), { reply: "Good explanation.", correction: "Try a shorter sentence.", encouragement: "Keep going!" });
  assert.equal(normalizeCoachFeedback({ reply: "What is your name?" }, "es").reply, "Gracias. Podemos seguir practicando a tu ritmo.");
  assert.equal(normalizeCoachFeedback(null).correction, "");
  assert.equal(normalizeCoachFeedback({ reply: "Tell me your name." }).reply, "Thank you. We can keep practicing at your pace.");
  assert.equal(normalizeCoachFeedback({ reply: "Dime tu nombre." }, "es").reply, "Gracias. Podemos seguir practicando a tu ritmo.");
  assert.ok(normalizeCoachFeedback({ reply: "x".repeat(1000) }).reply.length <= 600);
});

test("guided feedback avoids generic repeated praise and gives an actionable fallback", () => {
  const context = { question: "When did you first meet?", answer: "I met her in 2021", history: [] };
  const result = normalizeCoachFeedback({ reply: "Good job!", correction: "", encouragement: "Keep going!", example: "" }, "en", context);
  assert.match(result.reply, /date|approximate|remember|fact/i);
  assert.equal(result.encouragement, "");
  assert.equal(result.example, "");
});
test("guided feedback preserves specific coaching and grounded example", () => {
  const context = { question: "Where did you meet?", answer: "I meet my spouse in Houston", history: [] };
  const result = normalizeCoachFeedback({ reply: "You mentioned Houston as the location.", correction: "Use the past tense: met.", encouragement: "", example: "I met my spouse in Houston." }, "en", context);
  assert.equal(result.reply, "You mentioned Houston as the location.");
  assert.equal(result.correction, "Use the past tense: met.");
  assert.equal(result.example, "I met my spouse in Houston.");
});
test("guided feedback avoids repeating previously given coaching", () => {
  const context = { question: "Where did you live?", answer: "I lived in Houston", history: [{ role: "assistant", content: "Add a concrete detail." }] };
  const result = normalizeCoachFeedback({ reply: "Add a concrete detail.", correction: "", encouragement: "" }, "en", context);
  assert.notEqual(result.reply, "Add a concrete detail.");
});
test("incomplete and incorrect civics answers have a bounded recovery path", () => {
  for (const status of ["incorrect", "incomplete"]) {
    assert.equal(boundedPracticeOutcome(status, 1), "retry");
    assert.equal(boundedPracticeOutcome(status, 2), "advance");
  }
  for (const status of ["correct", "review"]) assert.equal(boundedPracticeOutcome(status, 1), "advance");
});

test("initial silence does not become an answer; the microphone eventually returns control", () => {
  const turn = createVoiceTurn();
  for (let now = 0; now < 15000; now += 50) assert.equal(turn.sample(0, now), null);
  assert.equal(turn.sample(0, 15000), "no-speech");
});

test("a short pause does not interrupt speech; a long pause after speech ends the turn", () => {
  const turn = createVoiceTurn();
  for (let now = 0; now <= 500; now += 50) assert.equal(turn.sample(.1, now), null);
  for (let now = 550; now <= 2000; now += 50) assert.equal(turn.sample(0, now), null);
  assert.equal(turn.sample(.1, 2050), null);
  for (let now = 2100; now < 4850; now += 50) assert.equal(turn.sample(0, now), null);
  assert.equal(turn.sample(0, 4850), "silence");
});

test("a click or brief background sound does not qualify as a spoken response", () => {
  const turn = createVoiceTurn();
  turn.sample(0, 0);
  turn.sample(.1, 50);
  for (let now = 100; now < 15000; now += 50) assert.equal(turn.sample(0, now), null);
  assert.equal(turn.sample(0, 15000), "no-speech");
});

test("Spanish speech chooses Spanish voices for Sarah and Kevin, never an English fallback", () => {
  const voices = [
    { name: "Samantha", lang: "en-US" },
    { name: "Spanish voice A", lang: "es-MX" },
    { name: "Spanish voice B", lang: "es-ES" },
  ];
  assert.equal(selectVoiceIndex(voices, "female", "es-US"), 1);
  assert.equal(selectVoiceIndex(voices, "male", "es-US"), 2);
  assert.equal(selectVoiceIndex([voices[0]], "female", "es-US"), undefined);
  assert.equal(selectVoiceIndex(voices, "female"), 0);
});
