import test from 'node:test';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {newSession} from '../modules/asylum/study-session.mjs';
import {studyBank} from '../modules/asylum/reflection-bank.mjs';

test('rendered study and call controls have bilingual accessible names and native disabled semantics',async()=>{
 const directory=await mkdtemp(fileURLToPath(new URL('../node_modules/.asylum-render-',import.meta.url)));
 const oldWindow=globalThis.window,oldDocument=globalThis.document;
 try{
  globalThis.window={localStorage:{getItem:()=>JSON.stringify(newSession(studyBank,'Cuba'))}};globalThis.document={body:{}};
  for(const [name,path] of [['study','modules/asylum/AsylumStudyBook.jsx'],['call','shared/interview-ui/CallView.jsx'],['adaptive','modules/asylum/AsylumAdaptivePicker.jsx']]){
   const output=`${directory}/${name}.mjs`;
   const result=await build({entryPoints:[fileURLToPath(new URL(`../${path}`,import.meta.url))],bundle:true,format:'esm',platform:'node',jsx:'automatic',define:{'import.meta.env.BASE_URL':'"/"'},write:false,external:['react','react/jsx-runtime'],loader:{'.css':'empty'},plugins:[{name:'ssr-portal',setup(b){b.onResolve({filter:/^react-dom$/},()=>({path:'portal',namespace:'qa'}));b.onLoad({filter:/.*/,namespace:'qa'},()=>({contents:'export const createPortal = children => children;',loader:'js'}));}}]});
   await writeFile(output,result.outputFiles[0].text);const Component=(await import(pathToFileURL(output).href)).default;
   for(const lang of ['es','en']){
    if(name==='adaptive'){
     const html=renderToStaticMarkup(React.createElement(Component,{lang,value:{offer:{quote:'Synthetic test',options:['IMMIGRA_ASYLUM_ADAPT_EMPLOYMENT_1_S1'],priorQuotes:[]}},onAction:()=>{}}));
     assert.match(html,/<select/);assert.ok(html.includes(lang==='es'?'Identificar la parte vinculada al empleo.':'Identify the job-dependent part.'));
     const active=renderToStaticMarkup(React.createElement(Component,{lang,value:{active:{id:'IMMIGRA_ASYLUM_ADAPT_EMPLOYMENT_1_S1',impact:false}},onAction:()=>{}}));
     assert.ok(active.includes(lang==='es'?'no es una pregunta oficial':'not an official question'));continue;
    }
    const html=renderToStaticMarkup(React.createElement(Component,{lang,moduleId:'asylum',state:'listening',muted:true,captions:[],showCaptions:true,onSkip:()=>{},onPause:()=>{},onRepeat:()=>{},onFinish:()=>{},onMic:()=>{}}));
    assert.ok(html.includes(lang==='es'?'Pasar pregunta':'Skip question'));
    assert.ok(html.includes(`aria-label="${lang==='es'?'Pasar esta pregunta sin responder':'Skip this question without answering'}"`));
    assert.match(html,/<button/);
    if(name==='study')assert.match(html,/aria-live="polite"/);
    if(name==='call'){
     const disabled=renderToStaticMarkup(React.createElement(Component,{lang,moduleId:'asylum',state:'processing',muted:true,captions:[],showCaptions:true,onSkip:()=>{}}));
     assert.match(disabled,/<button[^>]*aria-label="(?:Pasar esta pregunta sin responder|Skip this question without answering)"[^>]*disabled=""/);
    }
   }
  }
 }finally{globalThis.window=oldWindow;globalThis.document=oldDocument;await rm(directory,{recursive:true,force:true});}
});
