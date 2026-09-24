import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { civicsQuestionBank, getCivicsQuestion } from "../src/civicsQuestionBank.js";
import {
  buildAnswerChoices,
  buildQuizQuestionModels,
  createQuizSession,
  evaluateQuizResponse,
  getQuizProgress,
  QUIZ_LEVELS,
  recordQuizAttempt,
  summarizeQuizProgress,
} from "../src/quizLearning.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

const questions = buildQuizQuestionModels(civicsQuestionBank);

test("the adaptive path enriches the existing 128-question source without replacing official answers", () => {
  assert.equal(questions.length, 128);
  assert.deepEqual(QUIZ_LEVELS.map((level) => level.id), ["vocabulary", "choose", "connect", "recall", "challenge"]);
  for (const question of questions) {
    assert.equal(question.preferredAnswer, question.acceptedAnswers[0] || "");
    assert.ok(Array.isArray(question.vocabulary));
  }
});

test("every official acceptable answer still passes through the shared deterministic evaluator", () => {
  for (const question of questions.filter((item) => !item.isDynamic)) {
    for (const answer of question.acceptedAnswers) {
      assert.notEqual(evaluateQuizResponse(question, answer).status, "incorrect", `Question ${question.questionId}: ${answer}`);
    }
  }
  assert.equal(evaluateQuizResponse(questions[0], "representative democracy").status, "correct");
});

test("preferredAnswer chooses the memorization recommendation but does not narrow valid answers", () => {
  const question = questions.find((item) => item.questionId === 1);
  assert.equal(question.preferredAnswer, getCivicsQuestion(1).acceptedAnswers[0]);
  assert.equal(evaluateQuizResponse(question, "representative democracy").status, "correct");
  const choices = buildAnswerChoices(question, questions);
  assert.equal(choices.length, 4);
  assert.ok(choices.includes(question.preferredAnswer));
});

test("progress persists independently for each authenticated user and question", () => {
  const storage = memoryStorage();
  const question = questions[0];
  const first = recordQuizAttempt({
    userKey: "user-a", question, mode: "recall", correct: true, score: 100,
    answeredAt: "2026-09-23T12:00:00.000Z", storage,
  });
  recordQuizAttempt({
    userKey: "user-b", question: questions[1], mode: "choose", correct: false, score: 0,
    answeredAt: "2026-09-23T12:00:00.000Z", storage,
  });

  assert.equal(first[question.questionId].recall, 100);
  assert.equal(getQuizProgress("user-a", storage)[question.questionId].attempts, 1);
  assert.equal(getQuizProgress("user-b", storage)[question.questionId], undefined);
  assert.equal(getQuizProgress("user-b", storage)[questions[1].questionId].attempts, 1);
});

test("sessions are adaptive and avoid unverified dynamic officeholder answers", () => {
  const storage = memoryStorage();
  const firstQuestion = questions.find((question) => !question.isDynamic);
  const progress = recordQuizAttempt({
    userKey: "adaptive", question: firstQuestion, mode: "challenge", correct: true, score: 100,
    answeredAt: "2026-09-23T12:00:00.000Z", storage,
  });
  const session = createQuizSession(questions, progress, "challenge", 128);
  assert.ok(session.every((question) => !question.isDynamic));
  assert.ok(session.indexOf(firstQuestion) > 0);
  assert.equal(summarizeQuizProgress(progress).attempted, 1);
});

test("the existing Quiz control routes to the mobile-first learning path", async () => {
  const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const component = await readFile(new URL("../src/QuizLearningPath.jsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../src/App.css", import.meta.url), "utf8");
  assert.match(app, /setScreen\("quiz"\)/);
  assert.match(app, /userKey=\{session\?\.user\?\.id \|\| "guest"\}/);
  assert.match(component, /evaluateQuizResponse\(question, value\)/);
  assert.match(component, /Recommended answer to memorize/);
  assert.match(styles, /\.quiz-path-screen/);
  assert.match(styles, /@media \(max-width: 390px\)/);
});
