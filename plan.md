# Production Implementation Plan

## Principle

Build this as a production control plane in small phases.

Do not ask an AI agent to "make it production ready" in one pass. Give Claude one bounded phase at a time, require a migration explanation before schema changes, and require verification after each phase.

## Phase 0: Documentation And Architecture Alignment

Status: current phase.

- [x] Define production product direction.
- [x] Define Claude/agent operating rules.
- [x] Define target feature-based Next.js structure.
- [x] Define production domain model.
- [x] Define naming convention.
- [x] Define Zod validation standard.
- [x] Define shadcn UI standard.
- [ ] Review these docs before implementation starts.

## Phase 1: Auth Foundation

Goal: make identity real before expanding deployment features.

- Configure Better Auth email/password.
- Configure Better Auth GitHub social login.
- Make `app/page.tsx` a public landing page with sign-in and sign-up actions.
- Add dashboard protection for signed-in users.
- Add server-side session helpers.
- Ensure auth routes use the official Next.js Better Auth handler.
- Use `nextCookies()` when server actions need to set cookies.
- Keep auth implementation isolated under the auth feature and shared auth server helpers.

Acceptance:

- User can sign up, sign in, sign out.
- Signed-out user sees the landing page first.
- Dashboard is not accessible without a valid session.
- Server actions and route handlers can reliably get the current user.

## Phase 1.5: Structure And Validation Standard

Goal: stop the mixed structure before adding more product code.

- Move auth code toward `features/auth`.
- Move dashboard shell and sidebar toward `features/dashboard/components`.
- Move deployment UI from `components/deployment` to `features/deployments/components`.
- Move deployment server code from `server/services` and `server/providers` to `features/deployments/server`.
- Keep Prisma client in `lib/prisma.ts`.
- Move shared errors and utilities into `lib/errors` and `lib/utils`.
- Replace `types/index.ts` with feature-local `types.ts` files or Zod-inferred types.
- Add Zod schemas for current import and deployment inputs.

Acceptance:

- No new code is added to old mixed folders.
- Client and server validation use the same Zod schemas where practical.
- Imports still pass lint/build after each moved feature.

## Phase 2: Production Data Model

Goal: replace the single prototype `Deployment` concept with production ownership and history.

- Add `Project`.
- Add `Environment`.
- Add `DeploymentRun`.
- Add `ProjectSecret`.
- Add `Domain`.
- Add `AuditEvent`.
- Add `WebhookEvent`.
- Add `GitHubConnection` or document why the first implementation uses Better Auth `Account`.
- Link every user-owned model to `User`.
- Add indexes for ownership, lookup, status, and created date queries.

Acceptance:

- Schema explains ownership clearly.
- Existing prototype deployment behavior is either preserved or intentionally migrated.
- Claude explains migration impact before applying Prisma changes.

## Phase 3: GitHub Connection And Repo Import

Goal: make repo import permission-aware.

- Use GitHub social identity for account association.
- Prefer GitHub App installation for repo access if implemented now.
- If OAuth repo access is used first, document scopes and limitations.
- Add authorized repo list.
- Keep manual GitHub URL import as advanced public-repo fallback.
- Validate repo access before project creation.

Acceptance:

- Main CTA is `Connect GitHub`.
- User selects from repos they are allowed to access.
- Manual URL flow is visibly secondary and public-only.

## Phase 4: Project And Environment Setup

Goal: create stable deployable configuration before triggering deploys.

- Create project setup flow.
- Add branch selection.
- Add root directory selection for monorepos.
- Add deployment mode selection.
- Add Dockerfile path/container port fields.
- Add static publish directory field.
- Add environment creation for production/staging.

Acceptance:

- A project exists before any deployment run.
- Environment-specific settings are stored and editable.
- Detection is advisory and user-confirmed.

## Phase 5: Secrets Management

Goal: stop treating env vars as disposable form fields.

- Store project/environment secrets separately.
- Encrypt secrets before production.
- Never return saved secret values to the client.
- Support secret create/update/delete.
- Mask existing secrets in UI.
- Audit secret mutations.

Acceptance:

- Deployment can use saved secrets.
- Secrets cannot be read back from the browser.
- Logs and errors do not leak secret values.

## Phase 6: Deployment Runs And Dokploy Orchestration

Goal: make each deploy a durable, auditable run.

- Create `DeploymentRun` before remote side effects.
- Add idempotency key.
- Serialize or reject concurrent runs per project/environment.
- Configure or reuse Dokploy application.
- Save Git/build/env/domain settings.
- Trigger Dokploy deployment.
- Persist status transitions.
- Store safe error messages.

Acceptance:

- Remote deploy cannot succeed invisibly without a local run record.
- Duplicate requests do not create duplicate broken state.
- The deployment list shows historical runs, not only current app records.

## Phase 7: Status, Webhooks, And Reconciliation

Goal: make backend status independent from an open browser.

- Add Dokploy status reconciliation job or scheduled task if webhook is unavailable.
- Add GitHub webhook receiver for push-triggered deployments.
- Store webhook events idempotently.
- Update deployment run status from backend processing.
- Keep UI polling only for display refresh.

Acceptance:

- Closing the browser does not leave runs stuck forever.
- Duplicate webhook deliveries are safe.
- Push-triggered deploys can be enabled per project/environment.

## Phase 8: Production Hardening

Goal: make the system presentable to a senior reviewer.

- Add rate limiting.
- Add structured logs and safe error mapping.
- Add audit views or audit queries.
- Add tests for auth, ownership, validation, and deployment orchestration.
- Add deployment failure playbook.
- Add rollback design document before implementing rollback.

Acceptance:

- The system has clear security boundaries.
- The architecture explains why each component exists.
- The code is reviewable by feature and domain concept.

## Claude Prompt Pattern

Use prompts like this:

```text
Read AGENTS.md, CLAUDE.md, PRD.md, plan.md, and docs/architecture/nextjs-feature-structure.md.

Implement Phase N only: <phase name>.

Before editing, explain:
- files likely affected
- schema migration impact, if any
- risks
- verification commands

After editing, run verification and summarize changed files.
Do not implement later phases.
```

## Do Not Let Claude Do These Yet

- Do not auto-detect every framework.
- Do not add team billing.
- Do not add private repo deployment with a global token.
- Do not store plaintext secrets as normal env var rows.
- Do not put new product code under generic `lib/`, `server/services`, `server/providers`, or `types/index.ts`.
- Do not couple UI components directly to Dokploy response shapes.
