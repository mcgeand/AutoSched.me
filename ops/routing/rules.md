# Routing Rules (Ticket → Owner)

Use this matrix to assign tickets to the correct specialist. Domain key controls branch name `bg/<domain>-NNN`, labels, and PR title prefix.

## Routing Matrix

| Category               | Domain key  | Primary owner            | Typical paths                                                               | PR title prefix |
| ---------------------- | ----------- | ------------------------ | --------------------------------------------------------------------------- | --------------- |
| Dev Experience (devex) | **senior**  | Senior Dev / Triage      | repo scripts, editor/format configs, lint setups, pre-commit, local DX docs | [SENIOR]        |
| CI pipeline            | **ci**      | CI Specialist            | `.github/workflows/**`, generated-reports/\*\*                              | [CI]            |
| Containers / local env | **docker**  | Docker/DevOps Specialist | Dockerfile*, docker-compose*.yml, `.dockerignore`, env docs                 | [DOCKER]        |
| Frontend UI            | **frontend-dev**      | Frontend Specialist      | `frontend/**` or `apps/web/**`, `packages/ui/**`                            | [FE]            |
| API/Server             | **backend-dev**     | API Specialist           | `backend/**` or `apps/api/**`, controllers/services                         | [API]           |
| Database               | **db**      | DB Specialist            | `prisma/**`, migrations/\*\*, seeds                                         | [DB]            |
| OAuth/Identity         | **oauth**   | OAuth Specialist         | backend oauth/auth handlers, calendar integrations                          | [OAUTH]         |
| Security               | **sec**     | Security Specialist      | lockfiles, secrets handling docs, auth middleware cfg                       | [SEC]           |
| UX Copy/Flows          | **ux**      | UX Specialist            | `frontend/**` (copy/micro-UI), error/empty states                           | [UX]            |
| Release mgmt           | **release** | Release Manager          | CHANGELOG, release notes/checklists                                         | [RELEASE]       |
| Ops meta               | **ops**     | Ops Updater / Scrum      | `/ops/**` docs only                                                         | [OPS]           |

### DevEx sub-routing (resolution order)

1. `.github/workflows/**` → **ci**
2. Dockerfile*, docker-compose*.yml, `.dockerignore` → **docker**
3. Frontend-only ESLint/Prettier configs under `frontend/**` → **frontend-dev**
4. Backend-only ESLint/Prettier configs under `backend/**` → **backend-dev**
5. Repo-wide ESLint/Prettier, editorconfig, lint-staged, Husky, VSCode settings, local DX scripts → **senior** (devex)
6. If mixed or unclear → **senior** creates split follow-up tickets per domain.

### Branching & Labels (derived)

- Feature branch = `bg/<domain>-NNN` (e.g., `bg/ci-004`)
- Target = `dev`
- PR title = `[<PREFIX>] <Short name> (<domain>-NNN)` using the matrix prefix
- Suggested labels = `<domain>`, `ticket`, plus `devex` when category=devex

---
