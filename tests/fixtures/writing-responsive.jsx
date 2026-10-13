// Local-only visual fixture; not an application route or a production build entry.
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import '../../src/style.css';
import '../../shared/design-system/platform.css';
import '../../shared/design-system/citizenship.css';
import '../../shared/design-system/glass.css';
import '../../modules/citizenship/src/App.css';
import '../../modules/citizenship/src/BrandPalette.css';
import '../../modules/citizenship/src/index.css';
import '../../shared/design-system/citizenship-exercises.css';
import '../../shared/design-system/liquid-glass.css';
import WritingPractice from '../../modules/citizenship/src/WritingPractice.jsx';
import {writingSentences} from '../../modules/citizenship/src/writingSentences.js';
import {evaluateWritingSentence,localizeWritingResult} from '../../modules/citizenship/src/writingEvaluator.js';
import {speakAppText} from '../../modules/citizenship/src/speech.js';
function Fixture(){
 const [index,setIndex]=useState(2),[answer,setAnswer]=useState(''),[evaluation,setEvaluation]=useState(null),[good,setGood]=useState(0),[needs,setNeeds]=useState(0),[audio,setAudio]=useState('');
 const sentence=writingSentences[index];
 return <><header style={{minHeight:64,padding:16}}>Immigration AI · <small>Prueba visual local</small></header><main id="main" className="citizenship-surface"><div id="citizenship-root"><nav style={{minHeight:48,padding:12}}>Ciudadanía · Escritura</nav><WritingPractice t={(en,es)=>es} sentence={sentence} index={index} total={writingSentences.length} answer={answer} onAnswer={setAnswer} evaluation={evaluation} message={audio} busy={false} goodCount={good} needsCount={needs} onListen={async()=>{const ok=await speakAppText(sentence.english,{profile:'female',rate:.85,pitch:1.08,onStart:()=>setAudio('Audio iniciado')});setAudio(ok?'Audio finalizado':'Audio no disponible');}} onCheck={()=>{const result=localizeWritingResult(evaluateWritingSentence(sentence,answer),'es');setEvaluation({...result,writtenAnswer:answer,expectedAnswer:sentence.english});if(['Excellent','Good'].includes(result.accuracy))setGood(n=>n+1);else setNeeds(n=>n+1);}} onRetry={()=>setEvaluation(null)} onNext={()=>{setIndex(i=>(i+1)%writingSentences.length);setAnswer('');setEvaluation(null);setAudio('');}} onBack={()=>{}} backLabel="Ciudadanía"/></div></main></>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
