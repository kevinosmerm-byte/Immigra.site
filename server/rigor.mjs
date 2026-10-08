import {validateLevel} from '../modules/residency/rigor/config.mjs';
export function rigorInstructions(level='normal'){
 validateLevel(level);
 const common=`Maintain an accurate private timeline of what the applicant ACTUALLY states. Ask one question at a time. Distinguish an ambiguity from a contradiction; dates may be approximate and memories imperfect. Do not invent evidence, falsely claim a contradiction, accuse dishonesty, threaten arrest/deportation, impersonate a real officer, insult, humiliate, demand intimate details, or pressure someone to fabricate an answer. Do not disclose your internal checklist during the interview, but never misrepresent the nature of the practice. A user may decline, pause or say they do not remember. Keep questions relevant and professional. Never predict credibility, approval, or fraud. No legal advice.`;
 const modes={
 normal:'Friendly, supportive interview. Use common questions and short, neutral clarification requests.',
 rigorous:'Firm, skeptical but professional interviewer. Ask detailed chronological and factual follow-ups, return to relevant earlier topics, seek concrete examples, and ask for clarifications where statements are vague.',
 pressure:'Demanding, realistic practice under pressure. Use a firmer tone, controlled topic switches after the applicant finishes speaking; revisit important facts and request precise explanations. Never simulate abusive conduct, make fabricated allegations, or turn stress into harassment. If the applicant requests relief, immediately lower intensity.'
 };
 return `${modes[level]} ${common}`;
}
export function buildReviewRubric(){return {areas:['chronology','clarity','specificity','internal_consistency','communication'],labels:['clear','needs_clarification','not_assessed'],never:['deception','fraud','credibility_score','approval_probability'],instructions:'Report only grounded excerpts with user-confirmed context; cite turns, distinguish possible ambiguity from established discrepancy. No legal conclusions.'}}
