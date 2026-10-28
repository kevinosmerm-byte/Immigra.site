# Citizenship AI — UI verification

Date: October 5, 2026. Scope: the current working tree, using the existing React/Vite application. This report supersedes the older navigation inventory for this implementation.

## Verified results

| Verification | Final measured result |
| --- | --- |
| Route, viewport, language and theme combinations | **960 / 960 PASS** |
| Distinct axe accessibility combinations | **96 / 96 PASS**, zero reported WCAG-tagged violations |
| Interactive application scenarios | **120 / 120 PASS** |
| Podcast mini-player reopening | **6 / 6 PASS** |
| All five policy panels, expansion/collapse and keyboard focus | **10 / 10 PASS** |
| All three onboarding steps, layout and axe | **12 / 12 PASS** |
| React/page runtime errors in the final route matrix | **0** |
| Document horizontal overflow in the final route matrix | **0** |
| Visible buttons without an accessible name | **0** |
| Visible buttons below the tested 44px target tolerance | **0** |
| Unloaded main-content `img` assets in the final matrix | **0** |

These are consolidated measurements, with their original observations retained. The first complete 960-combination run passed 956 cases and identified four PRO contrast failures. A later 240-case recheck identified four Coach ARIA-role failures. The affected routes were corrected and rerun across all ten widths, both languages and both themes; the final records retain their source filename in `validatedBy`. The final accessibility set similarly retains the full 96-case run and replaces affected combinations with their actual passing rechecks. Results were never changed from fail to pass without rerunning the affected case.

## Browser and dimensions

Chromium 151.0.7922.173 on Linux, Playwright 1.58.2, axe-core 4.11.1, Node 24.19.0. Browser dependencies and harnesses were installed outside the application repository at `/workspace/.citizenshipai-qa`; the application dependency manifest was not changed for browser QA.

Every route case below was rendered in **EN and ES**, **dark and light** themes at these widths:

| Device layout | Viewports |
| --- | --- |
| Mobile | 320×844, 360×844, 375×844, 390×844, 414×844 |
| Tablet portrait | 768×1024, 820×1024 |
| Tablet landscape / desktop breakpoint | 1024×768 |
| Desktop | 1280×900, 1440×900 |

Axe ran on every route case at 390px in both languages and themes, using `wcag2a`, `wcag2aa` and `wcag21aa` tags. The interactive suite ran in both languages at 320, 390, 820, 1024 and 1440px. The policy and onboarding checks separately covered expanded text and initial-launch states.

## Route inventory and QA matrix

The application retains 22 named screen IDs. The three supported interview modes produce 24 independently checked route cases. `#privacy` maps to the same Settings screen; `#interview` uses the full mode by default. Mobile and desktop visual reviews covered every route case; an additional independent review covered all 24 tablet cases at 820px. Visual review checks content hierarchy, readable wrapping, media proportion, control placement, navigation clearance and obvious overlap. It is not a claim of pixel-by-pixel inspection of all 960 renders.

| SCREEN | MOBILE | TABLET | DESKTOP | EN | ES | OVERFLOW | VISUAL | PASS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `#home` | ✓ | ✓ P/L | ✓ | ✓ | ✓ | None | M/T/D | PASS |
| `#practice` | ✓ | ✓ P/L | ✓ | ✓ | ✓ | None | M/T/D | PASS |
| `#uscisTracker` — Case Journey | ✓ | ✓ P/L | ✓ | ✓ | ✓ | None | M/T/D | PASS |
| `#immigrationHelp` | ✓ | ✓ P/L | ✓ | ✓ | ✓ | None | M/T/D | PASS |
| `#profile` | ✓ | ✓ P/L | ✓ | ✓ | ✓ | None | M/T/D | PASS |
| `#settings` | ✓ | ✓ P/L | ✓ | ✓ | ✓ | None | M/T/D | PASS |
| `#civicProfile` | ✓ | ✓ P/L | ✓ | ✓ | ✓ | None | M/T/D | PASS |
| `#pro` | ✓ | ✓ P/L | ✓ | ✓ | ✓ | None | M/T/D | PASS |
| `#podcasts` | ✓ | ✓ P/L | ✓ | ✓ | ✓ | None | M/T/D | PASS |
| `#civicsGuide` | ✓ | ✓ P/L | ✓ | ✓ | ✓ | None | M/T/D | PASS |
| `#quiz` | ✓ | ✓ P/L | ✓ | ✓ | ✓ | None | M/T/D | PASS |
| `#vocabulary` | ✓ | ✓ P/L | ✓ | ✓ | ✓ | None | M/T/D | PASS |
| `#choose` | ✓ | ✓ P/L | ✓ | ✓ | ✓ | None | M/T/D | PASS |
| `#connect` | ✓ | ✓ P/L | ✓ | ✓ | ✓ | None | M/T/D | PASS |
| `#civics` | ✓ | ✓ P/L | ✓ | ✓ | ✓ | None | M/T/D | PASS |
| `#english` | ✓ | ✓ P/L | ✓ | ✓ | ✓ | None | M/T/D | PASS |
| `#reading` | ✓ | ✓ P/L | ✓ | ✓ | ✓ | None | M/T/D | PASS |
| `#writing` | ✓ | ✓ P/L | ✓ | ✓ | ✓ | None | M/T/D | PASS |
| `#coach` | ✓ | ✓ P/L | ✓ | ✓ | ✓ | None | M/T/D | PASS |
| `#uscisSandbox` | ✓ | ✓ P/L | ✓ | ✓ | ✓ | None | M/T/D | PASS |
| `#progress` | ✓ | ✓ P/L | ✓ | ✓ | ✓ | None | M/T/D | PASS |
| `#interview?mode=full` | ✓ | ✓ P/L | ✓ | ✓ | ✓ | None | M/T/D | PASS |
| `#interview?mode=civics` | ✓ | ✓ P/L | ✓ | ✓ | ✓ | None | M/T/D | PASS |
| `#interview?mode=n400` | ✓ | ✓ P/L | ✓ | ✓ | ✓ | None | M/T/D | PASS |

P/L means portrait and landscape. Intentional horizontal section-navigation strips scroll inside their container; they do not create document overflow. Full official PDFs and English-language exercise content preserve their source language while surrounding controls, explanations and supplemental policies follow the selected UI language.

## Interactive states checked

| State or journey | Evidence |
| --- | --- |
| First launch | All three language, preference and consent steps; optional ZIP input; completion opens Home. Twelve additional axe/layout checks and screenshot review cover all steps at 320/1440 in EN/ES. |
| Private Profile | Edit first name and daily study time; explicit device save; reload; Home reuses the saved name. Default cloud-save consent state is visibly disabled. |
| Case Journey | Explicit stage/date update; upcoming interview changes the study plan; checklist interaction; confirmed fields survive reload in the separate Journey suite. |
| Notice review | Extracted fields leave the confirmed stage unchanged before confirmation; edited fields save only after confirmation. Separate Journey checks cover cancel, local PDF extraction and scanned-PDF manual fallback. |
| Immigration Help | Resource detail, outgoing-link dialog and mascot visibility; separate EN/ES checks verify initial focus, Tab/Shift+Tab containment, inert background, Escape/Cancel and restored opener focus. |
| Civics cards | Native flip button, answer state, needs-practice feedback; deterministic typed civics answers and continuation in the separate interview suite. |
| Quiz | Selected-answer and feedback states, plus readable level descriptions. |
| Writing | Typed response and deterministic evaluation state. |
| N-400 practice | Known confirmed context, unknown remaining unknown, explicit confirmation before saving, and excluded A-number storage in the separate interview suite. |
| Live avatar wrapper | Consent precedes provider connection; modal focus, Escape/reconnect, generic provider error and standard-interview fallback checked in EN/ES with controlled provider responses. |
| Settings | All five policy panels expand/collapse in EN/ES at 320px, with the correct language and visible keyboard focus. Operational controls and policy narratives are localized. |
| Podcasts | Full player, unavailable-media state and mini-player reopening from another destination, in EN/ES at 320/820/1440. Native SVG controls and full-player proportions were visually reviewed. |

The broad route matrix starts with an empty guest profile and onboarding already completed. These state checks extend that coverage; they do not claim every possible account, purchase, historical-profile or remote-provider state was exercised.

## Problems corrected after actual review

| Before | Final behavior |
| --- | --- |
| Different navigation sets between destinations | Stable Home / Practice / Journey / Help / Profile ordering, localized labels, grouped active states and accessible secondary navigation. |
| Floating mascot could cover content or dialogs | Existing companion stays in normal content flow, is compact on mobile, and hides during dialogs, focused form controls and voice-practice screens. |
| Legacy neon surfaces, inconsistent controls and weak light-theme contrast | Shared dark/light tokens, quiet surfaces, primary/secondary/tertiary hierarchy, visible keyboard focus and adequate button targets. |
| PRO benefits collapsed into a narrow column | One-column benefits, readable price/supporting text and corrected dark/light contrast. |
| Coach and interview stages retained large empty panels | Content-sized stages, compact existing media and controls following the question without fixed-height gaps. |
| Coach CTA clipped; portrait identity covered the face | Unclipped single primary action; complete portrait; redundant mobile identity badge removed. |
| Interview header clipped at 320px | Exit/repeat controls retain their space and the subtitle wraps. |
| Spanish Civics heading/tabs broke inside words | Readable heading and complete labels in an internally scrolling strip. |
| Spanish podcast title lost its final letter onto another line | Smaller cover, usable text width and natural word wrapping. |
| Podcast mini-player could disappear without reopening the player | Reopening navigates to the retained Podcast destination and restores the full player. |
| Full-player glyphs were missing or rendered as emoji tiles | Named native SVG controls with centered icons; recorded audio is labeled accurately. |
| Quiz instructions were ellipsized | Instructions wrap into readable lines. |
| English tablet captions crossed the card arrow | Separate icon/content/arrow layout with normal-flow icons and reserved arrow space. |
| Guide advertised an unrelated title and 88 pages | Accurate M-1778 title; rendered PDF toolbar reports the actual 19 pages; supplied PDF unchanged. |
| Decorative external-link glyphs rendered as empty squares | Decorative glyphs removed from Guide and Journey links. |
| Generic elements had prohibited ARIA labels | Proper roles and values for onboarding progress and Coach media; native Civics flip control removes nested-interactive behavior. |

## Artifacts and reproduction

All raw browser observations, final consolidated records and screenshots are retained under `/workspace/.citizenshipai-qa/artifacts`:

- `validation-summary.json`: exact counts and input provenance.
- `matrix-validated.json`: 960 final measured route/viewport/language/theme records.
- `accessibility-validated.json`: 96 final measured axe combinations.
- `matrix.json`, `axe-matrix.json` and `focused-*.json`: original runs and actual remediation rechecks, including their original failures.
- `states.json`, `mini-player.json`, `policy-states.json`, `onboarding.json`: interactive and expanded-state results.
- `visual-review.md`: independent screenshot-review scope, findings and closeout.
- Route screenshots such as `home-es-320.png`, `uscisTracker-es-820.png`, `interview-mode-n400-en-1440.png`, and the independent `visual-*` / `tablet-*` rechecks.

Additional verified browser journeys are recorded in `/workspace/.citizenshipai-cloud/journey-functional-qa.json`, `help-dialog-accessibility-qa.json`, `interview-interaction-qa.json` and `avatar-interaction-qa.json`.

With the app running at port 5173, the external harnesses can be rerun:

```sh
node /workspace/.citizenshipai-qa/check-ui.mjs
node /workspace/.citizenshipai-qa/check-ui.mjs --axe
node /workspace/.citizenshipai-qa/check-states.mjs
node /workspace/.citizenshipai-qa/check-mini.mjs
node /workspace/.citizenshipai-qa/check-policy.mjs
node /workspace/.citizenshipai-qa/check-onboarding.mjs
```

Final repository verification reported PASS for `npm run quality` (lint, tests, build and mobile/iOS/app-store readiness checks), typecheck, official-PDF verification and diff checks. The test suite passed **231 / 231 tests**, with no failures or skips. Scoped oxlint also passed for all files changed by the design/QA work.

## Practical limits

The browser harness deliberately aborts MP4/MP3/WebM/M4A requests and mutes audio. It validates presentation, control behavior, poster assets where rechecked, consent/fallback/error handling and retained local state; it does not establish live audio playback, microphone transcription or a paid D-ID session. One early Civics image observation was pending at the short initial mount wait; image-readiness checks and a full Civics rerun now pass. Coach poster loading was separately recaptured after readiness, resolving a transient blank snapshot.

High-volume browser runs reached the local API's public-config rate limit. The UI remained usable through its existing fallback; the API was subsequently restarted for the root agent's final smoke check. Remote credentials, live USCIS/Census/Congress requests, real cloud profile persistence, deployed migrations, store purchases and physical iOS/Android devices require their own integration checks. No success for those operations is inferred from this browser matrix.
