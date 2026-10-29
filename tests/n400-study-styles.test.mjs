import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import postcss from 'postcss';
import config from '../vite.config.js';

test('N400 styles survive the actual platform PostCSS pipeline with matching DOM selectors',async()=>{
 const component=readFileSync(new URL('../modules/citizenship/src/N400StudyCards.jsx',import.meta.url),'utf8');
 const imported=component.match(/import '([^']*n400-study\.css)'/);
 assert.ok(imported,'use the shared stylesheet outside the legacy module scoper');
 const stylesheet=new URL(imported[1],new URL('../modules/citizenship/src/N400StudyCards.jsx',import.meta.url));
 const source=readFileSync(stylesheet,'utf8');
 const result=await postcss(config.css.postcss.plugins).process(source,{from:fileURLToPath(stylesheet)});
 const selectors=[];result.root.walkRules(rule=>selectors.push(...rule.selectors));
 assert.ok(selectors.includes('#root #main #citizenship-root .n400-study-body'));
 assert.ok(selectors.includes('#root #main #citizenship-root .n400-emphasis-ever'));
 assert.ok(selectors.includes('#root #main #citizenship-root .n400-emphasis-support'));
 assert.ok(selectors.includes('html[data-theme=dark] #root #main #citizenship-root .n400-study-screen'));
 assert.ok(selectors.every(s=>!s.includes('.n400-study-.citizenship-surface')&&!s.includes('#citizenship-root #main #citizenship-root')));
 const body=result.root.nodes.find(n=>n.selector==='#root #main #citizenship-root .n400-study-body');
 assert.ok(body.nodes.some(n=>n.prop==='padding'&&n.value==='24px'));
 assert.ok(body.nodes.some(n=>n.prop==='min-height'&&n.value==='0'));
 const emphasis=result.root.nodes.find(n=>n.selector==='#root #main #citizenship-root .n400-emphasis-ever');
 assert.ok(emphasis.nodes.some(n=>n.prop==='color'&&n.value==='var(--n400-blue)'));
 assert.match(component,/className="n400-study-body"/);
 assert.ok(selectors.includes('#root #main #citizenship-root .n400-study-navigation > button.n400-icon-control'));
 assert.doesNotMatch(source,/line-clamp|text-overflow:\s*ellipsis|max-height:/);
});
