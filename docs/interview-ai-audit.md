# Interview AI audit — 2026-10-10

Before changes, production `services/ai/router.mjs` deliberately returned 503 for `/api/realtime/session`; its status was `MODULE_POLICY_NOT_CONFIGURED`. The residency WebRTC client therefore stopped before microphone capture. The separate `server/realtime.mjs` implementation was not mounted by `start-all.mjs`'s production backend.

N-400 uses MediaRecorder → `/api/transcribe`, deterministic N-400 flow, browser speech, and a separate opt-in `AnswerFeedback`. Asylum bridges a generated local engine into `CallView`, with recording → server transcription, a manual Continue action, and the same separate feedback form. Neither path feeds previous conversation into a conversational model. Feedback permission resets on every answer. These are functional distinctions, not proof that a production provider request succeeds.

Residency text practice calls `/api/residency/conversation` with six previous turns and a bounded grounded-quote schema. It is not live voice. Its separate beta interface connects to the disabled endpoint above.

`CallView` plays existing muted listening/speaking clips. Those clips are visual states, not lip synchronization. Its microphone and keyboard were disabled during speaking/recording, which conflicts with continuous voice interruption and typed input.

Shared Supabase authentication is required by the paid endpoints. Inspection of both live domains showed the email login form, not an authenticated account. The user's sign-in link targets the Render hostname. An end-to-end paid test is still unverified; configured environment readiness alone proves neither account access nor provider success.

Civics grading intentionally remains deterministic against the official bank, per the module's AGENTS.md. Speech and conversational personal-answer review are separate; no model should invent civics facts or grade eligibility.

Implementation direction: one authenticated, quota-controlled session service; server-issued WebRTC SDP with a server hangup deadline; one transient session history and validated structured evaluator; shared browser transport and avatar states connected to existing module entry points. No recordings or personal transcripts in logs, disk, or localStorage. Real calls and microphone tests must be reported separately from mocks.
