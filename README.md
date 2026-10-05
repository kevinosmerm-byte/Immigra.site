# CitizenshipAI

A practice application for the U.S. naturalization process. It includes the 128 civics questions, reading and writing exercises, an English coach, a practice interview, progress tracking, and an optional USCIS case-status connection.

## Requirements

- Node.js 22.13 or later; Node 24 is pinned in `.node-version` and used for CI/deployment.
- An OpenAI API key for AI evaluation, coaching, and transcription
- USCIS API credentials only if case-status lookup is enabled

## Run locally

1. Install dependencies:

   ```powershell
   npm ci
   ```

2. Copy `.env.example` to `.env` and fill in the variables needed for your environment. Do not commit `.env`.

3. In one terminal, start the API:

   ```powershell
   node server/server.js
   ```

4. In another terminal, start the website:

   ```powershell
   npm run dev
   ```

Open `http://localhost:5173`.

## Production build

```powershell
npm run lint
npm run build
```

The static website is created in `dist/`. Deploy it to a static host and deploy `server/server.js` as a Node.js service. Use HTTPS in production: browsers require it for microphone access and PWA installation.

### Production environment

Set these values on the server, not in the browser:

```text
PORT=3001
CORS_ORIGIN=https://citizenshipai.us,https://www.citizenshipai.us
OPENAI_API_KEY=...
USCIS_ENV=sandbox
USCIS_SANDBOX_CLIENT_ID=...
USCIS_SANDBOX_CLIENT_SECRET=...
```

USCIS Sandbox is the default and the only environment that should be used until USCIS grants separate Production credentials and endpoints. The server never guesses Production URLs. Legacy `USCIS_CLIENT_ID` and `USCIS_CLIENT_SECRET` names remain supported for the existing Sandbox deployment, but new Sandbox setups should use the named variables above.

After USCIS explicitly grants Production access, set `USCIS_ENV=production` and provide all four separate values: `USCIS_PRODUCTION_CLIENT_ID`, `USCIS_PRODUCTION_CLIENT_SECRET`, `USCIS_PRODUCTION_TOKEN_URL`, and `USCIS_PRODUCTION_API_URL`. Never reuse Sandbox credentials or endpoints for Production.

## Recommended hosting

Deploy the Vite frontend to **Cloudflare Pages** and the Express API to **Render**. Cloudflare Pages uses `npm run build` and publishes `dist`. The included `functions/api/[[path]].js` proxy keeps production browser requests on the Citizenship AI origin and forwards them to Render. Set the `API_ORIGIN` Pages environment variable to the Render HTTPS origin if it differs from the default. The included `render.yaml` configures Render to run `npm ci`, start the API with `npm run start`, and verify `/health`.

In Render, enter the API and USCIS credentials as secret environment variables. Set `CORS_ORIGIN` to `https://citizenshipai.us,https://www.citizenshipai.us`.

## PWA installation

CitizenshipAI includes a web app manifest and service worker. After deployment with HTTPS, users can choose **Add to Home Screen** on iPhone or Android to install it like an app. The offline cache contains the application interface only; requests involving voice, AI, or USCIS case status are never cached.

## Privacy and safety

- Voice recordings are sent only to the transcription service for the active request and are not stored by this application.
- Receipt numbers are used only to make the active USCIS Sandbox status request and are not stored by this application. Server diagnostics may include a masked receipt number, environment, result, and USCIS trace ID; never the full receipt number or case response.
- The first launch requires acknowledgement of the independent educational-use and AI disclaimers. Legal & Privacy is permanently available in Settings and at `https://citizenshipai.us/#privacy`.
- Before Play Store submission, add a public support contact, complete the Play Console Data safety and content-rating forms, and use the exact same disclosures as the in-app privacy policy.
- Do not expose API keys or USCIS credentials in frontend variables, source code, screenshots, or Git commits.

## Android / Google Play release

The web app is installable as a PWA today. A Google Play release additionally requires an Android container and a signed Android App Bundle (`.aab`). Capacitor is the planned wrapper because it preserves this React application and its current visual system. Install it only in an environment that can validate npm registry certificates, then follow the [official Capacitor setup](https://capacitorjs.com/docs/getting-started): install `@capacitor/core`, `@capacitor/cli`, and `@capacitor/android`; initialize the app with `dist` as `webDir`; add Android; run `npm run build`, `npx cap sync android`, and build the signed `.aab` in Android Studio.

## iOS / App Store release

The native iOS container lives in `ios/` and uses the same stable application id, `us.citizenshipai.app`. Run `npm run ios:sync` after every web release to build the Vite app and copy the current production assets and native plugins into Xcode. The final archive, signing, device testing, TestFlight upload, and App Store submission must be completed on a Mac using the current App Store-supported Xcode and iOS SDK. See `docs/IOS_READINESS.md` for the handoff checklist.
