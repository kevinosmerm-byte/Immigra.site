# White appearance update — October 6, 2026

The requested style uses a plain white page background, subtly translucent button backgrounds, and Public Sans from the U.S. Web Design System. Screen headers now use a white-to-off-white gradient with a slight shadow, and the Home Podcast destination has a translucent red background, red border and icon, and navy text. These treatments apply to the light theme and preserve existing layout dimensions. The existing Home layout, navigation, portraits, and civics artwork are retained from the latest main revision (`023e139`); the supplied Home video was updated separately.

`src/WhiteStyle.css` loads last and uses a CSS cascade layer to override the legacy appearance rules without changing layout dimensions. `src/BrandPalette.css` defines the white background and alpha colors. Only button backgrounds are translucent; their text and icons remain legible. Controls over photographs use a high-alpha white surface. Active recording keeps its red background and white text/icons.

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
