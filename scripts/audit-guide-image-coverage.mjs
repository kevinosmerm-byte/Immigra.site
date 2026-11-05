import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=fileURLToPath(new URL('..',import.meta.url));
const source=readFileSync(root+'/public/guias/guide-bundle.js','utf8');
const from=source.indexOf('const visualGuides=');
const to=source.indexOf("let visualKey=",from);
const guides=vm.runInNewContext(source.slice(from,to)+';visualGuides',Object.create(null),{timeout:1000});
// Totals refer to the existing reference images, not a claim of current USCIS editions.
const referenceTotals={asylum:12,adjust:24,citizenship:14,family:12,ead:7,familySupplement:6,conditions:11,card:7,addressPaper:2,travel:14};
const completePath=root+'/public/guias/guide-form-data.js';
if(existsSync(completePath))Object.assign(guides,vm.runInNewContext(readFileSync(completePath,'utf8')+';completeFormGuides',Object.create(null),{timeout:1000}));
const rows=Object.entries(guides).map(([process,g])=>({
 process,form:g.form,referenceEdition:g.edition,currentEditionVerified:false,
 referencePageCount:referenceTotals[process],draft:!!g.draft,
 includedPages:g.slides.map(s=>s.page),
 missingReferencePages:Array.from({length:referenceTotals[process]},(_,i)=>i+1).filter(p=>!g.slides.some(s=>s.page===p)),
 imageFiles:g.slides.map(s=>({file:s.image,exists:existsSync(root+'/public/guias/assets/'+s.image)})),official:g.official
}));
console.log(JSON.stringify({baseCommit:'ba00b46fd45cec68f52603701fce37be1b91a442',verifiedAt:'2026-11-05',scope:'Static source and stored reference-image coverage; no live functional testing and no claim of current filing edition',forms:rows,processesWithoutSpecificImages:['court','tps'],portalCaptureCounts:{account:2,foia:2},eadOnlineSelectedScreens:[3,8,13,20,21,25,28,29,30,40,50]},null,2));
if(rows.some(r=>r.imageFiles.some(f=>!f.exists)))process.exitCode=1;
