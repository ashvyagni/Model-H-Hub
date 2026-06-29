# ModelHub

A premium AI model management platform — plug in any API key, auto-detect the provider, explore models, and interact via a dynamic playground.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, routes at /api)
- `pnpm --filter @workspace/modelhub run dev` — run the frontend (Vite dev server)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TailwindCSS v4 + shadcn/ui + framer-motion + wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec at lib/api-spec/openapi.yaml)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — DB tables: providers, models, history, settings
- `artifacts/api-server/src/routes/` — Express route handlers (providers, models, history, settings, playground, detection)
- `artifacts/api-server/src/lib/detection.ts` — smart provider auto-detection engine
- `artifacts/api-server/src/lib/providerAdapter.ts` — provider adapter: model listing, chat, cost estimation
- `artifacts/modelhub/src/pages/` — React pages: Dashboard, Providers, Models, Playground, History, Settings
- `artifacts/modelhub/src/components/` — shared UI components + layout Shell + CommandPalette

## Architecture decisions

- **Provider-agnostic adapter pattern**: each provider type has detection logic + API adapter in `providerAdapter.ts`. Adding a new provider only requires adding patterns to `detection.ts` and handling in `listModels`/`chat`.
- **API key masking**: all provider routes mask API keys (show only last 4 chars) in responses. Keys are stored in plaintext in DB but never sent to the client in full.
- **Auto-detection engine**: uses weighted scoring across key prefixes, URL patterns, and endpoint patterns to identify providers with confidence scores.
- **History auto-save**: playground chat/stream routes automatically save every request+response to the history table (non-blocking).
- **Dark-only theme**: CSS variables are defined for dark mode, `dark` class forced on `<html>` in main.tsx.

## Product

- **Dashboard**: real-time stats (connected providers, models, requests today, tokens, cost), recent activity feed
- **Provider Manager**: add/configure/test AI providers with smart auto-detection; pastes API key → shows confidence badge
- **Model Explorer**: browse all saved models with capability badges (vision, reasoning, tools, JSON, audio, embeddings)
- **Playground**: split-panel chat interface with parameter controls; saves all interactions to history
- **History**: searchable/filterable request log with star, replay, export, delete
- **Settings**: default provider/model, streaming, autosave, retry count

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- In TailwindCSS v4, `@apply dark` is invalid — use `document.documentElement.classList.add('dark')` in JS instead
- Shadcn UI component files use lowercase names (`button.tsx`, not `Button.tsx`) — always import from lowercase paths
- Badge variants are limited to: `default`, `destructive`, `outline`, `secondary`. Use `className` overrides for custom colors.
- Express 5 wildcard routes need `/{*splat}` not `/*`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
