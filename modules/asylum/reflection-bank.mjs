import {sequenceQuestions} from './question-sequence.mjs';
import proposal from './reflection-bank.json' with {type:'json'};
import countryQuestions from './country-study-questions.json' with {type:'json'};
// Split cards receive new IDs; no completion is inferred from parent cards.
export const studyBank = sequenceQuestions([...proposal.questions,...countryQuestions]);
export const studyInstructions = {es: proposal.instructions_es, en: proposal.instructions_en};
export const adaptiveDesign = proposal.adaptive_interview_appendix;
// Contextual appendix prompts must NOT become standalone turns. Their prose
// activation summaries are not executable rules. Explicit gates are implemented
// separately in adaptive-prerequisites.json and adaptive-session.mjs.
export function asylumInterviewQuestions(locale = 'en', country) {
  return studyBank.filter(q => !q.country || q.country === country).map(q => ({
    id: q.id, concept: q.id, block: q.topic || q.phase_id || q.category,
    subBlock: q.topic || q.phase_id || q.subcategory || q.category,
    canonicalPracticePrompt: locale === 'es' ? q.question_es : q.question_en,
    answerType: 'text', followUps: [], sourceRefs: q.source ? [q.source] : [],
  }));
}
