### 🧠 Advanced AI Brain Diagnostic Ledger

* **Target File / Component:** `shared/AsylumPreparation.jsx`, `shared/PlatformHeader.jsx`, `shared/interview-ui/ConversationInterview.jsx`, `shared/interview-ui/interviewer-media.mjs`, `services/ai/interview-engine.mjs`.
* **Deep User Experience Impact (Pros & Cons):**
  * *Pros:* Existing shared calls already follow actual audio playback events. The official civics evaluator, N-400 concepts and asylum case engine remain intact. Separate module colors are citizenship blue, asylum purple and residency green.
  * *Friction Points:* Mobile CSS hid account and settings buttons. Personal asylum practice required separate PDF import, setup and repeated permission screens. The default N-400 entry bypassed its interviewer selector. Publishing to the other repository did not update immigra.site.
* **Root-Cause Architectural Failure:**
  * The live HTML referenced `index-C1guRYAd.js`, reproduced by a clean build of `immigration-ai/design/citizenship-visual@d754256`. Cloudflare Pages publication of `Immigra.site` is a separate application. Production domain verification must follow publication.
  * Historical rules in `src/style.css` and `shared/design-system/platform.css` explicitly hid mobile header actions. The new accessible header uses visible icon/text buttons and important Tailwind utilities.
  * Prepared asylum entry now uses the existing authenticated analysis API, reads every supported PDF page locally, and starts the existing interview through one explicit voice/context authorization. Scanned, oversized and incomplete imports fail visibly. Cancellation aborts pending work. No story is persisted by this new flow.
  * Interviewer identity previously normalized every choice except Kevin to Sahara. William is now retained through all three entry routes and the server chooses his own `echo` voice. Kevin retains `cedar`; Sahara retains `marin`. The selected Spanish/English language, evaluation rules and question engines are unchanged.
  * Prerecorded video state follows actual speaking/listening events, not a guessed duration. Uploaded H.264 720×1280 media was remuxed without re-encoding; original file audio was removed so it cannot overlap AI speech. Versioned shared URLs avoid stale cached Kevin media.
* **Production-Grade Implementation:**

```js
export const INTERVIEWERS = [{id:"sarah",name:"Sahara"},{id:"kevin",name:"Kevin"},{id:"william",name:"William"}];
export function interviewerLabel(name){return INTERVIEWERS.find(x=>x.id===String(name).toLowerCase()||x.name.toLowerCase()===String(name).toLowerCase())?.name||"Sahara";}
export function interviewerMediaBase(name,requestedBase,baseUrl='/'){
 if(/^william$/i.test(name))return `${baseUrl}interviewer/william-20261014/`;
 if(/^kevin$/i.test(name))return `${baseUrl}interviewer/kevin-20261014/`;
 return /^(sarah|sahara)$/i.test(name)?`${baseUrl}interviewer/`:requestedBase||`${baseUrl}interviewer/`;
}
```

Legal disclosures are provided in English and Spanish in Settings: Kevin Medina is the operator; Immigra is educational, not a law firm, provides no legal advice or representation, guarantees no outcome, and recommends a licensed immigration attorney or authorized DOJ-accredited representative. Limitations of liability preserve mandatory statutory rights. AI/provider processing, readable exports and subscription cancellation are disclosed. These changes are implementation and writing work, not certification by a lawyer.

Validation:

- Root suite: 196 passing tests, including all three avatars, both languages, all modules, distinct voices, cancellation, full-document chunking and rejection of fabricated quotes.
- Citizenship `npm run quality`: 280 passing tests plus type/lint/build and existing mobile/iOS/store-metadata checks. These checks do not constitute app-store approval.
- Official source extraction verified 128 questions and 410 answer bullets. No official bank or question-engine changes.
- Browser at 375px: visible account/settings; real two-page PDF import, authorized automatic analysis and direct Kevin/William calls in English and Spanish; William selection retained in civics, N-400 and residency setup. Provider requests use controlled fixtures without paid calls or real case data. Original microphone testing was reported as complete by the user.
- Build succeeds. Existing bundle-size warning remains; no claim of improved loading time.
- `connected-apps/manifest.json` had stale engine/bank checksums before these changes. They were reconciled against deployed commit d754256 and verified official extraction, alongside explicitly approved replacement Kevin media. Verification assertions were not disabled.
- `public/immigra-release.json` identifies this release for public-domain verification. Production status is only confirmed after the live domain serves the new release and matching media; a GitHub push alone is not proof.

Limits: OCR is not part of this new importer. PDFs must contain selectable text and be at most 40 pages, 10 MB and 30,000 extracted characters. Analysis processes the complete supported document in chunks; the existing conversation-context limit remains 6,000 characters. Videos illustrate speaking/listening and do not provide word-level lip synchronization. No database migration is required for these changes.

Production verification completed after Render's automatic deployment of code commit `5b68401`:

- `https://immigra.site/immigra-release.json` returned HTTP 200 and the release `2026-10-14-friendly-intake-three-interviewers`.
- Live HTML changed from `index-C1guRYAd.js` to `index-DJHZDMUH.js`. The latter was downloaded with TLS verification and matched the tested local build byte-for-byte (SHA-256 `9e7f755120d8f40b8e749ef7412a875f248dfc730e07039e0bba96d470e9313c`).
- Both Kevin and both William versioned videos returned successfully and matched the prepared files byte-for-byte.
- Public interview status reported `ready: true`, `authentication_required: true`, `testing_access: false`. No paid production interview request was made.
- Local browser playback decoded William at 720×1280 and passed repeated speaking/listening transitions. A separate browser navigation to production encountered the cloud session's certificate trust error; TLS verification was not disabled. Production delivery was verified through the correctly configured curl trust store instead. This limitation is not evidence of a certificate problem for ordinary users.

Cloud setup for this checkout:

```sh
npm_config_cache=/workspace/.npm-cache npm ci
npm test
npm run build
npm --prefix modules/citizenship run quality
npm run dev -- --port 5174
```

Use the inherited proxy and CA trust. A writable npm cache avoids the default cache permission failure without disabling package integrity checks. Official extraction additionally requires Python with `pypdf`: run `python scripts/extract-official-civics.py --check` from `modules/citizenship`.
