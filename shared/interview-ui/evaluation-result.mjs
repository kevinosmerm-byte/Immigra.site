// UI adapter only: original evaluators retain their own statuses and behavior.
export const evaluationStatuses = Object.freeze(['correct','adequate','incomplete','ambiguous','needs_clarification','incorrect_knowledge','uncertain','evaluation_unavailable']);
export function normalizeEvaluation(result, domain = 'personal') {
  const map = domain === 'civics'
    ? {correct:'correct',incorrect:'incorrect_knowledge',incomplete:'incomplete',review:'needs_clarification'}
    : {adequate:'adequate',incomplete:'incomplete',ambiguous:'ambiguous',clarification_needed:'needs_clarification',not_understood:'needs_clarification',uncertain:'uncertain'};
  return {...result, status:map[domain === 'civics' ? result?.status : result?.answer_status] || 'evaluation_unavailable'};
}
