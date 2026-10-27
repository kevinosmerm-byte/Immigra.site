# White welcome experience — 2026-10-27

Publication authorized by the user on 2026-10-27. The supplied HTML is a visual reference; its demo navigation and placeholder legal links are not used.

## Integration
- `src/welcome/WelcomeGate.jsx`: gates the initial home visit, citizenship, asylum, residency and preparation before mounting those tools. Account/auth callbacks, settings, help and public static/SEO pages stay accessible. The requested hash (including route parameters) is retained. A `lang` marketing query is removed on acceptance so it cannot override the explicit language choice; other query parameters remain.
- `src/welcome/WelcomeExperience.jsx`, `welcome.css`, `copy.mjs`: scoped React UI, white glass panels, bilingual controls and educational acknowledgment. The decorative greeting cycles across six languages independently of the UI language. No prechecked acknowledgment; choose/confirm language explicitly before continuing.
- `src/welcome/LiquidBackground.jsx`, `shaders.mjs`: the supplied white WebGL shader with capped DPR/resolution, pointer response, visibility pause, resource cleanup and CSS fallback. Reduced motion stops greeting rotation and renders a static background. No video or extra image downloads.
- `src/welcome/state.mjs`: version `2026-10`, existing `citizenshipai.language` preference, and `immigra:welcome:v1` containing only language, notice version and timestamp. Memory fallback permits navigation when storage fails. Change `NOTICE_VERSION` when the notice changes.
- `src/main.jsx`: gate around the existing App; existing services/providers and module internals preserved.
- Settings has no welcome-review button. Completing the explicit `#/welcome` route opens the main `#/` screen.
- `tests/welcome.test.mjs`: language preference/suggestion, version changes, persistence, malformed/blocked storage, and route eligibility.

## Notice and privacy
The checkbox acknowledges the educational notice, not a new bundled data-processing permission or acceptance of changed terms. Existing permissions and subscriptions remain separate. Records are device-local, including for signed-in visitors: the current architecture has no welcome acknowledgment synchronization endpoint. No new account database or server writes were introduced. A second device therefore asks again.

Legal links are the existing Spanish `/terminos`, `/privacidad` and English `/terms`, `/privacy` pages at `https://immigra.site`; all four returned HTTP 200 with matching headings during verification. They open separately so the requested practice route is retained.

## Verification and preview
Run `npm run build`, then `npm run preview -- --port 5192`.
Open `http://127.0.0.1:5192/#/welcome` to review regardless of stored acknowledgment. Use a fresh browser profile to test first access to `/#/citizenship/interview?mode=n400`, `/#/asylum/fiction` or `/#/residency`.

Verified in the local browser: ES/EN, initially disabled Continue until explicit choice, unchecked acknowledgment/disabled entry, Shift+Tab focus wrap, Escape returning focus to Continue, exact N-400 hash preserved after acceptance, refresh without repeating welcome, explicit welcome entry returning to home, system reduced-motion support, and 390px layout in a local viewport fixture. Unit tests cover version upgrades and unavailable storage. Full project checks passed; existing lint/chunk-size warnings remain.

Differences from the standalone prototype: no intermediate success page (entry resumes the real destination), no marketing-page block, language choice must be confirmed, existing IMMIGRA wordmark instead of a new logo, and system reduced-motion support. WebGL fallback is CSS rather than video. No production deployment, native package upload or store submission was performed.

## User revision
Welcome now appears on the initial app home visit too (only before acknowledgment). Removed the duplicate top language selector and bottom motion/back controls. The central language choices remain. Footer centers Asilo · Ciudadanía · Residencia; header uses the supplied IMMIGRA-only wordmark style. System reduced-motion preference remains respected. Static SEO pages are unchanged.

## Latest direct user correction
Removed the welcome-review button from Settings. Completing the explicit `#/welcome` screen now opens `#/` (main IMMIGRA screen), never Settings. Practice deep links still resume their original destination. This direct request supersedes the attached master plan’s suggestion of a Settings review button. Master plan read as a specification; no additional phases or production deployment performed in this correction.

