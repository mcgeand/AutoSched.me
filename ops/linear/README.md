# Linear Project Management — AutoSched

## Linear API Key Setup

- The Linear API Key required for GraphQL access must be stored in a local environment file named `.env.local` at the project root.
- Add the following line to your `.env.local` file:

  ```
  LINEAR_API_KEY=your_linear_api_key_here
  ```

- This file is git-ignored and should **not** be committed to version control.
- The API key is used for all authenticated Linear GraphQL operations.

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

## Milestone Setup in Linear

- Always use the official Linear Project Milestone object for tracking progress and associating issues.
- Never create an issue called “milestone”; only use the official milestone object.
- Assign issues to milestones by their UUID, not by name, to avoid ambiguity.
- Milestone UUIDs (from ops/linear/README.md and ops/hub.md):

  - Core Backend APIs: `ad332a2f-f981-4812-8104-86216948418c`
  - Frontend Integration: `9587db4f-8120-493a-8877-fe207019b624`
  - CI/CD & QA Baseline: `70acfbbf-1fcf-4a85-a8a7-be660db22527`
  - Infra Setup: `a82d0c7b-083b-4ab5-9259-d38a56f6812e`
  - Ops: `fb15740e-d290-47af-807a-c25a5dc93441`

- To create or reference a milestone in Linear:
  1. Go to Projects → Add Milestone.
  2. Use the UUID from the list above for the correct milestone.
  3. When associating issues, use the milestone’s UUID field.
  4. For links and more details, see `ops/linear/README.md` and `ops/hub.md`.
