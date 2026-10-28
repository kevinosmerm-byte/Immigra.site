import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import assert from "node:assert/strict";

const requiredFiles = [
  "ios/App/App/Info.plist",
  "ios/App/CapApp-SPM/Package.swift",
  "ios/App/App/PrivacyInfo.xcprivacy",
  "ios/App/App/en.lproj/InfoPlist.strings",
  "ios/App/App/es.lproj/InfoPlist.strings",
  "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
  "ios/App/App.xcodeproj/project.pbxproj",
];
for (const file of requiredFiles) await access(file, constants.R_OK);

const info = await readFile("ios/App/App/Info.plist", "utf8");
assert.match(info, /NSMicrophoneUsageDescription/);
assert.match(info, /NSCameraUsageDescription/);
assert.match(info, /ITSAppUsesNonExemptEncryption[\s\S]*<false\/>/);

const privacy = await readFile("ios/App/App/PrivacyInfo.xcprivacy", "utf8");
assert.match(privacy, /NSPrivacyTracking<\/key><false\/>/);
assert.match(privacy, /NSPrivacyCollectedDataTypeEmailAddress/);
assert.match(privacy, /NSPrivacyCollectedDataTypeAudioData/);
assert.match(privacy, /NSPrivacyCollectedDataTypePhotosorVideos/);
assert.doesNotMatch(privacy, /NSPrivacyCollectedDataTypeTracking<\/key><true\/>/);

const project = await readFile("ios/App/App.xcodeproj/project.pbxproj", "utf8");
assert.match(project, /PRODUCT_BUNDLE_IDENTIFIER = us\.citizenshipai\.app/);
assert.match(project, /MARKETING_VERSION = 1\.0/);
assert.match(project, /CURRENT_PROJECT_VERSION = 1/);
assert.match(project, /PrivacyInfo\.xcprivacy in Resources/);
assert.match(project, /InfoPlist\.strings in Resources/);

const englishPermissions = await readFile("ios/App/App/en.lproj/InfoPlist.strings", "utf8");
const spanishPermissions = await readFile("ios/App/App/es.lproj/InfoPlist.strings", "utf8");
assert.match(englishPermissions, /NSMicrophoneUsageDescription/);
assert.match(englishPermissions, /NSCameraUsageDescription/);
assert.match(spanishPermissions, /NSMicrophoneUsageDescription/);
assert.match(spanishPermissions, /NSCameraUsageDescription/);
assert.match(spanishPermissions, /micrófono/);

const swiftPackages=await readFile("ios/App/CapApp-SPM/Package.swift","utf8");
assert.match(swiftPackages,/\.package\(name: "CapacitorApp", path: "\.\.\/\.\.\/\.\.\/node_modules\/@capacitor\/app"\)/,"Native auth callback plugin must be included in iOS");
assert.match(swiftPackages,/\.product\(name: "CapacitorApp", package: "CapacitorApp"\)/);
console.log("iOS readiness checks passed.");
