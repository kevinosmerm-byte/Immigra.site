import {stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import {createGzip} from 'node:zlib';

export async function serveFile(req,res,target,type){
 const info=await stat(target);
 if(!info.isFile())throw new Error('Not a file');
 const size=info.size;
 const etag=`W/"${size}-${Math.trunc(info.mtimeMs)}"`;
 const html=type.startsWith('text/html');
 const headers={'Content-Type':type,'Accept-Ranges':'bytes','Cache-Control':html?'no-cache':'public, max-age=3600','ETag':etag,'Vary':'Accept-Encoding'};
 if(req.headers['if-none-match']===etag){res.writeHead(304,headers);res.end();return;}
 const gzip=!req.headers.range&&req.method!=='HEAD'&&/^(text\/|application\/(json|javascript))/.test(type)&&/\bgzip\b/.test(req.headers['accept-encoding']||'');
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
 if(gzip)headers['Content-Encoding']='gzip';else headers['Content-Length']=size?end-start+1:0;
 res.writeHead(status,headers);
 if(req.method==='HEAD'||!size){res.end();return;}
 try{if(gzip)await pipeline(createReadStream(target),createGzip(),res);else await pipeline(createReadStream(target,{start,end}),res);}catch(error){if(!res.destroyed)res.destroy(error);}
}
