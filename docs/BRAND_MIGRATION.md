# Immigra.site product identity

Immigra.site is the only public product represented by this repository. The earlier Citizenship AI name is not a second application and must not appear in customer-facing copy, metadata, public URLs, or downloadable account exports.

## Compatibility identifiers

Some internal identifiers intentionally keep their historical values during the migration:

- Native bundle/application ID: `us.citizenshipai.app`.
- Existing browser storage keys beginning with `citizenshipai.`.
- Existing API compatibility headers beginning with `X-Citizenship-AI-`.
- Existing infrastructure service names and database migration identifiers.

Changing these values without a coordinated migration could split an App Store/Play Store listing, sign users out, lose local study progress, or break deployed clients. They are legacy technical identifiers owned by Immigra.site, not separate branding. New customer-facing features must use the Immigra.site name and `immigra.site` domain.

## SEO baseline

The production canonical origin is `https://immigra.site`. The current application exposes one indexable public SPA entry point, so the sitemap intentionally lists only `/`. Additional English and Spanish URLs must not be advertised until each route has stable content, canonical and `hreflang` metadata, and a direct-load fallback in production.
