import { Queue } from 'bullmq';
import fp from 'fastify-plugin';

import { QUEUE_NAMES } from '../jobs/queues';

export default fp(
  async (fastify) => {
    const queues = new Map<string, Queue>();

    for (const name of Object.values(QUEUE_NAMES)) {
      queues.set(
        name,
        new Queue(name, {
          connection: fastify.redis,
        }),
      );
    }

    fastify.decorate('queues', queues);

    fastify.addHook('onClose', async () => {
      await Promise.all([...queues.values()].map((q) => q.close()));
    });
  },
  { name: 'bullmq', dependencies: ['redis'] },
);
