# Immigra launch operations

## Validated code versus activated services

`npm run build` runs root tests, builds the unified platform and public pages, runs Citizenship quality checks, and validates release files. A failed check exits nonzero before deployment. `npm run verify:production` additionally fails while external checks in `docs/launch-readiness.json` remain unverified. Do not mark a check verified without dated evidence. Passing static checks is not store approval or proof of a live payment.

The repository's default branch is `design/citizenship-visual`. Root workflows run quality on pushes and pull requests and read-only hourly public health checks. GitHub only schedules workflows from its default branch. Configure repository notification recipients and confirm the first scheduled run; no email integration was added.

## Stripe

Use test mode to verify purchase, signed webhook activation, renewal, payment failure, cancellation and expiry; then confirm live configuration with an authorized owner. Never infer success from the return URL. Run `python3 scripts/check-live.py --billing` for read-only diagnostics. `billing_status_unavailable` means the server cannot inspect a provider resource; inspect the private Stripe request reference and key permissions in Stripe, not in public logs. A restricted key may lack account or price read permissions while some payment actions work. Do not disable verification or grant access manually to conceal an error.

Deletion stops future renewal only for a linked web subscription whose customer and user ownership are verified by the server. If cancellation fails, deletion reports a recoverable failure and privacy support can handle the request. Cancel Apple/Google purchases through the store. Existing invoices and legally required payment records may remain. Test the full deletion path in Stripe test mode before broad paid promotion.

## Reports and moderation

Users can report AI content in the app, including after their premium trial ends. The report is stored in the existing server-only usage table under `ai_content_report`; no new database migration is required. The description and explicitly authorized excerpt are AES-GCM encrypted with a purpose-separated key derived from the server secret. Never place raw report contents in ordinary logs. Report metadata are separate from ordinary content-free cost events.

The API allows five reports per account per hour, shares persistent server-side rate limits, and returns confirmation only after storage succeeds. The server removes expired reports at startup and every six hours while running. Operator inactivity or downtime can delay cleanup. Export and deletion include the account's reports. Reusing an id avoids ordinary retry duplicates; this is not a cross-server transactional uniqueness guarantee.

Use `node scripts/review-ai-reports.mjs` only in a private operator shell with existing server configuration. Its output may include content explicitly submitted by a user and must not be copied into public issues. Review reports regularly, classify problems and change prompts/filtering with regression tests. `docs/operations/metrics.sql` contains content-free aggregate queries for costs and conversion.

## Backups and incidents

Confirm the Supabase project's actual backup/PITR plan. A free plan or the existence of an export button does not establish a recoverable production backup. Use an encrypted off-site database backup and test restoration into an isolated non-production project. Include authentication, storage objects and configuration in the documented recovery scope; a database-only dump does not cover every provider resource.

A supported operator backup command is `python3 scripts/backup-database.py --service immigra --recipient AGE_PUBLIC_RECIPIENT --output /private/immigra.backup.age`. It requires installed `pg_dump` and `age`, a verified age recipient, and a private PostgreSQL service/password configuration. Configure `sslmode=verify-full` and the provider CA in that service. Do not put a password in command arguments or commit credential files. The script does not create plaintext backup files and removes incomplete encrypted output on failure. This environment has no production database credentials, so no backup or restoration is claimed.

For incidents: inspect `/healthz`, the last deployment and public configuration; protect current user data; roll back a failed release; investigate supplier status; record only non-sensitive error codes. Restore only to a separate test project before choosing a production recovery action. Record who can access Render, Supabase, Stripe, GitHub and the domain; enable MFA and keep recovery codes private. Rotate credentials if exposure is confirmed.

## Cost controls

Keep the seven-day email-first trial and unlimited practice policy. Burst limits and the session duration cap are technical protections, not daily practice quotas. Enable provider billing alerts and an operator budget; measure tokens, audio duration and request counts against actual invoices. ChatGPT subscriptions do not cover OpenAI API usage. Use the existing remote AI feature switches or `DISABLED_AI_FEATURES` to stop an affected feature during an incident. Do not advertise a profit margin without measured data.

## Native package and store submission

The native configuration retains the stable technical ID `us.citizenshipai.app`, displays Immigra and packages `../../dist`, the unified root build. Run `npm run native:sync:android` or `npm run native:sync:ios` from the root. The latter requires a Mac/Xcode/CocoaPods. Package signing, physical devices and store uploads are external tasks.

Native API requests use HTTPS to `https://immigra.site`, not the WebView's localhost server. Native trial credentials are signed, stored through secure system storage and never grant verified-private-account privileges. Add `us.citizenshipai.app://auth-callback` to Supabase's allowed redirect URLs before device testing. App URL handlers exchange tokens through the existing provider; no password is stored. Universal-link association is not configured because an Apple team ID and published Android certificate fingerprints have not been supplied.

App Store and Google Play copy is prepared under `modules/citizenship/app-store` and `modules/citizenship/google-play`. Kevin Medina is the operator; review telephone, developer-team signing, app records and review-account access still require the owner. Verify privacy/data-safety declarations against the actual built app and SDKs. Re-capture screenshots from the unified app; old CitizenshipAI screenshots are not submission assets for this release.

Native purchases and restoration remain disabled. Register monthly and annual products in each store, implement and test store purchase/restore and server verification with real registered products and provider credentials, and complete renewal/refund/revocation notifications before offering a paid native app. Stripe web checkout is not exposed in native builds. Do not claim store readiness while these gates are open. Suggested product IDs for registration: `immigra.pro.monthly` and `immigra.pro.annual`; these are planned names, not registered products.

## Public information and promotion

Public privacy, terms, support and deletion pages are available in English and Spanish without an account. Module landing pages, sitemap, robots.txt and the original social-preview image are generated at build time. Submit the sitemap to Search Console and review real indexing. Measure visits, first practice, trial expiry, paid conversion and cancellation without sending documents or personal answers to advertising analytics. Use educational claims; never promise approval, official affiliation or legal advice. Obtain explicit permission before using customer testimonials or case information.
