---

Title: "AutoSched.me — Product Requirements Document (v2)"
Owner: Product Manager (PM)
Co‑Owner: Project Manager (PjM)
Contributors: Engineering Lead, QA Lead, DevOps, Design
Doc Version: 0.1 (Draft)
Status: Draft → Review → Approved
Last Updated: 2025‑08‑15
Domain: [https://autosched.me](https://autosched.me)
----------------------------------------------------

# AutoSched.me — Product Requirements Document (v2)

> **Purpose.** This PRD defines the business goals, product scope, detailed technical requirements, and delivery plan for AutoSched.me v2. It incorporates lessons learned from the AutoSched v1 cycle and is intended to be the single source of truth for PM, PjM, Engineering, QA, and Ops.

## 1) Executive Summary

AutoSched.me is a lightweight, privacy‑respecting scheduling tool for freelancers, consultants, and small teams. It delivers the core scheduling value chain—**availability → booking → calendar invite → notifications**—without enterprise bloat. v2 is a clean restart informed by v1 lessons:

* Normalize domain models early to minimize refactors.
* Keep FE↔BE contracts explicit and versioned.
* Treat **availability** as a first‑class domain (multi‑calendar, buffers, recurring exceptions, time zones, DST).
* Ship with a strong testing and automation posture from day one.

Initial monetization is **tier‑based monthly booking limits** (Free 3 / \$9 20 / \$20 100 bookings per month), with future upsell into branding removal, payments, and analytics.

## 2) Objectives & Success Criteria

**Business Objectives**

* Reach 100 active Owners within 3 months of GA.
* Achieve 25% free→paid conversion by end of Q2 post‑launch.
* Maintain infra costs that scale primarily with revenue (usage‑based footprint).

**User Objectives**

* Owners can create a booking type and share a link in <10 minutes from signup.
* Guests can complete a booking in ≤ 4 steps with < 2 seconds average page response.

**Operational Objectives**

* ≥ 95% uptime in MVP (targeting 99%+ as we mature).
* P0 incidents resolved (MTTR) within 2 hours; P1 within 24 hours.

**Key Success Metrics**

* Booking completion rate (slot select → confirmation): ≥ 90%.
* Owner 30‑day retention: ≥ 70%.
* Average support response time: ≤ 1 business day.

## 3) Product Scope

### In Scope (MVP)

* Owner auth: Google & Microsoft OAuth, JWT sessions; optional email/password + 2FA.
* Booking Types (CRUD): duration, location (virtual or in‑person), description, availability toggle, custom questions.
* Availability: working hours with multiple blocks/day, **recurring exceptions**, buffers, **multi‑calendar** (connect multiple calendars per Owner).
* Guest booking: public pages, real‑time availability checks, confirmation, calendar invite, email notifications.
* Tiered quotas: enforce bookings/month per plan; show remaining quota; soft→hard cap behavior.
* Branding footer on free tier (“Created with AutoSched.me”).
* GDPR‑aligned data handling; minimal PII.

### Out of Scope (MVP)

* Team/org features (pooled availability, round‑robin).
* Payments (Stripe) and invoicing.
* Advanced analytics dashboards.
* Full white‑labeling.
* Native mobile apps.

## 4) Users & Primary Use Cases

**Personas**

* **Owner**: a solo consultant, coach, or freelancer needing a shareable link for booking time. Values set‑and‑forget availability, clean UX, and reliability.
* **Guest**: a client or prospect booking with an Owner. Wants clarity on time zones, minimal fields, and instant confirmation.

**Top Use Cases**

1. Owner connects calendars, defines working hours and exceptions, creates 1–3 booking types, and shares a public link.
2. Guest opens link, selects booking type, picks a slot, answers required questions, and gets a calendar invite + email.
3. Owner (or Guest) reschedules/cancels via links in email/invite; system updates calendars and notifications.

## 5) End‑to‑End Product Walkthrough

### 5.1 Owner Onboarding Flow

1. **Sign up / Sign in** via Google/Microsoft OAuth (fallback: email + 2FA optional).
2. **Connect calendars** (multiple allowed). Requested scopes (principle of least privilege):

   * Google: `openid`, `email`, `profile`, `https://www.googleapis.com/auth/calendar.events`, `https://www.googleapis.com/auth/calendar.readonly`.
   * Microsoft Graph: `offline_access`, `User.Read`, `Calendars.ReadWrite`.
3. **Set availability**: working hours per weekday; multiple blocks per day; lead time/cutoff; buffers; **recurring exceptions** (e.g., off every 2nd Friday, first Monday monthly, specific holidays).
4. **Create Booking Types**: name, duration, location (Zoom/Google Meet/Microsoft Teams/address), optional description, required/optional custom questions (text/dropdown/checkbox/date).
5. **Share public link**: `autosched.me/{ownerSlug}` or `autosched.me/{ownerSlug}/{bookingTypeSlug}`.
6. **Quota visibility**: dashboard shows bookings used/remaining this month and upgrade CTA.

### 5.2 Guest Booking Flow

1. Open Owner link → select booking type (or land directly on type page).
2. View available slots **in Guest’s local time** (Owner’s rules applied server‑side).
3. Select slot → answer questions → confirm.
4. System writes Booking (transactional), creates calendar event (Owner + Guest), and sends confirmation email with **update/cancel links**.
5. Guest can reschedule/cancel from email; system updates event and quota accounting accordingly.

## 6) Detailed Functional Requirements

### 6.1 Booking Types

* Fields: `name`, `slug`, `durationMinutes`, `locationType` (VIRTUAL\_MEET | GOOGLE\_MEET | MS\_TEAMS | ADDRESS), `locationValue`, `description`, `isActive`.
* Questions: owner‑defined, ordered; types: TEXT, DROPDOWN (with options), CHECKBOX, DATE; `required` boolean.
* Validation: at least one active booking type is required for a public page to show slots.

### 6.2 Availability & Scheduling

**Working Hours**

* Per weekday, multiple blocks: `{ dayOfWeek (0–6), startTime, endTime }` (times stored in Owner’s profile TZ).
* Lead time (min hours before earliest bookable slot) and cutoff (max days ahead).

**Buffers**

* `bufferBeforeMinutes`, `bufferAfterMinutes` applied per booking type (default global fallback).

**Recurring Exceptions**

* Rules modeled as RRULE‑like definitions:

  * Weekly patterns (e.g., every Friday off).
  * Monthly by nth weekday (e.g., first Monday, third Thursday).
  * Specific dates (holidays, trips).
* Evaluate exceptions before slot generation; removed intervals are not bookable.

**Multi‑Calendar**

* Owners may connect multiple calendars (work/personal). All relevant calendars are checked at booking time using free‑busy reads.
* Conflicts on **any** connected calendar make a slot unavailable.

**Time Zones & DST**

* Store Owner’s base time zone in profile (IANA TZ). Guest UI renders in Guest TZ with clear labels.
* All server logic uses TZ‑aware arithmetic and handles DST transitions (e.g., skip nonexistent times, handle repeated times at fall‑back).

**Slot Generation Algorithm (server‑side)**

* Input: Owner, bookingType, target date range (based on Guest view window), calendars, rules.
* Steps:

  1. Build working windows for each date in Owner TZ.
  2. Apply recurring exceptions; subtract removed windows.
  3. Snap windows to `durationMinutes` grid (e.g., 15‑min granularity configurable; default match duration).
  4. Inflate candidate slots with buffers (before/after) for conflict checks.
  5. Fetch free‑busy for all connected calendars for the date range.
  6. Exclude slots overlapping any busy period or violating lead/cutoff.
  7. Return slots as ISO 8601 with explicit TZ offsets.
* Concurrency control: generate slots idempotently per (ownerId, date, bookingTypeId, params), cache in Redis for short TTL to reduce API pressure; always revalidate on confirm.

**Booking Transaction & Idempotency**

* On confirm: use **database transaction** with `SELECT ... FOR UPDATE` lock on candidate slot window to prevent double‑booking.
* Require `Idempotency-Key` header; store a short‑lived record to dedupe retries.

### 6.3 Calendar & Communications

**Calendar Events**

* Create primary event on Owner’s chosen calendar; add Guest as attendee (email).
* Event description includes booking details + Q\&A responses.
* Reschedule/cancel updates the existing event; ICS fallback attached to emails for Guests without calendars.

**Email Notifications (AWS SES default)**

* Domains: `autosched.me`, DKIM/SPF configured; bounce/complaint handling.
* Templates: confirmation (Owner/Guest), update, cancellation, reminder (future).
* Delivery policy: retries with exponential backoff on transient failures; log messageId + status.

### 6.4 Authentication & Authorization

* OAuth 2.0 (Google/Microsoft) with refresh tokens stored encrypted at rest; token refresh on demand.
* JWT access tokens (short TTL) + refresh tokens; rotation on refresh; revoke on logout.
* Roles: OWNER, GUEST (implicit); all write endpoints require OWNER auth.
* Optional TOTP 2FA for email/password accounts.

### 6.5 Public Booking Pages

* Slugs: `{ownerSlug}` and `{ownerSlug}/{bookingTypeSlug}`.
* SEO: minimal (robots allow); metadata for social share; no indexing for non‑active Owners.
* Branding: footer on Free; removed on paid tiers.

### 6.6 Rate Limiting & Abuse Prevention

* Per‑IP + per‑account rate limits via Redis (token bucket).
* Bot protection (basic) with challenge on anomalous patterns.
* Idempotent booking API.

### 6.7 Privacy, Security, Compliance

* Data minimization: store only necessary PII (Owner name/email; Guest email and Q\&A responses when required).
* GDPR: DSAR support (export/delete Owner data), retention policies (e.g., delete canceled/expired booking data after N months—default 12, configurable later).
* Secrets in AWS Secrets Manager/SSM; TLS everywhere; at‑rest encryption for DB/Redis/S3.

## 7) Technical Architecture

### 7.1 High‑Level Components

* **Frontend**: React + **Next.js** (recommended for SSR on public booking pages). TailwindCSS. Owner app is auth‑gated; public booking pages SSR for fast loads.
* **Backend**: Node.js **Express** service; REST JSON APIs. Strict DTO validation (Zod). Layered services (controllers → services → repositories).
* **DB**: PostgreSQL via Prisma ORM.
* **Cache/Queues**: Redis for rate limiting, short‑TTL slot caches, job queue (BullMQ) for emails/invites.
* **Email**: AWS SES.
* **Calendar**: Google Calendar API, Microsoft Graph Calendar.
* **Storage**: S3 for static assets (e.g., logos) if needed.
* **Observability**: Winston logging (JSON), OpenTelemetry traces (future), Prometheus‑compatible metrics export.

### 7.2 Data Model (ER sketch)

* **User**(id, email, name, slug, timezone, plan, bookingsMonthCount, bookingsMonthResetAt, createdAt, updatedAt)
* **OAuthAccount**(id, userId, provider\[GOOGLE|MICROSOFT], providerUserId, accessTokenEnc, refreshTokenEnc, scope, expiresAt)
* **BookingType**(id, userId, name, slug, durationMinutes, locationType, locationValue, description, isActive, bufferBeforeMinutes, bufferAfterMinutes, leadTimeHours, cutoffDays)
* **Question**(id, bookingTypeId, label, type, required, order)
* **QuestionOption**(id, questionId, value, order)
* **AvailabilityBlock**(id, userId, dayOfWeek, startTime, endTime)  // in Owner TZ
* **RecurringExceptionRule**(id, userId, rruleType, byDay, bySetPos, byMonth, datesJson, note)
* **Booking**(id, userId, bookingTypeId, status\[CONFIRMED|CANCELLED], startDateTime, endDateTime, guestEmail, guestName, calendarEventId, calendarProvider, iCalAttachmentUrl, createdAt, updatedAt)
* **BookingQuestionResponse**(id, bookingId, questionId, responseText)
* **EmailLog**(id, bookingId?, toEmail, template, providerMessageId, status, error)
* **AuditLog**(id, userId?, actor, action, entity, entityId, payloadJson, createdAt)

> Notes:
>
> * Times are stored in UTC with explicit offsets; Owner TZ used for rendering and calculations.
> * Sensitive tokens encrypted at rest.

### 7.3 API Design (selected)

**Auth**

* `POST /api/auth/oauth/:provider/start` → redirect URL
* `GET /api/auth/oauth/:provider/callback` → sets refresh/access tokens, creates/links User
* `POST /api/auth/login` (email/pw), `POST /api/auth/refresh`, `POST /api/auth/logout`

**Owner Profile**

* `GET/PUT /api/owner/me` (name, slug, timezone, plan)
* `GET /api/owner/quotas` → { plan, usedThisMonth, remaining }

**Calendars**

* `POST /api/calendars/:provider/connect`
* `GET /api/calendars` → list connections
* `DELETE /api/calendars/:id`

**Availability**

* `GET/PUT /api/availability/blocks` (list & bulk upsert)
* `GET/PUT /api/availability/exceptions` (RRULE rules)

**Booking Types**

* `GET/POST /api/booking-types`
* `GET/PUT/DELETE /api/booking-types/:id`
* `POST /api/booking-types/:id/questions` (bulk upsert with options)

**Public Slots & Booking**

* `GET /api/public/:ownerSlug/:bookingTypeSlug/slots?date=YYYY-MM-DD`
* `POST /api/public/:ownerSlug/:bookingTypeSlug/book` (headers: `Idempotency-Key`)

  * Request: { startDateTimeISO, guest: { email, name }, answers: \[{ questionId, value }] }
  * Response: { bookingId, status, calendar: { provider, eventId }, emailSent: true }

**Reschedule/Cancel**

* `POST /api/bookings/:id/reschedule` (new startDateTimeISO)
* `POST /api/bookings/:id/cancel`

**Errors & Status Codes**

* 400 validation; 401/403 auth; 404 not found; 409 conflict (slot taken/quota exceeded); 429 rate limit; 500 server.

### 7.4 Scheduling Details & Edge Cases

* **Lead time** enforced at display and confirm; server is source of truth.
* **Cutoff** prevents showing dates past window.
* **DST**: use IANA TZ (Luxon/Temporal or date‑fns‑tz). Skip nonexistent times (spring forward), treat repeated times (fall back) carefully; store UTC instants.
* **Back‑to‑back**: buffers ensure at least N minutes before/after; add optional global min gap later.
* **Race conditions**: final availability recheck inside DB transaction right before insert; on failure return 409 with fresh slots payload.

### 7.5 Observability

* **Logging**: request ID correlation; structured JSON logs; PII‑safe.
* **Metrics**: `http_request_duration_ms`, `bookings_created_total`, `emails_sent_total`, `calendar_api_failures_total`.
* **Tracing**: instrument calendar + email calls for latency; consider OpenTelemetry SDK.

### 7.6 Configuration & Secrets

* Twelve‑Factor; `.env` for local only; AWS SSM/Secrets Manager in cloud. No secrets in code or CI logs.

### 7.7 CI/CD & Environments

* **GitHub Actions** pipeline stages:

  1. `lint` (ESLint, formatting check)
  2. `typecheck` (tsc) — FE/BE
  3. `test` (Jest unit; Supertest integration)
  4. `build`
  5. `docker` build & push (tags: sha, env)
  6. `deploy` to Dev → Staging (manual approval) → Prod
* **Environments**: Dev (ephemeral ok), Staging (prod‑like), Prod.

### 7.8 Testing Strategy

* **Unit tests**: 100% coverage target for services (availability, booking, calendar, email). Typed mocks/factories. Loop‑safety guards to prevent infinite slot gen.
* **Integration**: Supertest for controller routes; MSW for FE API mocking; contract tests for FE↔BE DTOs.
* **E2E (future)**: Minimal smoke set (book a slot end‑to‑end) with Playwright.
* **Regression**: Add tests for every bug fixed.

### 7.9 Performance & SLOs

* P95 API latency < 500ms for slot queries with warm cache; < 1.5s cold (includes free‑busy).
* Booking confirmation end‑to‑end < 2.5s P95 (includes event creation + email enqueue).

### 7.10 Risks & Mitigations

* **Calendar API rate limits** → cache free‑busy, batch requests, exponential backoff, circuit breakers; graceful degradation (warn, retry, suggest reconnect).
* **Token expiry/rotations** → robust refresh handling; proactive refresh on 401.
* **DST/time zone bugs** → centralize TZ logic; add unit tests around DST boundaries; simulate EU/US transitions.
* **Email deliverability** → proper DNS (SPF/DKIM/DMARC), warmup, feedback loops; fallback provider if SES region blocked.
* **Quota enforcement** → count bookings on CONFIRMED only; decrement on cancel; protect via DB constraints and transactions.

## 8) Pricing & Quotas (MVP)

* **Free**: 3 bookings/month, branded footer.
* **Pro (\$9)**: 20 bookings/month, remove branding.
* **Plus (\$20)**: 100 bookings/month, remove branding, upcoming features first.
* Enforce at `POST /book` with 409 when exceeded (hard cap). Soft warnings in dashboard at 80%+.
* Counter resets monthly on `bookingsMonthResetAt` (UTC midnight first of month). Cron job aligns counters.

## 9) Roadmap (Post‑MVP)

* **Payments (Stripe)**: paid booking types, no‑show fees, payout reports.
* **Teams/Org**: pooled availability, round‑robin, shared pages.
* **Reminders & Follow‑ups**: email/SMS reminders; post‑meeting forms.
* **Analytics**: conversion, source tracking, per‑type insights.
* **Chrome Extension**: quick copy of booking links; create ad‑hoc holds.
* **White‑labeling**: custom domain, themes.

## 10) Migration / Restart Plan

* Treat v2 as greenfield. If migrating any v1 data, write one‑time migration with explicit mapping for Users, BookingTypes, and Availability blocks; manually verify a sample set.
* Announce v1 deprecation window if applicable; provide export (CSV/JSON) of bookings and settings.

## 11) Operational Playbooks

* **Incident Response**: severity matrix, on‑call rota, runbooks for calendar provider outages, SES bounce spikes, DB connection saturation.
* **Backups & DR**: nightly DB snapshots; point‑in‑time recovery enabled; restore test monthly.
* **Security**: quarterly secrets rotation; dependency scanning (Dependabot + CI audit).

## 12) Cursor‑Powered Ops/Dev Automation

AutoSched.me development leverages **Cursor background agents** for repeatable, auditable workflows.

**Repository Structure (monorepo)**

```
/ops
  /prompts
    product_manager.md
    project_manager.md
    frontend_dev.md
    backend_dev.md
    qa_engineer.md
    devops_engineer.md
  /specialists
    product_manager.md
    project_manager.md
    frontend_dev.md
    backend_dev.md
    qa_engineer.md
    devops_engineer.md
/apps
  /web (Next.js)
  /api (Express)
/packages
  /ui (shared components)
  /config (eslint, tsconfig)
```

**Agent Roles & Responsibilities**

* **Product Manager**: maintains this PRD; curates roadmap; writes acceptance criteria.
* **Project Manager**: translates PRD → Linear Issues/Roadmap/Cycles; tracks delivery; enforces definition of done.
* **Frontend Dev Agent**: builds pages/components; adheres to API contracts; adds MSW mocks.
* **Backend Dev Agent**: implements services/controllers; writes unit + Supertest integration tests.
* **QA Agent**: crafts test plans; ensures coverage thresholds; adds regression tests for bugs.
* **DevOps Agent**: maintains CI/CD, infra as code, environment secrets, observability.

**Standard Prompt Shape (example)**

```
Role: Backend Dev Agent
Goal: Implement POST /api/public/:ownerSlug/:bookingTypeSlug/book with idempotency and DB transaction.
Inputs: PRD sections 6.2, 7.3; DTOs in /packages/config; prisma schema.
Definition of Done:
- Unit tests for booking service (conflict, quota, happy path) at 100%.
- Supertest route test covering 200, 409, 429.
- Logs include requestId, ownerId.
- Docs updated in /apps/api/README.md.
```

**Maintenance Contracts**

* PM updates **/ops/prompts/product\_manager.md** and this PRD on scope changes.
* PjM mirrors scope into Linear Issues with labels: `feat`, `bug`, `infra`, `docs`, `test`.
* CI guardrails: PRs blocked unless tests pass and coverage ≥ target for changed packages.

## 13) Acceptance Criteria (MVP)

* Owner can:

  * Connect at least one Google or Microsoft calendar.
  * Define working hours with ≥ 2 blocks per day and at least one recurring exception.
  * Create a 30‑minute Google Meet booking type with 10‑minute buffers.
  * Share a public link that displays slots in Guest TZ.
* Guest can:

  * Book a slot, receive calendar invite + email, and reschedule successfully.
* System:

  * Prevents double‑booking under concurrent requests (proven by test).
  * Enforces plan quotas and surfaces remaining bookings in dashboard.
  * Handles DST boundary dates without generating invalid slots.

## 14) Open Decisions (Resolved for v2)

* **Recurring exceptions**: **Yes**, supported at launch.
* **Multiple calendars per Owner**: **Yes**, supported.
* **Email service**: **AWS SES** by default; pluggable provider interface for fallbacks.
* **Pricing**: **Tiered quotas** (Free 3 / \$9 20 / \$20 100 per month). Exact prices subject to regionalization later.

## 15) Change Log

* 0.1 (2025‑08‑15): Initial long‑form PRD for AutoSched.me v2 based on v1 lessons learned.

---

### Appendix A — Sample Slot Generation Pseudocode

```ts
function generateSlots(owner, bookingType, dateRange) {
  const windows = buildWorkingWindows(owner.timezone, dateRange, owner.blocks);
  const withoutExceptions = subtractExceptions(windows, owner.recurringRules);
  const candidates = gridSlots(withoutExceptions, bookingType.durationMinutes);
  const buffered = applyBuffers(candidates, bookingType.bufferBeforeMinutes, bookingType.bufferAfterMinutes);
  const busy = fetchFreeBusy(owner.connectedCalendars, dateRange);
  return filterConflicts(buffered, busy)
    .filter(slot => respectsLeadAndCutoff(slot, bookingType.leadTimeHours, bookingType.cutoffDays))
    .map(toISOWithOffset);
}
```

### Appendix B — Error Codes

* `ASCHED-409-SLOT_TAKEN` — Slot no longer available.
* `ASCHED-409-QUOTA_EXCEEDED` — Plan quota reached.
* `ASCHED-401-OAUTH_EXPIRED` — Need to reconnect calendar provider.
* `ASCHED-429-RATE_LIMIT` — Too many requests; retry later.

### Appendix C — Email Templates (Keys)

* `booking_confirmation_owner`
* `booking_confirmation_guest`
* `booking_update`
* `booking_cancellation`

### Appendix D — Security Checklist (MVP)

* [ ] All secrets managed via SSM/Secrets Manager.
* [ ] DB at‑rest encryption + TLS in transit.
* [ ] OAuth tokens encrypted with KMS key.
* [ ] PII logging scrubbing and access controls.
* [ ] Dependency scanning enabled in CI.
