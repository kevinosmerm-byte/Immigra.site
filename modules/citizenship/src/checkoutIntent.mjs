const KEY='immigra.checkout-intent.v2',LEGACY='immigra.pending-billing.v1',TTL=30*60*1000;
const valid=interval=>['monthly','annual'].includes(interval);
export function saveCheckoutIntent(interval,email='',browser=window,now=Date.now()){
 if(!valid(interval))return;
 const url=new URL(browser.location.href);if(url.searchParams.has('checkout')){url.searchParams.set('checkout',interval);browser.history.replaceState(browser.history.state,'',url.pathname+url.search+url.hash);}
 try{browser.localStorage.setItem(KEY,JSON.stringify({interval,email:email.trim().toLowerCase(),createdAt:now}));}catch{}
 try{browser.sessionStorage.setItem(LEGACY,interval);}catch{}
}
export function readCheckoutIntent(email='',browser=window,now=Date.now()){
 const url=new URL(browser.location.href),fromLink=url.searchParams.get('checkout');
 if(valid(fromLink))return fromLink;
 try{const raw=browser.localStorage.getItem(KEY);if(raw){const value=JSON.parse(raw);return value&&valid(value.interval)&&now>=value.createdAt&&now-value.createdAt<TTL&&(!value.email||value.email===email.trim().toLowerCase())?value.interval:null;}}catch{}
 try{const value=browser.sessionStorage.getItem(LEGACY);if(valid(value))return value;}catch{}
 return null;
}
export function clearCheckoutIntent(browser=window){
 try{browser.localStorage.removeItem(KEY);}catch{}
 try{browser.sessionStorage.removeItem(LEGACY);}catch{}
 const url=new URL(browser.location.href);if(url.searchParams.has('checkout')){url.searchParams.delete('checkout');browser.history.replaceState(browser.history.state,'',url.pathname+url.search+url.hash);}
}
export function checkoutReturnUrl(email='',browser=window){
 const url=new URL(browser.location.pathname,browser.location.origin),interval=readCheckoutIntent(email,browser);
 if(interval)url.searchParams.set('checkout',interval);
 return url.href;
}
