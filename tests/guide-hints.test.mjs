import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const script = readFileSync(new URL('../public/guias/guide-hints.js',import.meta.url),'utf8');
function setup(){
 const events={};
 class El {
  constructor(){this.dataset={};this.attrs={};this.children=[];this.style={};this.isConnected=true;}
  setAttribute(k,v){this.attrs[k]=v;} removeAttribute(k){delete this.attrs[k];}
  append(...els){this.children.push(...els);} replaceChildren(){this.children=[];}
  contains(el){return el===this||this.children.includes(el);}
  closest(){return this.dataset.guideHintTitle?this:null;}
  getBoundingClientRect(){return {left:10,top:100,bottom:140,width:300,height:100};}
 }
 const body=new El();
 const context={document:{body,createElement:()=>new El(),addEventListener:(k,f)=>events[k]=f},window:{addEventListener:()=>{}},MutationObserver:class{observe(){}},app:new El(),innerWidth:375,innerHeight:800,renderVisual(){},renderEadLesson(){},renderFriendlyPortal(){}};
 vm.runInNewContext(script,context);
 const target=new El();target.dataset={guideHintTitle:'Identidad',guideHintText:'Consulta tus documentos.'};
 return {events,target,tooltip:body.children[0],context,El};
}
test('tooltip uses existing labels, hover and keyboard focus without HTML injection',()=>{
 const {events,target,tooltip}=setup();
 events.pointerover({target,pointerType:'mouse'});
 assert.equal(tooltip.hidden,false);assert.equal(tooltip.children[0].textContent,'Identidad');
 assert.equal(tooltip.children[1].textContent,'Consulta tus documentos.');
 assert.equal(target.attrs['aria-describedby'],'guide-zone-tooltip');
 events.keydown({key:'Escape'});assert.equal(tooltip.hidden,true);
 events.focusin({target});assert.equal(tooltip.hidden,false);
 events.focusout({target});assert.equal(tooltip.hidden,true);
});
test('tap pins explanation, second tap and Escape dismiss it',()=>{
 const {events,target,tooltip}=setup();
 events.click({target});assert.equal(tooltip.hidden,false);
 events.pointerout({target,relatedTarget:null});assert.equal(tooltip.hidden,false);
 events.click({target});assert.equal(tooltip.hidden,true);
 events.click({target});events.keydown({key:'Escape'});assert.equal(tooltip.hidden,true);
});
test('all three guide render paths are enhanced and CSP-safe assets are loaded',()=>{
 const html=readFileSync(new URL('../public/guias/index.html',import.meta.url),'utf8');
 assert(html.includes('href="guide-hints.css"'));
 assert(html.indexOf('src="guide-hints.js"')>html.indexOf('src="guide-bundle.js"'));
 for(const fn of ['renderVisual','renderEadLesson','renderFriendlyPortal'])assert(script.includes(`${fn} = function`));
 assert.doesNotMatch(script,/innerHTML|eval\(|setAttribute\(['"]on/);
});
test('I-765 image itself receives a direct hover and touch explanation',()=>{
 const {context,El,events,tooltip}=setup();
 const image=new El(), figure=new El();
 figure.querySelector=selector=>selector==='.native-crop'?image:null;
 context.document.querySelector=()=>figure;
 context.eadLessons=[[3,[], 'Abre el formulario correcto', 'Busca File a form online.']];
 context.eduScreen=0;
 context.renderEadLesson();
 assert.equal(image.dataset.guideHintTitle,'Abre el formulario correcto');
 events.pointerover({target:image,pointerType:'mouse'});
 assert.equal(tooltip.hidden,false);
 assert.equal(tooltip.children[1].textContent,'Busca File a form online.');
 events.click({target:image});
 events.pointerout({target:image,relatedTarget:null});
 assert.equal(tooltip.hidden,false);
});
