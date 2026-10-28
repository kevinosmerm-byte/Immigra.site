import {spawn} from 'node:child_process';
import {access,mkdir,copyFile,readFile,writeFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const moduleRoot=path.join(root,'modules/citizenship');
const output=path.join(root,'artifacts/native');
const target=process.argv[2];
const available=async p=>access(p).then(()=>true,()=>false);
function run(command,args,cwd){return new Promise((resolve,reject)=>{const child=spawn(command,args,{cwd,env:process.env,stdio:'inherit'});child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error(`${command} failed (${code})`)));});}
async function artifact(file,type){const data=await readFile(file);await writeFile(file+'.json',JSON.stringify({app:'Immigra',applicationId:'us.citizenshipai.app',artifact:path.basename(file),type,storeUploadReady:false,bytes:(await stat(file)).size,sha256:createHash('sha256').update(data).digest('hex')},null,2)+'\n');console.log(`Created ${path.relative(root,file)}. ${type==='android-debug'?'Install for testing; not a Play Store upload.':'Simulator build; not an App Store upload.'}`);}
async function main(){
 if(!['android','ios'].includes(target))throw Error('Choose android or ios. These commands create test packages only.');
 if(target==='ios'&&process.platform!=='darwin')throw Error('The iOS simulator build requires macOS and Xcode. Run this command on your Mac or MacinCloud.');
 if(!await available(path.join(root,'dist/index.html')))throw Error(`Build and synchronize first: npm run native:sync:${target}`);
 const html=await readFile(path.join(root,'dist/index.html'),'utf8');if(!html.includes('<title>Immigra'))throw Error('The unified Immigra build is required.');
 const nativeAssets=target==='android'?path.join(moduleRoot,'android/app/src/main/assets/public/index.html'):path.join(moduleRoot,'ios/App/App/public/index.html');
 if(!await available(nativeAssets)||await readFile(nativeAssets,'utf8')!==html)throw Error(`Native assets differ from the current build. Run npm run native:sync:${target} first.`);
 await mkdir(output,{recursive:true});
 if(target==='android'){
  const android=path.join(moduleRoot,'android');
  await run(process.platform==='win32'?'cmd.exe':'sh',process.platform==='win32'?['/c','gradlew.bat','--no-daemon',':app:assembleDebug']:['gradlew','--no-daemon',':app:assembleDebug'],android);
  const apk=path.join(output,'Immigra-android-debug.apk');await copyFile(path.join(android,'app/build/outputs/apk/debug/app-debug.apk'),apk);await artifact(apk,'android-debug');
 }else{
  const derived=path.join(output,'ios-derived');
  // Simulator Keychain operations require a signed executable too. Ad-hoc
  // signing needs no distribution certificate and is only for this test build.
  await run('xcodebuild',['-project',path.join(moduleRoot,'ios/App/App.xcodeproj'),'-scheme','App','-configuration','Debug','-sdk','iphonesimulator','-destination','generic/platform=iOS Simulator','-derivedDataPath',derived,'CODE_SIGNING_ALLOWED=YES','CODE_SIGN_IDENTITY=-','build'],root);
  const zip=path.join(output,'Immigra-ios-simulator.zip');await run('ditto',['-c','-k','--keepParent',path.join(derived,'Build/Products/Debug-iphonesimulator/App.app'),zip],root);await artifact(zip,'ios-simulator');
 }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
