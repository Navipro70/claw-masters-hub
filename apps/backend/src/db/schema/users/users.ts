import { bigint, boolean, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { timestamps } from '../timestamps';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  telegramId: bigint('telegram_id', { mode: 'number' }).notNull().unique(),
  username: text('username'),
  firstName: text('first_name').notNull(),
  lastName: text('last_name'),
  languageCode: text('language_code'),
  isBot: boolean('is_bot').notNull().default(false),
  isPremium: boolean('is_premium').notNull().default(false),
  email: text('email').unique(),
  ...timestamps,
});
