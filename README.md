# CitizenshipAI

A practice application for the U.S. naturalization process. It includes the 128 civics questions, reading and writing exercises, an English coach, a practice interview, progress tracking, and an optional USCIS case-status connection.

## Requirements

- Node.js 20 or later
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
USCIS_CLIENT_ID=...
USCIS_CLIENT_SECRET=...
USCIS_TOKEN_URL=...
USCIS_API_URL=...
```

When the website and API share a domain, route `/api/*` to the Node service and leave `VITE_API_BASE_URL` unset. When they use separate domains, set `VITE_API_BASE_URL=https://api.citizenshipai.us` during the frontend build and set `CORS_ORIGIN` to the website's exact HTTPS origin.

## Recommended hosting

Deploy the Vite frontend to **Cloudflare Pages** and the Express API to **Render**. Cloudflare Pages uses `npm run build` and publishes `dist`. The included `render.yaml` configures Render to run `npm ci`, start the API with `npm run start`, and verify `/health`.

In Render, enter the API and USCIS credentials as secret environment variables. Set `CORS_ORIGIN` to `https://citizenshipai.us,https://www.citizenshipai.us`. After Render provides its initial `onrender.com` URL, set `VITE_API_BASE_URL` to that HTTPS URL in the Cloudflare Pages production environment, then rebuild the frontend. A custom API domain such as `api.citizenshipai.us` can be added later.

## PWA installation

CitizenshipAI includes a web app manifest and service worker. After deployment with HTTPS, users can choose **Add to Home Screen** on iPhone or Android to install it like an app. The offline cache contains the application interface only; requests involving voice, AI, or USCIS case status are never cached.

## Privacy and safety

- Voice recordings are sent only to the transcription service for the active request and are not stored by this application.
- Receipt numbers are used only to make the active USCIS status request and are not stored by this application.
- Publish a privacy policy before inviting public users, explaining your hosting provider, AI provider, retention rules, contact information, and that the app is study support rather than legal advice.
- Do not expose API keys or USCIS credentials in frontend variables, source code, screenshots, or Git commits.
