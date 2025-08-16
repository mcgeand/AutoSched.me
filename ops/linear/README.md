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

### Workflow Statuses

The AutoSched team uses the following standardized workflow statuses:

#### **Backlog Statuses**
- **Triage** - Initial state for new issues requiring prioritization and assignment

#### **Unstarted Statuses**  
- **Todo** - Ready to work, prioritized and assigned
- **Blocked** - Cannot proceed due to dependencies or external blockers

#### **Started Statuses**
- **In Progress** - Actively being worked on (enforce WIP limits: 1 per agent)
- **In Review** - Code/work completed, awaiting peer review
- **QA** - In quality assurance testing phase

#### **Completed Statuses**
- **Done** - Work completed and accepted

#### **Canceled Statuses**
- **Canceled** - Work discontinued or no longer needed
- **Duplicate** - Issue is duplicate of another issue

### Status Guidelines

- **Triage**: All new issues start here for Scrum Master prioritization
- **Todo**: Issues ready to be pulled into "In Progress" by assigned agents
- **In Progress**: Enforce WIP limits - maximum 1 issue per agent to maintain focus
- **In Review**: Trigger for code review process, PR review, or stakeholder approval
- **QA**: Issues requiring testing validation before completion
- **Blocked**: Use when dependencies prevent progress - document blocker in comments
- **Done**: Final state for successfully completed and accepted work

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

## Updating Milestones via Linear GraphQL API

- All milestone and issue updates should be performed using the official Linear GraphQL API for accuracy and auditability.
- Use the API key from `.env.local` (see 'Linear API Key Setup' above) for authenticated GraphQL calls.
- To associate an issue with a milestone, use the GraphQL mutation to update the issue’s `milestoneId` field with the correct UUID.
- Always resolve milestone IDs from the UUIDs listed above or from the Linear web UI (never by name alone).
- For milestone creation, updates, or assignment, refer to the [Linear GraphQL API documentation](https://developers.linear.app/docs/graphql/overview) for mutation examples and required fields.
- This ensures all changes are reflected in Linear as the source of truth and are compatible with automations and reporting.

## Milestone Assignment Automation

The script `assign-missing-milestones.sh` intelligently automates the process of assigning milestones to issues in Linear that do not have one. It analyzes issue content to determine the most appropriate milestone assignment. It is located in this directory and can be run as follows:

```
chmod +x assign-missing-milestones.sh
./assign-missing-milestones.sh
```

### Intelligent Assignment Logic

The script analyzes each issue's title, description, and labels to determine the most appropriate milestone from the M1 Platform Foundations milestones:

- **Core Backend APIs** (`ad332a2f-f981-4812-8104-86216948418c`): Issues containing keywords like backend, api, endpoint, prisma, database, session, auth, calendar, oauth, schema, migration
- **Frontend Integration** (`9587db4f-8120-493a-8877-fe207019b624`): Issues containing keywords like frontend, fe, ui, ux, react, component, interface, type alignment, client codegen
- **CI/CD & QA Baseline** (`70acfbbf-1fcf-4a85-a8a7-be660db22527`): Issues containing keywords like ci, cd, workflow, test, qa, integration test, pipeline, build, node version, dependency, baseline, drift
- **Infra Setup** (`a82d0c7b-083b-4ab5-9259-d38a56f6812e`): Issues containing keywords like docker, infra, infrastructure, aws, deployment, environment, env, secrets, production
- **Ops** (`fb15740e-d290-47af-807a-c25a5dc93441`): Issues containing keywords like ops, operations, documentation, readme, hub.md, linear, milestone, triage, handoff

### Process
- The script fetches all issues (up to 100 at a time) with detailed information including description and labels.
- For issues without milestones, it analyzes the content using pattern matching to determine the best fit.
- Issues already assigned to milestones are skipped and reported.
- The script provides detailed output showing the reasoning and outcome for each assignment.
- The script requires `jq` to be installed for JSON parsing.
- The Linear API key must be present in `.env.local` as `LINEAR_API_KEY`.

### Limitations
- Only works for the first 100 issues (can be extended for pagination).
- Currently focused on M1 Platform Foundations milestones (can be extended for M2-M5).
- Keyword matching is case-insensitive but relies on English text patterns.
- Will not update special Linear onboarding/demo issues (API limitation).

### Extending for Future Milestones
- Each milestone phase (M2-M5) may require different keyword patterns.
- The script can be extended to accept a milestone phase argument and use appropriate pattern sets.
- Future versions could include machine learning-based classification for more sophisticated content analysis.
