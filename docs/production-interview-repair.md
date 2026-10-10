# Production interview repair — 2026-10-10

Status: partial repair, **not an end-to-end voice acceptance pass**.

## Confirmed findings

- The published conversation setup required an account before requesting the microphone. The previous sign-in link returned `otp_expired`. At the owner's request, temporary guest access replaces that requirement only for interview sessions and their dedicated transcription endpoint. Existing account and billing authorization remains intact.
- Production session creation returned HTTP 503 `QUOTA_UNAVAILABLE` in all three modules. The previous implementation called the database REST RPC directly with only an API-key header. The repair uses the existing authenticated Supabase client. In addition, the first guest rollout supplied a global subject shorter than the SQL function's required 32 characters. All quota subjects are now SHA-256 hashes. After these changes, real Responses API calls succeeded in production.
- The browser receiver assumed `event.streams[0]` always exists. It now builds a MediaStream from a streamless remote audio track. This is a confirmed code defect with an automated regression test, not a proven cause on the user's phone.
- The Codex browser's microphone attempt timed out before `MIC_PERMISSION_GRANTED`. No captured audio, OpenAI voice session, WebRTC connection, transcription or audible response was demonstrated in that attempt. A separate microphone-permission timeout now identifies this stage.
- Provider HTTP errors previously collapsed into a generic message. Diagnostics now distinguish request, credential, access and rate-limit failures without recording response bodies.

## Production checks actually performed

On `https://immigra.site`, synthetic text was submitted through the public session API, evaluated by OpenAI and then deleted from server session memory:

| Module | Result |
| --- | --- |
| Citizenship N-400 | Real provider response, validated feedback, follow-up referring to the synthetic context |
| Asylum | Real provider response, validated feedback, related clarification |
| Residency | Two runs rejected an ungrounded evaluation with HTTP 502. A later run returned validated feedback and a follow-up. The simple keyword check did not establish contextual relevance. This is not a stable quality acceptance pass. |

TLS, allowed-origin requests, guest cookie ownership and backend access to Supabase/OpenAI were exercised. No secret values were retrieved. Existing credential values and the Realtime model's account permissions were not directly inspected or proven by the text tests.

Local checks: full project tests, Citizenship quality suite, build; additional tests cover phase evidence, streamless tracks, playback denial, cookie tampering, account isolation and origin denial. These do not substitute for physical-device voice tests.

## Safe diagnostics

Browser console messages prefixed `[interview]` report the ten requested phases. Permission alone never reports captured audio: receipt of a provider speech event confirms the audio path. Playback requires both a browser playback event and an active provider output buffer. Evaluation completion occurs only after a successful validated API result.

Render logs report server session creation, evaluation requests/completions and allowlisted error/status codes. Logs exclude audio, transcript text, prompts, cookies, tokens, user IDs and raw provider errors. Browser-only phases are not uploaded as telemetry. Media playback evidence cannot prove the user's speakers are physically audible.

## Temporary public access

- `shared/interview-ui/access-policy.mjs` enables the temporary policy. Server override `INTERVIEW_PUBLIC_ACCESS=false` closes public endpoints; restore the shared flag and publish to restore account links as well.
- Signed Secure/HttpOnly/SameSite=Strict cookie, 24-hour expiry. Clearing a cookie can create a new visitor allowance, so a persistent global cap also applies.
- 3 sessions and 30 evaluations per visitor/day; global public caps of 100 sessions, 1,000 evaluations and 1,000 transcriptions/day. Maximum session duration is ten minutes.
- Limits fail closed on database failure. Guest identity does not grant access to account records or billing. No permanent personal history is created.
- Account-link generation is temporarily disabled; existing authenticated subscription management is preserved.

## Files

`services/ai/{router,platform,guest-access,interview-engine,asylum-transcription}.mjs`; `shared/interview-ui/{InterviewAIEngine,diagnostics,access-policy}.mjs`; `shared/interview-ui/ConversationInterview.jsx`; `modules/citizenship/src/{Account.jsx,App.jsx,audio.js}`; `src/main.jsx`; regression tests and `scripts/verify-public-interviews.mjs`.

## Reproducible remaining acceptance test

1. Reload the published app in Chrome/Safari over HTTPS. Open developer console and filter `[interview]`. Use fictitious details only.
2. N-400: open the existing **Conversar con IA** flow, authorize processing, select voice and start. Grant microphone permission. Answer Sahara, interrupt once and confirm contextual speech plus displayed feedback.
3. Asylum: start Kevin's existing AI flow. Give a fictional event with a place and date; answer a second turn. Verify a neutral clarification remembering the detail, without a credibility judgment.
4. Residency: start Sahara's existing conversation. State the petitioner's relationship and status; verify that the next question respects that relationship and that each answer receives validated feedback.
5. Confirm all ten phases for each voice test. If a phase is missing, report the last phase and safe error code, not private transcripts. Check mute, pause, resume, speaker playback and the ten-minute close.
6. Separately test the existing civic interview: microphone recording → OpenAI transcription → deterministic comparison with the official bank. This flow is not a Realtime conversation and must not be represented as one.
7. Repeat on iPhone Safari and Android Chrome. Test denied permission, interrupted network and exhausted allowance. A reconnect currently starts a new session; it does not restore discarded private context.

Outstanding: end-to-end voice on all three modules, mobile playback, stable Residency contextual/evidence quality, and durable Realtime termination across process restart. No claim of complete repair is made until those checks pass.
