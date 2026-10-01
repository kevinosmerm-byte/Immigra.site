import { civicsQuestionBank } from "./civicsQuestionBank.js";
import { resolveCivicsQuestion } from "./dynamicCivicsData.js";
import { evaluateCivicsAnswer } from "./civicsAnswerEvaluator.js";

export function avatarCivicsBank(profile) {
  return civicsQuestionBank.map(question => resolveCivicsQuestion(question, { profile }));
}

export function createAvatarPractice(profile, random = Math.random) {
  const questions = avatarCivicsBank(profile).filter(question => question.acceptedAnswers.length);
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }
  return questions.slice(0, 20);
}

export function evaluateAvatarResponse(question, answer) {
  return evaluateCivicsAnswer(question, answer);
}

export function avatarQuestionScript(question) {
  return question.question;
}

export function avatarReviewScript(question) {
  return `USCIS accepts the following answers. ${question.acceptedAnswers.join(". ")}`;
}
