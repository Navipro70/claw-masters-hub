import { eq } from 'drizzle-orm';

import type { Db } from '@/db/connection';
import { userSubscriptions } from '@/db/schema/users/user-subscriptions';
import { users } from '@/db/schema/users/users';

type SubscriptionStatus = 'inactive' | 'active' | 'expired' | 'canceled';
type UserRow = typeof users.$inferSelect;
type UserSubscriptionRow = typeof userSubscriptions.$inferSelect;

export type UserWithSubscription = UserRow & {
  subscriptionStatus: SubscriptionStatus;
  subscriptionProvider: string | null;
  subscriptionPlan: string | null;
  subscriptionActivatedAt: Date | null;
  subscriptionExpiresAt: Date | null;
};

type CreateUserData = {
  telegramId: number;
  username?: string;
  firstName: string;
  lastName?: string;
  languageCode?: string;
  isBot?: boolean;
  isPremium?: boolean;
  email?: string;
};

type SubscriptionUpdateData = {
  subscriptionStatus: SubscriptionStatus;
  subscriptionProvider: string | null;
  subscriptionPlan: string | null;
  subscriptionActivatedAt: Date | null;
  subscriptionExpiresAt: Date | null;
};

function toUserWithSubscription(
  user: UserRow,
  subscription: UserSubscriptionRow | null,
): UserWithSubscription {
  return {
    ...user,
    subscriptionStatus: subscription?.subscriptionStatus ?? 'inactive',
    subscriptionProvider: subscription?.subscriptionProvider ?? null,
    subscriptionPlan: subscription?.subscriptionPlan ?? null,
    subscriptionActivatedAt: subscription?.subscriptionActivatedAt ?? null,
    subscriptionExpiresAt: subscription?.subscriptionExpiresAt ?? null,
  };
}

export function usersRepository(db: Db) {
  async function findUserById(id: string) {
    const rows = await db.select().from(users).where(eq(users.id, id));
    return rows[0] ?? null;
  }

  async function findSubscriptionByUserId(userId: string) {
    const rows = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));
    return rows[0] ?? null;
  }

  async function findUserWithSubscriptionById(id: string) {
    const user = await findUserById(id);
    if (!user) {
      return null;
    }

    const subscription = await findSubscriptionByUserId(id);
    return toUserWithSubscription(user, subscription);
  }

  return {
    async findAll() {
      const userRows = await db.select().from(users).orderBy(users.createdAt);
      const subscriptionRows = await db.select().from(userSubscriptions);
      const subscriptionsByUserId = new Map(subscriptionRows.map((row) => [row.userId, row]));

      return userRows.map((user) =>
        toUserWithSubscription(user, subscriptionsByUserId.get(user.id) ?? null),
      );
    },

    async findById(id: string) {
      return findUserWithSubscriptionById(id);
    },

    async create(data: CreateUserData) {
      const userRows = await db
        .insert(users)
        .values({
          telegramId: data.telegramId,
          username: data.username ?? null,
          firstName: data.firstName,
          lastName: data.lastName ?? null,
          languageCode: data.languageCode ?? null,
          isBot: data.isBot ?? false,
          isPremium: data.isPremium ?? false,
          email: data.email ?? null,
        })
        .returning();

      const user = userRows[0]!;
      const subscriptionRows = await db
        .insert(userSubscriptions)
        .values({ userId: user.id })
        .returning();

      return toUserWithSubscription(user, subscriptionRows[0] ?? null);
    },

    async updateSubscription(id: string, data: SubscriptionUpdateData) {
      const rows = await db
        .update(userSubscriptions)
        .set(data)
        .where(eq(userSubscriptions.userId, id))
        .returning();
      return rows[0] ?? null;
    },
  };
}
