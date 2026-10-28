import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {publicPages,publicPageHtml} from './public-pages.mjs';
import {structuredData} from '../shared/seo-pages.mjs';
import {injectInitialShell} from './initial-shell.mjs';
const index=await readFile('dist/index.html','utf8');
const css='/'+index.match(/href="([^"\s]+\.css)"/)[1].replace(/^\.\//,'');
for(const page of publicPages){await mkdir(`dist/${page[0]}`,{recursive:true});await writeFile(`dist/${page[0]}/index.html`,publicPageHtml(page,css));}
// The fully styled first paint remains useful without JS, and React replaces
// it on mount. Guide links remain accessible below the initial viewport.
await writeFile('dist/index.html',injectInitialShell(index).replace('</head>',structuredData('','IMMIGRA.site | Práctica de entrevistas con IA','es')+'</head>'));
await writeFile('dist/robots.txt','User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://immigra.site/sitemap.xml\n');
await writeFile('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+['',...publicPages.map(p=>p[0])].map(path=>`<url><loc>https://immigra.site/${path}</loc></url>`).join('')+'</urlset>\n');
console.log(`Built ${publicPages.length} public pages, robots.txt and sitemap.xml`);
