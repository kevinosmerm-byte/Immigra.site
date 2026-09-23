const ORIGINAL_SOURCE = Object.freeze({
  sourceName: "Citizenship AI",
  sourceUrl: "/docs/CIVICS_VISUAL_LIBRARY.md",
  license: "Original project artwork",
  attribution: "Citizenship AI",
});

const CONCEPTS = Object.freeze({
  constitution: { imagePath: "/assets/civics/constitution.svg", alt: "Illustrated parchment representing constitutional government and individual rights" },
  declaration: { imagePath: "/assets/civics/declaration.svg", alt: "Illustrated parchment and quill representing American founding documents" },
  congress: { imagePath: "/assets/civics/congress.svg", alt: "Illustration of a domed legislative building representing Congress" },
  presidency: { imagePath: "/assets/civics/presidency.svg", alt: "Neutral illustration of the White House representing the executive branch" },
  supremeCourt: { imagePath: "/assets/civics/supreme-court.svg", alt: "Illustration of a courthouse representing the federal judicial branch" },
  revolution: { imagePath: "/assets/civics/revolution.svg", alt: "Historical illustration representing American history, conflicts, and independence" },
  lincoln: { imagePath: "/assets/civics/lincoln.svg", alt: "Stylized educational portrait representing Abraham Lincoln and the Civil War era" },
  civilRights: { imagePath: "/assets/civics/civil-rights.svg", alt: "Illustration of a diverse gathering representing voting and civil rights" },
});

function conceptFor(questionId) {
  if ([8, 9, 10, 11, 14].includes(questionId)) return "declaration";
  if (questionId <= 16) return "constitution";
  if (questionId <= 35) return "congress";
  if (questionId <= 49) return "presidency";
  if (questionId <= 60) return "supremeCourt";
  if (questionId <= 72) return "civilRights";
  if (questionId <= 89) return "revolution";
  if (questionId <= 99) return "lincoln";
  if (questionId <= 111) return "revolution";
  if (questionId <= 116) return "civilRights";
  return questionId <= 118 ? "revolution" : "declaration";
}

export const civicsVisualLibrary = Object.freeze(Array.from({ length: 128 }, (_, index) => {
  const questionId = index + 1;
  return Object.freeze({ questionId, concept: conceptFor(questionId), ...CONCEPTS[conceptFor(questionId)], ...ORIGINAL_SOURCE });
}));

const visualByQuestion = new Map(civicsVisualLibrary.map((visual) => [visual.questionId, visual]));

export function getCivicsVisual(questionId) {
  return visualByQuestion.get(Number(questionId)) || null;
}
