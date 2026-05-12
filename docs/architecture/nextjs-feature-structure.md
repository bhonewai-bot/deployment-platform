# Next.js Feature Structure

This document defines the target folder structure.

It follows the local Next.js 16 docs in `node_modules/next/dist/docs/`.

- `app/` owns routes, layouts, route handlers, and route groups.
- route groups like `(auth)` and `(dashboard)` organize routes without changing the URL.
- folders in `app/` become public routes only when they contain `page.tsx` or `route.ts`.
- Server Components are default.
- Client Components should be small interactive leaves.
- Route Handlers live only in `app/`.
- A `route.ts` file must not live at the same route segment as `page.tsx`.

## Target Structure

```text
app/
  layout.tsx
  page.tsx                 # public landing page
  not-found.tsx
  styles/
    globals.css
  (auth)/
    sign-in/
      page.tsx
    sign-up/
      page.tsx
  (dashboard)/
    layout.tsx
    page.tsx
    projects/
      page.tsx
      [projectId]/
        page.tsx
        settings/
          page.tsx
        environments/
          [environmentId]/
            page.tsx
        deployments/
          [deploymentRunId]/
            page.tsx
  api/
    auth/
      [...all]/
        route.ts
    github/
      repositories/
        route.ts
      installations/
        route.ts
    projects/
      route.ts
    deployments/
      route.ts
    webhooks/
      github/
        route.ts
      dokploy/
        route.ts

features/
  auth/
    components/
    server/
    schemas/
    types.ts
  dashboard/
    components/
  github/
    components/
    server/
    schemas/
    types.ts
  projects/
    components/
    server/
    schemas/
    types.ts
  environments/
    components/
    server/
    schemas/
    types.ts
  deployments/
    components/
    server/
    schemas/
    types.ts
  secrets/
    components/
    server/
    schemas/
    types.ts
  domains/
    components/
    server/
    schemas/
    types.ts
  audit/
    server/
    schemas/
    types.ts
  webhooks/
    server/
    schemas/
    types.ts

components/
  ui/                      # shadcn primitives only

lib/
  prisma.ts                # Prisma client

shared/
  env/
    env.ts
    env.schema.ts
  errors/
    app-error.ts
    map-error.ts
  security/
    encryption.ts
    rate-limit.ts
  utils/
    cn.ts

config/
  deployment.ts

prisma/
  schema.prisma
  migrations/

docs/
  agents/
  architecture/
```

## Source Of Truth Rule

Use one home for each kind of code.

- no `components/deployment/*`; use `features/deployments/components/*`
- no `server/providers/*`; put provider clients in the feature that owns them
- no `server/services/*`; put services in `features/*/server/*`
- no `types/index.ts`; use `features/*/types.ts` or schema-inferred types
- no broad `lib/*` for product code; `lib/prisma.ts` is the allowed exception

## Ownership Rules

| Folder                          | Owns                                                 | Does Not Own              |
| ------------------------------- | ---------------------------------------------------- | ------------------------- |
| `app/`                          | routes, layouts, route handlers, page composition    | business logic            |
| `features/*/components`         | feature UI                                           | shared primitives         |
| `features/*/server`             | feature actions, services, queries, provider clients | route files               |
| `features/*/schemas`            | Zod schemas for that feature                         | env schemas               |
| `features/dashboard/components` | dashboard shell, sidebar, app navigation             | shadcn primitive source   |
| `components/ui`                 | shadcn primitives                                    | product-specific behavior |
| `shared/env`                    | typed env parsing                                    | feature input validation  |
| `shared/errors`                 | error classes and safe error mapping                 | raw provider errors in UI |
| `lib/prisma.ts`                 | Prisma client                                        | feature-specific queries  |
| `config`                        | typed constants                                      | secrets                   |

## Route Handler Rule

Route handlers are public HTTP endpoints. Keep them thin:

```text
parse request -> validate session -> validate input -> call feature service -> return safe response
```

Do not put Dokploy orchestration, GitHub parsing, or database workflows directly inside `route.ts`.

## Server Action Rule

Server Actions may be used for forms, but they still need:

- session validation
- authorization
- Zod input validation
- safe error mapping
- feature service delegation

Server Actions are reachable by direct POST requests. Do not trust them just because they are called from the UI.

## Client Component Rule

Only add `"use client"` when the component needs state, event handlers, effects, browser APIs, or client hooks.

Do not make full pages, dashboards, or large layouts Client Components just because one button is interactive. Extract the interactive part.

## Landing Page Rule

`app/page.tsx` is the public landing page.

It should:

- show the product name and main value
- show sign-in and sign-up actions when the user is signed out
- redirect or link signed-in users to the dashboard
- not render the dashboard directly
- not require the dashboard sidebar

Dashboard pages belong under `app/(dashboard)`.

## UI Rule

This project uses shadcn-style UI.

- put reusable UI primitives in `components/ui/*`
- build feature screens with those primitives
- do not build product UI from plain Tailwind-only one-off controls when a shadcn primitive exists
- keep dashboard shell and sidebar composition in `features/dashboard/components/*`
- keep feature-specific forms, tables, cards, and logs inside the feature

## Zod Rule

Use Zod for client and server validation.

- put schemas in `features/*/schemas/*`
- export input and output types with `z.infer`
- reuse the same schema in form validation and server validation when possible
- validate route handler JSON before calling services
- validate Server Action `FormData` after converting it to a plain object
- validate env variables in `shared/env/env.schema.ts`

Example:

```ts
// features/deployments/schemas/create-deployment-run.schema.ts
import { z } from "zod";

export const createDeploymentRunSchema = z.object({
  projectId: z.string().min(1),
  environmentId: z.string().min(1),
  branch: z.string().min(1),
});

export type CreateDeploymentRunInput = z.infer<
  typeof createDeploymentRunSchema
>;
```

## Migration From Current Structure

Migrate one feature at a time.

| Current                         | Target                                               |
| ------------------------------- | ---------------------------------------------------- |
| `lib/auth.ts`                   | `features/auth/server/auth.ts`                       |
| `lib/auth-client.ts`            | `features/auth/client.ts`                            |
| `lib/prisma.ts`                 | keep as `lib/prisma.ts`                              |
| `lib/errors.ts`                 | `shared/errors/*`                                    |
| `lib/utils.ts`                  | `shared/utils/cn.ts`                                 |
| `server/services/github.ts`     | `features/github/server/*`                           |
| `server/services/deployment.ts` | `features/deployments/server/*`                      |
| `server/providers/dokploy.ts`   | `features/deployments/server/dokploy-client.ts`      |
| `components/deployment/*`       | `features/deployments/components/*`                  |
| `components/layout/sidebar.tsx` | `features/dashboard/components/sidebar.tsx`          |
| `app/actions/github.ts`         | `features/github/server/import-repository.action.ts` |
| `types/index.ts`                | `features/*/types.ts` or schema-inferred types       |

## Naming Standards

- use kebab-case for files and folders
- use PascalCase for React components and Prisma models
- use camelCase for functions and variables
- use lower-case route segments
- name Server Action files with `.action.ts`
- name Zod schema files with `.schema.ts`
- keep provider wrappers explicit, for example `dokploy-client.ts`
- use `Project`, `Environment`, and `DeploymentRun` in domain code
- do not use `Deployment` to mean both a long-lived app and one deploy attempt

## What Claude Should Do Before Moving Files

1. Identify the feature being migrated.
2. List current files and target files.
3. Check imports and route references.
4. Move only files required for the phase.
5. Run lint or build after import-path changes.
6. Update this document if a new pattern becomes standard.
