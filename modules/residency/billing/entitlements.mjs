export const TIERS=Object.freeze({
 free:{writtenSessionsPerDay:3,realtimeSecondsPerMonth:0,documentAnalysesPerMonth:0},
 pro:{writtenSessionsPerDay:100,realtimeSecondsPerMonth:1800,documentAnalysesPerMonth:10}
});
export function entitlementFor(tier){if(!Object.hasOwn(TIERS,tier))throw Error('Unknown tier');return {...TIERS[tier]}}
export function canConsume({tier='free',kind,used=0,requested=1}={}){
 const limits=entitlementFor(tier);
 const key={written:'writtenSessionsPerDay',realtime:'realtimeSecondsPerMonth',document:'documentAnalysesPerMonth'}[kind];
 if(!key||!Number.isFinite(used)||!Number.isFinite(requested)||used<0||requested<=0)return false;
 return used+requested<=limits[key];
}
export function verifyWebhookSignature(){throw Error('Not implemented: use payment provider official SDK with raw request body and signature verification');}
