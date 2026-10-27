import {useEffect,useRef} from 'react';
import {vertexShader,fragmentShader} from './shaders.mjs';
export default function LiquidBackground({reduced}) {
  const ref=useRef(null);
  useEffect(()=>{
    const canvas=ref.current; let gl;
    try { gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'}); } catch {}
    if(!gl) return;
    let frame=0,failed=false,time=0,last=0,x=.5,y=.5,tx=.5,ty=.5;
    const shaders=[];
    const program=gl.createProgram(),buffer=gl.createBuffer();
    const cleanup=()=>{cancelAnimationFrame(frame);gl.deleteBuffer(buffer);gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));};
    for(const [type,source] of [[gl.VERTEX_SHADER,vertexShader],[gl.FRAGMENT_SHADER,fragmentShader]]){
      const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){cleanup();return;}
      gl.attachShader(program,shader);
    }
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){cleanup();return;}
    gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const pos=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    const res=gl.getUniformLocation(program,'u_res'),mouse=gl.getUniformLocation(program,'u_mouse'),clock=gl.getUniformLocation(program,'u_time');
    const draw=stamp=>{
      if(failed||document.hidden)return;
      time+=last?Math.min(stamp-last,50)/1000:0;last=stamp;
      x+=(tx-x)*.04;y+=(ty-y)*.04;
      gl.uniform2f(res,canvas.width,canvas.height);gl.uniform2f(mouse,x,y);gl.uniform1f(clock,reduced?0:time);
      gl.drawArrays(gl.TRIANGLES,0,6);canvas.style.opacity='1';
      if(!reduced)frame=requestAnimationFrame(draw);
    };
    const start=()=>{cancelAnimationFrame(frame);last=0;if(!document.hidden)frame=requestAnimationFrame(draw);};
    const resize=()=>{const scale=Math.min(devicePixelRatio||1,1.4,1600/innerWidth,1000/innerHeight);canvas.width=Math.max(1,Math.round(innerWidth*scale));canvas.height=Math.max(1,Math.round(innerHeight*scale));gl.viewport(0,0,canvas.width,canvas.height);start();};
    const pointer=e=>{if(!reduced){tx=e.clientX/innerWidth;ty=1-e.clientY/innerHeight;}};
    const lost=e=>{e.preventDefault();failed=true;cancelAnimationFrame(frame);canvas.style.opacity='0';};
    resize();window.addEventListener('resize',resize);window.addEventListener('pointermove',pointer,{passive:true});document.addEventListener('visibilitychange',start);canvas.addEventListener('webglcontextlost',lost);
    return()=>{cleanup();window.removeEventListener('resize',resize);window.removeEventListener('pointermove',pointer);document.removeEventListener('visibilitychange',start);canvas.removeEventListener('webglcontextlost',lost);};
  },[reduced]);
  return <div className="welcome-scene" aria-hidden="true"><canvas ref={ref}/></div>;
}
