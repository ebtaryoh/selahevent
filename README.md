# Selah — Christian Event Operating System

Selah is a multi-tenant platform for planning, publishing, registering, paying
for, running and reviewing Christian events — churches, conferences, retreats,
training programs, camps, conventions and ministry gatherings.

The organising principle is simple: **every event should make the next event
easier.** Registration forms, ticket structures, schedules, volunteer
departments, communication timelines, certificates, venues and speakers are
captured once as an **Event Blueprint** and reused with explicit confirmation.

> Demonstration build. All organisations, people, payments and figures shown in
> the seed data are clearly fictional.

---

## 1. Product overview

| Area | Where it lives | What it does |
| --- | --- | --- |
| Marketing site | `src/app/page.tsx` | Positioning, lifecycle, Event Blueprint, Command Center, Organization Memory, pricing, FAQ |
| Public event page | `src/app/e/[slug]/page.tsx` | Countdown, speakers, multi-track schedule, ticket tiers, OG/Twitter metadata, JSON-LD `Event` structured data |
| Registration flow | `src/app/e/[slug]/register` + `src/components/registration-form.tsx` | Four-step progressive-disclosure form, per-step validation, capacity checks, server-side persistence, QR ticket, `.ics` download |
| Organization dashboard | `src/app/dashboard` | Event ledger, readiness checklist, tasks, activity/audit, ticket distribution, blueprint CTA |
| Event management | `src/app/dashboard/events/[id]` | Readiness, operations (accommodation, transport, volunteers, communications), registrations ledger, schedule |
| Event Command Center | `src/app/dashboard/events/[id]/command` | Live check-in console (QR code + manual lookup), duplicate prevention, sync state, live feed, operational alerts |
| Organization Memory | `src/app/dashboard/blueprints` | Blueprints, reusable library, retention controls, audit log |
| Certificate verification | `src/app/verify/[code]` | Public, read-only verification that exposes only the minimum necessary data |

### Backend surface

- `POST /api/registrations` — validates and creates a registration plus a
  payment record. Free events are confirmed immediately; paid events are stored
  with `pending` status because **no live gateway is configured in this build**
  (the UI says so rather than faking a successful charge).
- `POST /api/check-in` — validates a ticket code against a specific event,
  rejects duplicates and cancelled registrations, and records timestamp, gate,
  method and staff member.
- `GET /api/health` — liveness/DB connectivity probe used by the platform.

---

## 2. Architecture & stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript, server
  components + route handlers.
- **Styling:** Tailwind CSS v4 with a tokenised design system in
  `src/app/globals.css` (cypress/brass/parchment palette, Fraunces + Manrope,
  hairline ledger tables, reduced-motion support).
- **Database:** PostgreSQL via Drizzle ORM (`src/db/schema.ts`,
  `src/db/index.ts`).
- **Data access:** `src/lib/data.ts` — every read goes through typed query
  helpers rather than being inlined in UI components.
- **Seeding:** `src/lib/seed.ts` — idempotent demo tenant ("Grace Fellowship").
- **Motion:** `framer-motion` for reveal choreography, CSS keyframes for
  micro-interactions, all gated by `prefers-reduced-motion`.
- **Charts:** hand-authored SVG/HTML bars — no chart dependency.

### Tenant model

`organizations` is the root of the tenant tree. `events`, `speakers`,
`tasks`, `blueprints` and `audit_logs` all carry `organization_id`;
`registrations`, `payments`, `check_ins`, `sessions`, `ticket_types` and
`volunteers` hang off `events` and therefore inherit the tenant boundary.
Indexes exist on every foreign key used in filtering.

For production on Supabase, mirror this shape with Postgres Row Level Security
policies keyed on `organization_id` — the application layer already scopes every
query, and RLS adds the defence-in-depth guarantee.

---

## 3. Environment variables

Copy `.env.example` to `.env` and fill in the values.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical URLs, Open Graph, sitemaps |
| `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` | For payments | Gateway credentials (server-side only) |
| `PAYSTACK_MODE` | No | `live` for production verification; anything else is test mode |
| `EMAIL_PROVIDER_API_KEY` etc. | For communications | Provider abstraction — nothing is sent without a key |
| `AUTH_SECRET` | Production | Signing secret for sessions |
| `RATE_LIMIT_PER_MINUTE` | No | Abuse protection budget |

**No secret is ever referenced from client code.** Only `NEXT_PUBLIC_*`
variables reach the browser bundle.

---

## 4. Local development

```bash
# 1. Install
npm install

# 2. Start PostgreSQL (or use the provided sandbox database)
#    docker run --name selah-pg -e POSTGRES_PASSWORD=postgres \
#      -e POSTGRES_DB=app_db -p 5432:5432 -d postgres:16

# 3. Configure
cp .env.example .env

# 4. Push the schema and start
npx drizzle-kit push
npm run dev
```

The demo tenant seeds automatically on first request. To reset the data, drop
the tables and push again:

```bash
npx drizzle-kit drop   # or: psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npx drizzle-kit push
```

Useful scripts: `npm run typecheck`, `npm run lint`, `npm run build`,
`npm run start`.

---

## 5. Payments

Payments are behind a gateway abstraction (`gateway`, `gateway_reference`,
`verified`, `status` on the `payments` table). Paystack is the first provider.

Rules enforced in code:

1. The frontend never decides that a payment succeeded.
2. Verification happens server-side against the gateway API before `verified`
   is set to `true`.
3. Amounts, currency and reference IDs are stored with the registration so a
   charge can always be traced and audited.
4. Free events skip the gateway entirely and are recorded as `paid` with an
   explicit `FREE_*` reference.

This build ships **without live gateway credentials**. Paid registrations are
created with `pending` status and the confirmation screen states plainly that no
card details were collected — rather than simulating a successful payment.

---

## 6. Testing & quality gates

Recommended coverage before production:

- **Unit:** pricing/capacity rules, promo codes, ticket code generation,
  permission helpers, readiness calculations.
- **Integration:** registration creation, payment verification, check-in
  duplicate prevention, certificate issuance.
- **End-to-end:** create event → publish → register → pay → confirm →
  scan → check in → issue certificate → clone as blueprint.
- **Security:** cross-tenant reads, IDOR on `eventId`/`registrationId`, role
  escalation, payment amount tampering, malicious file uploads, rate limits.

Manual checks that matter for this codebase: keyboard navigation through the
registration stepper, `prefers-reduced-motion`, layout at 360px width, and the
empty/error states on the Command Center.

---

## 7. Deployment

The app is a standard Next.js application and deploys cleanly to Vercel (or any
Node host) with a managed Postgres/Supabase database.

1. Provision Postgres and set `DATABASE_URL`.
2. Run `npx drizzle-kit push` (or generate migrations with
   `npx drizzle-kit generate` and apply them in CI).
3. Set `NEXT_PUBLIC_SITE_URL` to the production origin.
4. Add payment and email credentials, keeping secret keys server-side.
5. Deploy, then verify `/api/health` returns `{ "ok": true }`.

---

## 8. Security notes

- Every database query is parameterised through Drizzle — no string-concatenated
  SQL.
- All writes validate and normalise input on the server; the client-side
  validation exists for ergonomics, not for trust.
- Check-in and registration endpoints are scoped to an `eventId`, preventing
  cross-event and cross-tenant access.
- QR payloads contain only an opaque ticket identifier — no names, emails or
  phone numbers are encoded.
- Sensitive attendee fields (emergency contacts, dietary/medical notes) are
  never rendered on public pages and are excluded from the registrations
  preview.
- Security headers, CSRF protection and per-route rate limiting should be added
  at the edge/middleware layer for production (see `RATE_LIMIT_PER_MINUTE`).

---

## 9. Production checklist

- [ ] `DATABASE_URL` points at the production database with backups enabled
- [ ] `NEXT_PUBLIC_SITE_URL` set and canonical URLs verified
- [ ] Paystack live keys configured and a real transaction verified end-to-end
- [ ] Email provider verified; sender domain authenticated (SPF/DKIM)
- [ ] Row Level Security enabled on tenant tables (Supabase)
- [ ] Rate limiting and bot protection on `/api/*`
- [ ] Error monitoring and structured logging connected
- [ ] Accessibility audit (WCAG 2.2 AA) on the registration flow
- [ ] Data retention policy documented and enforced
- [ ] Incident/rollback runbook written and tested

---

## 10. Project structure

```
src/
  app/
    page.tsx                    Marketing site
    e/[slug]/                   Public event page + registration flow
    dashboard/                  Organization dashboard, event management,
                                Command Center, Organization Memory
    verify/[code]/              Public certificate verification
    api/                        health · registrations · check-in
  components/                   Design-system and feature components
  db/                           Drizzle client + schema
  lib/                          Formatting, data access, seed data
```
