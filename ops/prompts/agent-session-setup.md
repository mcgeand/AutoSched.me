# AutoSched Background Agent Session Setup — Full Prompts Included

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

## QA Analyst — ops/prompts/qa.md

Role: Verify acceptance criteria and regressions.

Trigger: `review tickets`

ATTACHMENTS:
- ops/prompts/qa.md
- ops/specialists/qa.md

---

## CI/CD Specialist — ops/prompts/ci-cd.md

Role: Keep CI reliable and fast; no unfamiliar workflows.

Trigger: `run ticket: ci-cd-###`

ATTACHMENTS:
- ops/prompts/ci-cd.md
- ops/specialists/ci-cd.md

---

## Frontend Developer — ops/prompts/frontend-dev.md

Trigger: `run ticket: frontend-dev-###`

ATTACHMENTS:
- ops/prompts/frontend-dev.md
- ops/specialists/frontend-dev.md

---

## Backend Developer — ops/prompts/backend-dev.md

Trigger: `run ticket: backend-dev-###`

ATTACHMENTS:
- ops/prompts/backend-dev.md
- ops/specialists/backend-dev.md

---

## Database Specialist — ops/prompts/db.md

Trigger: `run ticket: db-###`

ATTACHMENTS:
- ops/prompts/db.md
- ops/specialists/db.md

---

## DevOps Specialist — ops/prompts/devops.md

Trigger: `run ticket: devops-###`

ATTACHMENTS:
- ops/prompts/devops.md
- ops/specialists/devops.md

---

## OAuth/Security Specialist — ops/prompts/oauth-security.md

Trigger: `run ticket: oauth-security-###`

ATTACHMENTS:
- ops/prompts/oauth-security.md
- ops/specialists/oauth-security.md

---

## Security Specialist — ops/prompts/security.md

Trigger: `run ticket: security-###`

ATTACHMENTS:
- ops/prompts/security.md
- ops/specialists/security.md

---

## Release Manager — ops/prompts/release.md

Trigger: `prepare release`

ATTACHMENTS:
- ops/prompts/release.md
- ops/specialists/release.md

---

## UX Specialist — ops/prompts/ux.md

Trigger: `run ticket: ux-###`

ATTACHMENTS:
- ops/prompts/ux.md
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
- QA Specialist → `review tickets`
- CI/CD Specialist → `run ticket: ci-cd-###`
- Frontend Developer → `run ticket: frontend-dev-###`
- Backend Developer → `run ticket: backend-dev-###`
- Database Specialist → `run ticket: db-###`
- DevOps Specialist → `run ticket: devops-###`
- OAuth/Security Specialist → `run ticket: oauth-security-###`
- Security Specialist → `run ticket: security-###`
- Release Manager → `prepare release`
- UX Specialist → `run ticket: ux-###`
- Product Owner → `plan roadmap` / `groom backlog` / `refine ticket: ###` / `accept ticket: ###` / `write AC: ###`

---

## Project Manager — ops/prompts/project-manager.md

Role: Translate PRD to delivery plan across teams; track schedule, risks, and dependencies.

Triggers: `plan delivery`, `update project`, `report delivery`, `risk review`

ATTACHMENTS:
- ops/prompts/project-manager.md
- ops/specialists/project-manager.md

---

Addendum: Product Owner Notes (2025-08-10)
- Use Given/When/Then AC; include non-functional (a11y, performance).
- Keep outcomes testable; avoid implementation directives.
- Coordinate scope changes with Scrum Master and Senior Dev Triage.