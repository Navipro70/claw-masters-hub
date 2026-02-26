# errors/

Централизованная обработка ошибок: кастомный класс `AppError` и глобальный error handler Fastify.

## Структура

```
errors/
├── app-error.ts      # Класс AppError со статическими фабриками
└── error-handler.ts  # Глобальный Fastify error handler
```

## Назначение

- `AppError` — бизнес-ошибки с HTTP status code. Бросаются в service-слое
- `errorHandler` — устанавливается через `app.setErrorHandler()` в `app.ts`, обрабатывает все ошибки единообразно

## AppError API

```typescript
AppError.badRequest(message, code?)    // 400
AppError.unauthorized(message?, code?) // 401
AppError.forbidden(message?, code?)    // 403
AppError.notFound(message?, code?)     // 404
AppError.conflict(message, code?)      // 409
AppError.internal(message?, code?)     // 500
```

## Формат ответа

Все ошибки возвращают единый JSON:

```json
{ "statusCode": 400, "error": "VALIDATION_ERROR", "message": "..." }
```

Validation-ошибки дополнительно содержат поле `issues`.

## Приоритет обработки в error handler

1. `AppError` → statusCode + code + message
2. Zod validation error (fastify-type-provider-zod) → 400
3. Zod serialization error → 500 + логирование
4. Fastify built-in error (statusCode) → as-is
5. Неизвестная ошибка → 500 + логирование

## Кодстайл

- Новые статусы добавляются как static-методы в `AppError`
- Ошибки бросаются **только** в service-слое, не в route и не в repository
- PostgreSQL unique violation (`code: '23505'`) перехватывается в service → `AppError.conflict()`
- Не добавлять `try/catch` в route handlers — error handler поймёт всё сам
