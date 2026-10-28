import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {governmentSources} from '../shared/government-sources.mjs';
import {publicPages,publicPageHtml} from '../scripts/public-pages.mjs';
import {IMMIGRATION_RESOURCES} from '../modules/citizenship/src/immigrationResources.js';

test('source pages include all directory links and official topic sources in both languages',()=>{
  for(const slug of ['sources','fuentes']) {
    const html=publicPageHtml(publicPages.find(p=>p[0]===slug),'/style.css');
    for(const url of [...governmentSources.map(s=>s[2]),...IMMIGRATION_RESOURCES.map(r=>r.official_url)]) {
      assert.match(new URL(url).hostname,/\.gov$/);
      assert.ok(html.includes(url),url);
    }
    assert.ok(html.includes(slug==='sources'?'not affiliated with the government':'no estamos afiliados al gobierno'));
  }
});
test('store descriptions retain official sources, independence and description size limits',()=>{
 const metadata=JSON.parse(readFileSync(new URL('../modules/citizenship/google-play/metadata.json',import.meta.url)));
 for(const copy of Object.values(metadata.localizations)) {
   assert.ok(copy.fullDescription.length<=4000);
   assert.ok(copy.shortDescription.length<=80);
   for(const agency of ['uscis.gov','justice.gov','congress.gov','census.gov','cbp.dhs.gov','travel.state.gov','ice.gov']) assert.ok(copy.fullDescription.includes(agency),agency);
   assert.ok(!copy.fullDescription.includes('Citizenship AI'));
 }
});
