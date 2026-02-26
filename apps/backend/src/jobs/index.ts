import type { FastifyInstance } from 'fastify';

import { createExampleWorker } from './workers/example.worker';

export function startWorkers(app: FastifyInstance) {
  const workers = [createExampleWorker(app.redis)];

  for (const worker of workers) {
    worker.on('failed', (job, err) => {
      app.log.error({ jobId: job?.id, err }, 'Job failed');
    });
  }

  return workers;
}
