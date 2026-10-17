# Immigra — iOS readiness

Current submission instructions: [`stores/OWNER_CHECKLIST.md`](../../../stores/OWNER_CHECKLIST.md). Privacy and rating guidance: [`stores/PRIVACY_AND_RATING.md`](../../../stores/PRIVACY_AND_RATING.md).

## Native foundation

- Bundle ID: `us.citizenshipai.app`; display name: Immigra.
- The Capacitor project embeds the unified root `dist` via `../../dist`.
- Swift Package Manager includes Capacitor App for authentication callbacks, secure storage and text-to-speech.
- Native microphone/camera purpose descriptions, localized permission messages and privacy manifest are included.
- Static checks verify project configuration; they do not establish signing, device behavior or App Store approval.

## Build from repository root on macOS

```sh
npm ci
npm run native:sync:ios
npm run native:build:ios
open modules/citizenship/ios/App/App.xcodeproj
```

The test command creates an unsigned simulator ZIP. It cannot be uploaded to App Store Connect. Xcode, an appropriate installed iOS SDK and macOS are required. The native-test-builds workflow provides a separate GitHub-hosted Mac build path; it does not connect to MacinCloud.

## Remaining release gates

The owner must select the Apple Developer team, verify agreements and app records, sign and archive in Xcode, test a real iPhone and upload to TestFlight. Test permission denial, audio, keyboard, safe areas, background/resume, persistent account access and `us.citizenshipai.app://auth-callback`. Register that redirect in Supabase and verify it on a device.

StoreKit purchases, server validation, notifications and restoration remain disabled and require implementation and Sandbox testing. Provide stable reviewer access, current native screenshots, and privacy/age-rating answers that include asylum and AI content. Never commit signing credentials, provisioning profiles, API keys or private account data.
