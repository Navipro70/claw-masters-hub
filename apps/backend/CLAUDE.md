# Backend CLAUDE.md

## Commands

| Command            | Description                                       |
| ------------------ | ------------------------------------------------- |
| `pnpm dev`         | Dev server with hot-reload (tsx watch, port 3000) |
| `pnpm build`       | TypeScript build to dist/                         |
| `pnpm start`       | Run production build                              |
| `pnpm lint`        | ESLint check                                      |
| `pnpm lint-fix`    | ESLint auto-fix                                   |
| `pnpm format`      | Prettier check                                    |
| `pnpm typecheck`   | tsc --noEmit                                      |
| `pnpm test`        | Vitest single pass                                |
| `pnpm test:watch`  | Vitest watch mode                                 |
| `pnpm db:generate` | Generate Drizzle migrations                       |
| `pnpm db:migrate`  | Run Drizzle migrations                            |
| `pnpm db:push`     | Push schema to DB (dev only)                      |
| `pnpm db:studio`   | Open Drizzle Studio                               |

## Stack

- **Fastify 5** ESM (`"type": "module"`) with Pino logging
- **Zod 4** validation via `fastify-type-provider-zod` (auto JSON Schema transform)
- **Drizzle ORM 0.39** with `postgres` (postgres.js) driver
- **IORedis 5** shared by `@fastify/rate-limit` and **BullMQ 5** job queues
- **@fastify/websocket** for WebSocket support
- **@fastify/cors**, **@fastify/helmet**, **@fastify/swagger** + swagger-ui
- **bcryptjs** for password hashing, **nanoid** for short IDs
- **@claw/api-contracts** — shared Zod schemas (API contracts) consumed by backend + clients
- **Vitest 3** for testing, **tsx** for dev execution

## Project Structure

```
src/
├── index.ts              # Entry: buildApp() + listen + startWorkers()
├── app.ts                # App factory: registers plugins then routes
├── config/
│   ├── env.schema.ts     # Zod schema for all env vars (DATABASE_URL, REDIS_URL, etc.)
│   └── env.ts            # Validates process.env at startup, exports `env` singleton
├── plugins/              # All wrapped in fastify-plugin (fp) for decorator visibility
│   ├── cors.ts           # CORS (CORS_ORIGIN env, comma-separated)
│   ├── helmet.ts         # Security headers (relaxed CSP in dev)
│   ├── swagger.ts        # OpenAPI docs at /docs (jsonSchemaTransform for Zod)
│   ├── db.ts             # Decorates fastify.db (Drizzle instance)
│   ├── redis.ts          # Decorates fastify.redis (IORedis, maxRetriesPerRequest: null)
│   ├── rate-limit.ts     # Rate limiting via Redis (depends on redis plugin)
│   ├── bullmq.ts         # Decorates fastify.queues (Map<string, Queue>)
│   └── websocket.ts      # Enables @fastify/websocket
├── db/
│   ├── connection.ts     # createDbConnection(url) → { client, db }
│   └── schema/
│       ├── timestamps.ts # Reusable createdAt/updatedAt columns (timestamptz)
│       └── users/
│           ├── users.ts              # Users table (uuid pk, telegram_id unique)
│           └── user-subscriptions.ts # User subscriptions table
├── errors/
│   ├── app-error.ts      # AppError with static factories (badRequest, notFound, conflict, etc.)
│   └── error-handler.ts  # Handles: AppError → Zod validation → Zod serialization → Fastify → 500
├── routes/
│   ├── health/
│   │   ├── health.schema.ts
│   │   ├── health.route.ts   # GET /health (checks db + redis, returns 200 or 503)
│   │   └── health.test.ts
│   └── v1/
│       ├── index.ts          # Registers all v1 subroutes
│       └── users/
│           ├── users.schema.ts       # Re-exports Zod schemas from @claw/api-contracts
│           ├── users.repository.ts   # Drizzle queries: findAll, findById, create, updateSubscription
│           ├── users.service.ts      # Business logic + AppError throwing
│           ├── users.route.ts        # GET /, GET /:id, POST /, POST /:id/subscription/activate
│           └── users.test.ts
├── jobs/
│   ├── index.ts          # startWorkers(app) — registers all workers
│   ├── queues.ts         # QUEUE_NAMES constant
│   └── workers/
│       └── example.worker.ts
├── ws/
│   ├── index.ts          # Registers WS handlers at /ws prefix
│   └── handlers/
│       └── echo.handler.ts  # GET /ws/echo
└── types/
    └── fastify.d.ts      # Module augmentation: db, redis, queues on FastifyInstance
```

## Route Module Pattern

Every route domain in `src/routes/v1/` has four files with strict layer boundaries:

| File              | Responsibility                                                | Imports               | Never does                     |
| ----------------- | ------------------------------------------------------------- | --------------------- | ------------------------------ |
| `*.schema.ts`     | Re-exports Zod schemas from `@claw/api-contracts`             | `@claw/api-contracts` | Define schemas inline, business logic |
| `*.repository.ts` | Pure Drizzle queries, factory fn taking `Db`                  | `drizzle-orm`, schema | Throw AppError, business logic |
| `*.service.ts`    | Business logic, null checks, error mapping                    | Repository, AppError  | Import Fastify types           |
| `*.route.ts`      | Thin Fastify handlers, wires request → service → response     | Service, schemas      | DB access, business logic      |

Route files typed as `FastifyPluginAsyncZod` for full Zod type inference. Service/repo use factory functions: `usersService(fastify.db)`.

**Adding a new route module:**

1. Define Zod contracts in `packages/api-contracts/src/<domain>.ts`, re-export from `packages/api-contracts/src/index.ts`, build with `pnpm --filter @claw/api-contracts build`
2. Create `src/routes/v1/<domain>/` with schema (re-exports from `@claw/api-contracts`) + repository + service + route files
3. Create DB table in `src/db/schema/<domain>/`
4. Register in `src/routes/v1/index.ts`: `fastify.register(routes, { prefix: '/<domain>' })`
5. `pnpm db:push` to sync schema
6. Write tests in `<domain>.test.ts` co-located with route

## API Contracts (`packages/api-contracts/`)

All Zod schemas defining the API surface live in the shared `@claw/api-contracts` package — not inline in the backend. This ensures type-safe contracts shared between backend and clients.

- One file per domain in `packages/api-contracts/src/` (e.g., `users.ts`, `health.ts`)
- Export both schemas and inferred types (`z.infer<typeof schema>`)
- Use `z.coerce.date()` for date fields (handles JSON string ↔ Date)
- Re-export everything from `packages/api-contracts/src/index.ts`
- Backend `*.schema.ts` files are thin re-exports: `export { userSchema, createUserSchema } from '@claw/api-contracts'`
- After changes: `pnpm --filter @claw/api-contracts build`

## Error Handling

**AppError** static factories: `.badRequest()`, `.unauthorized()`, `.forbidden()`, `.notFound()`, `.conflict()`, `.internal()`

All error responses follow: `{ statusCode, error, message }`. Validation errors add `issues` array.

**PostgreSQL unique violations** caught in services with code `'23505'` → `AppError.conflict()`.

Error handler priority: AppError → Zod validation (400) → Zod serialization (500, logged) → Fastify built-in → unknown (500, logged).

## Plugin System

All plugins use `fastify-plugin` (fp). Registration order in `app.ts`: cors → helmet → swagger → db → redis → rate-limit → bullmq → websocket.

Plugin dependencies declared via `{ dependencies: ['redis'] }`. New decorators must be added to `src/types/fastify.d.ts`.

Current decorators: `fastify.db` (Drizzle), `fastify.redis` (IORedis), `fastify.queues` (Map<string, Queue>).

## Database

- **Drizzle ORM** with postgres.js driver, schema in `src/db/schema/`
- UUID primary keys: `uuid('id').primaryKey().defaultRandom()`
- Spread `timestamps` (createdAt/updatedAt with timezone) into every table
- Column names: `snake_case` in PostgreSQL
- Dev: `pnpm db:push`. Production: `pnpm db:generate` + `pnpm db:migrate`

## Job Queues

- Queue names in `src/jobs/queues.ts` as `QUEUE_NAMES` const object
- Workers in `src/jobs/workers/` — factory functions taking Redis connection
- Workers registered in `src/jobs/index.ts`, started from `src/index.ts` when `WORKERS_ENABLED=true`
- Enqueue from routes: `fastify.queues.get(QUEUE_NAMES.X)?.add('job-name', data)`
- Workers closed on app shutdown via `onClose` hook

## Testing

**Framework:** Vitest 3 | **Config:** `vitest.config.ts` (globals: true, 10s timeout, `src/**/*.test.ts`)

**Pattern:** Create minimal Fastify instance, mock decorators, register only the route under test.

```typescript
const app = Fastify({ logger: false });
// Always set these three:
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
app.setErrorHandler(errorHandler);
// Mock decorators (cast as never):
app.decorate('db', mockDb as never);
app.decorate('redis', mockRedis as never);
app.decorate('queues', new Map());
await app.register(myRoutes);
await app.ready();
// Test with app.inject():
const res = await app.inject({ method: 'GET', url: '/path' });
expect(res.statusCode).toBe(200);
```

**Test:** routes (status codes, response shapes, validation), services (business logic, error cases).
**Don't test:** plugins, Drizzle queries (integration concerns).

## Conventions

- **Path alias** `@/*` maps to `src/*` — use `@/db/connection`, `@/errors/app-error`
- **Strict TypeScript** — `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`
- **Type imports** — `import type { FastifyInstance } from 'fastify'`
- **pnpm only** — never npm or yarn
- **Env vars** — add to `src/config/env.schema.ts` + `.env.example`
- **Boolean envs** — parsed via custom preprocessor (`'1'`/`'true'`/`'yes'`/`'on'` → `true`)

## Verify Before Done

```bash
pnpm typecheck && pnpm lint && pnpm test
```
