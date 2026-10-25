import {createHmac,timingSafeEqual} from 'node:crypto';
import {getStripe} from './stripeBilling.js';
import {PRO_PLAN} from '../shared/featureAccessConfig.js';

const cookie='__Host-immigra_payment_measurement';
export function createPaymentMeasurement({secret=()=>process.env.SUPABASE_SECRET_KEY?.trim(),now=Date.now,client=getStripe}={}){
 const mac=value=>{const key=secret();if(!key)throw Error('Measurement unavailable');return createHmac('sha256',key).update('payment-measurement-v1:'+value).digest('hex');};
 function issue(res,checkout){
  if(checkout?.livemode!==true||checkout.mode!=='subscription'||checkout.status!=='complete'||checkout.payment_status!=='paid'||checkout.metadata?.product_key!==PRO_PLAN.productKey||!Number.isSafeInteger(checkout.amount_total)||checkout.amount_total<=0||checkout.currency!=='usd'||!/^cs_live_[A-Za-z0-9]+$/.test(checkout.id||''))return false;
  // Only an opaque transaction identifier leaves this service. Never expose Stripe IDs.
  const data={transaction_id:mac('transaction:'+checkout.id),value:checkout.amount_total/100,currency:'USD',exp:now()+600000};
  const payload=Buffer.from(JSON.stringify(data)).toString('base64url');
  res.append('Set-Cookie',`${cookie}=${payload}.${mac(payload)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=600`);
  return true;
 }
 function read(req){
  const raw=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookie+'='))?.slice(cookie.length+1)||'';
  const [payload,signature,...extra]=raw.split('.');
  if(extra.length||!payload||payload.length>1000||!/^[a-f0-9]{64}$/.test(signature||''))return null;
  try{
   if(!timingSafeEqual(Buffer.from(mac(payload)),Buffer.from(signature)))return null;
   const data=JSON.parse(Buffer.from(payload,'base64url').toString());
   if(!Number.isFinite(data.exp)||data.exp<=now()||data.currency!=='USD'||!Number.isFinite(data.value)||data.value<=0||!/^[a-f0-9]{64}$/.test(data.transaction_id))return null;
   return {transaction_id:data.transaction_id,value:data.value,currency:data.currency};
  }catch{return null;}
 }
 async function confirm(req,res){
  const id=req.body?.checkoutId;
  if(!/^cs_live_[A-Za-z0-9]{8,200}$/.test(id||''))return false;
  const checkout=await client().checkout.sessions.retrieve(id);
  if(!req.account?.userId||checkout.id!==id||checkout.metadata?.user_id!==req.account.userId||checkout.client_reference_id!==req.account.userId)return false;
  return issue(res,checkout);
 }
 return {issue,read,confirm};
}
export const paymentMeasurement=createPaymentMeasurement();
