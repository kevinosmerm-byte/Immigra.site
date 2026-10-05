# Master implementation audit and reuse map

Source instruction: user supplied master implementation, October 5, 2026. This is now an application implementation task, not repository-preserving onboarding.

## Architecture and inventory
React 19/Vite 8 frontend; Express 5 API; Supabase optional accounts with server-verified JWT and server-only private key. React state/context plus account-scoped browser storage; legacy progress and scheduler already exist. No document object storage or OCR service exists. PDF.js is installed for the study guide. EN/ES dictionaries are distributed; several practice screens currently English-only. CSS uses a large accumulated stylesheet and partial theme/spacing tokens. Existing official civics JSON and stable question IDs remain untouched.

Screens: home, settings, immigrationHelp (directory/detail/exit confirmation), civicProfile, pro, podcasts (full/mini), civicsGuide, quiz (path/vocabulary/choose/connect/results), vocabulary, choose, connect, civics (study/favorites/mistakes/front/back), practice, english, reading, writing, coach (welcome/conversation), uscisTracker, progress, interview (full/civics/n400). Additional states: onboarding, account/auth sheet, provider consent, progress/access gates, legal accordion, reset and theme dialogs.

Database: user_profiles, entitlements, ai_feature_config, app_settings, ai_sessions, reward_credits, usage_events, api_rate_limit_windows, subscription_events, saved_questions. Existing auth RLS denies direct browser access and routes use requireAccount. No durable journey, notices or structured N400 domain exists.

## Reuse map
| Requirement | Existing system to extend |
| --- | --- |
| Brain/next action | AppContent state + progress.js + learning.js + quizLearning.js |
| Civic context | civicProfile.js/storage + dynamicCivicsData.js + civicLocationService.js |
| Case journey | caseTracker.js + uscisService.js + existing uscisTracker destination |
| Notices | existing PDF.js dependency/worker; confirmed structured extracts only |
| N400/profile | n400InterviewEngine.js + bank + N400InterviewPractice.jsx |
| Interview | existing RealInterview and N400 engine, deterministic civic grading |
| Adaptive study | existing scheduler/readiness/quiz checkpoints, no new scheduler |
| Help/checklists | ImmigrationHelp + immigrationResources, contextual order |
| Navigation | navigationHistory + BottomNavigation, preserve destinations |
| Design/mascot | existing theme tokens + companion custom element/events |
| Accounts/privacy | accountService/accountRoutes + user_profiles/RLS/export/delete |

## Shared implementation contract
buildBrainContext({userProfile,immigrationProfile,n400Profile,civicProfile,caseProfile,learningProfile,language,preferences}).
learningProfile uses current practiceEvents, viewed/mastered/needsPractice indexes, quizProgress and moduleProgress, with questionIds resolved from the official bank.
Case profile: formType N-400, currentStage (uppercase canonical), filingDate, interviewDate, interviewTime, oathDate, fieldOffice, confirmed status/date, events, notices, checklistCompletedIds, source/confidence. Raw notices and unconfirmed extracted fields never persist.
n400Profile uses existing applicantProfile shape {answers,flags}; missing information stays unknown.
Persistent Brain profile contains userProfile, immigrationProfile, n400Profile, caseProfile, preferences; civicProfile and learning remain existing stores, not duplicated. Account storage is scoped by userKey. Cloud sync is explicit and requires supported secure server configuration. Address/receipt/N400 data are never included in analytics or ordinary logs.
getDailyStudyPlan(context,{now}) and getNextAction(context,plan) are pure derived orchestration, not parallel progress records.
Journey props {language,userKey,caseProfile,n400Profile,onUpdate,onNavigate,onBack}.
N400 props {brainContext,language,onSaveN400Profile} plus current callbacks.
Civic editor receives existing userProfile/context and calls onSave/profile update callbacks.
All routes remain accessible through grouped navigation; root owns App.jsx integration.

## Official provider research
Official Google API discovery currently has divisions/elections and no representativeInfoByAddress: https://github.com/googleapis/google-api-nodejs-client/blob/main/discovery/civicinfo-v2.json
Congress currentMember endpoint supports district 0 and official bioguide metadata: https://github.com/LibraryOfCongress/api.congress.gov/blob/main/Documentation/MemberEndpoint.md
Open States people.geo supports legislators but excludes governors: https://github.com/openstates/openstates-api-v3/blob/main/api/people.py
USCIS public status and current checklist guidance could not be retrieved: environment proxy refuses CONNECT before reaching www.uscis.gov/egov.uscis.gov. This does not establish destination WAF/CAPTCHA or permission for public automation. Preserve official OAuth implementation and manual link/notice/user-confirmed fallback. Do not automate protected public workflows.
Required external integrations will be tested with deterministic provider fixtures where live keys/access are absent; live verification must be reported separately.

## Execution and QA
Sequence: audit/inventory/reuse (completed before edits); Brain design; schema; providers; civic/journey/N400; study/interviews/help/checklists; navigation/design; every-screen responsive/EN/ES audit; lint/typecheck/tests/build; completion report.
Representative widths: 320,360,375,390,414,768,820,1024,1280,1440 with portrait/landscape tablet and EN/ES. Preserve unrelated functionality and official content. No silent claims for untested credentials, migrations, native builds or inaccessible routes.
