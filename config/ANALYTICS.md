# Analytics (PostHog EU)

Optional product analytics via [PostHog EU Cloud](https://eu.posthog.com/). Disabled by default so a public GitHub clone ships no tracking.

## Cookies & EU consent

**Default config is cookieless** (`cookielessMode: "always"`, `personProfiles: "never"`).

| Mode | Cookies / storage? | Consent banner for PostHog? |
|------|--------------------|-----------------------------|
| `cookielessMode: "always"` (default) | No PostHog cookies or local/session storage | **Usually no** — for PostHog alone |
| `cookielessMode: "on_reject"` + banner | Only after opt-in | **Yes** — wire `opt_in_capturing` / `opt_out_capturing` |
| `persistence: "localStorage+cookie"` (no cookieless) | Yes (`ph_*` cookies + localStorage) | **Yes** under ePrivacy / GDPR for analytics |

Also enable **Project settings → Web analytics → Cookieless server hash mode** in PostHog, or cookieless events are dropped.

This is not legal advice. You still need a privacy notice if you process visitor data, and a banner if anything else on the site sets non-essential cookies (embeds, fonts via third parties that set cookies, etc.).

## What gets tracked

| Event | When |
|-------|------|
| `$pageview` | Landing load + SPA navigations |
| `landing_view` | Home gallery rendered (includes `audience`, case count) |
| `case_study_open` | Case opened (`source`: `landing_card`, `more_cases`, `in_doc_link`, `history`) |
| `case_study_leave` | Leave a case (duration + max scroll depth) |
| `case_study_home` | Brand / home control back to landing |
| `scroll_depth` | 25 / 50 / 75 / 100% while reading |
| `section_view` | Active poster / hero section changes |
| `toc_toggle` / `toc_navigate` | Contents panel |
| `image_expand` / `image_collapse` | In-reader image expand |
| `back_to_top` | Back-to-top control |

**Useful PostHog setup after data flows:** funnel `landing_view` → `case_study_open` → `scroll_depth` (50) → `image_expand`; breakdown case opens by `source` and `audience`.

## Secrets vs publishable keys

| Credential | Safe in GitHub? | Notes |
|------------|-----------------|-------|
| Project token `phc_…` | Yes (write-only, like a GA ID) | Prefer env / `analytics.local.json` so history stays clean |
| Personal API key `phx_…` | **Never** | Stripped by the resolver if accidentally set |
| Session / private keys | **Never** | Not used by this integration |

Committed [`analytics.json`](./analytics.json) has `enabled: false` and an empty token. Production builds merge env + optional local override into `dist/config/analytics.json` and **never** copy `analytics.local.json`.

## Enable locally

1. In [PostHog EU](https://eu.posthog.com/) → Project settings → copy the **Project API key** (`phc_…`).
2. Enable **Cookieless server hash mode** (Web analytics settings).
3. Create `config/analytics.local.json` (gitignored):

```json
{
  "posthog": {
    "enabled": true,
    "projectToken": "phc_YOUR_TOKEN",
    "respectDnt": false
  }
}
```

4. `npm start` — console should show `[analytics] PostHog ready`; Network shows `eu-assets` / `eu.i.posthog.com`.

Or use `.env` (gitignored) for **production builds**:

```bash
cp .env.example .env
# POSTHOG_PROJECT_TOKEN=phc_…  POSTHOG_ENABLED=true
```

## Enable in production CI

GitHub Pages builds via `.github/workflows/pages.yml`. Add repository secrets:

| Secret | Value |
|--------|--------|
| `POSTHOG_PROJECT_TOKEN` | your `phc_…` project token |
| `POSTHOG_ENABLED` | `true` |

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

Then push to `main` (or run **Deploy GitHub Pages** manually). The build writes the token into `dist/config/analytics.json` only — it is never committed.

```bash
# Local prod smoke-test (uses analytics.local.json and/or .env)
POSTHOG_PROJECT_TOKEN=phc_… POSTHOG_ENABLED=true npm run build:production
npm run preview:prod
```

## Options (`config/analytics.json`)

- `cookielessMode` — `"always"` (default), `"on_reject"`, or `""` to use `persistence` cookies
- `personProfiles` — `"never"` with cookieless (recommended)
- `apiHost` / `uiHost` — EU defaults
- `autocapture` / `sessionRecording` — off by default (session replay needs cookies + consent)
- `respectDnt` — skips init when Do Not Track is on
- `scrollDepthMarks` — default `[25, 50, 75, 100]`
