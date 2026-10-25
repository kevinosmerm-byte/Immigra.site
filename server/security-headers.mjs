export function applySecurityHeaders(req,res,{production=false}={}) {
 const set=(name,value)=>res.setHeader(name,value);
 const policy=["default-src 'self'","base-uri 'self'","object-src 'none'","frame-ancestors 'none'","script-src 'self' 'wasm-unsafe-eval' https://agent.d-id.com https://www.googletagmanager.com https://www.googleadservices.com","style-src 'self' 'unsafe-inline'","img-src 'self' data: blob: https:","media-src 'self' blob: data: https:","font-src 'self' data:","connect-src 'self' https: wss:","worker-src 'self' blob:","frame-src 'self' https://*.d-id.com","form-action 'self' https://checkout.stripe.com https://billing.stripe.com"];
 set('Content-Security-Policy',policy.join('; '));
 set('X-Content-Type-Options','nosniff');
 set('X-Frame-Options','DENY');
 set('Referrer-Policy','strict-origin-when-cross-origin');
 set('Permissions-Policy','microphone=(self), camera=(self), geolocation=(), payment=(self "https://checkout.stripe.com")');
 set('Cross-Origin-Opener-Policy','same-origin-allow-popups');
 if(production)set('Strict-Transport-Security','max-age=31536000');
}
