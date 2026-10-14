> La preparación actual de Immigra se describe en [IMMIGRA_STORE_RELEASE.md](../docs/IMMIGRA_STORE_RELEASE.md). Las notas de promoción/pagos inactivos de este documento son históricas y no deben copiarse para el envío actual.

# Citizenship AI — App Store Connect submission sheet

The localized metadata is stored in `app-store/metadata.json` and validated by `npm run verify:app-store`.

The field-by-field privacy, review, age-rating, screenshot and release guidance is in `app-store/APP_STORE_CONNECT_GUIDE.md`.

## App record

- Name: Citizenship AI
- Bundle ID: `us.citizenshipai.app`
- SKU: `citizenship-ai-ios-1`
- Primary language: English (U.S.)
- Primary category: Education
- Secondary category: Reference
- Privacy policy: `https://citizenshipai.us/#privacy`
- Support URL: `https://citizenshipai.us/#privacy`
- Marketing URL: `https://citizenshipai.us/`

The account holder must enter and verify the legal contact name, telephone number, copyright owner, Apple Developer team, tax status and agreements. These details must not be guessed or committed as credentials.

## Localizations prepared

- English (U.S.): name, subtitle, promotional text, description and keywords.
- Spanish (U.S.): name, subtitle, promotional text, description and keywords.
- Screenshot captions should use the same language as each localization.

## Suggested screenshot sequence

1. Home — “Your interview. Your future.”
2. 128 Questions — bilingual study cards
3. Sarah — conversational English practice
4. Interview — realistic guided rehearsal
5. Writing and speaking — focused language practice
6. Podcasts — choose English or Spanish and listen

Capture real app screens without device frames first. Final App Store dimensions will be produced after the first iPhone simulator or physical-device build on a Mac.

## App Privacy answers to review in App Store Connect

The app and its partners may collect data for app functionality and limited analytics:

- Contact information: email address for optional account authentication.
- Identifiers: account/user identifier.
- User content: typed answers, conversational messages, audio, and optional live-avatar camera input for the active feature.
- Usage data: product interaction and privacy-conscious AI usage telemetry.

Declare that the current build does not use data for third-party advertising or cross-app tracking. Confirm every answer against the released build and the final third-party provider configuration before publishing.

## Review preparation

- Sign-in is optional during the launch promotion; no demo account is currently required.
- Microphone and camera paths must be tested on a real iPhone.
- Explain the independent educational purpose and lack of USCIS affiliation.
- Explain that podcasts are prerecorded and the Case Tracker uses USCIS Sandbox data.
- Do not advertise paid subscriptions or rewarded ads in version 1.0; their SDKs are not active.

## Items requiring the account owner or a Mac

- Confirm the app name is available in App Store Connect.
- Create the app record and select the registered bundle ID.
- Enter the review contact telephone number and copyright owner.
- Complete the current age-rating and content-rights questionnaires.
- Select the Apple Developer team and automatic signing in Xcode.
- Test on a real iPhone, archive, validate, and upload to TestFlight.
- Upload localized screenshots and submit the selected build for review.
