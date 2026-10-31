import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {homeStudyEntryRoutes,readHomeCategory,rememberHomeCategory} from '../src/home-study.mjs';
import {interviewRoutes,progressRoutes} from '../src/interview-glass-bank.mjs';
import {moduleFromHash} from '../shared/navigation/routes.mjs';
const storage=()=>{const entries=new Map();return {getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,value),entries};};

test('each category survives leaving study and returning home, including rapid repeated choices',()=>{
 const tab=storage();
 for(const category of ['citizenship','residency','asylum','residency','citizenship']){
  const selected=rememberHomeCategory(category,tab);
  const freeCTA=homeStudyEntryRoutes[selected],rightStudy=homeStudyEntryRoutes[selected];
  assert.equal(freeCTA,rightStudy);
  assert.equal(freeCTA,category,'both actions enter the selected module homepage');
  assert.equal(moduleFromHash('#/'+freeCTA),category);
  // A new Home mount reads the same tab selection, not the initial asylum default.
  const remounted=readHomeCategory(tab);
  assert.equal(remounted,category);
  assert.equal(homeStudyEntryRoutes[remounted],rightStudy);
  assert.equal(moduleFromHash('#/'+interviewRoutes[remounted]),category);
  assert.equal(moduleFromHash('#/'+progressRoutes[remounted]),category);
 }
 assert.equal(tab.entries.size,1,'only the category is stored, not user/case data');
});

test('invalid category values cannot become navigation paths and blocked storage keeps in-memory choice',()=>{
 const tab=storage();rememberHomeCategory('asylum',tab);
 for(const bad of ['account','__proto__','constructor','https://example.test',null,undefined]){
  assert.equal(rememberHomeCategory(bad,tab),'asylum');
  assert.equal(readHomeCategory({getItem:()=>bad}),'asylum');
 }
 const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
 assert.equal(rememberHomeCategory('residency',blocked),'residency');
 assert.equal(readHomeCategory(blocked),'residency');
 rememberHomeCategory('asylum',tab);
});

test('Home owns the single selection and header/free/right controls reuse it without starting interviews',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const home=read('src/ImmigraHome.jsx'),demo=read('src/InterviewGlassDemo.jsx'),header=read('src/WebExperience.jsx');
 assert.match(home,/useState\(readHomeCategory\)/);
 assert.match(home,/setSelectedCategory\(rememberHomeCategory\(value\)\)/);
 assert.match(home,/category=\{selectedCategory\} onCategoryChange=\{chooseCategory\}/);
 assert.match(home,/onNavigate\(homeStudyEntryRoutes\[selectedCategory\]\)/);
 assert.match(demo,/category='asylum'/);
 assert.doesNotMatch(demo,/setCategory|\[category,.*useState/);
 assert.match(demo,/go\(homeStudyEntryRoutes\[category\]\)/);
 assert.match(header,/getElementById\('ih-free-start'\)\?\.click\(\)/);
 assert.match(demo,/onClick=\{\(\)=>choose\(value\)\}/,'pills select without navigating');
 assert.doesNotMatch(home+demo,/getUserMedia|MediaRecorder/);
});
