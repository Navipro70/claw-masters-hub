# db/

Слой базы данных: подключение к PostgreSQL через Drizzle ORM и определение схем таблиц.

## Структура

```
db/
├── connection.ts         # Создание подключения: createDbConnection(url) → { client, db }
└── schema/
    ├── timestamps.ts     # Переиспользуемые колонки createdAt/updatedAt (timestamptz)
    └── users/
        ├── users.ts              # Таблица users
        └── user-subscriptions.ts # Таблица user_subscriptions
```

## Назначение

- `connection.ts` — фабрика подключения. Принимает DATABASE_URL, возвращает `{ client, db }`. Используется в плагине `plugins/db.ts`
- `schema/` — определение таблиц через Drizzle `pgTable()`. Каждый домен в отдельной подпапке

## Типы

```typescript
export type DbSchema = typeof dbSchema;
export type Db = PostgresJsDatabase<DbSchema>;
```

`Db` — основной тип для инъекции в repository-функции.

## Кодстайл

- Одна подпапка на домен: `schema/users/`, `schema/orders/` и т.д.
- UUID primary key: `uuid('id').primaryKey().defaultRandom()`
- Spread `...timestamps` в каждую таблицу для createdAt/updatedAt
- Имена колонок в PostgreSQL: `snake_case` — `telegram_id`, `first_name`
- Имена полей в TypeScript: `camelCase` — `telegramId`, `firstName`
- Enum-ы определяются через `pgEnum()` рядом с таблицей, которая их использует
- Foreign keys с `onDelete: 'cascade'` где логически уместно
- Новые таблицы импортируются в `connection.ts` в объект `dbSchema`
- Миграции: dev — `pnpm db:push`, production — `pnpm db:generate` + `pnpm db:migrate`
