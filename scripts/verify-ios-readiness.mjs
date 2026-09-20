import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import assert from "node:assert/strict";

const requiredFiles = [
  "ios/App/App/Info.plist",
  "ios/App/App/PrivacyInfo.xcprivacy",
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

console.log("iOS readiness checks passed.");
