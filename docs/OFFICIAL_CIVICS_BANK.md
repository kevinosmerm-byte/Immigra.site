# Official civics bank review — 2026-09-30

Source: user-supplied USCIS 128 Civics Questions and Answers (2025 version), M-1778 (09/25), 19 pages. The exact source PDF is bundled in public/study-guides/uscis-2025-civics-test-study-guide.pdf and its SHA-256 is recorded in src/data/uscis2025Civics.json.

Reviewed all 128 IDs and all 410 answer bullets or update instructions. Existing English questions match in substance; punctuation now follows the PDF. 112 answer arrays differed in wording, optional text, or content; this is not a count of 112 factual errors. All official lists now come from the extracted JSON. Optional wording, 65/20 markers, page references, and the note on tribes are preserved. Supplemental Spanish translations and existing image assignments remain associated with the same IDs.

Examples corrected: question 8 now includes inherent rights and individual freedoms; question 48 contains the complete Cabinet-level list; question 81 requires five distinct states; question 109 includes nuclear war. The document contains seven multiple-answer questions: 10, 48, 65, 67, 69, 81, 126.

Cards, quizzes and classic civics evaluation consume the same source. The /evaluate endpoint no longer invokes OpenAI or charges an AI quota. Uncertain phrasing is marked for review locally. Number and optional-word variants are derived deterministically. Multiple-choice recommendations include the requested number of answers.

Available officeholder records remain displayed and usable until explicitly updated, as requested. Missing user-specific location data is not guessed. This does not remove speech transcription costs or alter the external D-ID agent's separate knowledge configuration.

Validation: reproducible extraction compared with the bundled PDF; SHA-256 validation; all 151 tests, lint, production build and mobile/iOS/App Store static checks pass.
