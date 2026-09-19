# Agent and developer context

This file is for **human developers** and for **Cursor** (Agent, Chat, and inline AI). It complements [`../.github/copilot-instructions.md`](../.github/copilot-instructions.md), which mirrors the same architecture notes for GitHub Copilot.

**Persistent AI rules** live in [`../.cursor/rules/`](../.cursor/rules/) (`.mdc` files). Edit those when you want file-scoped or always-on behavior; keep this file for narrative and onboarding.

---

## Commands (run from repo root)

| Goal | Command |
|------|---------|
| Dev (all apps) | `pnpm dev` |
| Lint (Turborepo) | `pnpm lint` → `turbo lint` |
| Typecheck | `pnpm typecheck` |
| Format | `pnpm format` |
| Build everything | `pnpm build` |
| Web only | `pnpm exec turbo dev --filter=web` or `pnpm exec turbo build --filter=web...` |
| API only | `pnpm exec turbo dev --filter=api` or `pnpm exec turbo build --filter=api...` |
| API Docker image | `pnpm docker:api` |
| API via Compose | `pnpm docker:api:up` |

Use **`pnpm exec turbo … --filter=<name>`** when you want faster feedback on one package. Package names match `apps/web` / `apps/api` `package.json` `name` fields (e.g. `web`, `api`).

**Tooling:** Node ≥ 20 (`package.json` `engines`), `pnpm@10.33.0` (`packageManager`). CI may pin different minors; align locally with the repo lockfile.

---

## Repository map

| Path | Role |
|------|------|
| `apps/web` | Next.js App Router |
| `apps/api` | Fastify API (ESM), `src/server.ts`, autoloaded `src/routes/` |
| `packages/ui` | shadcn/ui-style **atoms**, Tailwind v4, `globals.css`, `@workspace/ui/...` exports |
| `packages/types` | Shared TS types for API/web contracts |
| `packages/db` | DB client / migrations (extend as needed) |
| `packages/eslint-config`, `packages/typescript-config` | Shared lint and TS configs |

Imports use **`@workspace/*`** (see each package’s `package.json` `exports`).

---

## Frontend: shadcn + atom → module → organism

- **Atoms:** `packages/ui/src/components/*` — add via shadcn CLI (see root `README.md`); import e.g. `@workspace/ui/components/button`.
- **Modules:** small composites → prefer `apps/web/components/modules/` (or `components/modules/<feature>/`).
- **Organisms:** larger sections → `apps/web/components/organisms/` or colocate under `app/<route>/` when route-specific.

Theme/tokens: `packages/ui/src/styles/globals.css`; app theming patterns under `apps/web` (e.g. `components/theme-provider.tsx`).

---

## Backend: layered architecture (`apps/api`)

Per feature: `src/modules/<feature>/`.

1. **`*.routes` wiring** — `src/routes/*.ts`: paths, methods, Fastify `schema`, construct `Repository` → `Service` → `Controller`.
2. **`*.controller.ts`** — HTTP in/out only; delegate to service.
3. **`*.service.ts`** — use cases and orchestration.
4. **`*.repository.ts`** — persistence and external I/O.
5. **`*.types.ts`**, **`*.schema.ts`** — TS shapes and Fastify/OpenAPI JSON schemas.

Cross-cutting: `src/plugins/` (order matters — see `plugins/index.ts`).

---

## Using Cursor effectively

- **@Files / @Folders:** Reference `apps/api/src/modules/system/` or `packages/ui/src/components/` so edits stay consistent with existing patterns.
- **Rules:** `.cursor/rules/*.mdc` — `alwaysApply: true` for global monorepo hints; use `globs` for API-only or UI-only conventions.
- **After substantive edits:** run `pnpm lint` and `pnpm typecheck` from the root (matches CI’s Turbo tasks).
- **New shadcn components:** prefer CLI over hand-copying so `components.json` and deps stay correct.

---

## CI (high level)

`.github/workflows/quality-gate.yml` runs Turbo **lint** and **typecheck**, then builds **web** and **api** via reusable workflows. Keep changes passing those tasks before opening a PR.

---

*Update this file and `.cursor/rules/` when conventions or layout change.*
