import {stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';

export async function serveFile(req,res,target,type){
 const info=await stat(target);
 if(!info.isFile())throw new Error('Not a file');
 const size=info.size;
 const headers={'Content-Type':type,'Accept-Ranges':'bytes','Cache-Control':'no-store'};
 let start=0,end=size-1,status=200;
 // Unsupported/multiple ranges are ignored; valid single ranges support Safari media seeking.
 const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range||'');
 if(match&&req.method!=='HEAD'){
  if(match[1]){start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),size-1):size-1;}
  else {const suffix=Number(match[2]);start=Math.max(0,size-suffix);}
  if(!size||(!match[1]&&!match[2])||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=size||end<start){
   res.writeHead(416,{...headers,'Content-Range':`bytes */${size}`,'Content-Length':0});res.end();return;
  }
  status=206;headers['Content-Range']=`bytes ${start}-${end}/${size}`;
 }
 headers['Content-Length']=size?end-start+1:0;
 res.writeHead(status,headers);
 if(req.method==='HEAD'||!size){res.end();return;}
 try{await pipeline(createReadStream(target,{start,end}),res);}catch(error){if(!res.destroyed)res.destroy(error);}
}
