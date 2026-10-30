import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import ImmigraHome from '../src/ImmigraHome.jsx';
import {WebHeader} from '../src/WebExperience.jsx';
import '../src/web-experience.css';
function Preview(){const[lang,setLang]=useState('es');return <><div className="private-preview-notice">Vista previa privada · No publicada. Los enlaces de cuenta y práctica abren la versión pública existente.</div><WebHeader lang={lang} setLang={setLang} page=""/><main id="main"><ImmigraHome previewExamples lang={lang} onNavigate={route=>{window.location.href='https://immigra.site/#/'+route;}}/></main><footer>Vista previa privada · No publicada. Los accesos de cuenta y práctica abren la web existente.</footer></>;}
createRoot(document.getElementById('root')).render(<Preview/>);
