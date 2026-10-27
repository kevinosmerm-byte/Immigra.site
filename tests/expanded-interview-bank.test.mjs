import test from "node:test";
import assert from "node:assert/strict";
import { adjustmentPracticeQuestions } from "../src/data/adjustmentPracticeQuestions.js";
import { asylumPracticeQuestions } from "../src/data/asylumPracticeQuestions.js";
import { CONVERSATION_TOPICS, PRACTICE_SESSION_LENGTH, createConversationFlow, advanceConversation, questionIndicesForTrack, getPracticeQuestionMeta, currentConversationPrompt } from "../src/conversationFlow.js";
import { chooseInterviewQuestions, markInterviewQuestionReviewed, getReviewedInterviewQuestions } from "../src/interviewQuestionMemory.js";

test("expanded banks provide original bilingual prompts and stable unique identifiers", () => {
  assert.equal(asylumPracticeQuestions.length, 106);
  assert.equal(adjustmentPracticeQuestions.length, 127);
  for (const bank of [asylumPracticeQuestions, adjustmentPracticeQuestions]) {
    assert.equal(new Set(bank.map(q => q.id)).size, bank.length);
    for (const q of bank) {
      assert.ok(q.en.length > 15 && q.es.length > 15);
      assert.equal(q.provenance, "original-educational");
    }
  }
  assert.equal(CONVERSATION_TOPICS.asylum.prompts.length, 112);
  assert.equal(CONVERSATION_TOPICS.adjustment.prompts.length, 133);
  assert.equal(CONVERSATION_TOPICS.citizenship.prompts.length, 6);
});

test("case tracks never mix marriage, parent-child and court-only questions", () => {
  for (const [topic, tracks] of Object.entries({ asylum: ["all","affirmative","court"], adjustment: ["all","marriage","parent","child","other_family"] })) {
    for (const track of tracks) {
      const indices = questionIndicesForTrack(topic, track);
      assert.ok(indices.length > 10);
      for (const index of indices) assert.ok(["all",track].includes(getPracticeQuestionMeta(topic,index).track));
      assert.ok(indices.some(index => index >= 6));
    }
  }
  assert.equal(questionIndicesForTrack("citizenship").length, 6);
});

test("six-turn practice can draw from expanded pool without losing old IDs", () => {
  const indices = questionIndicesForTrack("asylum", "court").filter(index => index >= 6).slice(0, 6);
  let flow = createConversationFlow("asylum", "es", indices);
  for (const index of indices) {
    assert.equal(flow.index, index);
    assert.equal(currentConversationPrompt(flow), CONVERSATION_TOPICS.asylum.spanishPrompts[index]);
    flow = advanceConversation(flow);
  }
  assert.equal(flow.complete, true);
  assert.equal(PRACTICE_SESSION_LENGTH, 6);
  assert.equal(getPracticeQuestionMeta("asylum",0).id, "LEGACY-asylum-1");
});

test("seen memory accepts newly-added IDs without overwriting old IDs", () => {
  const store = new Map();
  const storage = {getItem: k => store.get(k) || null, setItem: (k,v) => store.set(k,v)};
  markInterviewQuestionReviewed("asylum",0,"test-20261027",storage);
  markInterviewQuestionReviewed("asylum",7,"test-20261027",storage);
  assert.deepEqual(getReviewedInterviewQuestions("asylum","test-20261027",storage),[0,7]);
  const items = [0,7,8];
  assert.deepEqual(chooseInterviewQuestions("asylum",items,x=>x,"test-20261027",storage,()=>0),[8]);
});
