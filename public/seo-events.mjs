// Disabled by default. No analytics provider, cookies, identifiers or URL payloads.
// A consent-aware integration may listen for this event later.
export const seoEventNames=Object.freeze(['seo_page_view','start_practice_click','registration_begin','registration_complete','interview_start','subscription_paid']);
export function emitSeoEvent(name,context={}){
 if(!seoEventNames.includes(name)||typeof window==='undefined'||window.immigraAnalyticsConsent!==true)return false;
 const detail={event:name};
 if(['es','en'].includes(context.language))detail.language=context.language;
 if(['citizenship','asylum','residency'].includes(context.module))detail.module=context.module;
 window.dispatchEvent(new CustomEvent('immigra:analytics',{detail}));
 return true;
}
if(typeof document!=='undefined'&&document.body?.dataset.seoPage){
 const context={language:document.body.dataset.seoLanguage,module:document.body.dataset.seoModule};
 emitSeoEvent('seo_page_view',context);
 document.querySelectorAll('[data-seo-start]').forEach(link=>link.addEventListener('click',()=>emitSeoEvent('start_practice_click',context)));
}
