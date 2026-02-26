import type { Job } from 'bullmq';
import { Worker } from 'bullmq';
import type { Redis } from 'ioredis';

import { QUEUE_NAMES } from '../queues';

export function createExampleWorker(connection: Redis) {
  return new Worker(
    QUEUE_NAMES.EXAMPLE,
    async (job: Job) => {
      job.log(`Processing example job ${job.id}`);
      return { success: true };
    },
    { connection },
  );
}
