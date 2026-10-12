// Educational preferences only; never infer a legal case, eligibility or dates.
export const STUDY_GOALS = ["citizenship", "asylum", "adjustment"];
export const PREPARATION_STEP_IDS = ["official-source", "own-information", "practice-communication", "professional-questions", "review-learning"];
export function studyGoal(value) { return STUDY_GOALS.includes(value) ? value : "citizenship"; }
export function safePreparationChecklists(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return Object.fromEntries(STUDY_GOALS.map(goal => [
    goal, Array.isArray(source[goal]) ? [...new Set(source[goal].slice(0, 50).filter(id => PREPARATION_STEP_IDS.includes(id)))] : [],
  ]));
}
