import Fastify, { type FastifyServerOptions } from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

import { env } from './config/env';
import { errorHandler } from './errors/error-handler';
import bullmqPlugin from './plugins/bullmq';
import corsPlugin from './plugins/cors';
import dbPlugin from './plugins/db';
import helmetPlugin from './plugins/helmet';
import rateLimitPlugin from './plugins/rate-limit';
import redisPlugin from './plugins/redis';
import swaggerPlugin from './plugins/swagger';
import websocketPlugin from './plugins/websocket';
import healthRoutes from './routes/health/health.route';
import v1Routes from './routes/v1/index';
import wsRoutes from './ws/index';

function resolveLoggerOption(logger: FastifyServerOptions['logger']) {
  if (logger !== undefined) {
    return logger;
  }

  if (env.NODE_ENV === 'test') {
    return false;
  }

  if (env.NODE_ENV === 'development' && env.LOG_PRETTY) {
    return {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:standard',
        },
      },
    };
  }

  return true;
}

export async function buildApp(opts: FastifyServerOptions = {}) {
  const app = Fastify({
    ...opts,
    logger: resolveLoggerOption(opts.logger),
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.setErrorHandler(errorHandler);

  await app.register(corsPlugin);
  await app.register(helmetPlugin);
  await app.register(swaggerPlugin);

  await app.register(dbPlugin);
  await app.register(redisPlugin);
  await app.register(rateLimitPlugin);
  await app.register(bullmqPlugin);
  await app.register(websocketPlugin);

  await app.register(healthRoutes);
  await app.register(v1Routes, { prefix: '/api/v1' });
  await app.register(wsRoutes, { prefix: '/ws' });

  return app;
}
