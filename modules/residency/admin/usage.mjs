const amount=v=>Number.isFinite(Number(v))?Math.max(0,Number(v)):0;
export function aggregateUsage(rows=[]){
 return rows.reduce((a,r)=>{if(r?.engine!=='residency')return a;
  a.sessions+=amount(r.sessions);a.audioSeconds+=amount(r.audioSeconds);
  a.estimatedCostUSD+=amount(r.estimatedCostUSD);return a;
 },{sessions:0,audioSeconds:0,estimatedCostUSD:0});
}
export function usageGate({authenticated=false,consented=false,entitled=false,rateLimitOk=false,spendLimitOk=false}={}){
 return [authenticated,consented,entitled,rateLimitOk,spendLimitOk].every(v=>v===true);
}
