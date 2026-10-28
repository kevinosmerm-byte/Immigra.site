# Civics card visual library

The visual system applies to all 128 civics study cards. Eight compact original illustrations are intentionally reused by concept so the full set remains consistent and lightweight.

## Source and license register

Every question has an entry in `src/civicsVisuals.js`; the table below records the eight reusable source assets.

| Question | Asset | Description | Source | License | Attribution |
| --- | --- | --- | --- | --- | --- |
| 2 | `/assets/civics/constitution.svg` | Constitution parchment | Citizenship AI | Original project artwork | Citizenship AI |
| 9 | `/assets/civics/declaration.svg` | Declaration parchment and quill | Citizenship AI | Original project artwork | Citizenship AI |
| 18 | `/assets/civics/congress.svg` | Legislative building | Citizenship AI | Original project artwork | Citizenship AI |
| 42 | `/assets/civics/presidency.svg` | Neutral White House concept | Citizenship AI | Original project artwork | Citizenship AI |
| 52 | `/assets/civics/supreme-court.svg` | Courthouse concept | Citizenship AI | Original project artwork | Citizenship AI |
| 76 | `/assets/civics/revolution.svg` | American Revolution concept | Citizenship AI | Original project artwork | Citizenship AI |
| 94 | `/assets/civics/lincoln.svg` | Stylized Abraham Lincoln portrait | Citizenship AI | Original project artwork | Citizenship AI |
| 113 | `/assets/civics/civil-rights.svg` | Civil rights gathering | Citizenship AI | Original project artwork | Citizenship AI |

The repository could not reach the official Library of Congress or National Archives endpoints from the development environment (the network proxy returned HTTP 403 and the browsing connector returned HTTP 401). To avoid false attribution or incorporating an asset without confirming item-level rights, the library uses original, code-native vector illustrations. They contain no agency seal, logo, endorsement mark, or current officeholder photograph. Before replacing an original illustration with archival material, each proposed item must be reviewed individually and recorded with its exact item URL and rights statement.

SVG was retained for this library rather than wrapping vector artwork in WebP: each complete asset is approximately 1.1–1.4 KB, remains sharp at every density, and is substantially smaller than the requested 100–150 KB raster budget. The application makes no external image requests.
