# Immigra — Android readiness

The current submission instructions and unresolved gates are in [`stores/OWNER_CHECKLIST.md`](../../../stores/OWNER_CHECKLIST.md) and [`stores/PRIVACY_AND_RATING.md`](../../../stores/PRIVACY_AND_RATING.md).

## Native foundation

- Application ID: `us.citizenshipai.app`.
- Capacitor embeds the unified root `dist` via `../../dist`; do not synchronize the standalone Citizenship build.
- Java 21 JDK (including javac), Android SDK Platform 36 and Build Tools 36.0.0 are required. Installed tools vary by machine.
- Gradle 9.6.0 uses the official binary distribution and a verified SHA-256.
- HTTPS WebView, microphone permissions, secure session storage and auth callback integration are configured. Device behavior still requires testing.

## Build from repository root

```sh
npm ci
npm run native:sync:android
npm run native:build:android
```

The debug APK is `artifacts/native/Immigra-android-debug.apk`. It is for testing, not a signed Play Store release. The native-test-builds workflow can also generate debug packages.

## Release checks

Test Back navigation, keyboard, safe areas, permission denial, audio focus, background/resume, account persistence and native login callbacks on real devices. Declare only permissions actually used in the final build. Complete Data safety and the content questionnaire against all three modules, including sensitive asylum scenarios.

Native billing, server verification, purchase restoration and subscription notifications are not enabled. Complete them before selling native digital access. Produce a signed AAB with the owner’s upload key and Play App Signing only after device testing. Personal-account closed-testing requirements depend on the account creation date; see the owner checklist.
