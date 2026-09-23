const NEGATIONS = new Set(["not", "no", "never", "neither", "nor", "cannot", "cant", "dont", "doesnt", "didnt", "isnt", "wasnt", "wont", "without"]);

export function normalizeWritingText(value) {
  return String(value || "").normalize("NFKC")
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .toLowerCase().trim().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokens(value) {
  return normalizeWritingText(value).split(" ").filter(Boolean);
}

function distance(left, right) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = row[0]; row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const saved = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (left[i - 1] === right[j - 1] ? 0 : 1));
      diagonal = saved;
    }
  }
  return row[right.length];
}

function limitedTypo(spoken, expected) {
  if (spoken === expected) return true;
  if (/\d/.test(spoken + expected) || expected.length < 5 || spoken.length < 4) return false;
  // One insertion, deletion, substitution, or transposition; never broad phonetic matching.
  return distance(spoken, expected) <= 1;
}

function matchWords(expectedTokens, answerTokens) {
  const remaining = answerTokens.map((word, index) => ({ word, index, used: false }));
  const matches = expectedTokens.map((expected) => {
    const exact = remaining.find((item) => !item.used && item.word === expected);
    const found = exact || remaining.find((item) => !item.used && limitedTypo(item.word, expected));
    if (!found) return { expected, matched: false, typo: false };
    found.used = true;
    return { expected, matched: true, typo: found.word !== expected, actual: found.word };
  });
  return { matches, extras: remaining.filter((item) => !item.used).map((item) => item.word) };
}

function observationFeedback(expected, answer, typo) {
  if (typo) {
    const expectedDisplay = expected.match(/[A-Za-z0-9']+/g)?.find((word) => word.toLowerCase() === typo.expected) || typo.expected;
    return `¡Correcto! Hay un pequeño error de ortografía: ${expectedDisplay}.`;
  }
  const proper = expected.match(/\b[A-Z][A-Za-z']+\b/g)?.find((word) => answer.toLowerCase().includes(word.toLowerCase()) && !answer.includes(word));
  if (proper) return `¡Correcto! Recuerda comenzar ${proper} con mayúscula.`;
  if (/[.!?]$/.test(expected.trim()) && !/[.!?]$/.test(answer.trim())) return "Tu oración es correcta. El punto final es recomendable, pero no cambia el resultado.";
  return "¡Correcto! La oración comunica el significado esperado; revisa los detalles de escritura.";
}

export function evaluateWritingSentence(sentence, answer) {
  const expected = sentence?.english || "";
  const normalizedExpected = normalizeWritingText(expected);
  const normalizedAnswer = normalizeWritingText(answer);
  if (!normalizedExpected || !normalizedAnswer) {
    return { status: "needs_practice", resultLabel: "Necesita práctica", accuracy: "Needs Practice", score: 0, feedback: "Escribe la oración completa para continuar.", needsSemanticReview: false };
  }
  const expectedWords = tokens(expected);
  const answerWords = tokens(answer);
  const unexpectedNegation = answerWords.some((word) => NEGATIONS.has(word)) && !expectedWords.some((word) => NEGATIONS.has(word));
  if (unexpectedNegation) {
    return { status: "needs_practice", resultLabel: "Necesita práctica", accuracy: "Needs Practice", score: 40, feedback: "La negación cambia el significado de la oración. Inténtalo de nuevo.", needsSemanticReview: false };
  }
  if (String(answer).trim() === expected.trim()) {
    return { status: "correct", resultLabel: "Correcta", accuracy: "Excellent", score: 100, feedback: "¡Correcto!", needsSemanticReview: false };
  }
  if (normalizedAnswer === normalizedExpected) {
    return { status: "correct_with_observations", resultLabel: "Correcta con observaciones", accuracy: "Good", score: 90, feedback: observationFeedback(expected, String(answer), null), needsSemanticReview: false };
  }

  const comparison = matchWords(expectedWords, answerWords);
  const matched = comparison.matches.filter((item) => item.matched);
  const essential = new Set(sentence.essentialWords || []);
  const missingEssential = comparison.matches.filter((item) => essential.has(item.expected) && !item.matched);
  const coverage = matched.length / expectedWords.length;
  const unsafeExtra = comparison.extras.some((word) => NEGATIONS.has(word) || essential.has(word) || /\d/.test(word));
  if (!missingEssential.length && coverage >= 0.8 && !unsafeExtra && comparison.extras.length === 0) {
    const typo = comparison.matches.find((item) => item.typo);
    return { status: "correct_with_observations", resultLabel: "Correcta con observaciones", accuracy: "Good", score: typo ? 85 : 88, feedback: observationFeedback(expected, String(answer), typo), needsSemanticReview: false };
  }
  // A close response with all essential concepts can use semantic review; clear omissions never invoke AI.
  if (!missingEssential.length && coverage >= 0.65 && !unsafeExtra) {
    return { status: "ambiguous", resultLabel: "Revisión necesaria", accuracy: "Needs Review", score: null, feedback: "La oración parece cercana; revisaremos el significado.", needsSemanticReview: true };
  }
  return { status: "needs_practice", resultLabel: "Necesita práctica", accuracy: "Needs Practice", score: Math.round(coverage * 60), feedback: "Faltan palabras esenciales o cambió el significado. Inténtalo de nuevo.", needsSemanticReview: false };
}
