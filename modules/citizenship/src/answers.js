// Backward-compatible projection. New code must consume civicsQuestionBank directly.
import { civicsQuestionBank } from "./civicsQuestionBank.js";

export const acceptedAnswers = Object.freeze(Object.fromEntries(
  civicsQuestionBank.map((item) => [item.questionId, item.acceptedAnswers])
));
