import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../shared/design-system/asylum-videos.css',import.meta.url),'utf8');
test('asylum resource headers share desktop and mobile sizing',()=>{
  for(const component of ['AsylumVideos','AsylumPodcasts']){
    const source=readFileSync(new URL('../modules/asylum/'+component+'.jsx',import.meta.url),'utf8');
    assert.match(source,/className="asylum-videos /);
    assert.match(source,/className="asylum-videos-toggle"/);
  }
  assert.match(css,/\.asylum-videos\{max-width:1400px;margin:24px auto;padding:28px/);
  assert.match(css,/\.asylum-videos-toggle\{[^}]*width:100%;min-height:60px/);
  assert.match(css,/\.asylum-videos-toggle>svg\{width:44px;height:33px;flex-shrink:0\}/);
  assert.match(css,/@media\(max-width:540px\)\{\.asylum-videos-toggle\{gap:10px;font-size:21px;min-height:4\.2em\}/);
  assert.doesNotMatch(css,/\.video-library \.asylum-videos-toggle/);
  assert.doesNotMatch(css,/\.asylum-podcasts \.asylum-videos-toggle/);
});
