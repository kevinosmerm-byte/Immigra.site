// Hash routes are app screens, not separate search landing pages.
// This is a crawler hint only: authentication remains the privacy boundary.
export function syncSeoDocument(){
 if(document.documentElement.dataset.experience==='native')return;
 const privateScreen=Boolean(location.hash.replace(/^#\/?/,''));
 let robots=document.querySelector('meta[name="robots"]');
 if(!robots){robots=document.createElement('meta');robots.name='robots';document.head.append(robots);}
 robots.content=privateScreen?'noindex, nofollow':'index, follow';
}
syncSeoDocument();
window.addEventListener('hashchange',syncSeoDocument);
