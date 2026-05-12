# Claude Workflow Guide

This guide tells Claude how to work in this Next.js deployment platform.

Claude should work from clear product phases, not vague production-readiness prompts.

## Standard Task Workflow

1. Read context:
   - `AGENTS.md`
   - `CLAUDE.md`
   - `PRD.md`
   - `plan.md`
   - relevant files under `docs/architecture/`
   - relevant local Next.js docs under `node_modules/next/dist/docs/`
2. Inspect current code for the requested feature.
3. State the feature boundary and files likely affected.
4. Explain migration impact before Prisma/schema changes.
5. Implement only the requested phase.
6. Run focused verification.
7. Summarize changed files, verification, and risks.

## Prompt Template For Claude

```text
Read AGENTS.md, CLAUDE.md, PRD.md, plan.md, and docs/architecture/nextjs-feature-structure.md.

Task:
<specific task>

Constraints:
- Implement only this task.
- Do not implement later phases.
- Preserve existing behavior unless the task explicitly replaces it.
- Use Zod for client and server validation.
- Enforce session and ownership checks for user-owned data.
- Keep provider secrets server-only.
- Follow the feature structure in `docs/architecture/nextjs-feature-structure.md`.
- Use shadcn UI primitives for reusable controls.
- Use simple English in docs, labels, and errors.

Before editing, explain:
- impacted feature
- files likely affected
- schema/migration impact, if any
- verification commands

After editing:
- run verification
- summarize changed files
- list remaining risks
```

## PRD Workflow

Use a PRD before large features.

Good PRD topics:

- GitHub App installation
- project/environment data model
- deployment run state machine
- secret encryption
- webhook processing
- deployment concurrency control

PRDs must include:

- problem
- solution
- scope
- out of scope
- affected domain entities
- database changes
- backend/API changes
- frontend changes
- security requirements
- verification
- rollout risks

## Phase File Workflow

For large PRDs, split work into phase files.

Recommended phases:

- Phase 1: data model and contracts
- Phase 2: backend services and route handlers
- Phase 3: frontend workflow
- Phase 4: verification, hardening, and migration cleanup

Each phase file should be independently implementable by Claude.

## Review Checklist For Claude Output

Use this checklist before accepting generated code:

- Does it match the requested phase only?
- Did it preserve existing working behavior?
- Did it add runtime validation at server boundaries?
- Did it reuse the same Zod schema for client and server when possible?
- Did it enforce session and ownership checks?
- Did it keep provider tokens and secrets server-only?
- Did it avoid broad generic `lib/`, `server/`, or `types/index.ts` dumping, except for the approved `lib/prisma.ts` Prisma client?
- Did it follow the target feature-based structure?
- Did it use shadcn primitives for shared UI?
- Did it keep `app/page.tsx` public and dashboard pages protected?
- Did it run lint/build or explain why not?
- Did it update docs when architecture changed?

## Bad Prompt Patterns

Avoid:

```text
Make this production ready.
Refactor the whole app.
Add GitHub integration.
Fix auth and deployments.
Improve architecture.
```

These prompts are too broad and invite unreviewable changes.

## Better Prompt Patterns

Use:

```text
Implement Phase 2 only: add Project, Environment, and DeploymentRun models.
Do not change UI.
Explain migration impact before editing.
```

```text
Implement GitHub repository listing for the signed-in user's GitHub account.
Keep manual URL import as fallback.
Do not trigger deployments in this task.
```

```text
Move deployment service code into the deployments feature.
Do not change behavior.
Run lint after import updates.
```

## Decision Log Requirement

When Claude makes a product or architecture decision, add it to the relevant doc:

- production domain decisions: `docs/architecture/production-domain.md`
- folder structure decisions: `docs/architecture/nextjs-feature-structure.md`
- implementation phase decisions: `plan.md`

Do not hide decisions only inside code.
