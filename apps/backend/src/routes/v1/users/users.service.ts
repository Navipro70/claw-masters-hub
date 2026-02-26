import type { Db } from '@/db/connection';
import { AppError } from '@/errors/app-error';
import { usersRepository } from './users.repository';

const UNIQUE_VIOLATION_CODE = '23505';
const SUBSCRIPTION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const MOCK_SUBSCRIPTION_PROVIDER = 'mock-payment-provider';
const MOCK_SUBSCRIPTION_PLAN = 'premium';

type UniqueViolationError = {
  code: string;
  constraint?: string;
};

function isUniqueViolation(error: unknown): error is UniqueViolationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === UNIQUE_VIOLATION_CODE
  );
}

function getUniqueViolationError(error: UniqueViolationError) {
  if (error.constraint?.includes('telegram_id')) {
    return AppError.conflict(
      'User with this telegram id already exists',
      'USER_TELEGRAM_ID_CONFLICT',
    );
  }

  if (error.constraint?.includes('email')) {
    return AppError.conflict('User with this email already exists', 'USER_EMAIL_CONFLICT');
  }

  return AppError.conflict('User already exists', 'USER_CONFLICT');
}

export function usersService(db: Db) {
  const repo = usersRepository(db);

  return {
    async list() {
      return repo.findAll();
    },

    async getById(id: string) {
      const user = await repo.findById(id);
      if (!user) throw AppError.notFound('User not found');
      return user;
    },

    async create(data: {
      telegramId: number;
      username?: string;
      firstName: string;
      lastName?: string;
      languageCode?: string;
      isBot?: boolean;
      isPremium?: boolean;
      email?: string;
    }) {
      try {
        return await repo.create(data);
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw getUniqueViolationError(error);
        }

        throw error;
      }
    },

    async activateSubscription(id: string) {
      const user = await repo.findById(id);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      const activatedAt = new Date();
      const subscriptionExpiresAt = new Date(activatedAt.getTime() + SUBSCRIPTION_DURATION_MS);

      const subscription = await repo.updateSubscription(id, {
        subscriptionStatus: 'active',
        subscriptionProvider: MOCK_SUBSCRIPTION_PROVIDER,
        subscriptionPlan: MOCK_SUBSCRIPTION_PLAN,
        subscriptionActivatedAt: activatedAt,
        subscriptionExpiresAt,
      });

      if (!subscription) {
        throw AppError.internal('User subscription not found', 'USER_SUBSCRIPTION_NOT_FOUND');
      }

      return {
        ...user,
        subscriptionStatus: subscription.subscriptionStatus,
        subscriptionProvider: subscription.subscriptionProvider,
        subscriptionPlan: subscription.subscriptionPlan,
        subscriptionActivatedAt: subscription.subscriptionActivatedAt,
        subscriptionExpiresAt: subscription.subscriptionExpiresAt,
      };
    },
  };
}
