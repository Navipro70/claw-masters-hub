import cors from '@fastify/cors';
import fp from 'fastify-plugin';

import { env } from '../config/env';

export default fp(
  async (fastify) => {
    const allowedOrigins = env.CORS_ORIGIN.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    await fastify.register(cors, {
      origin: env.CORS_ORIGIN === '*' ? true : allowedOrigins,
    });
  },
  { name: 'cors' },
);
