export async function verifyAccess(request,env,fetcher=fetch){
 const token=request.headers.get('cf-access-jwt-assertion');
 if(!token||token.length>16000||!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.ACCESS_TEAM_DOMAIN||'')||!env.ACCESS_AUD)return null;
 try{
 const parts=token.split('.');if(parts.length!==3)return null;
 const decode=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),x=>x.charCodeAt(0));
 const header=JSON.parse(new TextDecoder().decode(decode(parts[0]))),claims=JSON.parse(new TextDecoder().decode(decode(parts[1]))),now=Date.now()/1000;
 if(header.alg!=='RS256'||typeof header.kid!=='string'||header.crit||claims.iss!==env.ACCESS_TEAM_DOMAIN||!Array.isArray(claims.aud)||!claims.aud.includes(env.ACCESS_AUD)||typeof claims.exp!=='number'||claims.exp<=now||typeof claims.sub!=='string'||!claims.sub||claims.sub.length>200||('nbf' in claims&&(typeof claims.nbf!=='number'||claims.nbf>now)))return null;
 const response=await fetcher(env.ACCESS_TEAM_DOMAIN+'/cdn-cgi/access/certs',{signal:AbortSignal.timeout(5000)});if(!response.ok)return null;
 const keys=await response.json(),jwk=keys.keys?.find(x=>x.kid===header.kid&&x.kty==='RSA'&&(!x.alg||x.alg==='RS256'));
 if(!jwk)return null;const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1])))return null;
 return claims.sub;
 }catch{return null;}
}
export async function reserveQuota(db,subject,day=new Date().toISOString().slice(0,10)){
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(subject)))).map(x=>x.toString(16).padStart(2,'0')).join('');
 // Global reservation happens first; failed/user-limited attempts intentionally consume quota.
 for(const [bucket,cap] of [['global',100],['user:'+hash,10]]){
 const row=await db.prepare('INSERT INTO ai_daily_usage (day,bucket,used) VALUES (?,?,1) ON CONFLICT(day,bucket) DO UPDATE SET used=used+1 WHERE used < ? RETURNING used').bind(day,bucket,cap).first();if(!row)return false;
 }
 return true;
}
