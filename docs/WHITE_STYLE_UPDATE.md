# White appearance update — October 6, 2026

The requested style uses the supplied White House image across screen backgrounds, translucent color gradients on button backgrounds, and Public Sans from the U.S. Web Design System. Screen headers use a white-to-off-white gradient with a slight shadow. Home destinations have distinct gradients: federal blue for N-400, AI blue for Civics, navy for Immigration Help, blue-to-soft-red for Writing, and red for Podcast. Podcast retains its red border and icon, and navy text. Shared primary and selected buttons use their own gradient variables; recording, success and error states keep their semantic colors. These treatments apply to the light theme and preserve existing layout dimensions. The existing Home layout, navigation, portraits, and civics artwork are retained from the latest main revision (`023e139`); the supplied Home video was updated separately.

`src/WhiteStyle.css` loads last and uses a CSS cascade layer to override the legacy appearance rules without changing layout dimensions. `src/BrandPalette.css` defines the background and alpha colors. One fixed, noninteractive background layer serves every route, including onboarding, Pro, loading and recovery screens, behind transparent outer screen shells. A 45% white veil softens the supplied image; Dark uses a 94% dark veil while retaining its existing surfaces and text. Gradient buttons have an 82% white underlay to protect their contrast over the flag. Text and icons keep their opacity, photograph controls retain their paired surfaces, and recording keeps its red background with white text/icons.

The original PNG from `citizenshipai-background-whitehouse.zip` is copied unchanged to `public/citizenshipai-background-whitehouse-1dcb5b04.png`: 1734×907, 959,665 bytes, SHA-256 `1dcb5b04e568b5db47e9c7cf28215bc4e7be89a93dfeeff97b18b7c641f45cfe`. It is displayed at full viewport width, aligned to the bottom without stretching its proportions. Service worker cache `citizenshipai-shell-v6` precaches the image and preserves the three Public Sans fonts for offline use.

Focused background review also normalizes light-theme completion scores and review-panel text/surfaces, restores readable Podcast header text, and adds a translucent white backing to the journey's official links and note where they cross the flag. Completion content, results and navigation behavior stay unchanged.

Public Sans weights 400, 600, and 700 are served locally. Original files, license, upstream URLs, and checksums are recorded in `public/fonts/public-sans/`. The service worker caches these fonts for offline use. Public Sans has USWDS provenance; individual government sites use different fonts.

The white design is applied once to older theme preferences, recorded by `citizenshipai.appearance.v2`. Subsequent explicit Light, Dark, and System selections in Settings persist normally. Clearing local application data also clears the appearance marker.

| Verification | Result |
| --- | --- |
| `npm run quality` | PASS; 232 tests, lint, production build, mobile/iOS/store checks |
| Typecheck and original USCIS PDF extraction | PASS; 128 questions and 410 official answer bullets |
| Appearance matrix | 288/288: 24 route states, EN/ES, stored Light/legacy Dark, 320/820/1440px |
| Focused axe accessibility | 80/80: 20 route states at 390px; zero reported violations |
| Initial preferences/onboarding and actual Settings interactions | 7/7 each |
| Recording presentation and mocked avatar recovery | 3/3 and 2/2 |
| Production build browser checks | 24/24: 20 route renders plus font-cache and runtime checks |
| Offline production font check | 4/4; all three WOFF2 files fetched successfully with browser network disabled |

Browser evidence is retained in `/workspace/.citizenshipai-qa/white-artifacts/` (`WHITE_UI_QA.md`, `final-matrix.json`, `final-axe.json`, screenshots and interaction records). Compiled-build evidence is in `/workspace/.citizenshipai-qa/artifacts/white-style/production.json` and `production-offline.json`; its harness is `/workspace/.citizenshipai-qa/white-production.mjs`.

This verifies presentation and theme persistence. It does not establish live media, microphone, paid-provider, payment, or native-device behavior. Earlier layout issues such as small existing controls and floating navigation/mascot overlap are recorded separately in the browser report; this update preserves the current layout.
