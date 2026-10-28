// Keep established public URLs; alternate marketing slugs redirect to these pages.
export const siteOrigin='https://immigra.site';
export const seoPages=[
 {path:'en/citizenship',alias:'citizenship-interview',lang:'en',module:'citizenship',alternate:'ciudadania',title:'US Citizenship Interview Practice with AI | IMMIGRA.site',description:'Prepare for your U.S. citizenship interview with AI. Practice civics questions, N-400 questions and realistic interview simulations.',heading:'Practice for your U.S. citizenship interview'},
 {path:'ciudadania',alias:'entrevista-ciudadania',lang:'es',module:'citizenship',alternate:'en/citizenship',title:'Preguntas de Ciudadanía Americana y Entrevista | IMMIGRA.site',description:'Prepárate para tu entrevista de ciudadanía americana con inteligencia artificial. Practica preguntas del N-400, educación cívica y entrevistas simuladas.',heading:'Prepárate para tu entrevista de ciudadanía americana'},
 {path:'en/asylum',alias:'asylum-interview',lang:'en',module:'asylum',alternate:'asilo',title:'Asylum Interview Practice with AI | IMMIGRA.site',description:'Prepare for your U.S. asylum interview with AI-powered practice questions, personalized simulations and educational interview preparation.',heading:'Practice for your U.S. asylum interview'},
 {path:'asilo',alias:'entrevista-asilo',lang:'es',module:'asylum',alternate:'en/asylum',title:'Preguntas para la Entrevista de Asilo | IMMIGRA.site',description:'Practica tu entrevista de asilo en Estados Unidos con inteligencia artificial. Prepárate con preguntas personalizadas y simulaciones interactivas.',heading:'Preguntas y práctica para la entrevista de asilo'},
 {path:'en/residency',alias:'green-card-interview',lang:'en',module:'residency',alternate:'residencia',title:'Green Card Interview Practice with AI | IMMIGRA.site',description:'Practice for your green card interview with AI. Explore common residency interview questions and prepare with interactive simulations.',heading:'Practice for your green card interview'},
 {path:'residencia',alias:'entrevista-residencia',lang:'es',module:'residency',alternate:'en/residency',title:'Preguntas para la Entrevista de Residencia | IMMIGRA.site',description:'Prepárate para tu entrevista de residencia americana con inteligencia artificial y practica preguntas mediante entrevistas simuladas.',heading:'Prepárate para tu entrevista de residencia americana'}
];
export const publicPairs=[['sources','fuentes'],['privacy','privacidad'],['terms','terminos'],['support','soporte'],['delete-account','eliminar-cuenta'],['en/citizenship','ciudadania'],['en/asylum','asilo'],['en/residency','residencia']];
export const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function alternateLinks(path){
 const pair=publicPairs.find(p=>p.includes(path));
 return pair?pair.map((p,i)=>`<link rel="alternate" hreflang="${i?'es':'en'}" href="${siteOrigin}/${p}">`).join('')+`<link rel="alternate" hreflang="x-default" href="${siteOrigin}/${pair[0]}">`:'';
}
export function structuredData(path,title,lang){
 const url=siteOrigin+'/'+path;
 const graph=[{'@type':'Organization','@id':siteOrigin+'/#organization',name:'IMMIGRA.site',url:siteOrigin,logo:siteOrigin+'/app-icon-192.png'}, {'@type':'WebSite','@id':siteOrigin+'/#website',name:'IMMIGRA.site',url:siteOrigin,inLanguage:['es','en'],publisher:{'@id':siteOrigin+'/#organization'}}];
 if(!path||seoPages.some(p=>p.path===path))graph.push({'@type':'SoftwareApplication',name:'IMMIGRA.site',url:siteOrigin,applicationCategory:'EducationalApplication',operatingSystem:'Web',inLanguage:['es','en'],description:'Educational immigration interview practice. Independent of government; not legal advice.'});
 if(path)graph.push({'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'IMMIGRA',item:siteOrigin+'/'},{'@type':'ListItem',position:2,name:title,item:url}]});
 graph.push({'@type':'WebPage',url,name:title,inLanguage:lang,isPartOf:{'@id':siteOrigin+'/#website'}});
 return `<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c')}</script>`;
}
export function seoNavigation(lang='es'){
 return `<nav aria-label="${lang==='es'?'Guías de preparación':'Preparation guides'}"><ul>${seoPages.map(p=>`<li><a href="/${p.path}" hreflang="${p.lang}">${escapeHtml(p.heading)} (${p.lang.toUpperCase()})</a></li>`).join('')}</ul></nav>`;
}
