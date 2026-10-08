(function(){
 'use strict';
 let cleanup=()=>{};
 window.AsiloPDF={mount(){
  cleanup();
  const fileInput=document.getElementById('source-pdf');if(!fileInput)return;
  const pageSelect=document.getElementById('pdf-page'),extract=document.getElementById('pdf-extract'),status=document.getElementById('pdf-status');
  let task=null,doc=null,file=null,disposed=false,revision=0,stopOCR=()=>{};
  const ocr=document.getElementById('pdf-ocr'),cancel=document.getElementById('pdf-cancel');
  cleanup=()=>{disposed=true;revision++;stopOCR();task?.destroy().catch(()=>{});};
  const valid=()=>!disposed&&fileInput.isConnected;
  const say=text=>{if(valid())status.textContent=text;};
  fileInput.addEventListener('change',async()=>{
   stopOCR();const token=++revision;ocr.disabled=true;await task?.destroy().catch(()=>{});task=null;doc=null;extract.disabled=true;pageSelect.replaceChildren();
   file=fileInput.files[0];if(!file)return;
   if(!file.name.toLowerCase().endsWith('.pdf')||file.size>20*1024*1024){say('Elige un PDF de hasta 20 MB.');return;}
   say('Abriendo PDF en este dispositivo…');
   try{
    const bytes=new Uint8Array(await file.arrayBuffer());
    if(!valid()||token!==revision)return;
    if(!new TextDecoder().decode(bytes.slice(0,1024)).includes('%PDF-'))throw new Error('INVALID_PDF');
    const pdfjs=await import('./vendor/pdfjs/pdf.mjs');
    if(!valid()||token!==revision)return;
    pdfjs.GlobalWorkerOptions.workerSrc='./vendor/pdfjs/pdf.worker.mjs';
    task=pdfjs.getDocument({data:bytes,isEvalSupported:false,enableXfa:false,verbosity:0,cMapUrl:'./vendor/pdfjs/cmaps/',cMapPacked:true,standardFontDataUrl:'./vendor/pdfjs/standard_fonts/',wasmUrl:'./vendor/pdfjs/wasm/'});
    doc=await task.promise;
    if(!valid()||token!==revision)return;
    if(doc.numPages>300){await task.destroy();doc=null;throw new Error('PAGE_LIMIT');}
    for(let n=1;n<=doc.numPages;n++){const option=document.createElement('option');option.value=n;option.textContent='Página '+n;pageSelect.append(option);}
    extract.disabled=false;ocr.disabled=false;say(`${doc.numPages} páginas. Elige una página para extraer y revisar. El archivo no se ha enviado a ningún servidor.`);
   }catch(error){if(!valid()||token!==revision)return;say(error.name==='PasswordException'?'Este PDF está protegido con contraseña. Abre una copia desbloqueada localmente.':error.message==='PAGE_LIMIT'?'El PDF supera 300 páginas. Usa un documento más pequeño.':'No se pudo abrir este PDF. Comprueba que sea válido.');}
  });
  ocr.addEventListener('click',async()=>{
   if(!doc)return;
   const token=++revision,number=Number(pageSelect.value),selected=file;
   let worker=null,renderTask=null,timer=null,aborted=false,canvas=null;
   const current=()=>valid()&&token===revision&&!aborted;
   const restore=()=>{if(valid()){ocr.disabled=!doc;extract.disabled=!doc;pageSelect.disabled=false;cancel.hidden=true;}};
   stopOCR=()=>{aborted=true;clearTimeout(timer);renderTask?.cancel();worker?.terminate().catch(()=>{});restore();};
   cancel.onclick=()=>{stopOCR();say('OCR cancelado. El texto anterior se conserva.');};
   ocr.disabled=true;extract.disabled=true;pageSelect.disabled=true;cancel.hidden=false;
   timer=setTimeout(()=>{if(current()){stopOCR();say('La lectura superó dos minutos. Prueba una página más sencilla. El texto anterior se conserva.');}},120000);
   say('Preparando lectura local de la página '+number+'…');
   try{
    if(!window.Tesseract)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='./vendor/ocr/tesseract.min.js';script.onload=resolve;script.onerror=()=>{script.remove();reject(new Error('LOAD'));};document.head.append(script);});
    if(!current())return;
    const page=await doc.getPage(number);if(!current())return;
    const base=page.getViewport({scale:1});const scale=Math.min(2.5,Math.sqrt(4000000/(base.width*base.height)),4096/Math.max(base.width,base.height));
    const viewport=page.getViewport({scale});canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
    renderTask=page.render({canvasContext:canvas.getContext('2d'),viewport,background:'rgb(255,255,255)'});await renderTask.promise;page.cleanup();if(!current())return;
    const url=p=>new URL('./vendor/ocr/'+p,location.href).href;
    worker=await Tesseract.createWorker(document.getElementById('ocr-language').value,1,{workerPath:url('worker.min.js'),corePath:url('core/'),langPath:url('lang/'),cacheMethod:'none',logger:message=>{if(current())say(message.status==='recognizing text'?'Leyendo página '+number+': '+Math.round(message.progress*100)+' %':'Preparando motor OCR local…');},errorHandler:()=>{}});
    if(!current()){await worker.terminate();return;}
    const result=await worker.recognize(canvas);if(!current())return;
    const text=result.data.text.trim();
    if(!text){say('No se detectó texto. Usa una copia más clara. El texto anterior se conserva.');return;}
    if(text.length>30000){say('La página supera 30.000 caracteres. No se ha importado ni recortado.');return;}
    document.getElementById('source-text').value=text;
    document.getElementById('source-title').value=selected.name+' · página '+number+' · OCR';
    document.getElementById('source-kind').value='user_document';
    say('OCR completado: '+text.length+' caracteres. Revisa nombres, fechas y cifras antes de Añadir fuente local. No se ha guardado ni enviado automáticamente.');
   }catch{if(current())say('No se pudo leer esta página. Prueba otro idioma o una copia más clara. El texto anterior se conserva.');}
   finally{clearTimeout(timer);await worker?.terminate().catch(()=>{});if(canvas){canvas.width=0;canvas.height=0;}if(valid()&&token===revision)restore();}
  });
  extract.addEventListener('click',async()=>{
   if(!doc)return;const token=revision,number=Number(pageSelect.value),selected=file;extract.disabled=true;say('Extrayendo texto de la página '+number+'…');
   try{
    const page=await doc.getPage(number),content=await page.getTextContent();page.cleanup();
    if(!valid()||token!==revision)return;
    const text=content.items.filter(item=>typeof item.str==='string').map(item=>item.str+(item.hasEOL?'\n':' ')).join('').trim();
    if(!text){say('Esta página no contiene texto extraíble. Puede ser una imagen escaneada; usa Leer página escaneada (OCR). El texto anterior no se ha cambiado.');return;}
    if(text.length>30000){say('La página supera 30.000 caracteres. No se ha importado ni recortado el texto.');return;}
    document.getElementById('source-text').value=text;
    document.getElementById('source-title').value=selected.name+' · página '+number;
    document.getElementById('source-kind').value='user_document';
    say(`Página ${number}: ${text.length} caracteres extraídos. Revisa abajo el orden y el contenido; luego pulsa Añadir fuente local. No se ha guardado ni enviado automáticamente.`);
   }catch{say('No se pudo extraer esta página. Prueba otra página.');}finally{if(valid()&&token===revision)extract.disabled=false;}
  });
 }};
})();
