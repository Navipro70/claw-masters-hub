import type { FastifyInstance } from 'fastify';

import usersRoutes from './users/users.route';

export default async function v1Routes(fastify: FastifyInstance) {
  await fastify.register(usersRoutes, { prefix: '/users' });
}
