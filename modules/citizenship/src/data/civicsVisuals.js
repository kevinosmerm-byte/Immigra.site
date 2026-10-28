import userImages from "./userCivicsImages.json" with { type: "json" };
import additionalImages from "./additionalCivicsImages.json" with { type: "json" };

const imageUrl = (fileName) => new URL(`../assets/civics-photos/${fileName}`, import.meta.url).href;
// Fill the existing landscape cards; keep text-heavy artwork readable in full.
const fullArtwork = new Set(["user-we-the-people.jpg", "user-liberty-rights.jpg", "user-uncle-sam.jpg", "user-revolution.jpg"]);
const focalPoints = {
  "user-chief-justice.jpg": "50% 25%",
  "user-susan-anthony.jpg": "50% 25%",
  "user-mlk.jpg": "50% 30%",
  "user-washington-portrait.jpg": "50% 20%",
  "user-gettysburg.jpg": "50% 42%",
  "user-lincoln-memorial.jpg": "50% 65%",
  "user-liberty.jpg": "50% 65%",
  "user-memorial-day.jpg": "50% 73%",
  "user-wwii-memorial.jpg": "50% 55%",
  "user-veterans.jpg": "50% 30%",
};
const userVisuals = new Map([...userImages, ...additionalImages].flatMap((entry) => entry.questionIds.map((id) => [id, {
  imagePath: imageUrl(entry.file), imageAlt: entry.imageAlt, category: entry.category,
  sourceName: entry.sourceName ?? "User-provided image", sourceLabel: "Original image",
  sourceUrl: imageUrl(entry.file),
  license: "User-supplied reference; publication rights not verified",
  userProvided: true, imageFit: entry.imageFit ?? (fullArtwork.has(entry.file) ? "contain" : "cover"),
  imagePosition: entry.imagePosition ?? focalPoints[entry.file] ?? "50% 50%", originalFileName: entry.original,
}])));

// These ten questions anchor the approved visual subjects from the prototype.
export const prototypeQuestionIds = Object.freeze([1, 2, 8, 17, 19, 24, 52, 86, 94, 113]);
export const allCivicsQuestionIds = Object.freeze(Array.from({ length: 128 }, (_, index) => index + 1));

const visualSubjects = Object.freeze({
  map: Object.freeze({
    imagePath: imageUrl("united-states-map.webp"),
    imageAlt: "Official U.S. Census Bureau reference map of the United States",
    sourceName: "U.S. Census Bureau", sourceLabel: "Census.gov",
    sourceUrl: "https://www.census.gov/geographies/reference-maps/2020/geo/county-wallmaps-2020.html",
    category: "map", license: "U.S. government work",
  }),
  constitution: Object.freeze({
    imagePath: imageUrl("constitution.webp"), imageAlt: "First page of the Constitution of the United States",
    sourceName: "National Archives", sourceLabel: "Archives.gov",
    sourceUrl: "https://www.archives.gov/founding-docs/downloads", category: "document", license: "Public domain",
  }),
  declaration: Object.freeze({
    imagePath: imageUrl("declaration.webp"), imageAlt: "The Declaration of Independence held by the National Archives",
    sourceName: "National Archives", sourceLabel: "Archives.gov",
    sourceUrl: "https://www.archives.gov/founding-docs/downloads", category: "document", license: "Public domain",
  }),
  president: Object.freeze({
    imagePath: imageUrl("president.webp"), imageAlt: "The White House in Washington, D.C.",
    sourceName: "Library of Congress", sourceLabel: "LOC.gov",
    sourceUrl: "https://www.loc.gov/pictures/item/2011633022/", category: "institution",
    license: "No known restrictions on publication",
  }),
  congress: Object.freeze({
    imagePath: imageUrl("congress.webp"), imageAlt: "United States Capitol in Washington, D.C.",
    sourceName: "Library of Congress", sourceLabel: "LOC.gov",
    sourceUrl: "https://www.loc.gov/pictures/item/2010630189/", category: "institution",
    license: "No known restrictions on publication",
  }),
  house: Object.freeze({
    imagePath: imageUrl("house.webp"), imageAlt: "The House Chamber during the opening of Congress",
    sourceName: "Library of Congress", sourceLabel: "LOC.gov",
    sourceUrl: "https://www.loc.gov/item/2019636820/", category: "institution",
    license: "No known restrictions on publication",
  }),
  supremeCourt: Object.freeze({
    imagePath: imageUrl("supreme-court.webp"), imageAlt: "United States Supreme Court building in Washington, D.C.",
    sourceName: "Library of Congress", sourceLabel: "LOC.gov",
    sourceUrl: "https://www.loc.gov/item/2011630083/", category: "institution",
    license: "No known restrictions on publication",
  }),
  washington: Object.freeze({
    imagePath: imageUrl("george-washington.webp"), imageAlt: "Historic portrait of President George Washington",
    sourceName: "Library of Congress", sourceLabel: "LOC.gov",
    sourceUrl: "https://www.loc.gov/item/2021669448/", category: "person", license: "Free to use and reuse",
  }),
  lincoln: Object.freeze({
    imagePath: imageUrl("abraham-lincoln.webp"), imageAlt: "Historic full-length portrait of President Abraham Lincoln",
    sourceName: "Library of Congress", sourceLabel: "LOC.gov",
    sourceUrl: "https://www.loc.gov/pictures/item/2013649747/", category: "person",
    license: "No known restrictions on publication",
  }),
  civilRights: Object.freeze({
    imagePath: imageUrl("martin-luther-king-jr.webp"), imageAlt: "Martin Luther King, Jr. Memorial in Washington, D.C.",
    sourceName: "National Park Service", sourceLabel: "NPS.gov",
    sourceUrl: "https://www.nps.gov/media/photo/gallery-item.htm?gid=108379A9-3701-4049-ABB5-0F178044536F&id=5b66f980-cc15-43eb-aa3f-02195e68f01f",
    category: "person", license: "Public domain; credited to NPS",
  }),
});

function subjectForQuestion(questionId) {
  if (questionId === 1 || questionId === 12 || (questionId >= 58 && questionId <= 62) || questionId === 90 || (questionId >= 99 && questionId <= 111) || (questionId >= 114 && questionId <= 118) || questionId >= 120) return "map";
  if ((questionId >= 2 && questionId <= 7) || questionId === 13 || questionId === 15 || (questionId >= 63 && questionId <= 72) || questionId === 82 || questionId === 88) return "constitution";
  if ((questionId >= 8 && questionId <= 11) || questionId === 14 || (questionId >= 73 && questionId <= 85) || questionId === 87) return "declaration";
  if (questionId === 17 || (questionId >= 36 && questionId <= 49)) return "president";
  if (questionId === 16 || (questionId >= 18 && questionId <= 23) || questionId === 119) return "congress";
  if (questionId >= 24 && questionId <= 35) return "house";
  if (questionId >= 50 && questionId <= 57) return "supremeCourt";
  if (questionId === 86 || questionId === 89) return "washington";
  if (questionId >= 91 && questionId <= 98) return "lincoln";
  if (questionId === 112 || questionId === 113) return "civilRights";
  return "map";
}

export const civicsVisualLibrary = Object.freeze(allCivicsQuestionIds.map((questionId) => Object.freeze({
  questionId,
  ...visualSubjects[subjectForQuestion(questionId)],
  ...userVisuals.get(questionId),
})));

const visualByQuestion = new Map(civicsVisualLibrary.map((visual) => [visual.questionId, visual]));

export function getCivicsVisual(questionId) {
  return visualByQuestion.get(Number(questionId)) ?? null;
}
