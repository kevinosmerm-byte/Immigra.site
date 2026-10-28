# Civic provider integration

The existing civic location service, civic profile store and dynamic answer resolver are extended; static official USCIS questions and answer lists are unchanged. Flashcards, quizzes and deterministic civics grading consume the same resolved profile without issuing provider calls.

## Providers and evidence

| Provider | Purpose | Configuration | Evidence |
| --- | --- | --- | --- |
| Census Geocoder | Address to verified state, federal/state districts and coordinates | None | https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.pdf |
| Congress.gov v3 | Current federal senators/representative, including at-large district zero | `CONGRESS_API_KEY`, server only | https://github.com/LibraryOfCongress/api.congress.gov/blob/main/Documentation/MemberEndpoint.md |
| Open States / Plural v3 | State legislators at Census coordinates | `OPENSTATES_API_KEY`, server only | https://github.com/openstates/openstates-api-v3/blob/main/api/people.py |
| Governor feed adapter | Explicit current, active governor records from an authoritative source | Optional `GOVERNOR_DATA_URL`, server only | An actual verified feed must be supplied; there is no invented default endpoint. |

Congress documentation specifies currentMember=true, chronological chamber terms, district 0 for at-large seats, a maximum list page size of 250 and 5,000 requests/hour. API secrets use headers and are excluded from request URLs, profile payloads and logs.

Open States people.geo requires latitude/longitude and an API key. Its official source explicitly excludes governors/mayors, so it is never used to guess a governor. Nebraska's unicameral `legislature` roles resolve to state senator. Federal results and other states are excluded from state-legislator results. Open States records carry provider provenance and government links when available; they are not falsely labeled as an official government feed.

Google's current official discovery contains divisions/elections and no representatives/representativeInfoByAddress: https://github.com/googleapis/google-api-nodejs-client/blob/main/discovery/civicinfo-v2.json . Google divisionsByAddress is therefore optional future geographic integration; no permanently discontinued representative endpoint or unnecessary Google key is required.

## Profile and refresh behavior

POST `/civic-location/profile` accepts `{address,zipCode,previousProfile?,addressUpdatedAt?}` and delegates to `resolveCivicProfile`. The response preserves existing `district`, `representative`, `senators`, `governor` compatibility fields while adding canonical official records, state legislative districts, sources and verification dates per record. Addresses and coordinate fields are omitted from the display profile. The request address is only used for Census; verified coordinates are sent to Open States when configured.

The app-wide `useCivicProfile` hook reuses confirmed UserProfile/N400 address data before the Brain resolves any question. It refreshes centrally when location changes, records are missing or stale, with a ten-minute failed/incomplete-attempt cooldown. Opening a flashcard does not issue requests. The existing civic store publishes account-scoped updates; the civic editor's manual refresh uses the same request coordinator. A changed address bypasses the cooldown and supersedes earlier lookups, so a late response cannot overwrite a newer location.

While a changed location is unresolved, a synchronous profile view removes the previous district, congressional representative and state legislators from display/grading. Statewide senators/governor may remain when the supplied state is explicitly the same; changed states or changed ZIPs without a confirmed same state also suppress previous statewide answers. The original verified records stay in the existing store as dated fallback, and age alone never invalidates facts. Once the address fingerprint matches the stored verified lookup, valid records are exposed again. Editing the location explicitly updates the caller's existing private user profile. Addresses are not copied into civic storage or analytics.

The server cache uses SHA-256 keys, a 300-entry bound, shared in-flight lookups, LRU eviction and provider-specific expiry (Census seven days; officials one day). Previously verified values remain available after a refresh failure with their original verification dates. ProviderHealth tracks success/failure timestamps and consecutive failures server-side only. Both cache and health are process-local: restart loses the cache; multi-instance deployments should use a shared backing store if needed. Persisted user civic profiles remain the durable fallback.

A changed federal district clears the previous representative. Senators can survive a same-state address change. State legislators are retained only when both known legislative district identifiers still match. A verified governor record supplied by a provider takes precedence over the previously verified NGA roster. The NGA roster remains a dated fallback, retaining its actual 2026-09-30 verification date; no successful Census lookup relabels a governor record as freshly verified. Legacy compatibility records retain original verification metadata.

## Governor feed contract

`GOVERNOR_DATA_URL` must be an actual HTTPS authoritative JSON feed under `.gov`, legacy `.state.xx.us`, or the National Governors Association's `nga.org`. Redirects are rejected. Configure only a feed whose published format and provenance have been independently verified. This adapter does not assert that any government currently publishes this exact format.

The JSON is an array or `{officials:[...]}` with entries containing:

```json
{"state":"AK","role":"GOVERNOR","name":"Name from the verified source","active":true,"sourceUrl":"https://gov.alaska.gov/","verifiedAt":"YYYY-MM-DD"}
```

Optional metadata: `id`, `externalId`, `party`, `photoUrl`, `officialUrl`. The source URL must also be authoritative and the supplied verification date must be real and not future-dated. Missing or invalid records do not replace available verified data. Without a configured feed, live governor verification is unavailable and the dated fallback is explicit.

## USCIS investigation and fallback

The existing optional OAuth USCIS API service remains separate. No public scraping, automated MyUSCIS login, CAPTCHA/WAF bypass, proxy rotation or private authenticated API reverse engineering is introduced. The official manual case-status URL is https://egov.uscis.gov/ and public processing information is https://egov.uscis.gov/processing-times/ . Neither processing averages nor inferred journey steps are personal appointment dates.

`createCaseStatusProvider({mode})` provides the common `getStatus(input)` contract in the existing `uscisService.js`. Its default `manual` mode performs no API/network request and returns the official action URL with `requiresUserAction:true`; title, status date and last-check timestamps remain null. It cannot claim an official confirmed status or update CaseProfile. Explicit `official-api` mode reuses `fetchUscisCaseStatus` and the existing granted OAuth configuration, never the public website's internal requests.

The normalized result contains title/description, dates actually supplied by the API, source/sourceUrl, `official`, `isTestData`, confidence and `canUpdateCaseProfile`. Only an explicit production environment with a real returned status and lookup timestamp is eligible to update a real CaseProfile. Sandbox or unknown environment data is marked test data and ineligible. The original response is available as a non-enumerable server-only `raw` property so the existing endpoint can return its compatibility format intentionally; ordinary JSON serialization of the normalized object omits the raw payload. No speculative next step becomes a USCIS status.

The governor adapter is implemented but **no concrete authoritative feed was available or verified**. It is an optional integration point, not a completed live production governor service. Dated fallback remains the actual behavior until a compatible feed is configured and validated.

During this implementation, the environment proxy rejected CONNECT requests to Google developer docs, Census, Open States, USCIS and NGA before reaching the sites. These failures are environment network restrictions and do not establish destination anti-bot behavior, terms or permission for automated public USCIS access. Accessible official GitHub source was inspected for Congress, Open States and Google. Live provider credentials were absent. Current public USCIS flow, protections, quotas and terms therefore remain unverified; the journey must operate using notices/user confirmation plus official links until access can be verified.

## Validation

Deterministic fixtures validate address ambiguity, district zero, current/chamber normalization, source metadata, state/federal separation, stale fallback, provider health, private cache keys, bounds, address reuse, refresh cooldown and dynamic answer precedence. Live credentialed provider checks are separately blocked by missing keys and destination access; fixture success does not imply live connectivity.
