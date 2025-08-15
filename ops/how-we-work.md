## Workflow

1. Hub triages tickets and sets Today’s Objectives.
2. Trigger specialists with short commands (e.g., `/fe`, `/api`, `/db`).
3. Specialists deliver PRs/tests/docs, then handoff back to Hub.
4. Hub updates Decision Log and Handoff Queue; opens/links Linear Issues.

## Ticket Template

### Ticket Template (copy into /ops/tasks/YYY-MM-DD-<domain>-NNN.md)

```md
---
id: 2025-08-10-<domain>-<NNN>
domain: <domain> # fe | api | db | docker | oauth | ci | qa | sec | release | ux | senior
owner: agent # or a name/github handle
branch: bg/<domain>-<NNN>
pr: '' # set when PR opens
status: todo # todo | in_progress | review | done | blocked
updated_at: '' # ISO timestamp
handoff: '' # optional: next domain id(s), e.g., "fe-002"
---

# <DOMAIN>-<NNN>: <Short name>

## Goal

One sentence outcome.

## Inputs

- Code paths: …
- Docs: …
- Related: …

## Steps (suggested)

1. …
2. …

## Acceptance Criteria

- [ ] …
- [ ] …

## Out of Scope

- …

## Notes / Risks

- …

## Result

(Agent fills on completion: Outcome PASS/FAIL/BLOCKED, Evidence links, Follow-ups)
```

## Handoff Protocol

- Create/confirm ticket with clear next owner.
- Record decisions in `ops/hub.md` Decision Log.
- Attach links: PRs, CI runs, logs, screenshots.
- Timebox: if blocked >30m, escalate via `/triage`.

## Labels

- area-fe, area-api, area-db, area-docker, area-oauth, area-ci, area-qa, area-security, area-release, area-ux, area-triage
- type-bug, type-chore, type-feature, type-refactor, type-docs
- priority-p0, priority-p1, priority-p2
- agent:Frontend Dev, agent:Backend Dev, agent:DB, agent:OAuth/Security, agent:CI/CD, agent:QA, agent:DevOps, agent:UX, agent:Product/PM, agent:Release

## Linear Integration & Process

- Each ticket maps to a Linear Issue. Link the Issue ID in `ops/hub.md` and PR titles.
- Use labels above. Reference Linear issues in PRs for traceability (e.g., "Linear: AS-123").

### Project management in Linear

- Work item = Linear Issue. Statuses flow: Triage → Todo → In Progress → In Review → QA → Done/Blocked.
- Fields: Priority (P0/P1/P2), Estimate, Domain (fe, api, db, docker, oauth, ci, qa, sec, release, ux, senior, ops), Agent (via labels `agent:*`), Milestone (M1–M5), Risk (R/Y/G).

# How We Work (AutoSched)

## Branching
- Create branches from `dev`
- Naming: `user/AS-123-short-slug` (e.g., `danny/AS-142-recurring-exceptions`)
- Alt: `feature/AS-123-…`, `fix/AS-123-…`, `chore/AS-123-…`

## Commits (Conventional)
- `feat(api): add recurring exception rules (AS-142)`
- `fix(web): correct DST rendering on booking grid (AS-166)`
- Include Linear key in title or body (AS-### or AUT-###).

## Pull Requests
- Title: `[feat|fix|chore|docs|refactor] short summary (AS-###)`
- Body: What/Why, screenshots/logs (if UI/bugfix), `Linear: AS-###`
- All checks must pass; branches auto-deleted on merge

## Status Flow
Triage → Todo → In Progress → In Review → QA → Done

Blocked is manual; unblock returns to Todo or In Progress

## Projects (Focus-based)
- Use Projects M1–M5 instead of time cycles
- Assign each issue to the appropriate Project

## Agent (Virtual Owner)
- Use labels to denote virtual owner role: `agent:*` (Frontend Dev, Backend Dev, DB, OAuth/Security, CI/CD, QA, DevOps, UX, Product/PM, Release)
- Real assignee remains Danny; `agent:*` indicates virtual owner role

## Linking
- PRs must mention the Linear issue key (AS-### or AUT-###)
- Automations keep PR/CI state ↔ Linear status in sync
- Cycles: 1–2 week sprints; enabled in the Linear workspace and referenced in Issues.
- Roadmap/Epics: Use Projects/Epics to group Issues per milestone; PjM maintains.
- Automations: New PR referencing an Issue moves it to In Progress; merged PR moves to In Review; CI failures set Blocked (via MCP integration where available).

### Roles in Linear

- Product Owner: backlog grooming, AC, acceptance.
- Project Manager: roadmap → Issues/Epics, cycles, dependency/risk tracking, weekly report.
- Scrum Master: capacity, sprint plan, standups, blocker routing.
- Ops Updater: keeps `ops/hub.md` aligned with Linear via MCP.

## Prompt Contracts (Specialists)

- Start from provided ticket + Inputs; do not expand scope.
- Maintain or improve test coverage; update mocks and scripts when code changes.
- No secrets in code; prefer AWS Secrets Manager for configuration.
- Keep changes small, reversible, and behind a branch. Provide a crisp summary and risks.
- If the API contract changes: update OpenAPI and run `npm run gen:openapi` and `npm run gen:api-types`.
