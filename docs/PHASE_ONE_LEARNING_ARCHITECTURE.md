# Phase-one learning architecture

## Current architecture

The runnable client is React 19 with Vite and Capacitor wrappers. Express provides the API. Supabase is used for optional authentication, entitlements, usage metering, and account operations; study events currently remain local-first in browser storage. Civics content is static, reviewed content in `questions.js`, `answers.js`, and `civicsAnswers.js`. Reading, writing, coach, and interview evaluations are recorded by `progress.js`.

## Safe first phase

Readiness is deterministic and separates accuracy from evidence. It combines answer volume, accuracy, study-day consistency, category coverage and mastery, independent recall, response pace, recent errors, spaced review, and mock-interview completion. Fewer than 20 measured answers cap readiness at 45%; fewer than 100 cap it at 75%; readiness cannot exceed 90% without 100 answers and two mock interviews.

`LegacySpacedRepetitionEngine` preserves current intervals. `SpacedRepetitionEngine` is the stable interface for the TS-FSRS adapter in `fsrsAdapter.js`. The adapter maps local answers to the official ratings and persists the returned card and review log. Shadow mode returns the legacy result, and adapter errors safely fall back to legacy. Activation remains off until the pinned package can be installed and shadow telemetry has been reviewed.

The ZIP civic profile accepts authoritative data rather than fetching or inferring it. Multiple districts mark the profile ambiguous and suppress the representative until an exact-address lookup confirms a district.

## AI cost controls

Readiness, plans, scheduling, content display, answer metadata, and ZIP ambiguity are deterministic and require no model call. Static civics answers remain preprocessed. Existing AI remains reserved for open speech/writing evaluation, conversation, and simulated interviews. A later server phase can add a versioned cache for normalized, nonsensitive evaluation prompts; raw audio, N-400 answers, and personally identifying responses must not be cached.

## Risks and rollout

- Historical civics mastery has no dates or incorrect-attempt detail, so it receives assisted-credit only.
- Response-time evidence will become useful as new enriched events accumulate.
- TS-FSRS is not activated or installed because the configured registry returns HTTP 403. The adapter and failure-safe shadow path are tested, but production activation must remain false until `ts-fsrs@5.4.2` can be pinned in the lockfile.
- Officeholders change. National answers are dated, sourced to USCIS, and disappear after 31 days without re-verification. State governors remain empty rather than guessed; Congress.gov member results expire after one day.
- Local storage is device-specific and can be cleared. Cloud sync needs consent, schema migration, and conflict resolution.

## Civics answer evaluation and changing answers

`civicsQuestionBank.js` derives one immutable model for all 128 cards and interview modes from the reviewed card content. The local evaluator uses normalized exact answers, curated aliases, and bounded typo/token matching before permitting the existing semantic evaluator as a last resort. Multi-answer questions count different official answers rather than words.

Changing answers are never copied into permanent question content. National officeholders require a recent administrative verification against the USCIS test-updates page. State capitals and governors have separate verification fields. Address-based district resolution uses the official Census Geocoder; ZIP alone never resolves an ambiguous district. Current members can be retrieved from the official Congress.gov API, cached for one day, and returned with `verifiedAt` and `sourceUrl` metadata.

## Writing evaluation

`writingSentences.js` is the canonical source for the existing writing prompts and their derived essential-word lists. The browser and API share `writingEvaluator.js`: it normalizes Unicode, case, spacing, quotation marks, and punctuation; rejects meaning-changing negations; requires essential terms; and permits only a bounded one-edit spelling tolerance. Exact writing, passing writing with observations, and writing that needs practice remain separate outcomes. The AI endpoint is reached only for a close result whose essential meaning is present but cannot be decided safely by deterministic rules.
