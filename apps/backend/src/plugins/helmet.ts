import helmet from '@fastify/helmet';
import fp from 'fastify-plugin';

import { env } from '../config/env';

export default fp(
  async (fastify) => {
    await fastify.register(helmet, {
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    });
  },
  { name: 'helmet' },
);
