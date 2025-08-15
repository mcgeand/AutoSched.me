## Today’s Objectives

- Pilot dependency update flow with minimal risk. Ensure CI remains understandable and relied upon.

## Active Tickets

<!-- OPS:ACTIVE-START -->
- [2025-08-10-ci-004](./tasks/2025-08-10-ci-004.md) — Decide canonical CI workflow(s) and required checks for `dev` — status: todo — branch: `bg/ci-004` — owner: ci
- [2025-08-10-ci-005](./tasks/2025-08-10-ci-005.md) — Define and pin Node/npm versions for CI and local dev — status: todo — branch: `bg/ci-005` — owner: ci
- [2025-08-10-ci-006](./tasks/2025-08-10-ci-006.md) — Align Node versions across workflows to Node 20 — status: todo — branch: `bg/ci-006` — owner: ci
- [2025-08-10-ci-007](./tasks/2025-08-10-ci-007.md) — Align Postgres service version across workflows — status: todo — branch: `bg/ci-007` — owner: ci
- [2025-08-10-ci-008](./tasks/2025-08-10-ci-008.md) — Reconcile dependency snapshot path and artifact upload — status: todo — branch: `bg/ci-008` — owner: ci
- [2025-08-10-ci-009](./tasks/2025-08-10-ci-009.md) — Enforce OpenAPI/types drift in baseline `dev` workflow — status: todo — branch: `bg/ci-009` — owner: ci
- [2025-08-10-ci-010](./tasks/2025-08-10-ci-010.md) — Add `.nvmrc` and align `engines` with Node 20 — status: todo — branch: `bg/ci-010` — owner: ci
- [2025-08-10-ci-011](./tasks/2025-08-10-ci-011.md) — Reconcile Mock System Freeze Validation doc vs workflows — status: todo — branch: `bg/ci-011` — owner: ci
- [2025-08-10-ci-012](./tasks/2025-08-10-ci-012.md) — Implement Ephemeral Test Database Setup for Prisma — status: in_progress — branch: `bg/ci-012` — owner: agent
- [2025-08-10-api-013](./tasks/2025-08-10-api-013.md) — Backend–OpenAPI contract validation and drift report — status: todo — branch: `bg/api-013` — owner: api
- [2025-08-10-ops-016](./tasks/2025-08-10-ops-016.md) — Environment variable inventory and validation plan — status: todo — branch: `bg/ops-016` — owner: ops
- [2025-08-10-ops-023](./tasks/2025-08-10-ops-023.md) — AWS Secrets Manager mapping validation (eu-north-1) — status: todo — branch: `bg/ops-023` — owner: ops
- [2025-08-10-db-014](./tasks/2025-08-10-db-014.md) — Prisma schema reconciliation (root vs backend) decision — status: todo — branch: `bg/db-014` — owner: db
- [2025-08-10-docker-015](./tasks/2025-08-10-docker-015.md) — Local dev environment validation (Docker/compose/scripts) — status: todo — branch: `bg/docker-015` — owner: docker
<!-- OPS:ACTIVE-END -->

## In Review

<!-- OPS:REVIEW-START -->

- [2025-08-10-ci-001](./tasks/2025-08-10-ci-001.md) — Baseline CI green on `dev` — status: review — branch: `bg/ci-001` — owner: ci
<!-- OPS:REVIEW-END -->

## Blocked

<!-- OPS:BLOCKED-START -->

- [2025-08-10-ci-003](./tasks/2025-08-10-ci-003.md) — Incremental safe dependency updates (minors/patches only) with CI green — status: blocked — branch: `bg/ci-003` — owner: ci
<!-- OPS:BLOCKED-END -->

## Done Today

<!-- OPS:DONE-START -->

- [2025-08-10-ci-002](./tasks/2025-08-10-ci-002.md) — Lock & report current dependency tree (deps-before.json) — status: done — branch: `bg/ci-002` — owner: agent
<!-- OPS:DONE-END -->

## Handoff Queue

<!-- OPS:HANDOFF-START -->

- [2025-08-10-ci-004](./tasks/2025-08-10-ci-004.md) — Decide canonical CI workflow(s) and required checks for `dev` — status: todo — branch: `bg/ci-004` — owner: ci
- [2025-08-10-ci-005](./tasks/2025-08-10-ci-005.md) — Define and pin Node/npm versions for CI and local dev — status: todo — branch: `bg/ci-005` — owner: ci
- [2025-08-10-ci-006](./tasks/2025-08-10-ci-006.md) — Align Node versions across workflows to Node 20 — status: todo — branch: `bg/ci-006` — owner: ci
- [2025-08-10-ci-007](./tasks/2025-08-10-ci-007.md) — Align Postgres service version across workflows — status: todo — branch: `bg/ci-007` — owner: ci
- [2025-08-10-ci-008](./tasks/2025-08-10-ci-008.md) — Reconcile dependency snapshot path and artifact upload — status: todo — branch: `bg/ci-008` — owner: ci
- [2025-08-10-ci-009](./tasks/2025-08-10-ci-009.md) — Enforce OpenAPI/types drift in baseline `dev` workflow — status: todo — branch: `bg/ci-009` — owner: ci
- [2025-08-10-ci-010](./tasks/2025-08-10-ci-010.md) — Add `.nvmrc` and align `engines` with Node 20 — status: todo — branch: `bg/ci-010` — owner: ci
- [2025-08-10-ci-011](./tasks/2025-08-10-ci-011.md) — Reconcile Mock System Freeze Validation doc vs workflows — status: todo — branch: `bg/ci-011` — owner: ci
- [2025-08-10-fe-019](./tasks/2025-08-10-fe-019.md) — Frontend setup validation and API client/codegen usage — status: todo — branch: `bg/fe-019` — owner: fe
- [2025-08-10-qa-020](./tasks/2025-08-10-qa-020.md) — Initial QA plan and test mapping — status: todo — branch: `bg/qa-020` — owner: qa
- [2025-08-10-sec-017](./tasks/2025-08-10-sec-017.md) — CSP configuration validation (report-only) — status: todo — branch: `bg/sec-017` — owner: sec
- [2025-08-10-oauth-018](./tasks/2025-08-10-oauth-018.md) — Google Calendar integration validation (mocks vs live) — status: todo — branch: `bg/oauth-018` — owner: oauth
- [2025-08-10-api-022](./tasks/2025-08-10-api-022.md) — Backend runtime environment validation (zod) — status: todo — branch: `bg/api-022` — owner: api
<!-- OPS:HANDOFF-END -->

---

### SDLC Roadmap: Milestones and Epics

- **Purpose**: Capture high-level milestones and epics only. Scrum Master will later create sprints and stories from these.

#### Milestones
- **M1 — Platform Foundations**: FE/BE contract alignment, calendar endpoints, session groundwork, CI green, integration test reliability.
- **M2 — Core Product Ready**: Booking flows end-to-end (email, payments, calendar sync), environment validation, interface compliance.
- **M3 — Production Launch (eu-north-1)**: AWS infra (ECS/ECR, RDS, ALB, VPC, SES, Route53, TLS), CI/CD, domain & DNS, rollback.
- **M4 — Scale & Optimize**: Performance and caching, DB optimization, frontend UX performance, CDN/edge, file ops.
- **M5 — Compliance & Trust**: Security hardening, audit/monitoring, compliance features, CSP dashboards/alerts.
- **Cross‑Cutting**: Documentation/JSdoc, architecture docs, naming/code-quality standardization.

#### Epics Backlog (grouped by Milestone)

- **M1 — Platform Foundations**
  - Epic: Frontend–Backend Type and API Alignment — branch `feature/phase-1-frontend-backend-sync`
    - Involved: Frontend Specialist, API Specialist, QA Analyst
  - Epic: Calendar Endpoint Logic Completion — branch `feature/phase-2-calendar-endpoints`
    - Involved: API Specialist, OAuth Specialist, QA Analyst
  - Epic: Session Management Enhancements (DB-backed, revoke, cleanup) — branch `feature/phase-3-session-enhancements`
    - Involved: API Specialist, DB Specialist, Security Specialist, QA Analyst
  - Epic: Integration Test Coverage (functional scenarios) — branch `feature/phase-4-integration-coverage`
    - Involved: QA Analyst, API Specialist, Frontend Specialist, CI Specialist
  - Epic: CI Baseline & Policy (green dev baseline, drift checks) — branches `bg/ci-*`
    - Involved: CI Specialist, Scrum Master

- **M2 — Core Product Ready**
  - Epic: Booking Flow Completeness (emails, cancellations, refunds wiring)
    - Involved: API Specialist, Frontend Specialist, QA Analyst, Email/SES (DevOps Specialist)
  - Epic: Payments to Production (Stripe) — branch `feature/payment-production`
    - Involved: API Specialist, Security Specialist, DevOps Specialist, QA Analyst
  - Epic: Email to Production (SES) — branch `feature/email-production`
    - Involved: DevOps Specialist, API Specialist, QA Analyst
  - Epic: Environment Variable Validation — branch `feature/env-validation`
    - Involved: API Specialist, Security Specialist, CI Specialist
  - Epic: Interface Compliance Audit — branch `feature/interface-compliance`
    - Involved: Senior Dev Triage, API Specialist, QA Analyst

- **M3 — Production Launch (eu-north-1)**
  - Epic: Production Infrastructure (AWS‑first) — branch `feature/phase-6-production-infra`
    - Involved: DevOps Specialist, Security Specialist, Release Manager
  - Epic: Domain, DNS, TLS, SES deliverability
    - Involved: DevOps Specialist, Security Specialist
  - Epic: Release Management & Rollback Strategy
    - Involved: Release Manager, DevOps Specialist, QA Analyst

- **M4 — Scale & Optimize**
  - Epic: Performance & Caching — branch `feature/phase-5-performance-caching`
    - Involved: API Specialist, Frontend Specialist, DB Specialist
  - Epic: Database Optimization — branch `feature/database-optimization`
    - Involved: DB Specialist, API Specialist
  - Epic: Frontend CDN & Edge Caching — branch `feature/phase-9-frontend-cdn`
    - Involved: Frontend Specialist, DevOps Specialist, Security Specialist
  - Epic: File Operations Optimization — branch `feature/file-optimization`
    - Involved: API Specialist, DevOps Specialist

- **M5 — Compliance & Trust**
  - Epic: Security Audit Service (dashboards, alerts) — branch `feature/security-audit`
    - Involved: Security Specialist, API Specialist, DevOps Specialist
  - Epic: Security Hardening — branch `feature/security-hardening`
    - Involved: Security Specialist, DevOps Specialist
  - Epic: Compliance Implementation (e.g., GDPR) — branch `feature/compliance-implementation`
    - Involved: Security Specialist, Legal/Compliance (external), API Specialist
  - Epic: CSP Violation Handling (dashboard/alerts) — branch `feature/csp-violation-handling`
    - Involved: Security Specialist, Frontend Specialist, API Specialist

- **Cross‑Cutting**
  - Epic: Documentation & Knowledge Management — branches `feature/jsdoc-comments`, `feature/architecture-docs`, `feature/readme-updates`
    - Involved: Senior Dev Triage, Scrum Master, All Specialists
  - Epic: Code Quality & Naming Standardization — branch `feature/code-quality-standardization`
    - Involved: Senior Dev Triage, API Specialist, Frontend Specialist, QA Analyst

> Note: Stories and sprint tickets will be created by the Scrum Master based on these epics. Region default for infra is eu-north-1. Secrets source of truth: AWS Secrets Manager.
