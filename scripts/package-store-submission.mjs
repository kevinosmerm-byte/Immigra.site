import {spawnSync} from 'node:child_process';
import {readFile,writeFile,mkdir,copyFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function run(command,args){const result=spawnSync(command,args,{cwd:root,stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)throw Error(`${command} failed (${result.status})`);}
run(process.execPath,[path.join(root,'scripts/verify-store-package.mjs')]);
const folder=path.join(root,'artifacts/store-submission');await rm(folder,{recursive:true,force:true});await mkdir(folder,{recursive:true});
const apple=JSON.parse(await readFile(path.join(root,'modules/citizenship/app-store/metadata.json'),'utf8')),google=JSON.parse(await readFile(path.join(root,'modules/citizenship/google-play/metadata.json'),'utf8'));
for(const [locale,copy] of Object.entries(apple.localizations))await writeFile(path.join(folder,`apple-${locale}.txt`),Object.entries(copy).map(([key,value])=>`${key}\n${value}\n`).join('\n'));
for(const [locale,copy] of Object.entries(google.localizations))await writeFile(path.join(folder,`google-play-${locale}.txt`),`Name\n${google.appName}\n\nShort description\n${copy.shortDescription}\n\nFull description\n${copy.fullDescription}\n`);
for(const file of ['stores/READ_ME_FIRST.md','stores/OWNER_CHECKLIST.md','stores/PRIVACY_AND_RATING.md','stores/subscriptions.json'])await copyFile(path.join(root,file),path.join(folder,path.basename(file)));
await copyFile(path.join(root,'modules/citizenship/app-store/metadata.json'),path.join(folder,'apple-metadata.json'));await copyFile(path.join(root,'modules/citizenship/google-play/metadata.json'),path.join(folder,'google-play-metadata.json'));
await writeFile(path.join(folder,'STATUS.json'),JSON.stringify({app:'Immigra',applicationId:google.applicationId,status:'preparation_only_not_submitted',nativePurchasesEnabled:false,signedStoreBinaryIncluded:false,privacyAnswersRequireOwnerReview:true,historicalScreenshotsIncluded:false},null,2)+'\n');
const zip=path.join(root,'artifacts/Immigra-store-preparation.zip');
run('python3',['-c',"from pathlib import Path;from zipfile import ZipFile,ZIP_DEFLATED; folder=Path('artifacts/store-submission');z=ZipFile('artifacts/Immigra-store-preparation.zip','w',ZIP_DEFLATED);[z.write(p,Path(folder.name)/p.relative_to(folder)) for p in sorted(folder.rglob('*')) if p.is_file()];z.close()"]);
const bytes=await readFile(zip);console.log(`Created artifacts/Immigra-store-preparation.zip SHA-256 ${createHash('sha256').update(bytes).digest('hex')}`);
