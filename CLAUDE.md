# Claw Masters Hub

PNPM monorepo with hoisted node_modules.

## Structure

- `apps/backend` — Fastify 5 REST API + WebSocket
- `packages/api-contracts` — shared Zod schemas (`@claw/api-contracts`)

## Commands

```bash
pnpm install                  # install all deps
pnpm --filter @claw/api-contracts build  # build shared contracts (required before backend)
pnpm --filter backend dev     # run backend in dev mode
pnpm --filter backend test    # run backend tests
pnpm -r run typecheck         # typecheck all packages
pnpm -r run lint              # lint all packages
```

## Infrastructure

```bash
docker compose up -d          # PostgreSQL 17 + Redis 7
```

- PostgreSQL: `postgres://claw:claw@localhost:5432/claw`
- Redis: `redis://localhost:6379`

## Conventions

- Shared Zod schemas go in `packages/api-contracts`, not duplicated in apps
- Backend route structure: `src/routes/{version}/{entity}/{entity}.route.ts`
- Backend plugins in `src/plugins/` registered via `fastify-plugin`
- Path alias `@/*` maps to `src/*` in backend
- Use `workspace:*` for internal package references
