# IMMIGRA guide-image coverage audit

Date: 5 November 2026. Code: ba00b46. Read-only production scope; local audit artifacts only. No publication or application changes.

## Findings

The guide has 13 process choices. Five PDF guides contain 16 selected pages out of 69 pages visible in their stored reference editions. This leaves 53 reference pages unrepresented. These are NOT counts certified against current filing editions. All 16 referenced image files exist locally; the deficiency is content coverage, not simply missing file paths.

| Process | Stored reference | Pages shown | Missing pages of that reference |
|---|---|---|---|
| Asylum I-589 | 01/20/25, 12 pages | 1,5,9 | 2–4,6–8,10–12 |
| Adjustment I-485 | 09/18/26, 24 pages, DRAFT | 1,3,5 | 2,4,6–24 |
| Naturalization N-400 | 01/20/25, 14 pages | 1,2,6 | 3–5,7–14 |
| Family I-130 | 04/01/24, 12 pages | 1,5,8 | 2–4,6–7,9–12 |
| EAD paper I-765 | 08/21/25, 7 pages | 1–4 | 5–7 |

The I-485 images visibly say DRAFT NOT FOR PRODUCTION. Existing code warns about this, but they should be replaced with a verified accepted edition before expanding a practical field-by-field guide. Do not remove the watermark or relabel them as final.

Six processes have no dedicated visual sequence: USCIS address change (E-COA/AR-11), EOIR/BIA address change (EOIR-33), card renewal/replacement (I-90), removal of conditions (I-751), TPS (I-821), travel documents (I-131). Their map currently falls through to “Capturas específicas pendientes.”

myUSCIS account setup has two public images (home and initial registration), not email verification, MFA or post-login setup. FOIA has two images (home and status), not a complete request flow. Authenticated images must come from official blank demonstrations, not real applicants' records.

I-765 online has 11 selected historical screens with source indices 3,8,13,20,21,25,28,29,30,40,50. These are not sequential exhaustive steps of the source deck; omissions must be assessed by category and conditional logic rather than inventing a count of mandatory screens. The online route is restricted by code to c8; other routes use method guidance or paper.

Related forms mentioned in adjustment/family route cards lack dedicated visual guides: I-130A, I-864/I-864EZ, I-864A, I-693 and I-131. They are conditional, not a universal package. I-693 must remain clinician-completed, not framed as applicant self-completion.

## Source verification and blockers

- Official USCIS form pages and PDFs returned HTTP 403 on this run. No bypass attempted.
- Official indexed N-400 PDF supports reference 01/20/25 and 14 pages: https://www.uscis.gov/sites/default/files/document/forms/n-400.pdf
- Official indexed I-130 PDF supports reference 04/01/24 and 12 pages: https://www.uscis.gov/sites/default/files/document/forms/i-130.pdf
- The government I-485 reference https://www.reginfo.gov/public/do/DownloadDocument?objectID=172320801 is DRAFT NOT FOR PRODUCTION. Do not use as final.
- Government N-400 objectID 152392701 is also DRAFT NOT FOR PRODUCTION. Do not use as final.
- I-589 government collection approved 28 July 2026: https://www.reginfo.gov/public/do/PRAViewIC?icID=20378&ref_nbr=202607-1615-002. Contains I589-039-FRM-AARWIRule-07162026.pdf but no usable final PDF download was established. Old indexed 01/20/25 content cannot certify current accepted edition.
- No current accepted I-765 edition was verified with accessible official evidence.
- No independent mirrors, proxy copies or blank-looking draft PDFs were used to create new images.

## Safe completion plan

1. Obtain accepted blank official PDFs plus instructions and verify edition against each current USCIS form page. Start I-589, I-485, N-400, then I-130 and I-765.
2. Render every page, retain source/edition/page number, review image text and annotate each actual region. Distinguish fields the applicant completes from interpreter/preparer/officer-only sections and supplements.
3. Build a true page index and next/back sequence. Keep conditional sections visible as conditional; do not imply everyone must fill every field.
4. Add the six absent process guides using official blank forms or public official demonstration screens. Do not access applicant accounts or manufacture screenshots.
5. Validate all assets, page counts, image labels, hover/tap behavior, small-screen readability, keyboard navigation and transition continuity. A static build does not establish visual correctness.

No production images were added because verified usable originals were unavailable. The prior I-589 preparation-banner dismissal patch was not present in this fresh executor and is not in main; it remains a separate pending change. Do not report it as deployed.

## Reproducibility

Run `node scripts/audit-guide-image-coverage.mjs` to regenerate the machine-readable inventory. It checks every PDF-slide asset exists and returns nonzero for missing files. It does not certify legal currency or full functional coverage.

## Public file checks

All 31 existing JPG URLs under https://immigra.site/guias/assets/ returned HTTP 200 with image content on 5 November 2026. This verifies file delivery only, not browser interactions, legal currency, or completeness. Results: `2026-11-05-public-assets.json`.
