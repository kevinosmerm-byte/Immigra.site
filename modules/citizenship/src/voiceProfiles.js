const FEMALE_VOICE = /(?:^|[^a-z])female(?:[^a-z]|$)|\b(?:samantha|ava|allison|aria|jenny|susan|victoria|karen|tessa|moira|salli|joanna|kendra|kimberly|ivy|emma|amy|olivia|sonia|natasha|serena|fiona|veena|zira)\b/i;
const MALE_VOICE = /(?:^|[^a-z])male(?:[^a-z]|$)|\b(?:aaron|alex|arthur|brian|christopher|daniel|david|eric|fred|george|guy|james|joey|justin|kevin|mark|matthew|oliver|ryan|tom)\b/i;

const searchableName = (voice) => `${voice?.name || ""} ${voice?.voiceURI || ""}`;
const normalizedLanguage = (voice) => String(voice?.lang || "").replace("_", "-").toLowerCase();

const profileScore = (voice, profile, requestedLanguage) => {
  const name = searchableName(voice);
  const language = normalizedLanguage(voice);
  const preferredPattern = profile === "male" ? MALE_VOICE : FEMALE_VOICE;
  const oppositePattern = profile === "male" ? FEMALE_VOICE : MALE_VOICE;
  const requested = requestedLanguage.toLowerCase().replace("_", "-");
  let score = language === requested ? 40 : 20;

  if (preferredPattern.test(name)) score += 1000;
  if (oppositePattern.test(name)) score -= 1000;
  // Prefer higher-quality installed variants without changing voice identity.
  if (/\b(premium|enhanced|natural|neural)\b/i.test(name)) score += 15;
  if (voice?.localService) score += 3;
  if (voice?.default) score += 1;
  return score;
};

const rankedVoices = (voices, profile, language) => voices
  .map((voice, index) => ({ voice, index, score: profileScore(voice, profile, language) }))
  .filter(({ voice }) => {
    const candidate = normalizedLanguage(voice);
    const base = language.toLowerCase().replace("_", "-").split("-")[0];
    return candidate === base || candidate.startsWith(base + "-");
  })
  .sort((left, right) => right.score - left.score || left.index - right.index);

/**
 * Selects a voice in the requested language while ensuring Sarah and Kevin do not silently fall
 * back to the same first voice when a platform uses unfamiliar voice names.
 */
export const selectVoiceIndex = (voices = [], profile = "female", language = "en-US") => {
  const normalizedProfile = profile === "male" ? "male" : "female";
  const ranked = rankedVoices(voices, normalizedProfile, language);
  if (!ranked.length) return undefined;

  if (normalizedProfile === "male" && ranked.length > 1) {
    const femaleIndex = rankedVoices(voices, "female", language)[0]?.index;
    const distinctMale = ranked.find(({ index }) => index !== femaleIndex);
    if (distinctMale) return distinctMale.index;
  }

  return ranked[0].index;
};

export const voiceProfileDefaults = (profile = "female") => profile === "male"
  ? { rate: 0.95, pitch: 1 }
  : { rate: 0.96, pitch: 1 };
