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
 const current=new URL(browser.location.href);
 if(current.searchParams.get('guest_checkout')==='return'&&/^cs_(?:test_|live_)?[a-zA-Z0-9]{8,200}$/.test(current.searchParams.get('session_id')||'')){url.searchParams.set('guest_checkout','return');url.searchParams.set('session_id',current.searchParams.get('session_id'));}
 else if(interval)url.searchParams.set('checkout',interval);
 return url.href;
}

export function guestCheckoutId(browser=window){const params=new URLSearchParams(browser.location.search);return params.get('guest_checkout')==='return'?params.get('session_id')||'':null;}

const GUEST_KEY='immigra.pending-checkout.v1';
// This public checkout reference is not a token: claiming it still requires the
// HttpOnly device proof or a verified account matching Stripe's paid email.
export function rememberGuestCheckout(id,browser=window){try{if(id)browser.localStorage.setItem(GUEST_KEY,JSON.stringify({id,expires:Date.now()+7*86400000}));else browser.localStorage.removeItem(GUEST_KEY);}catch{}}
export function pendingGuestCheckout(browser=window){try{const saved=JSON.parse(browser.localStorage.getItem(GUEST_KEY)||'null');return saved?.expires>Date.now()&&/^cs_(?:test_|live_)?[a-zA-Z0-9]{8,200}$/.test(saved.id)?saved.id:null;}catch{return null;}}
export function resumeGuestCheckout(browser=window){const id=pendingGuestCheckout(browser);if(!id)return;const url=new URL(browser.location.href);url.searchParams.delete('checkout');url.searchParams.set('guest_checkout','return');url.searchParams.set('session_id',id);url.hash='/account';browser.location.assign(url.href);}
