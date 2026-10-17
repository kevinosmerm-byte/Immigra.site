# Immigra Google sign-in (web)

Google uses the existing Supabase account and HttpOnly web-session flow. There is no second account database, password store or custom email-based identity merge. Email entry and secure email links remain available. An existing paid checkout is claimed only by the authenticated owner whose email matches Stripe's server-verified payment email.

## Owner setup

1. In Google Cloud / Google Auth Platform, configure branding, audience and a Web Application OAuth client for Immigra. If the consent screen is in testing, only listed test users can use it; complete Google's production/verification steps before offering it generally. Ask only for normal sign-in information, not Gmail, Contacts or Drive access.
2. Authorized JavaScript origin: `https://immigra.site`.
3. Authorized redirect URI: `https://oehhhbmrgefzodofgjtr.supabase.co/auth/v1/callback`. This is Google's return to Supabase, not the app's final return URL.
4. Open [the Immigra Supabase Google provider](https://supabase.com/dashboard/project/oehhhbmrgefzodofgjtr/auth/providers). Enable Google; save the Google OAuth Client ID and Client Secret in this provider. Do not place the secret in browser code, Render public variables, Git or chat. These credentials do not replace Supabase API keys or `STRIPE_SECRET_KEY`.
5. Supabase URL Configuration: Site URL `https://immigra.site`. Allow the web account return URLs from this origin, including the pending-checkout query. Where a pattern is needed for dynamic queries, limit it to `https://immigra.site/**`; do not allow arbitrary domains. Existing email callbacks also use this origin.
6. Confirm the public privacy and support pages in Google's branding configuration: `https://immigra.site/privacy` and `https://immigra.site/support`.
7. Test a new Google account, a returning account with the same email, sign-out/reopen, rejected consent, and paid-checkout recovery. Use the paid email when recovering Stripe. Choosing another Google account must not overwrite the purchase or expose another user's account.

Official setup reference: https://supabase.com/docs/guides/auth/social-login/auth-google

## App behavior

The app checks the public Supabase provider settings before navigating. Disabled Google or an unavailable lookup leaves the user in Immigra with an accessible error and working email alternative. The SDK builds the Google OAuth request; redirects are limited to the configured Supabase authorization origin. The existing token exchange adopts the verified session into the encrypted HttpOnly cookie. No Google password or new persistent browser token is stored. Pending plans and paid-checkout references survive the provider return. Google does not itself grant Pro or restart the seven-day trial.

The button appears in web Account, the free-trial access dialog and existing-account recovery after payment. It is hidden in native builds. Native Google setup and an equivalent Apple sign-in option (subject to App Review 4.8 and applicable exceptions) must be completed before enabling it for the iPhone app. Native purchases remain a separate release gate.

The managed coding environment has no Google Cloud/Supabase admin credentials, and direct access to the project's `supabase.co` host is network-restricted. The production provider's enabled state was therefore not confirmed here. Browser tests use fixtures; they do not establish that production OAuth credentials or Google's consent publication are complete.
