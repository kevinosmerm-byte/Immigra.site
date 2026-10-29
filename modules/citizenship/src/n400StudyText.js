// Styling tokens preserve every source character, case, space and punctuation.
export function n400StudyTokens(text) {
  return String(text).split(/(\bEVER\b|\b(?:DO YOU|HAVE YOU|ARE YOU|DID YOU|WERE YOU|WILL YOU)\b)/gi).filter(Boolean).map(text => ({
    text,
    kind: /^ever$/i.test(text) ? 'ever' : /^(?:do you|have you|are you|did you|were you|will you)$/i.test(text) ? 'stem' : 'plain',
  }));
}
export function nextStudyIndex(index, direction, count) {
  return Math.max(0, Math.min(Math.max(0, count - 1), index + direction));
}
