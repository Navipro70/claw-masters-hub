# ws/

WebSocket-эндпоинты приложения.

## Структура

```
ws/
├── index.ts          # Регистрация всех WS-хэндлеров, prefix /ws
└── handlers/
    └── echo.handler.ts   # GET /ws/echo — эхо-хэндлер для тестирования
```

## Назначение

- `index.ts` — точка входа, регистрирует все хэндлеры из `handlers/`. Подключается в `app.ts` с prefix `/ws`
- `handlers/` — каждый хэндлер в отдельном файле, экспортирует async Fastify plugin function

## Кодстайл

- Один хэндлер на файл: `handlers/{name}.handler.ts`
- Хэндлер — async function принимающая `FastifyInstance`
- WebSocket route: `fastify.get('/path', { websocket: true }, (socket) => { ... })`
- Сообщения приходят как `Buffer`, конвертируются через `.toString()`
- Регистрация в `index.ts` через `fastify.register(handler)`
- Доступ к `fastify.db`, `fastify.redis` из хэндлеров через closure
