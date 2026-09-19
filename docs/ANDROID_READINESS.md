# Citizenship AI Android readiness

## Completed foundation

- Stable application id: `us.citizenshipai.app`
- Capacitor web directory: `dist`
- HTTPS-only Android WebView configuration
- Installable PWA manifest and service worker
- Automated core-domain and mobile-readiness checks
- Production build remains the single source for web and Android

## Required local toolchain

Install Android Studio, Java, and Android SDK 36 before generating the native project. Google Play requires new apps and updates to target Android 16 / API 36 beginning August 31, 2026.

After the npm certificate issue is corrected:

1. Install `@capacitor/core`, `@capacitor/cli`, and `@capacitor/android` version 8.
2. Run `npx cap add android`.
3. Build the web app with `npm run build`.
4. Run `npx cap sync android`.
5. Open the native project with `npx cap open android`.

## Native review before release

- Declare microphone permission because voice answers are recorded for transcription.
- Declare camera permission only if the D-ID live panel exposes camera input in the Android build.
- Explain each sensitive permission immediately before the operating-system prompt.
- Confirm denial paths: reading, writing, civics, podcasts, and non-live interviews must remain usable.
- Target API 36 and test Android 12 through Android 16.
- Add adaptive PNG launcher icons and a branded splash screen.
- Verify system Back, keyboard resizing, safe areas, audio focus, and app resume behavior.
- Complete Google Play Data safety using the published Privacy Policy as the source of truth.
- Produce a signed Android App Bundle only after real-device testing.

## Current blocker

The local npm client cannot verify the registry certificate (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`). Do not disable TLS verification. Repair the machine trust chain or configure npm with the organization-approved CA certificate, then install Capacitor normally.
