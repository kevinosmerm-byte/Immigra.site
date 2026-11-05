# Complete blank-form reference guides prepared 2026-11-05

Base main: ba00b46. Not published.

## Inputs and privacy

Eighteen user-supplied PDFs were materialized with their original Library identities retained outside the repository. The initial eight blank forms are: I-589 (07/28/26), I-485 (09/18/26), N-400 (01/20/25), I-130 / I-130A / I-751 (04/01/24), I-90 (01/20/25), I-765 (08/21/25). Corresponding instructions were read. G-1151 is a naturalization preparation leaflet, not a replacement for N-400, and was not added as a filing form.

All initial 93 form pages were text- and widget-inspected and visually reviewed. Nonempty widget values were only template barcodes, PRESENT defaults and unselected checkbox defaults. No personal entries or DRAFT marks were found. Some encrypted PDFs fail pypdf parsing; PyMuPDF rendering and widget enumeration worked. Sources are unmodified; only page rasterizations are added to the app. Original PDFs, account records, private Library IDs and transfer metadata are not in public assets.

## Changes

- 109 sequential pages and 357 Spanish explanatory regions across ten forms; no gaps in supplied forms. AR-11 (11/02/22, 2 pages) is optional within address change; I-131 (01/20/25, 14 pages) covers travel/parole fields.
- Replaces the selected old reference slides, including the I-485 draft, at runtime using a complete data file.
- Adds I-751 and I-90 to existing process visual routes.
- Links I-130A conditionally from I-130 as spouse-beneficiary supplement.
- Direct page selector, previous/next, zoom and existing hover/tap hints preserved.
- Readiness notice closes when checked, stays closed while navigating and reopens through a compact button. Applies consistently to all form guides, including I-589.
- Uses full-page form images, not browser screenshots. Dimensions are explicit and preserve proportions.
- Education and safety text distinguishes applicant, petitioner, beneficiary, interpreter, preparer, supplements and agency-only sections. References do not determine individual eligibility.

## Edition limits

These are reviewed reference editions, not a certification of the currently accepted edition on the filing date. Official USCIS direct access returned 403; official search indexes corroborated some older editions and official notices provided partial evidence for newer I-485/I-589. The UI explicitly instructs checking current acceptance at USCIS. It does not label the uploads as independently verified current.

## Verification

- All 109 raster files exist, readable WebP, 1224×1584; each page loads separately, not as a full PDF download.
- Nine new focused tests cover page counts, asset paths, annotation bounds, source labels, dimensions, notice dismissal/reopening, page index validation and conditional I-130A navigation.
- Final full app build and checks passed after all instruction, address and travel changes: 484 root tests + 488 citizenship tests; lint/build/distribution passed with existing warnings.
- Whole-guide DOM integration test rendered all 109 pages and 246 instruction notes, verified image paths and hover-region presence, notice persistence/reopen and I-130A navigation. This is DOM simulation, not browser/device testing.
- Real Chromium launch fails at profile socket with Operation not permitted. Actual desktop/mobile visual and touch QA remains pending. No browser screenshots or device testing claimed.

## Still absent

No uploaded forms or verified screen sets were supplied for EOIR/BIA address change or TPS/I-821. Address change now has optional AR-11 paper reference while myUSCIS/E-COA remains primary. I-131 now has all form pages, but its separate instructions were not supplied. myUSCIS/FOIA remain two public screenshots each; the I-765 online flow remains 11 selected historical demonstration screens, separate from the complete paper/PDF reference. These are not complete authenticated portal walkthroughs. Additional conditional forms such as I-864/I-864A/I-693 still have no full visual guide.

## Instruction-linked guidance added

246 additional Spanish explanations are attached to specific form pages/zones and cite the uploaded official instructions by edition and physical page. Each quoted source fragment was matched against extracted PDF text. The UI links the first cited PDF page and lists all supporting pages. The explanations remain visible after dismissing the readiness notice and are also included in hover/tap hints. Zones without useful direct support are not assigned invented citations. Evidence is recorded in 2026-11-05-instruction-evidence.json; private Library identities are excluded.

The I-131 has no separate uploaded instructions; the UI distinguishes field explanations from instruction-based advice and warns that form presence does not establish current program availability or travel/work/entry authorization. The AR-11 wrapper preserves the online route, explains E-COA also supports cases filed by mail, and links separate EOIR obligations. No authenticated portal tested.
