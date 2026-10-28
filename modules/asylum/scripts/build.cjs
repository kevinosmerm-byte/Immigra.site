const fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..'),out=path.join(root,'dist');fs.mkdirSync(out,{recursive:true});fs.cpSync(path.join(root,'apps/web'),out,{recursive:true});fs.copyFileSync(path.join(root,'packages/core/index.cjs'),path.join(out,'core.js'));for(const name of ['style.css','master.css'])fs.copyFileSync(path.join(root,'packages/design',name),path.join(out,name));console.log('AsiloAI web build ready: dist');

const source=name=>fs.readFileSync(path.join(root,'services/analysis',name),'utf8').replace(/^import .*;$/gm,'').replace(/^export default .*;$/gm,'').replace(/export /g,'');
fs.writeFileSync(path.join(out,'_worker.js'),source('worker.mjs')+'\n'+source('access.mjs')+'\n'+source('gateway.mjs')+'\nexport default {fetch:(request,env)=>gateway(request,env)};\n');
fs.writeFileSync(path.join(out,'_routes.json'),JSON.stringify({version:1,include:['/api/*'],exclude:[]}));
const crypto=require('node:crypto');
const pdfPackage=path.join(root,'node_modules/pdfjs-dist'),pdfOut=path.join(out,'vendor/pdfjs');
fs.mkdirSync(pdfOut,{recursive:true});
for(const file of ['pdf.mjs','pdf.worker.mjs'])fs.copyFileSync(path.join(pdfPackage,'build',file),path.join(pdfOut,file));
for(const dir of ['cmaps','standard_fonts','wasm'])fs.cpSync(path.join(pdfPackage,dir),path.join(pdfOut,dir),{recursive:true});
fs.copyFileSync(path.join(pdfPackage,'LICENSE'),path.join(pdfOut,'LICENSE'));
const indexPath=path.join(out,'index.html');
fs.writeFileSync(indexPath,fs.readFileSync(indexPath,'utf8').replace(/(href|src)="([^"?#]+\.(?:css|js))"/g,(_,attr,file)=>`${attr}="${file}?v=${crypto.createHash('sha256').update(fs.readFileSync(path.join(out,file))).digest('hex').slice(0,12)}"`));

const ocrOut=path.join(out,'vendor/ocr');fs.mkdirSync(ocrOut,{recursive:true});
for(const name of ['tesseract.min.js','worker.min.js'])fs.copyFileSync(path.join(root,'node_modules/tesseract.js/dist',name),path.join(ocrOut,name));
fs.copyFileSync(path.join(root,'node_modules/tesseract.js/LICENSE.md'),path.join(ocrOut,'LICENSE'));
const coreDir=path.join(root,'node_modules/tesseract.js-core');
fs.mkdirSync(path.join(ocrOut,'core'),{recursive:true});
for(const name of fs.readdirSync(coreDir).filter(n=>n.endsWith('.wasm.js')||n.endsWith('.wasm')||n==='LICENSE'))fs.copyFileSync(path.join(coreDir,name),path.join(ocrOut,'core',name));
fs.mkdirSync(path.join(ocrOut,'lang'),{recursive:true});
for(const lang of ['spa','eng'])fs.copyFileSync(path.join(root,'node_modules/@tesseract.js-data',lang,'4.0.0_best_int',lang+'.traineddata.gz'),path.join(ocrOut,'lang',lang+'.traineddata.gz'));

