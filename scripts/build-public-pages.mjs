import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {publicPages,publicPageHtml} from './public-pages.mjs';
import {seoNavigation,structuredData} from '../shared/seo-pages.mjs';
const index=await readFile('dist/index.html','utf8');
const css='/'+index.match(/href="([^"\s]+\.css)"/)[1].replace(/^\.\//,'');
for(const page of publicPages){await mkdir(`dist/${page[0]}`,{recursive:true});await writeFile(`dist/${page[0]}/index.html`,publicPageHtml(page,css));}
// React replaces this matching public introduction when it mounts. Crawlers and
// visitors without JavaScript still receive meaningful content and working links.
const fallback=`<main><h1>Prepárate antes de tu entrevista.</h1><p>Simulaciones con IA para ciudadanía, asilo y residencia, en un solo lugar.</p><h2>Herramientas de preparación</h2><p>Explora material de estudio, preguntas de práctica y entrevistas simuladas. La práctica es educativa, no asesoría legal ni garantía de aprobación. IMMIGRA no está afiliada al gobierno.</p>${seoNavigation('es')}<p><a href="/fuentes">Fuentes oficiales e independencia</a> · <a href="/privacidad">Privacidad</a> · <a href="/soporte">Soporte</a></p></main>`;
await writeFile('dist/index.html',index.replace(/(<div id="root"[^>]*>)(<\/div>)/,`$1${fallback}$2`).replace('</head>',structuredData('','IMMIGRA.site | Práctica de entrevistas con IA','es')+'</head>'));
await writeFile('dist/robots.txt','User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://immigra.site/sitemap.xml\n');
await writeFile('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+['',...publicPages.map(p=>p[0])].map(path=>`<url><loc>https://immigra.site/${path}</loc></url>`).join('')+'</urlset>\n');
console.log(`Built ${publicPages.length} public pages, robots.txt and sitemap.xml`);
