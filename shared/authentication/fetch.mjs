let token=null;
export function setSessionToken(value){token=typeof value==='string'?value:null;}
export function getSessionToken(){return token;}
export function authenticatedFetch(input,options={}){
 const headers=new Headers(options.headers);
 if(typeof input==='string'&&input.startsWith('/api/')&&token&&!headers.has('Authorization'))headers.set('Authorization','Bearer '+token);
 return fetch(input,{...options,headers});
}
