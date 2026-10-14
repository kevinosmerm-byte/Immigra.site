import LegalOperatorNotice from "./LegalOperatorNotice.jsx";
import {StudyPreparation} from "../modules/citizenship/src/StudyPreparation.jsx";
import './design-system/immigration-help.css';
import React,{useState} from 'react';
import {THEME_STORAGE_KEY,normalizeThemePreference,resolveTheme} from '../modules/citizenship/src/theme.js';
import {useAccount} from '../modules/citizenship/src/accountContext.js';
import {useBrainProfile} from '../modules/citizenship/src/useBrainProfile.js';
import ImmigrationHelp from '../modules/citizenship/src/ImmigrationHelp.jsx';
import EmailProfile from './EmailProfile.jsx';
import {LegalSettings} from '../modules/citizenship/src/LegalSettings.jsx';
export default function SharedTools({page,language,onBack,onLanguageChange,navigate}){
 const [theme,setTheme]=useState(()=>{try{return normalizeThemePreference(localStorage.getItem(THEME_STORAGE_KEY));}catch{return 'light';}});
 const changeTheme=value=>{setTheme(value);try{localStorage.setItem(THEME_STORAGE_KEY,value);}catch{}document.documentElement.dataset.theme=resolveTheme(value,matchMedia('(prefers-color-scheme:light)').matches);};

 return <section className="citizenship-surface platform-shared-tools">{page==='preparation'?<Preparation language={language} onBack={onBack} onLanguageChange={onLanguageChange} navigate={navigate}/>:page==='help'?<ContextualHelp language={language} onBack={onBack} onLanguageChange={onLanguageChange}/>:page==='profile'?<EmailProfile language={language}/>:<><LegalOperatorNotice language={language}/><LegalSettings embedded language={language} onBack={onBack} themePreference={theme} onThemeChange={changeTheme} onRestartOnboarding={()=>{try{localStorage.removeItem('citizenshipai.onboarding.v1');}catch{}window.location.hash='/citizenship/home';}}/></>}</section>;
}

function ContextualHelp(props){const {session}=useAccount();const brain=useBrainProfile(session?.user?.id||'guest',session);return <ImmigrationHelp embedded {...props} caseProfile={brain.profile.caseProfile}/>;}
function Preparation({language,onBack,onLanguageChange,navigate}){const {session}=useAccount();const brain=useBrainProfile(session?.user?.id||"guest",session);return <StudyPreparation context={{...brain.profile,language}} language={language} onUpdate={brain.updateProfile} onLanguageChange={onLanguageChange} onBack={onBack} onNavigate={()=>navigate("help")} onPractice={item=>{const goal=brain.profile.preferences?.studyGoal;if(goal==="asylum"||goal==="adjustment"){navigate(goal==="adjustment"?"residency":goal);return;}window.location.hash="/citizenship/"+(item.module==="interview"?"interview?mode="+(item.mode||"civics"):item.module||"practice");}}/>;}

