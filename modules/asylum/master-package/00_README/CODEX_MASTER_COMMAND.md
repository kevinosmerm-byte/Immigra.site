# CODEX MASTER COMMAND — ASILOAI

You are implementing **AsiloAI** from this package.

## PRIMARY IMPLEMENTATION DIRECTIVE

**DO NOT OMIT, DELETE, SIMPLIFY AWAY, OR REPLACE EXISTING PRODUCT INFORMATION, DATA, FEATURES, SAFETY RULES, QUESTIONS, CASES, COUNTRY CONTEXT, DATABASE FIELDS, ENGINE LOGIC, PROMPTS, OR USER-REQUESTED REQUIREMENTS WHEN THEY CAN REASONABLY BE IMPLEMENTED.**

If a requirement can be implemented safely and technically within the current stack, implement it.

If a requirement cannot yet be implemented because of a concrete technical dependency, platform limitation, missing credential, unavailable API, privacy constraint, or safety/legal boundary:

1. **Do not silently discard it.**
2. Preserve it in the architecture and data model whenever feasible.
3. Mark it explicitly as `PENDING_IMPLEMENTATION` or `BLOCKED_DEPENDENCY`.
4. Document the exact reason it could not be implemented.
5. State what dependency or future change is needed.
6. Do not substitute a materially weaker feature unless necessary; if a fallback is used, preserve the original requirement in the backlog.

## SOURCE-OF-TRUTH ORDER

When instructions appear to conflict, use this priority:

1. User's most recent explicit requirement.
2. Product safety/legal boundary files in this package.
3. Master architecture and engine specifications.
4. Structured databases / JSON / schemas.
5. Older package notes.

Do not remove an older requirement merely because a newer document is shorter. The package is cumulative unless a newer instruction explicitly supersedes an older one.

## PRESERVATION RULE

Before modifying existing AsiloAI or CitizenshipAI code:

- inventory current functionality;
- identify reusable components;
- avoid breaking working functions;
- preserve existing payment/authentication/navigation/voice/AI infrastructure when compatible;
- migrate incrementally;
- document any intentional removal or replacement.

Never interpret "clean up", "refactor", or "simplify" as permission to delete product functionality or data requirements.

## PRODUCT BOUNDARY

AsiloAI is educational interview-practice software.

Internal analysis may be deep and may use interview methodology, official procedural knowledge, country-context retrieval, timeline reasoning, consistency detection, topic coverage, Mogharrabi/PACI-inspired factual coverage, future-fear coverage and prior practice history **only to improve the next neutral factual question**.

The applicant-facing system must never:

- tell the user what facts to provide;
- tell the user which conflicting version to use;
- create, invent, add, remove, rewrite or optimize personal testimony;
- tell the user what answer would improve an immigration outcome;
- determine legal eligibility;
- provide individualized legal strategy;
- predict approval/denial;
- provide case-strength, credibility, nexus, PACI, future-fear, approval or win scores;
- convert country conditions into personal facts;
- merge synthetic-case facts into a personal case.

Golden rule:

**ANALYZE DEEPLY. ASK INTELLIGENTLY. NEVER MODIFY THE STORY.**

## IMPLEMENTATION STYLE

Do not build the product as a static questionnaire.

Implement the layered system described in this package:

`Case Graph + Topic Coverage + Consistency + Interview State + Interview Knowledge Retrieval + Country Context Retrieval + Question Bank + Safety Layer -> Next Best Neutral Question`

The question bank is support data, not the brain of the application.

## PERSONAL vs SYNTHETIC DATA

Maintain strict separation:

- `data_domain=personal`
- `data_domain=synthetic`

Synthetic facts must never be copied into personal cases.
Country-context information must never be converted automatically into personal facts.
Documents are comparison sources, not answer keys.

## LOCAL-FIRST REQUIREMENT

Case-specific personal data should remain local-first where the architecture supports it.
Do not place asylum narratives, testimony, political activity, immigration history, interview answers or case-specific sensitive details in analytics, crash logs, URLs, generic telemetry or unnecessary server persistence.

If external AI/STT processing is required, preserve the distinction between **no AsiloAI server retention** and **third-party processing**. Do not claim information never leaves the device unless that is technically true.

## REQUIRED FIRST ACTIONS

1. Run the package validators.
2. Read `00_README/README.md` and this file completely.
3. Read all files in `01_product`, `06_prompts`, and `07_engines`.
4. Inspect `02_database/asiloai_schema.sql` and `02_database/asiloai_seed.sqlite`.
5. Index `03_question_bank/question_bank.jsonl`.
6. Index all synthetic cases and country packs.
7. Read the official-source catalog in `08_knowledge`.
8. Produce an implementation inventory mapping every package requirement to:
   - `IMPLEMENT_NOW`
   - `ALREADY_EXISTS`
   - `ADAPT_EXISTING`
   - `PENDING_IMPLEMENTATION`
   - `BLOCKED_DEPENDENCY`
9. Only after the inventory, begin implementation.

## NO-OMISSION ACCEPTANCE TEST

Before considering an implementation pass complete, compare implemented functionality against the entire package manifest and produce a `coverage_report.md` containing:

- every major requirement;
- implementation status;
- exact code/file location;
- tests covering it;
- any intentionally deferred item and reason.

A feature is not considered removed simply because it was deferred. Deferred items must remain visible in the coverage report and backlog.
