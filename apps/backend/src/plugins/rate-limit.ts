import rateLimit from '@fastify/rate-limit';
import fp from 'fastify-plugin';

import { env } from '../config/env';

export default fp(
  async (fastify) => {
    await fastify.register(rateLimit, {
      max: env.RATE_LIMIT_MAX,
      redis: fastify.redis,
      skipOnError: true,
      timeWindow: env.RATE_LIMIT_WINDOW_MS,
    });
  },
  { name: 'rate-limit', dependencies: ['redis'] },
);
