import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

import { errorHandler } from '../../errors/error-handler';
import healthRoutes from './health.route';

describe('GET /health', () => {
  const app = Fastify({ logger: false });
  const dbExecute = vi.fn().mockResolvedValue([{ '?column?': 1 }]);
  const redisPing = vi.fn().mockResolvedValue('PONG');

  beforeAll(async () => {
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    app.setErrorHandler(errorHandler);

    app.decorate('db', {
      execute: dbExecute,
    } as never);
    app.decorate('redis', {
      ping: redisPing,
    } as never);
    app.decorate('queues', new Map());

    await app.register(healthRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns ok when db and redis are healthy', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.status).toBe('ok');
    expect(body.db).toBe('ok');
    expect(body.redis).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });

  it('returns 503 when db and redis are unavailable', async () => {
    dbExecute.mockRejectedValueOnce(new Error('DB is down'));
    redisPing.mockRejectedValueOnce(new Error('Redis is down'));

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(503);

    const body = JSON.parse(response.body);
    expect(body.status).toBe('error');
    expect(body.db).toBe('error');
    expect(body.redis).toBe('error');
    expect(body.timestamp).toBeDefined();
  });
});
