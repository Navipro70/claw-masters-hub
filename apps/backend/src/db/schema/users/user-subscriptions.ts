import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { timestamps } from '../timestamps';
import { users } from './users';

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'inactive',
  'active',
  'expired',
  'canceled',
]);

export const userSubscriptions = pgTable('user_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').notNull().default('inactive'),
  subscriptionProvider: text('subscription_provider'),
  subscriptionPlan: text('subscription_plan'),
  subscriptionActivatedAt: timestamp('subscription_activated_at', { withTimezone: true }),
  subscriptionExpiresAt: timestamp('subscription_expires_at', { withTimezone: true }),
  ...timestamps,
});
