# Immigra — App Store Connect submission sheet

The localized metadata is stored in `app-store/metadata.json` and validated by `npm run verify:app-store`.

The field-by-field privacy, review, age-rating, screenshot and release guidance is in `app-store/APP_STORE_CONNECT_GUIDE.md`.

## App record

- Name: Immigra
- Bundle ID: `us.citizenshipai.app`
- SKU: choose an unused Immigra SKU when creating the app record.
- Primary language: English (U.S.)
- Primary category: Education
- Secondary category: Reference
- Privacy policy: `https://immigra.site/privacy`
- Support URL: `https://immigra.site/support`
- Marketing URL: `https://immigra.site/`

Kevin Medina is the confirmed operator. The account holder must verify the review telephone, copyright owner, Apple Developer team, tax status and agreements. These details must not be guessed or committed as credentials.

## Localizations prepared

- English (U.S.): name, subtitle, promotional text, description and keywords.
- Spanish (U.S.): name, subtitle, promotional text, description and keywords.
- Screenshot captions should use the same language as each localization.

## Suggested screenshot sequence

1. Unified home — citizenship, asylum and residency.
2. 128 Questions — bilingual study cards
3. Sahara, Kevin and William — interview selection.
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

- Free study is open. Email-first premium trial lasts seven days from first premium use. Supply a reviewer account with stable access and test instructions; do not rely on a trial that may expire during review.
- Microphone and camera paths must be tested on a real iPhone.
- Explain the independent educational purpose and lack of USCIS affiliation.
- Explain that podcasts are prerecorded and the Case Tracker uses USCIS Sandbox data.
- Native purchases and restore are not activated. Before selling digital access in the native app, register products and implement store billing, server verification and notifications. Keep Stripe checkout gated to web.

## Items requiring the account owner or a Mac

- Confirm the app name is available in App Store Connect.
- Create the app record and select the registered bundle ID.
- Enter the review contact telephone number and copyright owner.
- Complete the current age-rating and content-rights questionnaires.
- Select the Apple Developer team and automatic signing in Xcode.
- Test on a real iPhone, archive, validate, and upload to TestFlight.
- Upload localized screenshots and submit the selected build for review.

## Current release gate

Use `docs/operations/LAUNCH.md` and `docs/launch-readiness.json` at repository root. Build the unified app, not the old standalone Citizenship build. Existing screenshot archives are historical assets and must be re-captured from the current app before submission. Static validation does not replace device, payment or store review.
