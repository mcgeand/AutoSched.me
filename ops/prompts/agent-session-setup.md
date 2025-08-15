# EasyBook Background Agent Session Setup — Full Prompts Included

This file contains complete `ops/prompts/*.md` text for all defined roles. Use this to onboard background agents consistently in Cursor.

---

## Ops Updater — ops/prompts/ops-updater.md

Role: Keep all ticket files and hub lists accurate and up to date.

Trigger: `update tickets`

ATTACHMENTS:
- ops/prompts/ops-updater.md
- ops/specialists/ops-updater.md

---

## Scrum Master — ops/prompts/scrum-master.md

Role: Ensure nothing is stalled and tickets have correct owners.

Triggers: `plan sprint`, `assign tickets`, `standup`, `triage backlog`, `report`

ATTACHMENTS:
- ops/prompts/scrum-master.md
- ops/specialists/scrum-master.md

---

## Senior Dev Triage — ops/prompts/senior-dev-triage.md

Role: Identify dependencies, missing work, and create fallout tickets.

Trigger: `triage tickets`

ATTACHMENTS:
- ops/prompts/senior-dev-triage.md
- ops/specialists/senior-dev-triage.md

---

## QA Analyst — ops/prompts/qa-analyst.md

Role: Verify acceptance criteria and regressions.

Trigger: `review tickets`

ATTACHMENTS:
- ops/prompts/qa-analyst.md
- ops/specialists/qa.md

---

## CI Specialist — ops/prompts/ci-specialist.md

Role: Keep CI reliable and fast; no unfamiliar workflows.

Trigger: `run ticket: ci-###`

ATTACHMENTS:
- ops/prompts/ci-specialist.md
- ops/specialists/ci.md

---

## Frontend Specialist — ops/prompts/frontend-specialist.md

Trigger: `run ticket: fe-###`

ATTACHMENTS:
- ops/prompts/frontend-specialist.md
- ops/specialists/fe.md

---

## API Specialist — ops/prompts/api-specialist.md

Trigger: `run ticket: api-###`

ATTACHMENTS:
- ops/prompts/api-specialist.md
- ops/specialists/api.md

---

## Database Specialist — ops/prompts/db-specialist.md

Trigger: `run ticket: db-###`

ATTACHMENTS:
- ops/prompts/db-specialist.md
- ops/specialists/db.md

---

## DevOps Specialist — ops/prompts/devops-specialist.md

Trigger: `run ticket: devops-###`

ATTACHMENTS:
- ops/prompts/devops-specialist.md
- ops/specialists/docker.md

---

## OAuth Specialist — ops/prompts/oauth-specialist.md

Trigger: `run ticket: oauth-###`

ATTACHMENTS:
- ops/prompts/oauth-specialist.md
- ops/specialists/oauth.md

---

## Security Specialist — ops/prompts/security-specialist.md

Trigger: `run ticket: sec-###`

ATTACHMENTS:
- ops/prompts/security-specialist.md
- ops/specialists/security.md

---

## Release Manager — ops/prompts/release-manager.md

Trigger: `prepare release`

ATTACHMENTS:
- ops/prompts/release-manager.md
- ops/specialists/release.md

---

## UX Specialist — ops/prompts/ux-specialist.md

Trigger: `run ticket: ux-###`

ATTACHMENTS:
- ops/prompts/ux-specialist.md
- ops/specialists/ux.md

---

## Product Owner — ops/prompts/product-owner.md

Role: Define outcomes, maintain backlog quality, and accept completed work.

Triggers: `plan roadmap`, `groom backlog`, `refine ticket: <ticket-id>`, `accept ticket: <ticket-id>`, `write AC: <ticket-id>`

ATTACHMENTS:
- ops/prompts/product-owner.md
- ops/specialists/product-owner.md

---

# Quick Trigger Cheat Sheet

- Ops Updater → `update tickets`
- Scrum Master → `plan sprint` / `assign tickets` / `standup` / `triage backlog` / `report`
- Senior Dev Triage → `triage tickets`
- QA Analyst → `review tickets`
- CI Specialist → `run ticket: ci-###`
- FE Specialist → `run ticket: fe-###`
- API Specialist → `run ticket: api-###`
- DB Specialist → `run ticket: db-###`
- DevOps Specialist → `run ticket: devops-###`
- OAuth Specialist → `run ticket: oauth-###`
- Security Specialist → `run ticket: sec-###`
- Release Manager → `prepare release`
- UX Specialist → `run ticket: ux-###`
- Product Owner → `plan roadmap` / `groom backlog` / `refine ticket: ###` / `accept ticket: ###` / `write AC: ###`

---

Addendum: Product Owner Notes (2025-08-10)
- Use Given/When/Then AC; include non-functional (a11y, performance).
- Keep outcomes testable; avoid implementation directives.
- Coordinate scope changes with Scrum Master and Senior Dev Triage.