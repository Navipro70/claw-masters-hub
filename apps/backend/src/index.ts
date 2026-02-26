import { env } from './config/env';
import { buildApp } from './app';
import { startWorkers } from './jobs/index';

async function main() {
  const app = await buildApp();

  if (env.WORKERS_ENABLED) {
    const workers = startWorkers(app);

    app.addHook('onClose', async () => {
      await Promise.all(workers.map((worker) => worker.close()));
    });
  }

  await app.listen({ host: env.HOST, port: env.PORT });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
