# 🧠 Advanced AI Brain Diagnostic Ledger

- **Target File / Component:** `modules/citizenship/tests/account-foundation.test.mjs`; `.github/workflows/quality.yml`.
- **Deep User Experience Impact (Pros & Cons):** The deployment gate correctly stopped a failing test, preserving the previous site. Its environment-dependent fixture prevented the approved glass-trial and readiness changes from reaching users.
- **Root-Cause Architectural Failure:** Public configuration intentionally prefers `SUPABASE_PUBLISHABLE_KEY` over `VITE_SUPABASE_PUBLISHABLE_KEY`. The test replaced only the latter and the server secret. Render supplied the preferred variable, so the assertion compared a real public key with a fixture. A failed assertion also skipped the old manual environment cleanup.
- **Production-Grade Implementation:** Isolate both public-key variables, URL and private-key fixtures; restore original values through `t.after` even on failure. Assert the preferred key and fallback key and verify neither response exposes the server-secret fixture. Add a focused CI run with a nonsecret hosting-variable fixture. Production key precedence and security checks remain unchanged.

## Verification

Reproduced the original failure with `SUPABASE_PUBLISHABLE_KEY=render-public-fixture`. After the fix, the complete `npm run build` passed with that variable present: 203 root tests, 310 Citizenship tests, lint, both builds and mobile/iOS/store/static-release checks. No production credential was required or modified. Public deployment still requires observing the new release on immigra.site.
