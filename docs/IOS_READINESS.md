# Citizenship AI iOS and App Store readiness

## Completed foundation

- Native Capacitor iOS project in `ios/`
- Stable bundle identifier: `us.citizenshipai.app`
- App name: `Citizenship AI`
- Version foundation: `1.0` / build `1`
- Production web assets embedded in the native project
- Swift Package Manager integration for Capacitor plugins
- Native text-to-speech plugin registered
- Approved Citizenship AI icon installed as the 1024px App Store icon
- Branded dark launch artwork installed
- Microphone and optional-camera privacy descriptions added
- Export-compliance declaration added for standard/exempt encryption use
- Server-authoritative AI sessions, quotas, remote feature controls and launch-promotion controls verified in production
- Reward-credit and provider-neutral subscription foundations prepared, with advertising and payments intentionally inactive

## Repeatable sync workflow

From the repository root:

```bash
npm ci
npm run quality
npm run ios:sync
```

On a Mac:

```bash
npm run ios:open
```

Do not add credentials, signing certificates, provisioning profiles, API keys, or `.p8` files to Git.

## Required Mac and Xcode handoff

1. Use the current App Store-supported version of Xcode and iOS SDK.
2. Open `ios/App/App.xcodeproj`.
3. Select the `App` target and the owner's Apple Developer team.
4. Confirm the bundle identifier remains `us.citizenshipai.app`.
5. Let Xcode manage signing for the first device/TestFlight build.
6. Test on a real iPhone: microphone permission, denied-permission paths, native speech, podcast audio, background/foreground resume, keyboard, safe areas, external links, and D-ID consent/connection.
7. Increment the build number for every uploaded archive.
8. Archive using a generic iOS device, validate the archive, and upload it to App Store Connect/TestFlight.

## App Store Connect preparation

- Create the app record with bundle id `us.citizenshipai.app`.
- Use the exact public privacy policy and support contact already shown in the application.
- Complete App Privacy using the actual OpenAI, D-ID, USCIS, Cloudflare, and Render data flows.
- Complete the current age-rating questionnaire.
- Explain that microphone access is user initiated for spoken practice.
- Explain that camera access is optional and limited to the D-ID live-avatar experience.
- Disclose that the app is an independent educational service and is not USCIS or legal advice.
- Prepare current iPhone screenshots in English and Spanish.

## Release blockers outside this Windows workspace

- Apple Developer Program membership and team selection
- Apple distribution signing and provisioning
- Real-iPhone validation
- Xcode archive and TestFlight upload
- App Store Connect agreements, privacy answers, age rating, metadata, screenshots, and review submission

These steps require a Mac and the account owner. The project contains no signing credentials.
