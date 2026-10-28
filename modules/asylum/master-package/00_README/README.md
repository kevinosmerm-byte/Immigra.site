# AsiloAI Codex Package v0.1

Concrete starter repository for AsiloAI. It includes seed data and executable artifacts, not just instructions.

Contents:
- SQLite seed database + SQL schema
- bilingual structured question bank
- 50 fictional asylum-practice personas
- country practice packs
- Sahara system/safety prompts
- Story Graph, Topic Coverage, Consistency, Future Fear and Question Reasoning specs
- official-source catalog
- evaluation benchmarks
- JSON API contracts
- package validation utilities

## Product boundary
AsiloAI is educational interview-practice software. Internal knowledge may decide WHAT FACTUAL QUESTION TO ASK NEXT. It must never tell a user WHAT FACT TO PROVIDE, WHICH VERSION TO USE, or WHAT TO SAY TO OBTAIN AN IMMIGRATION BENEFIT.

Golden rule: ANALYZE DEEPLY. ASK INTELLIGENTLY. NEVER MODIFY THE STORY.

## Three modes
1. Fictional Practice — no personal story required.
2. Tell Sahara During Practice — no upload required; build the case graph from voluntary answers.
3. Use My Story — local-first personalized practice from voluntarily provided material.

Synthetic and personal data must never be merged.

Start with: `python 10_tools/validate_package.py`.


## v0.2 Detailed Case Expansion

Adds 60 detailed fictional cases (10 each for Venezuela, Cuba, Nicaragua, Colombia, Haiti and China), grounded at the scenario-pattern level in official country-context sources. Includes readable narratives, context profiles and one benchmark per detailed case.

## Master Codex execution rule

Before implementation, Codex must read `00_README/CODEX_MASTER_COMMAND.md`.
This package is cumulative: information and functionality should not be omitted when reasonably implementable. Deferred items must remain explicitly documented rather than silently removed.
