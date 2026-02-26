# plugins/

Fastify-плагины: инфраструктурные сервисы, middleware и декораторы.

## Структура

```
plugins/
├── bullmq.ts      # fastify.queues — Map<string, Queue> (зависит от redis)
├── cors.ts        # CORS — origin из env, поддержка comma-separated
├── db.ts          # fastify.db — Drizzle ORM instance
├── helmet.ts      # Security headers (CSP отключён в dev)
├── rate-limit.ts  # Rate limiting через Redis (зависит от redis)
├── redis.ts       # fastify.redis — IORedis instance
├── swagger.ts     # OpenAPI docs на /docs, Zod → JSON Schema transform
└── websocket.ts   # @fastify/websocket
```

## Назначение

Каждый плагин:
- Оборачивается в `fastify-plugin` (fp) для видимости декораторов в parent scope
- Регистрирует внешний плагин и/или декорирует `fastify` instance
- Закрывает ресурсы в `onClose` hook (db client, redis, queues)

## Порядок регистрации

Определён в `app.ts`, порядок важен из-за зависимостей:

```
cors → helmet → swagger → db → redis → rate-limit → bullmq → websocket
```

`rate-limit` и `bullmq` зависят от `redis` (объявлено через `{ dependencies: ['redis'] }`).

## Декораторы

| Декоратор        | Тип                  | Плагин      |
| ---------------- | -------------------- | ----------- |
| `fastify.db`     | `Db` (Drizzle)       | `db.ts`     |
| `fastify.redis`  | `Redis` (IORedis)    | `redis.ts`  |
| `fastify.queues` | `Map<string, Queue>` | `bullmq.ts` |

Все типы декораторов описаны в `src/types/fastify.d.ts`.

## Кодстайл

- Один плагин на файл, default export
- Всегда оборачивать в `fp(async (fastify) => { ... }, { name: 'xxx' })`
- Зависимости от других плагинов: `{ dependencies: ['redis'] }`
- Новые декораторы **обязательно** добавлять в `src/types/fastify.d.ts`
- Cleanup в `onClose` hook: `await client.end()`, `await redis.quit()`, `await queue.close()`
- Конфигурация берётся из `env`, не из хардкода
