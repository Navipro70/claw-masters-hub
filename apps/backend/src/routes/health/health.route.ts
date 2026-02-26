import type { FastifyInstance } from 'fastify';
import { sql } from 'drizzle-orm';

import { healthResponseSchema } from './health.schema';

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/health',
    {
      config: { rateLimit: false },
      schema: {
        tags: ['Health'],
        response: {
          200: healthResponseSchema,
          503: healthResponseSchema,
        },
      },
    },
    async (request, reply) => {
      let dbStatus: 'ok' | 'error' = 'error';
      let redisStatus: 'ok' | 'error' = 'error';

      try {
        await request.server.db.execute(sql`SELECT 1`);
        dbStatus = 'ok';
      } catch (error) {
        request.log.error({ error }, 'Health check: DB unreachable');
      }

      try {
        await request.server.redis.ping();
        redisStatus = 'ok';
      } catch (error) {
        request.log.error({ error }, 'Health check: Redis unreachable');
      }

      const status = dbStatus === 'ok' && redisStatus === 'ok' ? 'ok' : 'error';

      const payload = {
        status,
        db: dbStatus,
        redis: redisStatus,
        timestamp: new Date().toISOString(),
      };

      if (status === 'error') {
        return reply.status(503).send(payload);
      }

      return payload;
    },
  );
}
