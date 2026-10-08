# Codex Implementation Guide — Detailed Synthetic Cases v0.2

## Data available
- `04_synthetic_cases/detailed_cases/*.json`: 60 structured, source-contextualized fictional cases.
- `04_synthetic_cases/readable_narratives/*.md`: readable version for QA/product review.
- `05_country_packs/context_profiles/*.json`: country-specific scenario design guidance.
- `08_knowledge/current_country_context_sources.json`: official source registry.
- `09_evaluation/detailed_case_benchmarks/detailed_benchmarks.jsonl`: one benchmark per detailed case.

## Runtime rule
Country context is retrieval context, not a persona fact. Synthetic hidden details are available only to the benchmark/persona simulator, not to Sahara as a recommended answer.

## Recommended dual-agent test setup
1. `SyntheticPersonaAgent` receives the full Gold Case Graph and answers only if the asked question reaches that fact. It may answer vaguely or approximately according to intentional features.
2. `SaharaInterviewerAgent` receives only the exposed conversation state, topic coverage and permitted retrieval. It must discover the case through neutral questioning.
3. `EvaluatorAgent` receives the Gold Case Graph + transcript and scores question relevance, factual coverage, leading-question rate, fact injection, legal-advice violations and testimony optimization.

This mirrors the useful conceptual aspect of the DHS/USCIS synthetic-persona training approach while reversing the roles for applicant-side educational practice.
