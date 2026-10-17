// Bounds SDK work that may not expose an AbortSignal. Late work cannot settle
// the returned promise again; callers must keep mutations after awaiting it.
export function withDeadline(work, milliseconds=15000) {
 let timer;
 return Promise.race([
  Promise.resolve().then(work),
  new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(new Error('Operation timed out'),{code:'OPERATION_TIMEOUT'})),milliseconds);}),
 ]).finally(()=>clearTimeout(timer));
}
