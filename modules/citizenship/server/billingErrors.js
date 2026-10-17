export function billingFailure(error,fallback='checkout_unavailable'){
 let code=fallback,status=503;
 if(error.code==='subscription_already_active'){code=error.code;status=409;}
 else if(error.code==='stripe_customer_not_found'){code=error.code;status=404;}
 else if(error.type==='StripeAuthenticationError'||error.type==='StripePermissionError'||error.code==='account_invalid')code='billing_configuration_invalid';
 else if(error.code==='resource_missing'&&['price','line_items[0][price]'].includes(error.param))code='billing_price_unavailable';
 else if(error.type==='StripeRateLimitError'){code='billing_busy';status=429;}
 const reference=/^req_[a-zA-Z0-9]{4,80}$/.test(error.requestId||'')?error.requestId:undefined;
 return {status,code,...(reference?{reference}:{})};
}
