// Existing free study views; never point the free CTA at a paid interview gate.
export const freeStudyRoutes=Object.freeze({
 citizenship:'citizenship/civics',
 asylum:'asylum/full-bank',
 residency:'residency/study',
});

export function focusHomeSection(id){
 const element=document.getElementById(id);
 if(!element)return false;
 element.focus({preventScroll:true});
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.reduceMotion==='true';
 element.scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});
 return true;
}

// User-selected homepage entry; the modules retain their own study and access controls.
export const homeStudyEntryRoutes=Object.freeze({citizenship:'citizenship',asylum:'asylum/practice',residency:'residency'});

// Only a validated, non-sensitive module choice is remembered for this tab.
const categoryKey='immigra.home.study-category';
let lastCategory='asylum';
const validCategory=value=>Object.hasOwn(freeStudyRoutes,value);
const tabStorage=()=>{try{return globalThis.sessionStorage;}catch{return null;}};
export function readHomeCategory(storage=tabStorage()){
 try{const value=storage?.getItem(categoryKey);if(validCategory(value))lastCategory=value;}catch{}
 return lastCategory;
}
export function rememberHomeCategory(value,storage=tabStorage()){
 if(!validCategory(value))return lastCategory;
 lastCategory=value;
 try{storage?.setItem(categoryKey,value);}catch{}
 return value;
}
