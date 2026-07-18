# Accepta Analytics — PostHog Setup & Weekly Review

## One-time setup

1. Create a free account at https://posthog.com (US Cloud).
2. Use one project for Accepta. The two saved insights ("Acquisition funnel"
   and "Weekly returning users") live in project **504317** — the auto-created
   "Default project". Either rename that project to "Accepta" (Settings →
   Project), or create a new one and rebuild the insights there. **Copy the
   Project API key (`phc_...`) from whichever project holds the insights** —
   they only populate if the key below matches that same project.
3. Set in `.env.local` (and in your production host's env):
   - `NEXT_PUBLIC_POSTHOG_KEY=phc_...`  ← key of the project holding the insights
   - `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com`
4. Redeploy. Analytics are disabled automatically wherever the key is unset.
5. In PostHog → **Settings → Session replay**: confirm replay is enabled for the
   project. Input masking is already forced in code (`maskAllInputs: true`) —
   passports/transcripts are never recorded.

## Events instrumented (exactly these seven)

| Event | Fires when | Properties |
|---|---|---|
| `signup_completed` | Onboarding wizard finished (the app's signup completion point) | `referral_source` |
| `profile_completed` | Profile Strength first reaches 100% | — |
| `scan_run` | Each successful AI Program Scan (Discover) | `plan` (free/sprint/season) |
| `letter_generated` | Each successful Letter Studio generation | `plan` |
| `cv_tailored` | Each successful AI CV tailoring run | — |
| `pass_purchased` | Chapa payment verified server-side | `pass_type` (sprint/season), `amount_etb` |
| `returned_visit` | Logged-in session starting 24h+ after the previous one (per device) | — |

UTM parameters (`utm_source`, `utm_medium`, `utm_campaign`) from the first
landing URL are stored on the user record at signup. Share links like
`https://accepta.site?utm_source=telegram_grp1`.

## Insight 1 — Acquisition funnel (create in PostHog UI)

1. In PostHog, go to **Product analytics → New insight → Funnel**.
2. Add steps in order:
   - Step 1: `$pageview` (any pageview)
   - Step 2: `signup_completed`
   - Step 3: `profile_completed`
   - Step 4: click **+ Add step**, choose `scan_run`, then on that step choose
     **"any of"** and add `letter_generated` and `cv_tailored` as alternatives
     (PostHog: use the "Any of" step type / add multiple events to one step).
3. Set the conversion window to **30 days**.
4. Save as **"Acquisition funnel"** and pin it to a dashboard if you like.
5. Optional: break down by `referral_source` to see which channel converts.

## Insight 2 — Retention (weekly returned users)

1. **New insight → Trends**.
2. Event: `returned_visit`; change the aggregation from "Total count" to
   **"Unique users"**.
3. Set the interval to **Weekly**.
4. Save as **"Weekly returning users"**.

## Friday review, in one place

- Acquisition funnel → how many strangers discovered us and signed up.
- Weekly returning users → how many came back.
- People → filter by `referral_source` / `utm_source` → where they came from.
- `/en/admin/new-users` in the app → who to interview next
  (access controlled by the `ADMIN_EMAILS` env var).

The dashboard holding both tiles is **"Friday review"** (ID 1821251), in
project 504317. The funnel is intentionally kept with no standing breakdown —
add the `referral_source` split ad hoc (one click) when a number looks off.

## Close condition

Analytics is **"built," not "proven,"** until one real event (e.g.
`signup_completed`) lands in project **504317** via a live test signup. Wire the
key, sign up as a test user, watch it appear — that smoke-test is the actual
green light. Everything before it is scaffolding matched to spec against an
empty project.

**Boundary:** no product work until stranger behavior is visible in the funnel.
