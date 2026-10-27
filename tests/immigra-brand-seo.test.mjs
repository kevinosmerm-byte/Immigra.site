import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("public metadata consistently identifies the product as Immigra.site", async () => {
  const [index, manifest, app, packageJson] = await Promise.all([
    read("index.html"),
    read("public/manifest.webmanifest"),
    read("src/App.jsx"),
    read("package.json"),
  ]);

  assert.match(index, /<title>Immigra\.site \|/);
  assert.match(index, /rel="canonical" href="https:\/\/immigra\.site\/"/);
  assert.match(index, /property="og:url" content="https:\/\/immigra\.site\/"/);
  assert.doesNotMatch(index, /Citizenship\s*AI|citizenshipai\.us/i);

  const webManifest = JSON.parse(manifest);
  assert.equal(webManifest.short_name, "Immigra.site");
  assert.equal(JSON.parse(packageJson).name, "immigra-site");
  assert.match(app, /src="\/immigra-site-logo\.svg" alt="Immigra\.site"/);
});

test("robots and sitemap advertise only implemented public URLs", async () => {
  const [robots, sitemap] = await Promise.all([
    read("public/robots.txt"),
    read("public/sitemap.xml"),
  ]);

  assert.match(robots, /Sitemap: https:\/\/immigra\.site\/sitemap\.xml/);
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(locations, ["https://immigra.site/"]);
  assert.doesNotMatch(sitemap, /citizenshipai|hreflang/i);
});

test("legacy identifiers are documented as compatibility details, not public branding", async () => {
  const migration = await read("docs/BRAND_MIGRATION.md");
  assert.match(migration, /Immigra\.site is the only public product/);
  assert.match(migration, /us\.citizenshipai\.app/);
  assert.match(migration, /citizenshipai\./);
});
