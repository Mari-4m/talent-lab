# Sites Worker ESM starter

Use this starter for a static microsite, click counter, or simple internal UI whose state is browser-scoped. It has no dependencies and needs no install.

Edit `worker/index.js`, then publish through the Sites hosting workflow with this starter's build and validation in `commands`.

The build copies only `worker/index.js` and `.openai/hosting.json`. Do not add standalone asset files. Embed any essential raster bytes in `worker/index.js` and serve or reference them as a data URL.

Pass these argument arrays as `commands`:

```json
[
  ["bash", "scripts/build.sh"],
  ["node", "scripts/validate-artifact.mjs"]
]
```

The deterministic build produces:

```text
dist/
├── .openai/
│   └── hosting.json
└── server/
    └── index.js
```

`dist/server/index.js` is an ES module with a default export containing `fetch(request, env, ctx)`. Edit `worker/index.js`, not the generated file under `dist/`.

## Analytics service

This Worker backs the static Talent Lab frontend, including GitHub Pages. `DB` is a Sites-provisioned D1 database; schema migrations are in `drizzle/`. Configure the comma-separated administrator allowlist `ADMIN_EMAIL`, `ANALYTICS_SECRET` (secrets) and the comma-separated `ALLOWED_ORIGINS` through hosting environment settings. Never place these values in GitHub or browser code.

The service accepts anonymous learning events and ratings through `/api/public/*`. It must be publicly reachable for GitHub Pages collection. Public access to the service does not grant administrator access: every `/api/admin/*` request checks dispatch-provided ChatGPT identity against exact entries in `ADMIN_EMAIL`. Other signed-in accounts and anonymous callers are denied. Sites owns sign-in and strips/injects identity headers; do not expose this Worker through a proxy that trusts arbitrary client identity headers.

The dashboard is `/admin`. Public aggregate metrics are disabled by default and can be enabled individually by the owner. Detailed events, learner progress and feedback comments are never returned by the public summary endpoint.

Visitor counts represent anonymous browser identifiers, not verified people. Clearing browser storage or using another device can create another visitor. Ratings are one current rating per browser identifier. Public writes are origin-restricted, schema-validated, HMAC-token-bound and rate-limited, but anonymous metrics are not a certified identity or exam record. No historical activity from before installation can be reconstructed; previously saved completion state may be synchronised and is marked `existing`.

No names, emails, IP addresses, personal notes or candidate data are stored in analytics tables. Short-lived HMAC-derived abuse keys are used for request throttling. Star comments are optional and remain owner-only. Visitors can stop future learning-event collection through frontend analytics preferences. Rating submission remains an explicit separate action.

## Learner accounts (October 2026)

`/learn/` serves the same learning assets with ChatGPT sign-in. Public guest
pages link here from GitHub Pages or the original static Site. Dispatch identity
is the sole authentication authority. `/api/learner/progress` scopes every row
to `oai-authenticated-user-id`; writes require same-origin requests and an
expected account ID to prevent an old tab writing into a newly signed-in account.
No separate password, OAuth or bearer-session implementation is introduced.

The append-only migration `0001_learner_accounts` adds private learner documents
and temporary guest handoffs. Revisions provide optimistic concurrency; the
client merges independent changes and retries on conflict. Progress documents
include learning notes, bookmarks and practice history, unlike the existing
anonymous analytics tables. The analytics dashboard does not expose them.

Guest handoffs are random 256-bit capabilities, stored hashed, valid for 30
minutes, restricted to allowed frontend origins, rate-limited, bound to the
first signed-in claimant and deleted after successful import. Links carry only
the opaque code in the URL fragment. No account ID is accepted as authentication.

Keep `learner-assets/` in sync with the frontend distribution when changing
learning content. `scripts/bundle-learner.mjs` embeds these exact assets and the
account routes into the Worker. The existing environment keys and audiences
remain unchanged. Google sign-in and email/password registration are not added.
