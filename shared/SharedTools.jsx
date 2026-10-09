import React,{useState} from 'react';
import {THEME_STORAGE_KEY,normalizeThemePreference,resolveTheme} from '../modules/citizenship/src/theme.js';
import {useAccount} from '../modules/citizenship/src/accountContext.js';
import {useBrainProfile} from '../modules/citizenship/src/useBrainProfile.js';
import ImmigrationHelp from '../modules/citizenship/src/ImmigrationHelp.jsx';
import {Profile} from '../modules/citizenship/src/Profile.jsx';
import {LegalSettings} from '../modules/citizenship/src/LegalSettings.jsx';
export default function SharedTools({page,language,onBack,onLanguageChange,navigate}){
 const [theme,setTheme]=useState(()=>{try{return normalizeThemePreference(localStorage.getItem(THEME_STORAGE_KEY));}catch{return 'light';}});
 const changeTheme=value=>{setTheme(value);try{localStorage.setItem(THEME_STORAGE_KEY,value);}catch{}document.documentElement.dataset.theme=resolveTheme(value,matchMedia('(prefers-color-scheme:light)').matches);};
 const {session}=useAccount();const brain=useBrainProfile(session?.user?.id||'guest',session);
 return <section className="citizenship-surface platform-shared-tools">{page==='help'?<ImmigrationHelp language={language} caseProfile={brain.profile.caseProfile} onBack={onBack} onLanguageChange={onLanguageChange}/>:page==='profile'?<Profile language={language} profile={brain.profile} onUpdate={brain.updateProfile} onBack={onBack} onOpenCivicProfile={()=>{window.location.hash='/citizenship/civicProfile';}} onOpenAccount={()=>navigate('account')} onOpenSettings={()=>navigate('settings')} cloudStatus={brain.cloudStatus} onSaveCloud={brain.saveToCloud} onRestoreCloud={brain.restoreFromCloud} onDeleteCloud={brain.deleteFromCloud} onReset={brain.resetProfile}/>:<><div className="platform-panel"><h1>{language==='es'?'Privacidad y preferencias':'Privacy and preferences'}</h1><p>{language==='es'?'Los controles siguientes administran los datos de estudio y perfil de ciudadanía. Asilo mantiene el expediente local y su exportación cifrada; residencia conserva su memoria temporal.':'The controls below manage citizenship study and profile data. Asylum keeps local case files and encrypted exports; residency keeps temporary memory.'}</p><a href="#/asylum/vault">{language==='es'?'Datos y exportación de asilo':'Asylum data and export'}</a></div><LegalSettings language={language} onBack={onBack} themePreference={theme} onThemeChange={changeTheme} onRestartOnboarding={()=>{try{localStorage.removeItem('citizenshipai.onboarding.v1');}catch{}window.location.hash='/citizenship/home';}}/></>}</section>;
}
