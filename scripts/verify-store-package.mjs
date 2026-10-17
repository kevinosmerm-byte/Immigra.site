import assert from 'node:assert/strict';
import {readFile,access,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const json=async file=>JSON.parse(await readFile(path.join(root,file),'utf8'));
const apple=await json('modules/citizenship/app-store/metadata.json'),google=await json('modules/citizenship/google-play/metadata.json'),products=await json('stores/subscriptions.json');
assert.equal(apple.app.bundleId,google.applicationId);assert.equal(products.bundleId,google.applicationId);assert.equal(google.appName,'Immigra');assert.equal(products.nativePurchasesEnabled,false,'Store billing must remain disabled until separately implemented and verified');
for(const locale of ['es-US','en-US']){
 const a=apple.localizations[locale],g=google.localizations[locale];assert.equal(a.name,'Immigra');assert.ok(g.shortDescription.length<=80);assert.ok(g.fullDescription.length>=300&&g.fullDescription.length<=4000);assert.ok(a.description.length<=4000);assert.match(a.description,/https:\/\/immigra.site\/(terms|terminos)/);
}
for(const url of [apple.app.termsOfUseUrl,google.website,google.privacyPolicyUrl,google.accountDeletionUrl,google.termsOfUseUrl])assert.equal(new URL(url).origin,'https://immigra.site');
assert.equal(google.supportEmail,'info@immigra.site');assert.equal(apple.review.contactEmail,google.supportEmail);
assert.equal(products.status,'prepared_not_registered');assert.equal(products.apple.products.length,2);assert.equal(new Set(products.apple.products.map(p=>p.id)).size,2);
for(const p of products.apple.products){assert.ok(['P1M','P1Y'].includes(p.period));assert.ok(p.referencePriceCents>0);for(const text of Object.values(p.localizations)){assert.ok(text.name.length<=30);assert.ok(text.description.length<=55);}}
assert.deepEqual(products.google.basePlans.map(p=>p.period).sort(),['P1M','P1Y']);assert.equal(products.trial.storeIntroductoryOffer,false);assert.equal(products.trial.days,7);
const swift=await readFile(path.join(root,'modules/citizenship/ios/App/CapApp-SPM/Package.swift'),'utf8');assert.match(swift,/CapacitorApp/);
const wrapper=await readFile(path.join(root,'modules/citizenship/android/gradle/wrapper/gradle-wrapper.properties'),'utf8');assert.match(wrapper,/distributionSha256Sum=[a-f0-9]{64}/);
if(process.platform!=='win32')assert.ok((await stat(path.join(root,'modules/citizenship/android/gradlew'))).mode&0o111,'Gradle wrapper must be executable on Mac/Linux');
for(const file of ['stores/READ_ME_FIRST.md','stores/PRIVACY_AND_RATING.md','stores/OWNER_CHECKLIST.md'])await access(path.join(root,file));
console.log('Store preparation checks passed. Products, native payments, signing, device testing and submission remain separate gates.');
