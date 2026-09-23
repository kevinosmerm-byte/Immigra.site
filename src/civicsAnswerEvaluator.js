const STOP_WORDS = new Set(["a", "an", "and", "are", "for", "in", "is", "it", "of", "or", "the", "to", "us"]);

export function normalizeCivicsAnswer(value) {
  return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/\bu\s+s\s+s\s+r\b/g, "ussr").replace(/\bu\s+s\b/g, "us").replace(/\bj\s+d\b/g, "jd")
    .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function editDistance(left, right) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0]; row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const saved = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (left[i - 1] === right[j - 1] ? 0 : 1));
      previous = saved;
    }
  }
  return row[right.length];
}

function significantTokens(value) {
  return normalizeCivicsAnswer(value).split(" ").filter((token) => token && !STOP_WORDS.has(token));
}

function tokenMatches(spoken, expected) {
  if (spoken === expected) return true;
  if (expected.length < 5 || spoken.length < 4) return false;
  return editDistance(spoken, expected) <= (expected.length >= 9 ? 2 : 1);
}

function controlledMatch(answer, candidate) {
  const spoken = significantTokens(answer);
  const expected = significantTokens(candidate);
  if (!expected.length || !spoken.length) return false;
  const matched = expected.filter((token) => spoken.some((word) => tokenMatches(word, token))).length;
  // Require every key token for short facts; longer official phrases may omit grammar, never concepts.
  const required = expected.length <= 3 ? expected.length : Math.ceil(expected.length * 0.72);
  return matched >= required;
}

function answerMatches(answer, candidate) {
  const normalizedAnswer = normalizeCivicsAnswer(answer);
  const normalizedCandidate = normalizeCivicsAnswer(candidate);
  if (/\b(not|isnt|wasnt|never)\b/.test(normalizedAnswer)) return false;
  if (/\b(articles|declaration|state) of (the )?constitution\b/.test(normalizedAnswer) && normalizedCandidate.endsWith("constitution")) return false;
  return normalizedAnswer === normalizedCandidate
    || controlledMatch(answer, candidate);
}

export function evaluateCivicsAnswer(question, answer, dynamicAnswers = []) {
  if (!question || !normalizeCivicsAnswer(answer)) return { status: "incorrect", action: "retry", matchedAnswers: [], needsSemanticReview: false };
  const official = question.isDynamic ? dynamicAnswers : question.acceptedAnswers;
  if (question.isDynamic && !official.length) {
    return { status: "review", action: "review", matchedAnswers: [], needsSemanticReview: false, feedback: "Tu respuesta parece correcta, pero revisemos la respuesta oficial" };
  }
  const candidates = [...official, ...(question.aliases || [])];
  const matchedAnswers = official.filter((candidate) => answerMatches(answer, candidate));
  // Aliases may represent a complete official response, but do not inflate multi-answer counts.
  const aliasMatch = question.minimumAnswersRequired === 1 && (question.aliases || []).some((candidate) => answerMatches(answer, candidate));
  const correctCount = new Set(matchedAnswers.map(normalizeCivicsAnswer)).size;
  if (correctCount >= question.minimumAnswersRequired || aliasMatch) {
    return { status: "correct", action: "advance", matchedAnswers, needsSemanticReview: false, feedback: "Correct." };
  }
  if (correctCount > 0) {
    return { status: "incomplete", action: "retry", matchedAnswers, needsSemanticReview: false, feedback: `Please give ${question.minimumAnswersRequired} different answers.` };
  }
  const normalized = normalizeCivicsAnswer(answer);
  const knownContradiction = (question.questionId === 2 && /\b(articles|declaration|state)\b/.test(normalized))
    || (question.questionId === 9 && /\b(declaration)\b/.test(normalized) && /\b(war|constitution|rights)\b/.test(normalized));
  if (knownContradiction) {
    return { status: "incorrect", action: "repeat", matchedAnswers: [], needsSemanticReview: false, feedback: "That answer does not match an official answer." };
  }
  const closest = candidates.reduce((best, candidate) => {
    const left = normalizeCivicsAnswer(answer); const right = normalizeCivicsAnswer(candidate);
    const similarity = 1 - editDistance(left, right) / Math.max(left.length, right.length, 1);
    return similarity > best ? similarity : best;
  }, 0);
  return closest >= 0.58
    ? { status: "review", action: "semantic_review", matchedAnswers: [], needsSemanticReview: true, feedback: "Tu respuesta parece correcta, pero revisemos la respuesta oficial" }
    : { status: "incorrect", action: "repeat", matchedAnswers: [], needsSemanticReview: false, feedback: "That answer does not match an official answer." };
}
