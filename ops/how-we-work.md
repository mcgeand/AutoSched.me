## Workflow

1. Hub triages tickets and sets Today’s Objectives.
2. Trigger specialists with short commands (e.g., `/fe`, `/api`, `/db`).
3. Specialists deliver PRs/tests/docs, then handoff back to Hub.
4. Hub updates Decision Log and Handoff Queue; opens/links GitHub Issues.

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

## GitHub Issues Integration

- Each ticket maps to a GitHub Issue. Link the Issue ID in `ops/hub.md` and PR titles.
- Use labels above. Close Issues via PR with "Fixes #<id>".

## Prompt Contracts (Specialists)

- Start from provided ticket + Inputs; do not expand scope.
- Maintain or improve test coverage; update mocks and scripts when code changes.
- No secrets in code; prefer AWS Secrets Manager for configuration.
- Keep changes small, reversible, and behind a branch. Provide a crisp summary and risks.
- If the API contract changes: update OpenAPI and run `npm run gen:openapi` and `npm run gen:api-types`.
