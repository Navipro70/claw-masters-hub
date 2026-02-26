import fp from 'fastify-plugin';

import { env } from '../config/env';
import { createDbConnection } from '../db/connection';

export default fp(
  async (fastify) => {
    const { client, db } = createDbConnection(env.DATABASE_URL);

    fastify.decorate('db', db);

    fastify.addHook('onClose', async () => {
      await client.end();
    });
  },
  { name: 'db' },
);
