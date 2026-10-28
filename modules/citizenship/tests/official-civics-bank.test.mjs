import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import official from "../src/data/uscis2025Civics.json" with { type: "json" };
import { civicsQuestionBank, getCivicsQuestion } from "../src/civicsQuestionBank.js";
import { evaluateCivicsAnswer } from "../src/civicsAnswerEvaluator.js";

test("the complete official source retains all questions and 410 answer bullets", () => {
  assert.deepEqual(official.questions.map(q => q.id), Array.from({length:128},(_,i)=>i+1));
  assert.equal(official.questions.reduce((sum,q)=>sum+q.answers.length,0),410);
  assert.equal(official.questions.filter(q=>q.special6520).length,20);
  for (const record of official.questions) {
    const question = getCivicsQuestion(record.id);
    assert.equal(question.question,record.question);
    if (!question.isDynamic) assert.deepEqual(question.acceptedAnswers,record.answers);
    assert.ok(record.page >= 2 && record.page <= 19);
  }
});

test("five original states means five distinct states", () => {
  const question=getCivicsQuestion(81);
  assert.equal(question.minimumAnswersRequired,5);
  assert.equal(evaluateCivicsAnswer(question,"Virginia").status,"incomplete");
  assert.equal(evaluateCivicsAnswer(question,"Virginia Virginia Virginia Virginia Virginia").status,"incomplete");
  assert.equal(evaluateCivicsAnswer(question,"New York, New Jersey, Georgia, Delaware and Virginia").status,"correct");
});

test("official optional wording and number forms work without AI", () => {
  for (const [id,answer] of [[7,"27"],[22,"six years"],[24,"435"],[53,"9"],[78,"Jefferson"],[105,"Roosevelt"],[48,"Secretary of Defense and Secretary of State"],[120,"New Jersey"],[8,"It identifies inherent rights"],[109,"Nuclear war"]]) {
    assert.equal(evaluateCivicsAnswer(getCivicsQuestion(id),answer).status,"correct",`${id}: ${answer}`);
  }
  for (const q of civicsQuestionBank) assert.equal(evaluateCivicsAnswer(q,"uncertain response").needsSemanticReview,false);
});

test("the civics endpoint has no provider call or AI quota",async()=>{
  const server=await readFile(new URL('../server/server.js',import.meta.url),'utf8');
  const route=server.slice(server.indexOf('app.post("/evaluate",'),server.indexOf('app.post("/evaluate-writing",'));
  assert.match(route,/evaluateCivicsAnswer/);
  assert.doesNotMatch(route,/openai|requireAuthorizedAiAccess|recordProviderUsage|requireAiFeature/);
});
