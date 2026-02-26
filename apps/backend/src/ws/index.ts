import type { FastifyInstance } from 'fastify';

import { echoHandler } from './handlers/echo.handler';

export default async function wsRoutes(fastify: FastifyInstance) {
  await fastify.register(echoHandler);
}
