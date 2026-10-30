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
