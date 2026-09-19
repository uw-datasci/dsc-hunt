# Copilot instructions — sample web API monorepo

This document orients AI assistants and contributors to the repository layout, UI design system, and backend layering.

## Monorepo overview

- **Tooling:** [pnpm](https://pnpm.io/) workspaces + [Turborepo](https://turbo.build/) (`turbo.json`). Root scripts: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm format`.
- **Workspace layout:**
  - `apps/web` — Next.js (App Router) frontend.
  - `apps/api` — Fastify HTTP API (Node ESM), built with `tsup`; Docker assets under `docker/`.
  - `packages/ui` — shared **shadcn/ui**-style components, Tailwind v4 + `globals.css`, `cn()` utilities.
  - `packages/types` — shared TypeScript types (extend as cross-app contracts grow).
  - `packages/db` — database layer placeholder (extend for persistence).
  - `packages/eslint-config`, `packages/typescript-config` — shared lint and TS bases.

Import shared packages with the `@workspace/*` scope (see each `package.json`).

## Frontend: design system (shadcn + atom / module / organism)

This repo uses **shadcn/ui** (Radix primitives + Tailwind, “radix-nova” style) with components living primarily in **`packages/ui`**. Apps consume them via exports such as `@workspace/ui/components/button`.

We organize UI in three conceptual layers (aligned with atomic design, with **modules** as the middle tier):

| Layer | Role | Typical location | Examples |
|--------|------|------------------|----------|
| **Atom** | Single-purpose, reusable primitives; no business meaning. | `packages/ui/src/components/*` | Button, Input, Badge, shadcn primitives added with the CLI |
| **Module** | Small compositions of atoms (and other modules) for a recurring UI pattern; still reusable, still mostly presentational. | Prefer `apps/web/components/modules/*` (or feature-scoped `components/modules/<feature>/`) | Search field + icon; card header row; toolbar cluster |
| **Organism** | Larger sections that combine modules and atoms; often maps to a screen region, layout slice, or feature block; may wire data and callbacks. | `apps/web/components/organisms/*` or colocated under `app/<route>/` when route-specific | Page hero, sidebar, data table section, marketing footer |

**Conventions**

- Add new shadcn components with the CLI from the web app root, targeting the shared UI package (see root `README.md` for the exact `pnpm dlx shadcn@latest add …` command). Keep **atoms** in `packages/ui` so all apps stay visually consistent.
- Put **app-only** styling wrappers or one-off compositions in `apps/web`; keep **cross-app** modules/organisms in `packages/ui` only if multiple apps need them (avoid bloating the shared package).
- Theme and tokens: `packages/ui/src/styles/globals.css` + `ThemeProvider` patterns in `apps/web` (e.g. `components/theme-provider.tsx`). Prefer CSS variables and `className` composition over ad-hoc inline styles.

## Backend: layered architecture (`apps/api`)

The API follows a **route → controller → service → repository** split per feature area under `src/modules/<name>/`.

| Layer | Responsibility |
|--------|----------------|
| **Routes** (`src/routes/*.ts`) | Fastify plugins: URL paths, HTTP method, request/response **schema** hooks, and wiring **one controller method** per route. Instantiate repository → service → controller for the module (dependency injection by hand). |
| **Controller** (`*.controller.ts`) | Translate HTTP (Fastify `request` / `reply`) to service calls; keep thin — no business rules or DB access. |
| **Service** (`*.service.ts`) | Application use cases: orchestration, validation that belongs in the domain layer, calling one or more repositories. |
| **Repository** (`*.repository.ts`) | Data access and external I/O (DB, HTTP clients, file system). Return typed records; isolate framework-specific details here. |
| **Types** (`*.types.ts`) | Domain/API shapes for the module (e.g. records returned by the repository). |
| **Schema** (`*.schema.ts`) | Fastify/OpenAPI JSON schemas for routes (tags, summaries, response shapes). Keeps contract documentation aligned with Swagger when enabled. |

**Cross-cutting**

- **`src/plugins/`** — Register env validation, security (helmet, CORS), rate limiting, Swagger in non-production, etc. Order matters (see `plugins/index.ts`).
- **`src/server.ts`** — Builds Fastify, registers plugins, **autoloads** all route files from `src/routes/`.

When adding a new feature, add a folder under `src/modules/<feature>/` with the same file suffixes, register routes in a new or existing file under `src/routes/`, and keep each layer focused so tests and refactors stay localized.

## Shared contracts

- Prefer **`@workspace/types`** for types shared between `apps/web` and `apps/api` when you formalize API payloads.
- **`@workspace/db`** is the place for DB client setup and migrations as the data layer grows.

---

*Keep this file accurate when structure or conventions change.*
