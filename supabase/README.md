# Talent Lab: Google sign-in and Supabase progress

Frontend configuration is public, in `dist/supabase-config.js`. Google's client
secret lives only in the Supabase provider settings. Never commit secret keys,
service_role keys, passwords or Google client secrets.

Confirmed project: `kedandnxljollfhbwape`. Google is enabled and the public
configuration was checked against `/auth/v1/settings`. The progress table has
not yet been created in that project. Do not describe live cloud persistence as
working until the owner applies the migration and completes the sign-in test.

## Owner setup before uploading the new GitHub frontend

1. In this project's SQL Editor, paste and run
   `migrations/20261013_learner_progress.sql`. It runs transactionally and may be
   rerun. It creates only Talent Lab's own progress table/function/policies.
2. Authentication > URL Configuration:
   Site URL and Redirect URL: `https://mari-4m.github.io/talent-lab/`.
   Additional exact Redirect URL for Sites cutover:
   `https://talent-lab-academy.m-khuroshvili627536.chatgpt.site/`.
3. Google OAuth Web client:
   Authorized JavaScript origin: `https://mari-4m.github.io`.
   Authorized redirect URI:
   `https://kedandnxljollfhbwape.supabase.co/auth/v1/callback`.
   Client ID and secret go directly into Supabase > Authentication > Google.
4. In Google Auth Platform > Audience, complete the production publication
   when ready for other learners. Only request `openid`, email and profile.
5. Upload all frontend files (including `vendor/`) to GitHub Pages. Do not
   replace an existing Sites publication until the database is configured.
6. On the actual GitHub page, use Google sign-in, confirm guest import if
   desired, complete a lesson, check "Progress saved", reload, and sign in on
   another device. Verify sign-out and a second Google account.

## Implementation

- Official Supabase JS SDK 2.117.3 is vendored with its MIT license. The SDK
  handles Google OAuth PKCE and session refresh. No custom password form.
- Learning scripts wait for account hydration; authenticated learners never
  start from a different visitor's guest progress.
- `auth.getUser()` verifies identity. RLS owns authorization; client namespaces
  are only caches. A server-side account ID guard also rejects stale-tab saves.
- Separate per-user cloud and pending caches; atomic revision conflict merge
  preserves independent device edits. Offline changes survive reload and are
  merged with the remote copy before uploading.
- Guest import needs explicit confirmation for the selected Google email. Its
  original browser copy is retained. Confirmed interrupted transfers resume
  only for that account.
- Sign-out flushes changes first and clears that account's working caches.
  JSON backups can also be downloaded from the account controls.
- Existing analytics/admin backend and its authorization remain unchanged.
  No existing learner rows existed in the old backend at preparation;
  its native learner entry point remains intact, with no data deletion.

## Validation and limits

Passed PostgreSQL/PGlite tests of the exact SQL: two-user RLS isolation,
anonymous CRUD/RPC denial, spoofed ID denial, optimistic conflicts, document
size/shape checks, and migration reapplication. Passed actual frontend VM tests
of hydration, autosave, conflict merging, offline refresh, account switch,
guest confirmation/skip, and sign-out. Existing KA/EN content/theme/XP checks
passed. Auth settings and the Google redirect endpoint were checked read-only.
Full browser Google round-trip and real-project RLS still require owner setup;
the public key cannot execute administrative SQL. Browser QA control was not
available in this environment.

The GitHub frontend is the independent Google entry point. An existing Sites
publication keeps its access settings and previous learner path until a
completed cutover, so a Google button doesn't redirect users to an outdated
GitHub deployment.
