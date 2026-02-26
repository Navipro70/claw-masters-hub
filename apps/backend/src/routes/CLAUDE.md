# routes/

HTTP-эндпоинты приложения: health check и версионированные API-роуты.

## Структура

```
routes/
├── health/
│   ├── health.schema.ts    # Re-export из @claw/api-contracts
│   ├── health.route.ts     # GET /health — проверка db + redis
│   └── health.test.ts
└── v1/
    ├── index.ts            # Регистрация всех v1 подроутов
    └── users/
        ├── users.schema.ts       # Re-export Zod-схем из @claw/api-contracts
        ├── users.repository.ts   # Drizzle-запросы: findAll, findById, create, updateSubscription
        ├── users.service.ts      # Бизнес-логика + AppError
        ├── users.route.ts        # HTTP handlers: GET /, GET /:id, POST /, POST /:id/subscription/activate
        └── users.test.ts
```

## Route Module Pattern

Каждый домен в `v1/` имеет 4 файла со строгим разделением ответственности:

| Файл              | Отвечает за                     | Импортирует                | Никогда не делает              |
| ----------------- | ------------------------------- | -------------------------- | ------------------------------ |
| `*.schema.ts`     | Re-export Zod-схем              | `@claw/api-contracts`      | Определять схемы inline        |
| `*.repository.ts` | Чистые Drizzle-запросы          | `drizzle-orm`, db schema   | Бросать AppError               |
| `*.service.ts`    | Бизнес-логика, маппинг ошибок  | Repository, AppError       | Импортировать Fastify-типы     |
| `*.route.ts`      | Тонкие handlers: req → svc → res | Service, schemas          | Обращаться к БД напрямую       |

## Добавление нового домена

1. Zod-схемы в `packages/api-contracts/src/<domain>.ts` → re-export из `index.ts` → `pnpm --filter @claw/api-contracts build`
2. Создать `src/routes/v1/<domain>/` с 4 файлами (schema, repository, service, route) + test
3. DB-таблица в `src/db/schema/<domain>/`
4. Зарегистрировать в `src/routes/v1/index.ts`: `fastify.register(routes, { prefix: '/<domain>' })`
5. `pnpm db:push` для синхронизации схемы

## Кодстайл

- Route-файлы типизированы как `FastifyPluginAsyncZod` для Zod type inference
- Service и repository — фабричные функции: `usersService(fastify.db)`
- Schemas — **только** re-export из `@claw/api-contracts`, не определять inline
- Тесты рядом с роутами: `<domain>.test.ts`
- Health route на верхнем уровне (без версии), API-роуты под `/api/v1/`
- Response schema **обязательна** в каждом эндпоинте для Swagger и сериализации
- `config: { rateLimit: false }` для эндпоинтов, которые не нужно лимитировать (health)
