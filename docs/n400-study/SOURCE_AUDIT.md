# N-400 Part 9 study-bank source audit — 2026-10-29

## Result and release limitation
62 cards are text-compared and corrected against the **official USCIS-domain indexed PDF**, edition **01/20/25**, Part 9 items 1–37, pages 6–10. This is a study-card count, NOT a USCIS official question count. Nonbinary 22.c is excluded and documented in `excludedItems`.

Official URL: https://www.uscis.gov/sites/default/files/document/forms/n-400.pdf
Form page: https://www.uscis.gov/n-400

**Current-edition claim remains unverified:** direct live landing page and PDF requests returned HTTP 403 (web and curl). Full pages 6–10 were returned as indexed official-source text, including each edition/page footer; however, a downloaded-PDF visual check and live accepted-edition confirmation were not possible. Do not say the current live edition is verified. This need not block version-pinned educational use: label edition 01/20/25, show the official link, and do not claim current accepted filing edition. No third-party source was relied on for question content.

## Evidence obtained through official-domain search
- Page 6: full Part 9 introduction and items 1–5.b (including seven 5.b list entries).
- Page 7: full items 6.a–14 and shared stems, plus 8.a/8.b explanation and 14 examples.
- Page 8: full items 15.a–16 and crime/evidence instructions.
- Page 9: full items 17.a–25, including shared stem, 22.a lawful-nonimmigrant qualifier, 22.c registration fields.
- Page 10: full items 26.a–37, 25-to-30.a skip, 33-to-34–37 skip, and printed blank in 30.b.
- Every extracted page had edition 01/20/25 and its printed page number. Content was not truncated in the tool results used.

## Material corrections
- 5.b: inherited `Have you EVER:` restored; Spanish now preserves all seven list entries instead of examples-only abridgment.
- 6.a–c: full official shared stem restored (membership, involvement, association, money, things of value, services/labor, other assistance/support). Existing paraphrase dropped multiple categories.
- 7.a–g: full shared stem restored, including `incited, called for` and `helped with`.
- 2: local-election qualifier retained in separate bilingual source note.
- 14: combat and combat-services examples retained in source note.
- 22.a: educational Spanish now translates the English question itself; lawful-nonimmigrant qualifier preserved separately in both languages, not silently omitted from English.
- 26.b: vessel clause restored in Spanish; official follow-up contact instruction retained as source note.
- 26.a–29: item-25 routing condition preserved. 34–37: item-33 skip preserved. Conditions are reading context, never used to request answers or hide cards.
- Spanish abridgments expanded for 4, 6.a–c, 7.a–g, 8.b, 9, 10.a/10.c, 13–16, 17.a/17.b/17.g, 19, 22.a, 26.b, 30.b, 32, 34, 36–37.
- 30.b: printed blank is a documented reading-card placeholder adaptation, not passed off as exact continuous form text.
- Highlight regex escaping corrected; offsets rebuilt from literal English. Case-insensitive EVER and five opener patterns only.

## Schema and integration requirements
`questions[].en` and `.es` are the display strings. `.officialStemEn` and `.officialItemEn` preserve the official shared stem/item separation for inherited questions. `.wordingType` distinguishes combination/field-placeholder adaptation from an official standalone question. Spanish is ALWAYS educational, not an official USCIS translation.

**Render `formNotes`** with each card; otherwise essential qualifiers and conditions are lost. `formNotes[].wordingType=educational-context-summary` marks the page-8 contextual summary (not a quote). All other formNotes are official English instruction excerpts plus educational Spanish translations. These source excerpts are not advice on the user's personal answer. 6.c references 6.a/6.b using `relatedItems`; all cards remain readable regardless of personal history.

`sourceAudit` records fetch limitations and the publication gate. `generalFormContext` records EVER scope and links readers back to full official instructions. The bank does not replace complete form/evidence instructions and contains no answer fields or answer keys.

## Validation
Local Python checks passed: 62 unique IDs, no empty English/Spanish, pages6–10, source/stem metadata, complete corrected group6/7 stems, seven-entry Spanish 5.b list, lawful-nonimmigrant note, all literal highlight offsets, no answer keys.

Deliverable: `immigra_n400_part9_question_bank.validated.json` (the original is preserved separately).
