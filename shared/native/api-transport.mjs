export function createNativeApiFetch(fetchImpl,origin='https://immigra.site'){
 const base=new URL(origin);if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash||base.pathname!=='/')throw Error('Native API requires an HTTPS origin');
 return (input,options={})=>{
  if(typeof input!=='string'||!/^\/api(?:\/|$)/.test(input))return fetchImpl(input,options);
  const headers=new Headers(options.headers);headers.set('X-Immigra-Client','native');
  return fetchImpl(new URL(input,base.origin).href,{...options,credentials:'omit',headers});
 };
}
