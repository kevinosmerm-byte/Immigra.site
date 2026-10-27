const DAY_MS = 86_400_000;

function ratingForAttempt(Rating, attempt) {
  if (!attempt.correct) return Rating.Again;
  if (attempt.helpUsed?.length) return Rating.Hard;
  if (Number(attempt.score) >= 95 && Number(attempt.responseMs) > 0 && Number(attempt.responseMs) <= 12_000) return Rating.Easy;
  return Rating.Good;
}

/** Adapts the public ts-fsrs API to Immigra.site's persisted question state. */
export function createTsFsrsAdapter(tsFsrs, options = {}) {
  if (!tsFsrs?.fsrs || !tsFsrs?.createEmptyCard || !tsFsrs?.Rating) {
    throw new TypeError("A compatible ts-fsrs module is required.");
  }
  const scheduler = tsFsrs.fsrs({
    request_retention: options.requestRetention ?? 0.9,
    maximum_interval: options.maximumInterval ?? 365,
    enable_fuzz: options.enableFuzz ?? false,
    enable_short_term: true,
  });

  return Object.freeze({
    schedule(previous = {}, attempt = {}) {
      const reviewedAt = new Date(attempt.answeredAt);
      if (!Number.isFinite(reviewedAt.getTime())) throw new TypeError("answeredAt must be a valid date.");
      const card = previous.fsrsCard || tsFsrs.createEmptyCard(reviewedAt);
      const result = scheduler.next(card, reviewedAt, ratingForAttempt(tsFsrs.Rating, attempt));
      const due = new Date(result.card.due);
      return {
        ...previous,
        fsrsCard: result.card,
        fsrsLastReview: result.log,
        lastAttemptAt: reviewedAt.toISOString(),
        nextReviewAt: due.toISOString(),
        intervalDays: Math.max(0, (due.getTime() - reviewedAt.getTime()) / DAY_MS),
      };
    },
  });
}
