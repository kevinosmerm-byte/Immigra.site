# Immigra.site — App Store Connect copy-and-paste guide

Use this sheet when the Apple Developer membership shows the paid team and the app record can be created. Public-facing copy is already stored in `metadata.json`; this guide covers the remaining App Store Connect questionnaires without inventing owner information.

## App record

| Field | Value |
| --- | --- |
| Platform | iOS |
| Name | Immigra.site |
| Primary language | English (U.S.) |
| Bundle ID | `us.citizenshipai.app` |
| SKU | `citizenship-ai-ios-1` |
| Primary category | Education |
| Secondary category | Reference |
| Privacy policy URL | `https://immigra.site/#privacy` |
| Support URL | `https://immigra.site/#privacy` |
| Marketing URL | `https://immigra.site/` |

The legal name, review telephone number, copyright owner, tax information and agreements must be entered by the account owner.

## App Review information

- Sign-in required: **No** during the launch promotion.
- Demo account: **Not required** for this build.
- Review email: `info@immigra.site`
- Review contact name and phone: **ACCOUNT HOLDER MUST ENTER**.
- Notes: copy `review.notes` from `metadata.json` without removing the independent-product, microphone, camera, prerecorded-podcast, USCIS Sandbox or inactive-payment disclosures.

Suggested reviewer path:

1. Open the app and continue through the promotional access screen.
2. Open **128 Questions** to test study cards, practice and quiz without permissions.
3. Open **Writing Practice** for a typed exercise.
4. Open a spoken exercise and accept microphone access only when prompted.
5. Open **Podcasts** and play either prerecorded episode.
6. Treat **Live Avatar Beta** as optional; it shows a consent notice before requesting camera or microphone access.

## App Privacy questionnaire

The answers below match the current privacy manifest and application disclosures. Reconfirm them after any provider, analytics, advertising, payment or retention change.

| Data type | Collected | Linked to identity | Tracking | Purpose |
| --- | --- | --- | --- | --- |
| Email address | Yes, when the user chooses account sign-in | Yes | No | App functionality |
| User ID | Yes, for an authenticated account | Yes | No | App functionality |
| Product interaction | Yes | Yes | No | App functionality; analytics |
| Other user content | Yes, while processing typed practice or conversation input | Yes | No | App functionality |
| Audio data | Yes, when the user starts a spoken exercise | Yes | No | App functionality |
| Photos or videos | Yes, only for the optional live-avatar session | Yes | No | App functionality |

Current build declarations:

- Data used to track the user: **No**.
- Third-party advertising: **No**.
- Advertising SDK present: **No**.
- Payment SDK active: **No**.
- Microphone use is initiated by the user for speaking, transcription and conversation practice.
- Camera use is optional and limited to the consented live-avatar experience.
- Practice content may be processed by OpenAI; live-avatar content may be processed by D-ID; authentication and account data may be processed by Supabase. Provider handling is described in the public privacy policy.

## Age rating and content declarations

Complete Apple's current questionnaire using the actual build. The present app contains educational civics and language-training material and does not intentionally contain gambling, contests, sexual content, graphic violence, alcohol/tobacco/drug promotion or unrestricted web browsing.

Important disclosures:

- The app includes conversational AI and user-generated prompts, but it is a guided educational experience.
- External links lead to official or educational resources and open outside the app.
- Immigration information is educational and is not legal advice.
- Do not select a lower rating by hiding the AI or optional live-avatar capabilities.

## Export compliance

`ITSAppUsesNonExemptEncryption` is set to `false` in the iOS app. Answer the App Store Connect encryption questions consistently with the released binary and Apple's current wording. Re-evaluate this declaration if custom cryptography is ever added.

## Screenshot plan

Capture these screens from the final signed build, with no personal data, debug overlays or permission dialogs:

1. Home — “Your interview. Your future.”
2. 128 Questions — bilingual study card
3. Sarah — conversational English practice
4. Real Interview — guided rehearsal
5. Writing and speaking practice
6. Podcasts — English and Spanish episodes

Create separate English (U.S.) and Spanish (U.S.) sets. Use App Store Connect's dimensions for the selected current iPhone display sizes; do not resize browser screenshots and present them as native-device captures.

## Final release gates

- Paid Apple Developer team is visible in Xcode and App Store Connect.
- App record exists with the exact bundle ID.
- Owner name, phone and copyright are complete.
- Agreements, tax and banking status are complete where applicable.
- Real-iPhone permission, audio, keyboard, safe-area and external-link tests pass.
- The archive validates and reaches TestFlight.
- App Privacy and age-rating answers are reconfirmed against the uploaded build.
- English and Spanish screenshots are uploaded.
- TestFlight smoke test passes before review submission.

