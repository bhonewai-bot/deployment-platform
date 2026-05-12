# Deployment Platform

A production-oriented Next.js deployment control plane for deploying GitHub repositories to Dokploy.

This app should own identity, permissions, project configuration, deployment intent, history, and auditability. Dokploy remains the execution backend for build and runtime orchestration.

## Production Product Direction

Primary flow:

```text
Landing page -> sign in or sign up -> connect GitHub -> select authorized repo -> create project -> configure environment -> deploy -> track deployment run
```

Manual GitHub URL import may stay as an advanced fallback for public repositories, but it is no longer the primary production flow.

## Current Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Prisma 7
- Neon PostgreSQL
- Better Auth
- Zod
- Dokploy API
- shadcn-style UI primitives

## Core Concepts

- `User`: signed-in platform user.
- `Project`: long-lived deployable app linked to a GitHub repository.
- `Environment`: deploy target such as production, staging, or preview.
- `DeploymentRun`: one attempt to deploy one commit to one environment.
- `ProjectSecret`: encrypted environment variable scoped to project/environment.
- `Domain`: public URL mapped to an environment.
- `AuditEvent`: record of important user or system actions.
- `WebhookEvent`: inbound provider event processed idempotently.

## Product Boundaries

This is not a generic PaaS.

The platform should focus first on:

- signed-in users
- GitHub repository import through explicit permission
- Dockerfile deployments
- static deployments with explicit publish directory
- Dokploy as the single execution backend
- Prisma + Neon + PostgreSQL persistence
- deployment history and status tracking

The platform should avoid:

- private repo deployment through a global server token
- broad framework auto-detection before the core workflow is stable
- storing secrets as plain form fields
- relying on browser polling as the only status update mechanism
- coupling UI directly to raw Dokploy response shapes

## Target Architecture

Use feature-based organization:

```text
app/          route groups, pages, layouts, route handlers
features/     product code by feature
components/ui shadcn primitives only
lib/prisma.ts Prisma client
shared/       env, errors, security, utilities
config/       typed constants
docs/         agent and architecture guidance
```

See [docs/architecture/nextjs-feature-structure.md](/Users/appleclub/Documents/Professional%20Product%20Lab/deployment-platform/docs/architecture/nextjs-feature-structure.md) for the full target structure.

Do not add new code to `server/providers`, `server/services`, `components/deployment`, or `types/index.ts`.

## Naming And Validation

- use kebab-case for files and folders
- use PascalCase for React components and Prisma models
- use camelCase for functions and variables
- use `Project`, `Environment`, and `DeploymentRun` as the main domain names
- use Zod for both client and server validation
- keep Zod schemas inside the feature that owns the input
- infer types from Zod schemas when possible

## UI Direction

Use shadcn-style UI.

- shared primitives live in `components/ui/*`
- dashboard shell and sidebar live in `features/dashboard/components/*`
- deployment forms and logs live in `features/deployments/components/*`
- pages should compose feature components, not own large UI flows

`app/page.tsx` is the public landing page. Signed-out users should see sign-in and sign-up actions. Signed-in users may be sent to the dashboard.

## Environment Variables

Expected server environment:

```env
DATABASE_URL=
DIRECT_URL=

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

DOKPLOY_URL=
DOKPLOY_KEY=
DOKPLOY_ENVIRONMENT_ID=
```

Do not commit real `.env` values.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Handoff Docs

- [AGENTS.md](/Users/appleclub/Documents/Professional%20Product%20Lab/deployment-platform/AGENTS.md)
- [CLAUDE.md](/Users/appleclub/Documents/Professional%20Product%20Lab/deployment-platform/CLAUDE.md)
- [PRD.md](/Users/appleclub/Documents/Professional%20Product%20Lab/deployment-platform/PRD.md)
- [plan.md](/Users/appleclub/Documents/Professional%20Product%20Lab/deployment-platform/plan.md)
- [docs/agents/claude-workflow.md](/Users/appleclub/Documents/Professional%20Product%20Lab/deployment-platform/docs/agents/claude-workflow.md)
- [docs/architecture/production-domain.md](/Users/appleclub/Documents/Professional%20Product%20Lab/deployment-platform/docs/architecture/production-domain.md)
- [docs/architecture/integration-notes.md](/Users/appleclub/Documents/Professional%20Product%20Lab/deployment-platform/docs/architecture/integration-notes.md)
