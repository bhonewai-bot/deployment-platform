# Integration Notes

These notes capture the external documentation assumptions for the current direction.

Use simple rules. Do not add a second pattern when one pattern already exists.

## Better Auth With Next.js

Current direction:

- Use Better Auth as the auth authority.
- Use its Next.js route handler under `app/api/auth/[...all]/route.ts`.
- Use email/password and GitHub social login.
- Use server-side session checks for protected data.
- Use `nextCookies()` for server actions that need auth cookie updates.
- `app/page.tsx` is public. It should show sign-in and sign-up actions for signed-out users.
- Dashboard routes must require a session.

Rules for agents:

- Do not hand-roll password auth.
- Do not bypass Better Auth session validation.
- Do not assume GitHub social login grants production repo deployment access.
- Do not place auth secrets or provider tokens in Client Components.

## Prisma With Better Auth

Current direction:

- Keep Better Auth models in Prisma: `User`, `Session`, `Account`, `Verification`.
- Preserve Better Auth-required fields unless an official migration requires a change.
- Add platform domain models alongside Better Auth models, not inside Better Auth models unless the relationship is explicit.

Rules for agents:

- Do not rename Better Auth tables casually.
- Do not remove indexes required for session or account lookup.
- Link platform-owned resources to `User`.
- Explain migration impact before changing `prisma/schema.prisma`.

## Neon With Prisma

Current direction:

- Use Neon PostgreSQL for production persistence.
- Use pooled connection for runtime.
- Use direct connection for schema migrations when required.
- Keep database URLs in env, not in source code.

Rules for agents:

- Do not reintroduce SQLite.
- Do not hardcode database URLs.
- Do not run destructive migrations without explicit approval.
- Add indexes for common owner/status/date lookups when adding tables.

## Next.js 16 App Router

Current direction:

- Use App Router routes and route handlers only.
- Use Server Components by default.
- Use Client Components only for interactive UI leaves.
- Use route groups for `(auth)` and `(dashboard)`.
- Use `proxy.ts` terminology for route protection redirects if implementing that layer.
- Follow the local official docs in `node_modules/next/dist/docs/`.
- Keep `app/page.tsx` as the public landing page.

Official local docs to read first:

- `01-app/01-getting-started/02-project-structure.md`
- `01-app/01-getting-started/03-layouts-and-pages.md`
- `01-app/01-getting-started/05-server-and-client-components.md`
- `01-app/01-getting-started/07-mutating-data.md`
- `01-app/01-getting-started/15-route-handlers.md`
- `01-app/01-getting-started/16-proxy.md`

Rules for agents:

- Read local Next.js docs under `node_modules/next/dist/docs/` before changing routing, auth protection, or data-fetching patterns.
- Keep route handlers thin.
- Do not treat route handlers as private just because the UI requires sign-in.
- Do not put a `route.ts` and `page.tsx` at the same route segment.
- Do not make a route page a Client Component unless the full page truly needs browser-only logic.

## Zod

Current direction:

- Use Zod for client form validation and server input validation.
- Keep schemas inside the feature that owns the input.
- Infer TypeScript types from schemas when possible.
- Validate environment variables with a shared env schema.

Rules for agents:

- Do not trust `request.json()` output.
- Do not trust Server Action `FormData`.
- Do not duplicate client and server validation rules by hand.
- Do not keep request types in `types/index.ts`.

## shadcn UI

Current direction:

- Use shadcn-style primitives in `components/ui/*`.
- Build dashboard layout and sidebar from those primitives.
- Keep product-specific UI in `features/*/components/*`.

Rules for agents:

- Do not add new plain Tailwind-only controls when a shadcn primitive should exist.
- Do not put deployment-specific components under `components/`.
- Do not put dashboard shell code inside every page.

## Dokploy

Current direction:

- Dokploy remains the deployment execution backend.
- The platform owns project/deployment state and audit history.
- Dokploy response shapes should be normalized in provider/service code.
- The Dokploy client should live in the deployment feature unless another feature needs it.

Rules for agents:

- Do not leak raw Dokploy responses to the UI.
- Do not assume domain creation is always successful.
- Do not create remote side effects before creating a local deployment run record.
- Add retry, timeout, and idempotency behavior when productionizing deployment triggers.
