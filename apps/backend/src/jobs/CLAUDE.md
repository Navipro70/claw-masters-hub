# jobs/

Фоновые задачи на BullMQ: очереди и воркеры.

## Структура

```
jobs/
├── index.ts          # startWorkers(app) — регистрация и запуск всех воркеров
├── queues.ts         # QUEUE_NAMES — константы имён очередей
└── workers/
    └── example.worker.ts   # Пример воркера
```

## Назначение

- `queues.ts` — единый реестр имён очередей (`QUEUE_NAMES` const object). Используется и в плагине `plugins/bullmq.ts` для создания Queue, и в воркерах
- `workers/` — каждый воркер в отдельном файле, экспортирует фабрику `createXxxWorker(connection: Redis)`
- `index.ts` — собирает все воркеры, стартует их, подписывается на `failed` события

## Жизненный цикл

1. `plugins/bullmq.ts` создаёт `Map<string, Queue>` → `fastify.queues`
2. `index.ts` (вызывается из `src/index.ts`) создаёт Worker-ы
3. Routes добавляют задачи: `fastify.queues.get(QUEUE_NAMES.X)?.add('job-name', data)`
4. При shutdown: Queue-и и Worker-ы gracefully закрываются через `onClose` hook

## Кодстайл

- Имена очередей — UPPER_CASE константы в `queues.ts`
- Один воркер на файл: `workers/{name}.worker.ts`
- Фабричная функция: `createXxxWorker(connection: Redis) → Worker`
- Воркеры запускаются только при `env.WORKERS_ENABLED === true`
- Логирование ошибок через `app.log.error()` в обработчике `failed`
