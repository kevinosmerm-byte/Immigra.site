# Review submission and moderation — NOT deployed
The current UI only prepares an in-memory draft. It does not submit, persist, queue or publish a review. Private preview examples are explicitly labelled synthetic; the normal application renders an empty approved-review state. No customer photos or aggregate rating is fabricated.

Before enabling real submissions, obtain separate authorization for backend/database work:
- Server validation: rating integer1–5 (no default5), comment1–500 characters, display name optional max40, language allowlist. Do not solicit immigration-case details.
- Server-owned pending/approved/rejected states; public query returns approved records only. Client cannot set moderation state or approve its own record.
- Approval must use an existing verified owner/admin identity and server authorization; do not add a public admin switch or infer authorization from a display name/email supplied by a client.
- Rate limiting/abuse controls, CSRF/auth decision, consent/privacy text, retention and deletion policy, moderation audit log, HTML escaping and pagination require review before activation.
- Only approved real reviews enter public rating aggregates. Optional photos require consent and controlled upload; use generic illustrative avatars otherwise.

No schema migration, database/RLS change, admin credentials or service configuration has been applied or created as executable rollout work in this revision.
