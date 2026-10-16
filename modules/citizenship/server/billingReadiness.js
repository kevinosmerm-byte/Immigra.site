import {getStripe,getBillingConfiguration,priceIdForInterval} from './stripeBilling.js';
import {billingFailure} from './billingErrors.js';

export function createBillingReadiness({configuration=getBillingConfiguration,stripe=getStripe,priceId=priceIdForInterval,now=Date.now}={}){
 let cached=null,until=0,pending=null;
 return async()=>{
  if(cached&&now()<until)return cached;
  if(pending)return pending;
  pending=(async()=>{
   const config=configuration(),checkedAt=new Date(now()).toISOString();
   if(!config.enabled)return {enabled:false,ready:false,reason:'billing_disabled',checkedAt};
   try{
    const client=stripe();
    const steps=[['account',()=>client.accounts.retrieve()],['monthly_price',()=>client.prices.retrieve(priceId('monthly'))],['annual_price',()=>client.prices.retrieve(priceId('annual'))]];
    const results=await Promise.allSettled(steps.map(([,check])=>Promise.resolve().then(check)));
    const failed=results.flatMap((result,index)=>result.status==='rejected'?[{step:steps[index][0],error:result.reason}]:[]);
    if(failed.length){
     const {step,error}=failed[0],failure=billingFailure(error);
     const reason=error.type==='StripePermissionError'?'billing_status_unavailable':step.endsWith('_price')&&error.code==='resource_missing'?'billing_price_unavailable':failure.code;
     return {enabled:true,ready:false,reason,blockedSteps:failed.map(item=>item.step),...(failure.reference?{reference:failure.reference}:{}),checkedAt};
    }
    const [account,monthly,annual]=results.map(result=>result.value);
    if(!monthly.livemode||!annual.livemode)return {enabled:true,ready:false,reason:'billing_test_mode',checkedAt};
    const expectedMonthly=config.introductoryOfferEnabled?config.introductoryMonthlyPriceCents:config.monthlyPriceCents;
    const valid=(item,interval,amount)=>item.active&&item.currency===config.currency.toLowerCase()&&item.unit_amount===amount&&item.recurring?.interval===interval&&item.recurring.interval_count===1;
    if(!valid(monthly,'month',expectedMonthly)||!valid(annual,'year',config.annualPriceCents))return {enabled:true,ready:false,reason:'billing_price_unavailable',checkedAt};
    if(!account.charges_enabled)return {enabled:true,ready:false,reason:'billing_account_unavailable',checkedAt};
    return {enabled:true,ready:true,reason:'ready',checkedAt};
   }catch(error){
    const failure=billingFailure(error);const reason=error.type==='StripePermissionError'?'billing_status_unavailable':error.billingStep==='price'&&error.code==='resource_missing'?'billing_price_unavailable':failure.code;
    return {enabled:true,ready:false,reason,...(failure.reference?{reference:failure.reference}:{}),checkedAt};
   }
  })().then(result=>{cached=result;until=now()+(result.ready?300000:60000);return result;}).finally(()=>{pending=null;});
  return pending;
 };
}
export const getBillingReadiness=createBillingReadiness();
