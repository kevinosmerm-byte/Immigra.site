# Interview AI integration — verification checkpoint

Status: implemented locally; not yet verified with a live authenticated OpenAI conversation. Do not describe this checkpoint as a completed production repair.

## Architecture and changes

- `services/ai/interview-engine.mjs`: shared server engine, `InterviewSessionManager`, structured `InterviewResponseEvaluator`, per-account sessions, neutral module policies, selected residency questions, WebRTC SDP negotiation and server hangup deadline.
- `services/ai/router.mjs`, `platform.mjs`: authenticated routes and existing persistent Supabase quota RPC. The API key stays in the server.
- `shared/interview-ui/InterviewAIEngine.mjs`: shared text/WebRTC transport, automatic voice turns, interruption events, captions, asynchronous reviews, cancellation and retry.
- `ConversationInterview.jsx`, `conversation.css`, `CallView.jsx`: existing call surface, informed consent, voice/text choice, educational review, optional source-context preview and permission, pause, mute, finish, playback recovery. Existing clips illustrate listening/speaking; they are not lip synchronized.
- N-400, Asylum Module and residency RealtimeInterview now connect to this shared surface. Existing local practice remains available. Asylum includes only explicitly opted-in displayed source text, capped at 6,000 characters, excluding country material and AI inference.
- `Account.jsx`: expired-link return now opens Account and explains how to request a new link; sending failures recover the form instead of leaving it pending.

## Endpoints

`GET /api/interview/status` reports configuration readiness, not provider verification.

`POST /api/interview/sessions` validates consent, module, language and transport; requires account authentication. Voice requests contain SDP, and the server forwards it with trusted configuration to OpenAI `/v1/realtime/calls`. Only SDP, local session ID and expiry return to the browser; no API credentials.

`POST /api/interview/sessions/:id/turn` performs structured review with temporary history and `store:false`; validates quotes and enum values. Text mode also returns the next contextual question. Provider failures never create a fabricated evaluation.

`DELETE /api/interview/sessions/:id` clears local server history and calls OpenAI hangup for voice sessions. Ownership is checked server-side.

## Configuration and cost controls

Existing required environment: `PLATFORM_BACKEND_ENABLED=true`, `PLATFORM_AI_ENABLED=true`, `OPENAI_API_KEY`, Supabase URL/secret/publishable configuration and production `CORS_ORIGIN`. Never put the private key in Vite variables.

Optional model overrides: `OPENAI_REALTIME_MODEL` (default `gpt-realtime-2.1`), `OPENAI_TEXT_MODEL` (existing default `gpt-4o-mini`). Input transcription uses `gpt-4o-mini-transcribe`. Model access for the production OpenAI project is not yet verified.

Persistent daily quota: three conversation starts and 30 educational reviews per authenticated account across modules. Starts count even if the provider subsequently fails. One active in-memory session per account per server process, 10-minute timer, 80 history entries / 40,000 text characters, 400 realtime output tokens per response and 1,100 evaluation output tokens. Browser changes cannot change the server timer or quota checks.

These are usage bounds, not a fixed dollar price. Audio and evaluation consume separately billed provider tokens. No new Stripe charges or subscription changes are part of this work.

## Verified

- Main automated suite: 127 passing tests, including 16 new engine/transport tests.
- Citizenship quality command: 232 tests, build and mobile/iOS/store static checks passed.
- Main Vite build passed; existing bundle size and mixed JSON-import warnings remain.
- Local setup UI renders voice/text selection and blocks starting without authentication and consent.
- Browser evidence: old login link returned `Email link is invalid or has expired`. A new login-link request returned the application's send-error state. Neither live domain exposed an authenticated account in the inspected browser.

Mocks verify ownership isolation, temporary memory, quota-before-provider, grounded quotes, failure behavior, server hangup, late microphone cancellation, pause, voice event mapping and delayed-transcript question association. They do not prove real provider comprehension, audio playback or microphone capture.

## Remaining acceptance work

1. Resolve account sign-in/email delivery and establish a valid session without exposing credentials.
2. Deploy the candidate through the existing GitHub/Render workflow; confirm build commit and `/api/interview/status`.
3. Run real conversations in N-400, Asylum and Residency using fictional test answers: incomplete response, retained date, neutral differing-date clarification and uncertainty. Confirm actual provider access and quotas.
4. Test real microphone/audio, interruption, device removal and autoplay recovery on desktop and physical iOS/Android. Static readiness checks are not a substitute.
5. The 10-minute hangup timer is process-local. Abrupt process loss can prevent hangup, and a failed hangup request cannot guarantee immediate provider termination. Durable call lifecycle enforcement is required before claiming a hard cost ceiling across server restarts or multiple instances.
6. Civics remains the existing official-bank deterministic flow; this checkpoint does not convert that flow, reading or writing into a continuous Realtime conversation. It must not be advertised as having completed all requested naturalization blocks.
7. Current final review aggregates actual educational assessments. It does not yet implement a model-generated overall narrative or targeted-topic restart. No numerical clarity scores are invented.

## Deployment commands

Run `npm test`, `npm run quality --prefix modules/citizenship`, and `npm run build`. Use the existing Render build/start configuration (`npm start` / `start-all.mjs`). Verify authentication and database quota RPC before real paid tests. Do not bypass account checks to test production.

## Official API references consulted

- https://developers.openai.com/api/docs/guides/voice-webrtc?voice-api=realtime
- https://developers.openai.com/api/docs/guides/realtime-conversations
- https://developers.openai.com/api/reference/resources/realtime/subresources/calls/methods/hangup
