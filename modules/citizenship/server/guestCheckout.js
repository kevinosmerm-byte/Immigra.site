import {createHmac, randomUUID, timingSafeEqual} from 'node:crypto';
import {PRO_PLAN} from '../shared/featureAccessConfig.js';
import {paymentMeasurement} from './paymentMeasurement.js';
import {getStripe, getBillingConfiguration, priceIdForInterval, appBaseUrl, mapStripeSubscription} from './stripeBilling.js';
import {registerEmailTrial, getBillingIdentity, applyVerifiedEntitlementEvent} from './accountService.js';

const COOKIE='__Host-immigra_checkout', FLOW='immigra_guest_v1', TTL=86400;
const validId=id=>typeof id==='string'&&/^cs_(?:test_|live_)?[a-zA-Z0-9]{8,200}$/.test(id);
const fail=(code,status=409)=>Object.assign(Error(code),{code,status,guestCheckoutError:true});
const email=value=>typeof value==='string'?value.trim().toLowerCase():'';

// A return URL is public. Only this HttpOnly proof or a verified owner can claim it.
export function createGuestCheckoutService({client=getStripe, configuration=getBillingConfiguration, price=priceIdForInterval, base=appBaseUrl, register=registerEmailTrial, identity=getBillingIdentity, apply=applyVerifiedEntitlementEvent, secret=()=>process.env.SUPABASE_SECRET_KEY?.trim(), now=Date.now}={}) {
 function sign(value){const key=secret();if(!key)throw fail('account_unavailable',503);return createHmac('sha256',key).update('immigra-guest-checkout-v1:'+value).digest('hex');}
 function proof(req,id){
  const cookie=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';
  const [payload,signature,...extra]=cookie.split('.');
  if(extra.length||!payload||payload.length>1000||!/^[a-f0-9]{64}$/.test(signature||''))return null;
  if(!timingSafeEqual(Buffer.from(sign(payload)),Buffer.from(signature)))return null;
  try {const data=JSON.parse(Buffer.from(payload,'base64url').toString());return (!id||data.id===id)&&validId(data.id)&&typeof data.nonce==='string'&&Number.isFinite(data.exp)&&data.exp>now()?data:null;}catch{return null;}
 }
 const intervals=['monthly','annual'];
 const switchWindow=23*60*60*1000;
 function validateOwned(session,device){
  if(session.id!==device.id||session.mode!=='subscription'||session.metadata?.flow!==FLOW||session.metadata?.product_key!==PRO_PLAN.productKey||session.metadata?.checkout_nonce!==device.nonce||!intervals.includes(session.metadata?.interval))throw fail('invalid_checkout',403);
 }
 function withinSwitchWindow(session){
  const created=Number(session.created)*1000;
  return Number.isInteger(session.created)&&created<=now()&&now()-created<switchWindow;
 }
 function requireUnpaid(session){
  if(session.payment_status!=='unpaid'||session.subscription)throw fail('checkout_switch_unavailable');
 }
 function payloadFor(interval,nonce){
  const metadata={flow:FLOW,checkout_nonce:nonce,product_key:PRO_PLAN.productKey,interval};
  return {
   mode:'subscription',line_items:[{price:price(interval),quantity:1}],
   metadata,subscription_data:{metadata},payment_method_collection:'always',allow_promotion_codes:true,
   automatic_tax:{enabled:String(process.env.STRIPE_AUTOMATIC_TAX||'').trim().toLowerCase()==='true'},
   success_url:`${base()}/?guest_checkout=return&session_id={CHECKOUT_SESSION_ID}#/account`,
   cancel_url:`${base()}/?billing=cancelled#/account`,
  };
 }
 function remember(res,session,nonce){
  const payload=Buffer.from(JSON.stringify({id:session.id,nonce,exp:now()+TTL*1000})).toString('base64url');
  res.setHeader('Set-Cookie',`${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${TTL}`);
  return {url:session.url,checkoutId:session.id};
 }
 function stripeUrl(value){
  try{const url=new URL(value);return url.protocol==='https:'&&url.hostname==='checkout.stripe.com'&&!url.username&&!url.password;}catch{return false;}
 }
 async function successor(res,old,device,interval){
  // One key for this predecessor across EVERY successor path, never per target.
  // Conflicting target/payload requests must fail Stripe's parameter check.
  if(!withinSwitchWindow(old))throw fail('checkout_switch_expired');
  requireUnpaid(old);
  if(old.status!=='expired')throw fail('checkout_switch_unavailable');
  const nonce=sign('successor-nonce:'+old.id+':'+device.nonce);
  const payload=payloadFor(interval,nonce);
  // The successor cannot outlive the original proof's 24-hour window if a
  // response is lost. This immutable timestamp also makes retries identical.
  payload.expires_at=old.created+TTL;
  const result=await client().checkout.sessions.create(payload,{idempotencyKey:'immigra-guest-successor-v1:'+old.id});
  if(!validId(result.id))throw fail('checkout_unavailable',503);
  const current=await client().checkout.sessions.retrieve(result.id);
  if(current.id!==result.id||current.mode!=='subscription'||current.metadata?.flow!==FLOW||current.metadata?.product_key!==PRO_PLAN.productKey||current.metadata?.checkout_nonce!==nonce||current.metadata?.interval!==interval||current.status!=='open'||!stripeUrl(current.url))throw fail('checkout_switch_unavailable');
  requireUnpaid(current);
  return remember(res,current,nonce);
 }
 async function start(req,res,interval){
  if(!intervals.includes(interval))throw fail('invalid_billing_interval',400);
  if(!configuration().enabled||!price(interval))throw fail('checkout_unavailable',503);
  const existingProof=proof(req);
  const hasProofCookie=(req.headers.cookie||'').split(';').some(value=>value.trim().startsWith(COOKIE+'='));
  if(hasProofCookie&&!existingProof)throw fail('checkout_verification_required',403);
  if(existingProof){
   const existing=await client().checkout.sessions.retrieve(existingProof.id);
   // Keep old checkout compatibility; switching requires the stronger checks.
   if(existing.id!==existingProof.id||existing.metadata?.flow!==FLOW||existing.metadata?.product_key!==PRO_PLAN.productKey||existing.metadata?.checkout_nonce!==existingProof.nonce)throw fail('invalid_checkout',403);
   if(existing.status==='open'&&existing.url){
    if(existing.metadata.interval!==interval){
     const error=fail('checkout_in_progress');
     if(existing.mode==='subscription'&&existing.payment_status==='unpaid'&&!existing.subscription&&intervals.includes(existing.metadata.interval)&&withinSwitchWindow(existing)){
      error.switchOffer={checkoutId:existing.id,fromInterval:existing.metadata.interval,toInterval:interval};
     }
     throw error;
    }
    return {url:existing.url,checkoutId:existing.id};
   }
   if(existing.status!=='expired')throw fail('subscription_already_active');
   validateOwned(existing,existingProof);
   return successor(res,existing,existingProof,interval);
  }
  sign('configuration-check');
  const nonce=randomUUID();
  const session=await client().checkout.sessions.create(payloadFor(interval,nonce),{idempotencyKey:`immigra-guest-checkout-v1:${nonce}`});
  if(!validId(session.id)||!session.url)throw fail('checkout_unavailable',503);
  return remember(res,session,nonce);
 }
 async function switchPlan(req,res,{confirmed,checkoutId,fromInterval,interval}={}){
  if(confirmed!==true||!validId(checkoutId)||!intervals.includes(fromInterval)||!intervals.includes(interval)||fromInterval===interval)throw fail('invalid_checkout_switch',400);
  if(!configuration().enabled||!price(interval))throw fail('checkout_unavailable',503);
  const device=proof(req,checkoutId);
  if(!device)throw fail('checkout_verification_required',403);
  let old=await client().checkout.sessions.retrieve(checkoutId);
  validateOwned(old,device);
  if(old.metadata.interval!==fromInterval)throw fail('invalid_checkout_switch',409);
  if(!withinSwitchWindow(old))throw fail('checkout_switch_expired');
  requireUnpaid(old);
  if(old.status==='open'){
   await client().checkout.sessions.expire(old.id,{},{idempotencyKey:'immigra-guest-expire-v1:'+old.id});
   // Never trust a timeout/expire response or a stale pre-payment read.
   old=await client().checkout.sessions.retrieve(checkoutId);
   validateOwned(old,device);
   if(old.metadata.interval!==fromInterval)throw fail('invalid_checkout_switch',409);
  }
  return successor(res,old,device,interval);
 }
 async function complete(req,res,id){
  if(!validId(id))throw fail('invalid_checkout',400);
  const device=proof(req,id), account=req.account, verified=account&&!account.emailTrial;
  if(!device&&!verified)throw fail('checkout_verification_required',401);
  const stripe=client(), checkout=await stripe.checkout.sessions.retrieve(id);
  if(checkout.id!==id||checkout.mode!=='subscription'||checkout.metadata?.flow!==FLOW||checkout.metadata?.product_key!==PRO_PLAN.productKey||device&&device.nonce!==checkout.metadata.checkout_nonce)throw fail('invalid_checkout',403);
  if(checkout.status!=='complete'||!['paid','no_payment_required'].includes(checkout.payment_status))return {pending:true};
  const paidEmail=email(checkout.customer_details?.email||checkout.customer_email);
  if(!paidEmail||paidEmail.length>254||!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(paidEmail))throw fail('checkout_email_unavailable',409);
  if(account&&email(account.email)!==paidEmail)throw Object.assign(fail('checkout_email_mismatch'),device?{email:paidEmail}:{});
  const subscriptionId=typeof checkout.subscription==='string'?checkout.subscription:checkout.subscription?.id;
  if(!subscriptionId) return {pending:true};
  let subscription=await stripe.subscriptions.retrieve(subscriptionId);
  const customer=typeof subscription.customer==='string'?subscription.customer:subscription.customer?.id;
  const checkoutCustomer=typeof checkout.customer==='string'?checkout.customer:checkout.customer?.id;
  if(!customer||customer!==checkoutCustomer||subscription.metadata?.flow!==FLOW||subscription.metadata?.checkout_nonce!==checkout.metadata.checkout_nonce)throw fail('invalid_checkout',403);
  if(!['active','trialing','past_due'].includes(subscription.status))throw fail('checkout_subscription_inactive');
  let access=null, userId=account?.userId;
  if(!userId){
   try{access=await register(req,res,paidEmail);userId=access.user.id;}
   catch(error){if(error.code==='verification_required')throw Object.assign(fail('verification_required'),{email:paidEmail});throw error;}
  }
  if([subscription.metadata?.user_id,checkout.metadata?.user_id].some(owner=>owner&&owner!==userId))throw fail('checkout_owner_mismatch',403);
  const existing=await identity(userId);
  if(existing?.tier==='pro'&&['active','grace'].includes(existing.status)&&existing.providerEntitlementId!==subscription.id)throw fail('subscription_already_active');
  // Stable bindings and event IDs allow safe refresh/retry. A later webhook always wins.
  if(!subscription.metadata?.user_id)subscription=await stripe.subscriptions.update(subscription.id,{metadata:{user_id:userId}},{idempotencyKey:`${id}:${userId}:bind`});
  if(!checkout.metadata?.user_id)await stripe.checkout.sessions.update(id,{metadata:{user_id:userId}},{idempotencyKey:`${id}:${userId}:owner`});
  const mapped=mapStripeSubscription(subscription);
  if(!Number.isFinite(subscription.created))throw fail('checkout_unavailable',503);
  await apply({provider:'stripe',providerEventId:`guest-checkout:${id}:claim`,userId,eventType:'checkout.session.claimed',...mapped,providerCustomerId:customer,providerEntitlementId:subscription.id,occurredAt:new Date(subscription.created*1000-1).toISOString()});
  // Never replace the trial session cookie written by register(). Keep the separate
  // checkout proof until its short expiry so an interrupted claim can be retried.
  let measurementReady=false;
  try{measurementReady=paymentMeasurement.issue(res,checkout);}catch{ /* Optional measurement must never block access. */ }
  return {claimed:true,...(measurementReady?{measurementReady:true}:{}),...(access?{session:access}:{})};
 }
 return {start,complete,switchPlan};
}
export const guestCheckout=createGuestCheckoutService();
