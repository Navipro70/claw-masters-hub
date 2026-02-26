import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { userSubscriptions } from './schema/users/user-subscriptions';
import { users } from './schema/users/users';

const dbSchema = {
  users,
  userSubscriptions,
};

export type DbSchema = typeof dbSchema;
export type Db = PostgresJsDatabase<DbSchema>;

export function createDbConnection(databaseUrl: string) {
  const client = postgres(databaseUrl);
  const db = drizzle(client, { schema: dbSchema });
  return { client, db };
}
