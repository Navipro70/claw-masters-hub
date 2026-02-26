import type { Queue } from 'bullmq';
import type { Redis } from 'ioredis';

import type { Db } from '../db/connection';

declare module 'fastify' {
  interface FastifyInstance {
    db: Db;
    redis: Redis;
    queues: Map<string, Queue>;
  }
}
