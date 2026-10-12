# Educational preparation review — October 12, 2026

## Executed plan

1. Review navigation, study recommendations, conversation recovery and legal notices.
2. Make the educational scope and professional-help recommendation explicit in both languages.
3. Add a practical preparation guide using the existing study planner and account-scoped profile.
4. Validate the application, record external verification limits and save the release in GitHub.

## Delivered behavior

- A shared Spanish/English notice states that we are not lawyers or a law firm, do not provide legal advice or representation, and do not create an attorney-client relationship. It recommends a licensed immigration attorney or a DOJ-accredited representative acting within their authorized scope. Practice does not determine eligibility or predict outcomes.
- The notice is available from Home, practice, Sarah/Kevin conversations, N-400 practice, the N-400 journey, resources and legal settings. First-launch acknowledgement and full terms/privacy explain this scope.
- “My preparation guide” lets a learner choose citizenship, asylum or adjustment of status, their supported language and study time. The existing planner supplies activities; asylum/adjustment plans prioritize communication and official/professional resources rather than automatically prescribing N-400 or civics tasks.
- Five fixed study checklist items are stored separately for each goal and account using the existing profile. These are learner-reviewed activities, not an assessment of legal readiness. Blocked browser storage is reported as session-only. Optional encrypted account snapshots use the existing mechanism.
- A printable blank worksheet helps prepare questions for a qualified professional. The guide has no fields for storing case narratives, evidence or answers to those questions. Asylum practice offers fictional examples, pauses and skipping without requiring traumatic disclosures.
- Clear requests for individual legal decisions receive a local professional-help referral before a model request. The current educational question stays available so the learner can resume. Narrow pattern matching is a product boundary, not a comprehensive legal classifier; model instructions also prohibit individual legal advice.
- Privacy text explains explicit continuous-microphone activation, per-turn provider transcription, pause/background/session stopping, browser audio/history behavior and provider retention. No new voice provider, subscription or paid service was introduced by this guide. Existing voice/AI services can still incur their usual costs.

## Validation completed

- `npm run quality`: lint, 267 tests (267 passed; zero failed or skipped), production build, mobile/iOS readiness scripts and App Store metadata verification.
- `npm run typecheck` and Python/pypdf `scripts/extract-official-civics.py --check`: official 128 questions and 410 answer bullets verified. Official questions, answers, IDs and PDF were unchanged.
- Chromium checks exercised language/goal/time persistence, per-goal checklist isolation, first-launch acknowledgement in both languages, unavailable storage, legal navigation, correct conversation topic/language and existing AI feature authorization gates.
- 84 combinations of relevant routes, Spanish/English, light/dark themes and 320/390/1280-pixel viewports had no horizontal overflow or uncaught page errors. Axe checks scoped to the new guide and shared notice reported no findings after correcting dark-theme contrast. This is not a whole-application accessibility certification.
- Continuous-voice regression checks covered correction, stale-request cancellation, pause, offline behavior, permission cancellation, provider failure and completion. A real Chromium AudioWorklet handled two synthetic audio turns on one stream and released it. N-400 uncertainty and repeated incorrect/incomplete civics answers could advance without a question loop.
- The current local API returned bilingual legal referrals without provider credentials; normal coaching still required provider configuration and invalid guided inputs were rejected. Browser checks confirmed that a referral did not advance the question and educational practice could resume.
- A three-page Spanish preparation PDF retained the educational notice and professional-help questions while hiding interactive controls.

## Verification limits and follow-up priorities

The environment proxy denied requests to USCIS, DOJ and the public deployment. The notice review date applies to the product wording; it is not a claim that all immigration law, linked pages or dynamic government facts were externally reverified. Existing source-verification dates were retained. The live deployment and recent government changes require verification from an environment with access.

No real provider credentials were available. Browser tests used fixture transcription/feedback and synthetic audio; they do not establish real-provider quality, physical-device microphone behavior or a signed native release. Readiness scripts do not replace device testing.

The most useful next tools are a source-maintenance check that reports changed or unavailable official pages for human review, and optional device-side document reading with an explicit user preview, deletion and privacy controls. Neither should infer eligibility, invent legal deadlines, evaluate evidence or propose case strategy. They need their own source/privacy/device validation before release. The implemented guide provides immediate study structure without adding another vendor or storing sensitive case documents.
