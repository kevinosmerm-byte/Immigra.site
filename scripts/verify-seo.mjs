import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {publicPages} from './public-pages.mjs';
import {seoPages} from '../shared/seo-pages.mjs';
const base=process.argv[2];
const get=async(path)=>{
 if(!base)return readFile(`dist/${path}`,'utf8');
 const route=path.replace(/index\.html$/,'').replace(/\/$/,'')||'/';
 const response=await fetch(new URL(route,base.endsWith('/')?base:base+'/'));
 assert.equal(response.status,200,route);assert.doesNotMatch(response.headers.get('x-robots-tag')||'',/noindex/);
 return response.text();
};
const sitemap=await get('sitemap.xml'),robots=await get('robots.txt');
assert.match(robots,/Sitemap: https:\/\/immigra.site\/sitemap.xml/);
assert.doesNotMatch(sitemap,/#|\/(?:account|profile|admin)(?:\/|<)|interview\?/);
for(const [path] of publicPages){
 const html=await get(path+'/index.html');
 assert.ok(sitemap.includes(`<loc>https://immigra.site/${path}</loc>`));
 assert.ok(html.includes(`rel="canonical" href="https://immigra.site/${path}"`));
 assert.doesNotMatch(html,/<meta name="robots" content="noindex/);
 JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
}
const home=await get('index.html');
assert.match(home,/<h1>Prepárate antes de tu entrevista\.<\/h1>/);
for(const p of seoPages)assert.ok(home.includes(`href="/${p.path}"`));
if(base)for(const p of seoPages){const response=await fetch(new URL(p.alias,base.endsWith('/')?base:base+'/'),{redirect:'manual'});assert.equal(response.status,301);assert.equal(response.headers.get('location'),'/'+p.path);}
console.log(`SEO verified: homepage, ${publicPages.length} pages, schema, sitemap, robots${base?', HTTP and redirects':''}.`);
