# types/

TypeScript module augmentation и глобальные типы.

## Структура

```
types/
└── fastify.d.ts   # Расширение FastifyInstance декораторами (db, redis, queues)
```

## Назначение

`fastify.d.ts` расширяет интерфейс `FastifyInstance` из пакета `fastify` через `declare module`. Это даёт типизацию для всех кастомных декораторов, добавляемых плагинами.

## Текущие декораторы

```typescript
interface FastifyInstance {
  db: Db;              // Drizzle ORM instance (из plugins/db.ts)
  redis: Redis;        // IORedis instance (из plugins/redis.ts)
  queues: Map<string, Queue>;  // BullMQ queues (из plugins/bullmq.ts)
}
```

## Кодстайл

- При добавлении нового плагина с `fastify.decorate()` — **обязательно** добавить тип сюда
- Использовать `import type` для импортов в `.d.ts` файлах
- Один `declare module 'fastify'` блок со всеми расширениями
