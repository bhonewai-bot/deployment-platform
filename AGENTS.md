<!-- BEGIN:nextjs-agent-rules -->

# This Is Not The Next.js You Remember

This project uses Next.js 16 App Router. APIs, conventions, routing behavior, and auth integration details may differ from older Next.js versions.

Before writing or moving code, read the relevant local docs in `node_modules/next/dist/docs/`, especially:

- `01-app/01-getting-started/02-project-structure.md`
- `01-app/01-getting-started/03-layouts-and-pages.md`
- `01-app/01-getting-started/05-server-and-client-components.md`
- `01-app/01-getting-started/07-mutating-data.md`
- `01-app/01-getting-started/15-route-handlers.md`
- `01-app/01-getting-started/16-proxy.md`
- `01-app/02-guides/authentication.md`
- `01-app/02-guides/backend-for-frontend.md`

Heed deprecation notices. For Next.js 16 auth protection, use `proxy.ts` terminology when route-level protection is needed.

<!-- END:nextjs-agent-rules -->

# Project Mission

This repository is becoming a production deployment platform, not a simple "paste repo URL and deploy" demo.

The main production flow is:

```text
Landing page -> sign in or sign up -> connect GitHub -> select authorized repo -> configure project -> create environment -> set secrets -> deploy -> track deployment run
```

The old manual GitHub URL input may remain only as an advanced public-repository fallback. Do not treat it as the primary production flow.

# Current Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Prisma 7
- Neon PostgreSQL
- Better Auth for email/password and GitHub social login
- Dokploy as the deployment execution backend
- Zod for runtime validation
- shadcn-style UI primitives

# Agent Operating Rules

- Read `CLAUDE.md`, `PRD.md`, `plan.md`, and docs under `docs/` before implementing.
- Prefer small PRD-scoped tasks over broad "make production ready" changes.
- Do not rewrite working flows unless the task explicitly asks for that migration.
- Keep server-only secrets and provider clients outside Client Components.
- Validate all route handler, server action, and form inputs with Zod.
- Always check ownership and authorization before reading or mutating user-owned resources.
- Do not add private GitHub repo deployment through a global token.
- Do not expose raw Dokploy, GitHub, Prisma, or Better Auth errors directly to users.
- Do not introduce new architecture patterns without updating the docs that guide Claude.

# Architecture Direction

Use one structure: feature-based product code plus shadcn UI primitives.

Rules:

- `app/` owns routes, layouts, route handlers, and route groups.
- `features/*` owns product UI, server actions, services, schemas, and local types.
- `components/ui/*` owns shadcn primitives only.
- `features/dashboard/components/*` owns dashboard layout, app shell, and sidebar composition.
- `lib/prisma.ts` owns the Prisma client.
- `shared/*` owns other true cross-feature infrastructure like env parsing, errors, security, and utility functions.
- Do not create new code under `server/providers`, `server/services`, `components/deployment`, or `types/index.ts`.

Target features:

- `auth`
- `github`
- `projects`
- `environments`
- `deployments`
- `secrets`
- `domains`
- `audit`
- `webhooks`

# Naming Rules

- Use kebab-case for folders and files: `deploy-form.tsx`, `create-project.schema.ts`.
- Use PascalCase for React components and Prisma models: `DeployForm`, `Project`.
- Use camelCase for variables and functions: `createProject`.
- Use lower-case route segments: `projects`, `deployments`, `sign-in`.
- Use `Project`, `Environment`, and `DeploymentRun` as the main domain names.
- Do not use `Deployment` to mean both a long-lived app and one deploy attempt.
- Keep schemas beside the feature that owns them.
- Do not use broad shared barrels like `types/index.ts`.

# Production Invariants

- Better Auth is the identity system.
- GitHub social login is for identity; GitHub App or explicit GitHub connection is the preferred long-term repo access model.
- A `Project` is long-lived and connected to one source repo.
- An `Environment` is a deploy target such as production, staging, or preview.
- A `DeploymentRun` is one attempt to deploy one commit.
- Secrets are encrypted, scoped, and never returned in plaintext.
- Browser polling is UI behavior only; backend state must eventually be updated by webhook, worker, or reconciliation.
- Deployment operations must be idempotent and concurrency-safe per project/environment.
- `app/page.tsx` is the public landing page. It should show login and sign-up actions when the user is signed out. It may redirect signed-in users to the dashboard.
- Dashboard routes must require a session.
- Public pages must not import server-only provider clients into Client Components.

# Verification

For documentation-only changes, run no build unless requested.

For code changes, use the narrowest useful checks:

```bash
npm run lint
npm run build
```

If Prisma schema changes are made, also run the appropriate Prisma generate/migrate command for the task and document migration impact.
