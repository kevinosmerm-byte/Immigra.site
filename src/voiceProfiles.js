const FEMALE_VOICE = /(?:^|[^a-z])female(?:[^a-z]|$)|\b(?:samantha|ava|allison|aria|jenny|susan|victoria|karen|tessa|moira|salli|joanna|kendra|kimberly|ivy|emma|amy|olivia|sonia|natasha|serena|fiona|veena|zira)\b/i;
const MALE_VOICE = /(?:^|[^a-z])male(?:[^a-z]|$)|\b(?:aaron|alex|arthur|brian|christopher|daniel|david|eric|fred|george|guy|james|joey|justin|kevin|mark|matthew|oliver|ryan|tom)\b/i;

const searchableName = (voice) => `${voice?.name || ""} ${voice?.voiceURI || ""}`;
const normalizedLanguage = (voice) => String(voice?.lang || "").replace("_", "-").toLowerCase();

const profileScore = (voice, profile) => {
  const name = searchableName(voice);
  const language = normalizedLanguage(voice);
  const preferredPattern = profile === "male" ? MALE_VOICE : FEMALE_VOICE;
  const oppositePattern = profile === "male" ? FEMALE_VOICE : MALE_VOICE;
  let score = language === "en-us" ? 40 : language.startsWith("en-") || language === "en" ? 20 : 0;

  if (preferredPattern.test(name)) score += 1000;
  if (oppositePattern.test(name)) score -= 1000;
  if (voice?.localService) score += 3;
  if (voice?.default) score += 1;
  return score;
};

const rankedEnglishVoices = (voices, profile) => voices
  .map((voice, index) => ({ voice, index, score: profileScore(voice, profile) }))
  .filter(({ voice }) => {
    const language = normalizedLanguage(voice);
    return language === "en" || language.startsWith("en-");
  })
  .sort((left, right) => right.score - left.score || left.index - right.index);

/**
 * Selects an English voice while ensuring Sarah and Kevin do not silently fall
 * back to the same first voice when a platform uses unfamiliar voice names.
 */
export const selectVoiceIndex = (voices = [], profile = "female") => {
  const normalizedProfile = profile === "male" ? "male" : "female";
  const ranked = rankedEnglishVoices(voices, normalizedProfile);
  if (!ranked.length) return undefined;

  if (normalizedProfile === "male" && ranked.length > 1) {
    const femaleIndex = rankedEnglishVoices(voices, "female")[0]?.index;
    const distinctMale = ranked.find(({ index }) => index !== femaleIndex);
    if (distinctMale) return distinctMale.index;
  }

  return ranked[0].index;
};

export const voiceProfileDefaults = (profile = "female") => profile === "male"
  ? { rate: 0.86, pitch: 0.78 }
  : { rate: 0.92, pitch: 1.12 };
