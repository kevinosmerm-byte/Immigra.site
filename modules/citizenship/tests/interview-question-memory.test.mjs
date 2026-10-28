import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { chooseInterviewQuestions, getReviewedInterviewQuestions, markInterviewQuestionReviewed, shuffleInterviewQuestions } from "../src/interviewQuestionMemory.js";
import { createConversationFlow, advanceConversation, currentConversationPrompt, CONVERSATION_TOPICS } from "../src/conversationFlow.js";
import { createN400InterviewState, selectNextN400Question } from "../src/n400InterviewEngine.js";
const memory = () => { const data = new Map(); return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }; };

test("all guided topics randomize only pending questions and preserve progress across accounts", () => {
  const storage = memory();
  for (const kind of Object.keys(CONVERSATION_TOPICS)) {
    const items = [0, 1, 2, 3, 4, 5];
    markInterviewQuestionReviewed(kind, 0, "a", storage);
    markInterviewQuestionReviewed(kind, 2, "a", storage);
    const order = chooseInterviewQuestions(kind, items, id => id, "a", storage, () => 0);
    assert.deepEqual(new Set(order), new Set([1, 3, 4, 5]));
    assert.notDeepEqual(order, [1, 3, 4, 5]);
    assert.deepEqual(getReviewedInterviewQuestions(kind, "b", storage), []);
    assert.deepEqual(getReviewedInterviewQuestions("civics", "a", storage), []);
  }
});

test("only fixed identifiers are retained; malformed storage and private text are rejected", () => {
  const storage = memory();
  markInterviewQuestionReviewed("asylum", "private answer", "a", storage);
  markInterviewQuestionReviewed("asylum", 1, "a", storage);
  assert.deepEqual([...storage.data.values()].map(JSON.parse), [{ seen: [1] }]);
  storage.data.set([...storage.data.keys()][0], JSON.stringify({ seen: [1, 1, 400, "private answer"], answer: "sensitive" }));
  assert.deepEqual(getReviewedInterviewQuestions("asylum", "a", storage), [1]);
  storage.data.clear();
  assert.deepEqual(getReviewedInterviewQuestions("asylum", "a", storage), []);
});

test("an exhausted finite bank starts another randomized cycle without duplicate entries", () => {
  const storage = memory();
  for (const id of [0, 1, 2, 3, 4, 5]) markInterviewQuestionReviewed("asylum", id, "a", storage);
  const order = chooseInterviewQuestions("asylum", [0, 1, 2, 3, 4, 5], id => id, "a", storage, () => 0);
  assert.equal(new Set(order).size, 6);
  assert.deepEqual(getReviewedInterviewQuestions("asylum", "a", storage), []);
});

test("random guided agendas use the original bilingual question indexes and finish exactly once", () => {
  for (const language of ["en", "es"]) {
    let flow = createConversationFlow("adjustment", language, [4, 2, 5]);
    for (const index of [4, 2, 5]) {
      assert.equal(flow.index, index);
      assert.equal(currentConversationPrompt(flow), CONVERSATION_TOPICS.adjustment[language === "es" ? "spanishPrompts" : "prompts"][index]);
      flow = advanceConversation(flow);
    }
    assert.equal(flow.complete, true);
    assert.deepEqual(flow.answered, [4, 2, 5]);
    assert.equal(advanceConversation(flow), flow);
  }
});

test("question shuffling leaves the original bank unchanged", () => {
  const original = [1, 2, 3, 4];
  assert.deepEqual(new Set(shuffleInterviewQuestions(original, () => 0)), new Set(original));
  assert.deepEqual(original, [1, 2, 3, 4]);
});

test("N-400 random ordering preserves blocks and conditions and excludes reviewed concepts without stored answers", () => {
  const bank = JSON.parse(fs.readFileSync(new URL("../src/data/n400InterviewBank.json", import.meta.url)));
  const state = createN400InterviewState(bank);
  const candidates = bank.questions.filter(q => q.block === state.currentBlock && q.subBlock === state.currentSubBlock);
  state.practiceQuestionOrder = [...candidates].reverse().map(q => q.id);
  let selection = selectNextN400Question(bank, state);
  assert.equal(selection.question.id, candidates.at(-1).id);
  state.askedConceptIDs = [selection.question.conceptId];
  selection = selectNextN400Question(bank, state);
  assert.notEqual(selection.question.conceptId, state.askedConceptIDs[0]);
  assert.deepEqual(state.applicantProfile.answers, {});
});

test("exhausting a subset preserves reviewed IDs in other tracks of the same bank", () => {
 const storage=memory();
 for(const id of [0,1,2,3]) markInterviewQuestionReviewed('asylum',id,'subset',storage);
 chooseInterviewQuestions('asylum',[0,1],id=>id,'subset',storage,()=>0);
 assert.deepEqual(getReviewedInterviewQuestions('asylum','subset',storage),[2,3]);
});
