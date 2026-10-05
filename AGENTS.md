# Civics source of truth

For the 2025 civics test, use src/data/uscis2025Civics.json as the only source of English questions and official answer lists. It is extracted from the user-supplied USCIS M-1778 (09/25) PDF at public/study-guides/uscis-2025-civics-test-study-guide.pdf. Do not generate, replace, or expand official facts with an AI model. Read this local source before searching elsewhere for static civics answers.

src/questions.js and src/civicsAnswers.js are compatibility views, not independently maintained banks. Spanish text is a supplemental translation, not official English source text. Keep question IDs stable to preserve progress and image assignments.

The PDF explicitly delegates changing officeholders and location-specific answers. Keep those available records in src/dynamicCivicsData.js and the user's civic profile, with provenance and verification dates. Per the user's instruction, retain available answers until explicitly updated; do not hide them solely because a fixed age elapsed. Never invent a missing district or officeholder. Later updates must use official sources, without generative answers.

Civics grading is deterministic and must not invoke a model or consume an AI evaluation quota. Speech transcription, voice synthesis, writing practice, and the external D-ID agent are separate integrations.

Validate source extraction with Python plus pypdf: python scripts/extract-official-civics.py --check. Run npm run quality for code changes. The source PDF SHA-256 is checked in tests.

# Visual design source of truth
Use BRAND_PALETTE.md and src/BrandPalette.css as the official user-approved palette for every screen. Reuse its CSS variables for new or modified UI. Match the Home reference surfaces, buttons, typography and spacing; preserve readable contrast, semantic feedback states and user-supplied media.
