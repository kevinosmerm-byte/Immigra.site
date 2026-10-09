import postcss from 'postcss';
import {defineConfig} from 'vite';
const scopeStyles={postcssPlugin:'domain-style-boundaries',Once(root,{result}){
 const file=(result.opts.from||'').replaceAll('\\','/');const domain=file.includes('/modules/citizenship/')?'citizenship':file.includes('/modules/asylum/')?'asylum':null;if(!domain)return;
 const scope='.'+domain+'-surface';
 root.walkRules(rule=>{if(rule.parent?.type==='atrule'&&rule.parent.name.includes('keyframes'))return;rule.selectors=rule.selectors.map(selector=>{
  let s=selector.replace(/#root\b/g,domain==='citizenship'?'#citizenship-root':'#content');
  if(s.includes(':root'))return s.replaceAll(':root',scope);
  if(/\bbody\b/.test(s))return s.replace(/\bbody\b/g,scope);
  if(s.startsWith('html'))return s.replace(/^(html[^\s]*)/,'$1 '+scope);
  return scope+' '+s;
 });});
 root.walkDecls(decl=>{decl.important=false;});
 const layer=postcss.atRule({name:'layer',params:'domain-layout'});
 for(const node of [...root.nodes])layer.append(node);root.append(layer);
}};
export default defineConfig({base:'./',build:{rollupOptions:{external:['/modules/asylum/vendor/pdfjs/pdf.mjs']}},esbuild:{jsx:'automatic'},resolve:{dedupe:['react','react-dom']},css:{postcss:{plugins:[scopeStyles]}},plugins:[{name:'citizenship-public-assets',enforce:'pre',transform(code,id){if(!id.replaceAll('\\','/').includes('/modules/citizenship/src/')||! /\.[jt]sx?$/.test(id))return;return code.replace(/(["'`])\/(?!api\/)([^"'`\n]+\.(?:png|jpg|svg|mp4|m4a|pdf)(?:[^"'`\n]*))\1/g,(_m,q,p)=>q+'/modules/citizenship/'+p+q);}}],server:{host:'127.0.0.1',proxy:{'/api':{target:'http://127.0.0.1:8787',changeOrigin:true}}}});
