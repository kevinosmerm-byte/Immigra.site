import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('..',import.meta.url);
const dataCode=readFileSync(new URL('public/guias/guide-form-data.js',root),'utf8');
const uiCode=readFileSync(new URL('public/guias/guide-complete-forms.js',root),'utf8');
const data=vm.runInNewContext(dataCode+';completeFormGuides');
test('all supplied blank forms have every page in order and existing non-draft assets',()=>{
 const expected={asylum:12,adjust:24,citizenship:14,family:12,familySupplement:6,conditions:11,card:7,ead:7,addressPaper:2,travel:14};
 for(const [key,total] of Object.entries(expected)){
  const g=data[key];assert.equal(g.slides.length,total);assert.equal(g.draft,false);
  assert.deepEqual(Array.from(g.slides,s=>s.page),Array.from({length:total},(_,i)=>i+1));
  for(const s of g.slides){
   assert(existsSync(new URL('public/guias/assets/'+s.image,root)),s.image);
   assert.equal(s.imageWidth,612);assert.equal(s.imageHeight,792);
   assert(s.spots.length>=2);
   for(const [x,y,w,h,title,text] of s.spots){assert(x>=0&&y>=0&&w>0&&h>0&&x+w<=613&&y+h<=793);assert(title&&text);}
  }
 }
 assert.equal(Object.values(data).reduce((n,g)=>n+g.slides.length,0),109);
});
test('sources retain explicit edition provenance and do not mark acceptance certified',()=>{
 for(const g of Object.values(data)){assert.match(g.official,/^https:\/\/www\.uscis\.gov\//);assert.match(g.instructions,/^https:\/\/www\.uscis\.gov\//);assert.equal(g.referenceVerified,'blank-upload-reviewed');}
 assert.match(uiCode,/No son capturas de tu cuenta ni certifican/);
});
function setup(){
 class El{
  constructor(tag='div'){this.tag=tag;this.children=[];this.listeners={};this.hidden=false;this.style={};}
  append(...x){this.children.push(...x);} before(x){this.beforeEl=x;} replaceChildren(...x){this.children=[...x];}
  addEventListener(k,f){this.listeners[k]=f;} setAttribute(k,v){this[k]=v;}
  querySelector(sel){return this.lookups?.[sel]||null;}
 }
 const checkbox=new El('input'),notice=new El(),aside=new El(),figure=new El(),workspace=new El(),sources=new El(),img=new El();
 notice.lookups={'input[type="checkbox"]':checkbox};aside.lookups={'.capture-required':notice,'details':sources};figure.lookups={'img':img};
 const elements={'.real-document':figure,'.visual-explanation':aside,'.visual-workspace':workspace};
 let persisted=0,renders=0;
 const c={mapView(){},mapStage(){},mapProcess:'asylum',eadMethodLesson(){},visualGuides:{},nativeScreen(){},renderVisual(){renders++;},visualKey:'asylum',visualPage:0,visualSpot:0,visualFocus:false,saved:{},persist(){persisted++;},esc:String,startVisual(k){c.visualKey=k;c.visualPage=0;},document:{querySelector:s=>elements[s],createElement:t=>new El(t)}};
 vm.runInNewContext(dataCode+'\n'+uiCode,c);
 return {c,notice,aside,checkbox,workspace,figure,img,get persisted(){return persisted},get renders(){return renders}};
}
test('directly rendered page uses its PDF dimensions rather than legacy browser-screenshot width',()=>{
 const {c}=setup();const s=c.visualGuides.asylum.slides[0];
 const html=c.nativeScreen(s.image,s.crop,s.title);assert.match(html,/width:100%/);assert.match(html,/aspect-ratio:612\/792/);assert.doesNotMatch(html,/onerror=/);
 const legacy=c.nativeScreen('myuscis-home.jpg',[0,0,1363,936],'Account');assert.match(legacy,/width:100%/);
});
test('readiness collapses, stays closed on navigation and can be reopened',()=>{
 const {c,notice,checkbox}=setup();c.renderVisual();assert.equal(notice.hidden,false);
 checkbox.listeners.change({target:{checked:true}});assert.equal(c.saved['ready-form-asylum'],true);assert.equal(notice.hidden,true);
 c.visualPage=1;c.renderVisual();assert.equal(notice.hidden,true);assert.equal(notice.beforeEl.hidden,false);
 notice.beforeEl.listeners.click();assert.equal(c.saved['ready-form-asylum'],false);assert.equal(notice.hidden,false);
});
test('page picker preserves sequence, resets zoom/zone and rejects invalid indices',()=>{
 const {c,workspace}=setup();c.renderVisual();
 const select=workspace.beforeEl.children.find(e=>e.tag==='select');assert.equal(select.children.length,12);
 c.visualSpot=2;c.visualFocus=true;select.value='3';select.listeners.change();
 assert.equal(c.visualPage,3);assert.equal(c.visualSpot,0);assert.equal(c.visualFocus,false);
 select.value='99';select.listeners.change();assert.equal(c.visualPage,3);
});
test('I-130A is available conditionally from I-130 without adding it as universal requirement',()=>{
 const {c,workspace}=setup();c.visualKey='family';c.renderVisual();
 const button=workspace.beforeEl.children.find(e=>e.tag==='button');assert.match(button.textContent,/Solo para cónyuge/);button.listeners.click();assert.equal(c.visualKey,'familySupplement');
});
test('complete reference data and UI load before hover annotations',()=>{
 const html=readFileSync(new URL('public/guias/index.html',root),'utf8');
 const order=['guide-bundle.js','guide-form-data.js','guide-complete-forms.js','guide-hints.js'].map(x=>html.indexOf('src="'+x+'"'));
 assert(order.every((v,i)=>v>=0&&(!i||v>order[i-1])));
});
test('instruction guidance is cited by form edition and physical PDF page',()=>{
 let count=0;
 const totals={asylum:12,adjust:41,citizenship:29,family:11,familySupplement:11,conditions:8,card:11,ead:25};
 for(const [key,g] of Object.entries(data))for(const slide of g.slides)for(const spot of slide.spots){
  const advice=spot[6];if(!advice)continue;count++;
  assert(advice.addition.length>30);assert.match(advice.instructionEdition,/^\d\d\/\d\d\/\d\d$/);
  assert(advice.instructionPages.length>0);
  for(const page of advice.instructionPages)assert(Number.isInteger(page)&&page>=1&&page<=totals[key]);
 }
 assert(count>=200,'expected broad, sourced instruction guidance');
 assert.match(uiCode,/#page=/);assert.match(uiCode,/Resumen educativo de la edición de referencia/);
});
test('instruction advice remains visible independently from collapsed readiness notice',()=>{
 const {c,aside}=setup();c.saved['ready-form-asylum']=true;c.renderVisual();
 const block=aside.children.find(e=>e.className==='form-instruction-guidance');
 assert(block);assert(block.children.some(e=>e.tag==='a'&&e.href.includes('i-589instr.pdf#page=')));
});
