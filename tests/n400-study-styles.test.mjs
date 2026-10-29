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
 const icon=result.root.nodes.find(n=>n.selector==='#root #main #citizenship-root .n400-study-navigation .n400-icon-control > span');
 assert.ok(icon,'N400 icon spans override legacy cyan arrow tiles');
 for (const [prop,value] of Object.entries({color:'inherit',background:'transparent',border:'0','box-shadow':'none'})) assert.ok(icon.nodes.some(n=>n.prop===prop&&n.value===value));
 assert.doesNotMatch(source,/line-clamp|text-overflow:\s*ellipsis|max-height:/);
});

test('five navigation tabs and larger N400 arrows retain responsive layout and reduced motion',()=>{
 const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
 const nav=read('../shared/design-system/citizenship-dashboard.css');
 const css=read('../shared/design-system/n400-study.css');
 assert.match(nav,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
 assert.match(nav,/platform-module-nav button \{ min-width:0; overflow-wrap:anywhere;/);
 assert.match(nav,/@media\(max-width:900px\)/);
 assert.match(css,/button.n400-page-control \{ width:52px; min-width:52px; height:52px; min-height:52px;/);
 assert.match(css,/--n400-blue:#0064e6/);
 assert.match(css,/--n400-green:#166343/);
 for(const direction of ['next','previous']) assert.match(css,new RegExp('animation:n400-page-'+direction+' 400ms ease-out'));
 assert.match(css,/@media\(prefers-reduced-motion:reduce\).*animation:none!important/s);
 assert.match(css,/html\[data-reduce-motion=true\].*animation:none!important/s);
 assert.doesNotMatch(css,/animation-delay|line-clamp|max-height:/);
});

test('page arrows are large vector shapes and the visible fold respects reduced motion',()=>{
 const css=readFileSync(new URL('../shared/design-system/n400-study.css',import.meta.url),'utf8');
 const component=readFileSync(new URL('../modules/citizenship/src/N400StudyCards.jsx',import.meta.url),'utf8');
 assert.match(css,/n400-icon-control.n400-page-control svg \{ width:36px; height:36px; stroke-width:2.8;/);
 for(const path of ['M20 12H4m7-7-7 7 7 7','M4 12h16m-7-7 7 7-7 7']) assert.ok(component.includes(path));
 assert.match(css,/rotateY\(14deg\)/);
 assert.match(css,/rotateY\(-14deg\)/);
 assert.match(css,/width:24%; pointer-events:none;/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\).*n400-study-body::after \{ animation:none!important; display:none;/s);
 assert.match(css,/html\[data-reduce-motion=true\].*n400-study-body::after \{ animation:none!important; display:none;/s);
});
