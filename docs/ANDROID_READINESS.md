# Immigra.site Android readiness

## Completed foundation

- Stable application id: `us.citizenshipai.app`
- Capacitor web directory: `dist`
- HTTPS-only Android WebView configuration
- Installable PWA manifest and service worker
- 192px and 512px maskable PNG icons derived from the approved app mark
- Automated core-domain and mobile-readiness checks
- Production build remains the single source for web and Android

## Installed local toolchain

- Android Studio Quail 4
- Microsoft OpenJDK 21
- Android SDK Platform 36, 36.1, and 37
- Android Build Tools 36
- Capacitor Core, CLI, and Android 8.5.2
- Generated native project in `android/`

Google Play requires new apps and updates to target Android 16 / API 36 beginning August 31, 2026. This project compiles and targets API 36.

## Native review before release

- Declare microphone permission because voice answers are recorded for transcription.
- Declare camera permission only if the D-ID live panel exposes camera input in the Android build.
- Explain each sensitive permission immediately before the operating-system prompt.
- Confirm denial paths: reading, writing, civics, podcasts, and non-live interviews must remain usable.
- Target API 36 and test Android 12 through Android 16.
- Convert the approved PNG mark into Android foreground/background adaptive resources and add a branded splash screen after the native project is generated.
- Verify system Back, keyboard resizing, safe areas, audio focus, and app resume behavior.
- Complete Google Play Data safety using the published Privacy Policy as the source of truth.
- Produce a signed Android App Bundle only after real-device testing.

## Build workflow

1. Run `npm run quality`.
2. Run `npx cap sync android`.
3. Open the native project with `npx cap open android`.
4. Let Android Studio complete Gradle sync.
5. Build and test a debug APK before configuring the release signing key.

The Codex sandbox blocks Gradle's local daemon socket, so the final Gradle build must run inside Android Studio or a normal local terminal. TLS verification remains enabled throughout the toolchain.
