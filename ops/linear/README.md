# Linear Project Management — AutoSched

## Scope and goals
- Use Linear as the single source of truth for work: issues, cycles, projects/epics, roadmap, dependencies, and risks.
- Keep GitHub PRs linked to Linear issues for traceability.

## Core fields
- Priority: P0, P1, P2
- Domain: fe, api, db, docker, oauth, ci, qa, sec, release, ux, senior, ops, devex
- Milestone: M1–M5 (matches `ops/hub.md` roadmap)
- Sprint: Cycle (1–2 weeks)
- Risk: R, Y, G
- Estimate: number

## Status flow
Triage → Todo → In Progress → In Review → QA → Done/Blocked

## Projects/Epics
- Organize larger initiatives as Linear Projects/Epics per milestone.
- Each Epic contains child issues spanning domains.
- Project Manager maintains status, target dates, and health.

## Cycles (Sprints)
- Enable Cycles in workspace settings.
- Scrum Master plans each cycle: selects issues by priority and capacity; confirms owners and dependencies.

## Issue template (paste into Linear description)
```
# Goal
One-sentence outcome.

# Inputs
- Code paths: …
- Docs: …
- Related: …

# Steps
1. …
2. …

# Acceptance Criteria
- [ ] …
- [ ] …

# Out of Scope
- …

# Notes / Risks
- …
```

## Referencing issues in PRs
- Include `Linear: <KEY>` (e.g., `Linear: AS-123`) in PR description.
- Prefer including the key in the PR title.

## Dependencies
- Use Linear issue relations: `blocks`, `blocked by`, `related to`.
- For cross-domain dependencies, create separate issues and relate them.

## Automations (via MCP)
- New PR mentioning an issue moves status to In Progress.
- CI failing on a PR moves issue to Blocked with a note.
- Merged PR moves issue to In Review or QA depending on team policy.

## Roles
- Product Owner: backlog quality, AC, acceptance.
- Project Manager: roadmap → issues/epics, cycles, risks, weekly report.
- Scrum Master: capacity, sprint planning, standups, blockers.
- Ops Updater: sync `ops/hub.md` to reflect Linear status.

## Conventions
- Naming: `[PREFIX] Short name (domain-NNN)` in PR titles; include Linear key.
- Labels: reuse `ops/routing/labels.md` values in Linear labels.
- Milestones: align with `ops/hub.md` M1–M5.
