import Fastify from 'fastify';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

import { errorHandler } from '../../../errors/error-handler';
import usersRoutes from './users.route';

const SUBSCRIPTION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function createMockDb() {
  const insertReturning = vi.fn();
  const insertValues = vi.fn(() => ({ returning: insertReturning }));
  const insert = vi.fn(() => ({ values: insertValues }));

  const updateReturning = vi.fn();
  const updateWhere = vi.fn(() => ({ returning: updateReturning }));
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const update = vi.fn(() => ({ set: updateSet }));

  const selectQueue: unknown[][] = [];
  const enqueueSelectResult = (rows: unknown[]) => {
    selectQueue.push(rows);
  };

  const selectFrom = vi.fn(() => ({
    where: vi.fn(() => Promise.resolve(selectQueue.shift() ?? [])),
    orderBy: vi.fn(() => Promise.resolve(selectQueue.shift() ?? [])),
  }));
  const select = vi.fn(() => ({ from: selectFrom }));

  return {
    db: {
      insert,
      update,
      select,
    },
    mocks: {
      insertReturning,
      updateReturning,
      enqueueSelectResult,
    },
  };
}

describe('Users routes', () => {
  const app = Fastify({ logger: false });
  const mockDb = createMockDb();

  beforeAll(async () => {
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    app.setErrorHandler(errorHandler);

    app.decorate('db', mockDb.db as never);
    app.decorate('redis', {
      ping: vi.fn().mockResolvedValue('PONG'),
    } as never);
    app.decorate('queues', new Map());

    await app.register(usersRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates user with telegram profile data', async () => {
    const createdUser = {
      id: 'f6fdbfcb-4d5a-4d2f-b5c8-91ebbfad1867',
      telegramId: 123456789,
      username: 'claw_user',
      firstName: 'Claw',
      lastName: 'User',
      languageCode: 'en',
      isBot: false,
      isPremium: false,
      email: null,
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
      updatedAt: new Date('2026-01-01T10:00:00.000Z'),
    };

    const createdSubscription = {
      id: '7f6f9eef-6ee0-4a30-9220-789f7a05e7c0',
      userId: createdUser.id,
      subscriptionStatus: 'inactive' as const,
      subscriptionProvider: null,
      subscriptionPlan: null,
      subscriptionActivatedAt: null,
      subscriptionExpiresAt: null,
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
      updatedAt: new Date('2026-01-01T10:00:00.000Z'),
    };

    mockDb.mocks.insertReturning
      .mockResolvedValueOnce([createdUser])
      .mockResolvedValueOnce([createdSubscription]);

    const response = await app.inject({
      method: 'POST',
      url: '/',
      payload: {
        telegramId: 123456789,
        username: 'claw_user',
        firstName: 'Claw',
        lastName: 'User',
        languageCode: 'en',
      },
    });

    expect(response.statusCode).toBe(201);

    const body = JSON.parse(response.body);
    expect(body.id).toBe(createdUser.id);
    expect(body.telegramId).toBe(createdUser.telegramId);
    expect(body.subscriptionStatus).toBe('inactive');
    expect(body.subscriptionExpiresAt).toBeNull();
  });

  it('returns 400 for invalid create payload', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/',
      payload: {
        telegramId: 'not-a-number',
      },
    });

    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('returns 409 when telegram id already exists', async () => {
    mockDb.mocks.insertReturning.mockRejectedValueOnce({
      code: '23505',
      constraint: 'users_telegram_id_unique',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/',
      payload: {
        telegramId: 123456789,
        firstName: 'Claw',
      },
    });

    expect(response.statusCode).toBe(409);

    const body = JSON.parse(response.body);
    expect(body.error).toBe('USER_TELEGRAM_ID_CONFLICT');
  });

  it('activates subscription for 7 days with mock provider data', async () => {
    const existingUser = {
      id: 'f6fdbfcb-4d5a-4d2f-b5c8-91ebbfad1867',
      telegramId: 123456789,
      username: 'claw_user',
      firstName: 'Claw',
      lastName: 'User',
      languageCode: 'en',
      isBot: false,
      isPremium: true,
      email: null,
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
      updatedAt: new Date('2026-01-02T12:00:00.000Z'),
    };

    const existingSubscription = {
      id: '7f6f9eef-6ee0-4a30-9220-789f7a05e7c0',
      userId: existingUser.id,
      subscriptionStatus: 'inactive' as const,
      subscriptionProvider: null,
      subscriptionPlan: null,
      subscriptionActivatedAt: null,
      subscriptionExpiresAt: null,
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
      updatedAt: new Date('2026-01-01T10:00:00.000Z'),
    };

    const activatedAt = new Date('2026-01-02T12:00:00.000Z');
    const expiresAt = new Date(activatedAt.getTime() + SUBSCRIPTION_DURATION_MS);

    const activeSubscription = {
      ...existingSubscription,
      subscriptionStatus: 'active' as const,
      subscriptionProvider: 'mock-payment-provider',
      subscriptionPlan: 'premium',
      subscriptionActivatedAt: activatedAt,
      subscriptionExpiresAt: expiresAt,
      updatedAt: new Date('2026-01-02T12:00:00.000Z'),
    };

    mockDb.mocks.enqueueSelectResult([existingUser]);
    mockDb.mocks.enqueueSelectResult([existingSubscription]);
    mockDb.mocks.updateReturning.mockResolvedValueOnce([activeSubscription]);

    const response = await app.inject({
      method: 'POST',
      url: '/f6fdbfcb-4d5a-4d2f-b5c8-91ebbfad1867/subscription/activate',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.subscriptionStatus).toBe('active');
    expect(body.subscriptionProvider).toBe('mock-payment-provider');
    expect(body.subscriptionPlan).toBe('premium');

    const responseActivatedAt = new Date(body.subscriptionActivatedAt).getTime();
    const responseExpiresAt = new Date(body.subscriptionExpiresAt).getTime();
    expect(responseExpiresAt - responseActivatedAt).toBe(SUBSCRIPTION_DURATION_MS);
  });

  it('returns 404 when activating subscription for missing user', async () => {
    mockDb.mocks.enqueueSelectResult([]);

    const response = await app.inject({
      method: 'POST',
      url: '/f6fdbfcb-4d5a-4d2f-b5c8-91ebbfad1867/subscription/activate',
    });

    expect(response.statusCode).toBe(404);

    const body = JSON.parse(response.body);
    expect(body.message).toBe('User not found');
  });
});
