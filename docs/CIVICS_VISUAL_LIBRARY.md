# Civics card visual library

The visual system applies to all 128 civics study cards. Fourteen compact original illustrations are reused by concept so the full set remains consistent, relevant, and lightweight.

## Source and license register

Every question has an entry in `src/civicsVisuals.js`; the table below records the reusable source assets.

| Question | Asset | Description | Source | License | Attribution |
| --- | --- | --- | --- | --- | --- |
| 2 | `/assets/civics/constitution.svg` | Constitution parchment | Immigra.site | Original project artwork | Immigra.site |
| 9 | `/assets/civics/declaration.svg` | Declaration parchment and quill | Immigra.site | Original project artwork | Immigra.site |
| 18 | `/assets/civics/congress.svg` | Legislative building | Immigra.site | Original project artwork | Immigra.site |
| 42 | `/assets/civics/presidency.svg` | Neutral White House concept | Immigra.site | Original project artwork | Immigra.site |
| 52 | `/assets/civics/supreme-court.svg` | Courthouse concept | Immigra.site | Original project artwork | Immigra.site |
| 76 | `/assets/civics/revolution.svg` | American Revolution concept | Immigra.site | Original project artwork | Immigra.site |
| 94 | `/assets/civics/lincoln.svg` | Stylized Abraham Lincoln portrait | Immigra.site | Original project artwork | Immigra.site |
| 113 | `/assets/civics/civil-rights.svg` | Civil rights gathering | Immigra.site | Original project artwork | Immigra.site |
| 63 | `/assets/civics/voting.svg` | Ballot and ballot box | Immigra.site | Original project artwork | Immigra.site |
| 73 | `/assets/civics/colonies.svg` | Thirteen colonies concept | Immigra.site | Original project artwork | Immigra.site |
| 100 | `/assets/civics/world-wars.svg` | Peace and service memorial | Immigra.site | Original project artwork | Immigra.site |
| 117 | `/assets/civics/geography.svg` | Map, rivers, and oceans | Immigra.site | Original project artwork | Immigra.site |
| 125 | `/assets/civics/symbols.svg` | National flag concept | Immigra.site | Original project artwork | Immigra.site |
| 128 | `/assets/civics/holidays.svg` | National holiday calendar | Immigra.site | Original project artwork | Immigra.site |

The repository could not reach the official Library of Congress or National Archives endpoints from the development environment (the network proxy returned HTTP 403 and the browsing connector returned HTTP 401). To avoid false attribution or incorporating an asset without confirming item-level rights, the library uses original, code-native vector illustrations. They contain no agency seal, logo, endorsement mark, or current officeholder photograph. Before replacing an original illustration with archival material, each proposed item must be reviewed individually and recorded with its exact item URL and rights statement.

SVG was retained for this library rather than wrapping vector artwork in WebP: every complete asset remains sharp at every density and is substantially smaller than the requested 100–150 KB raster budget. Card images use `object-fit: contain`, so no part of an illustration is cropped. The application makes no external image requests.
