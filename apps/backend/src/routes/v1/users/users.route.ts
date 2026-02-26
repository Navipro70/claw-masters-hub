import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { createUserSchema, userParamsSchema, userSchema, usersListSchema } from './users.schema';
import { usersService } from './users.service';

const usersRoutes: FastifyPluginAsyncZod = async (fastify) => {
  const service = usersService(fastify.db);

  fastify.get(
    '/',
    {
      schema: {
        tags: ['Users'],
        response: { 200: usersListSchema },
      },
    },
    async () => {
      return service.list();
    },
  );

  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['Users'],
        params: userParamsSchema,
        response: { 200: userSchema },
      },
    },
    async (request) => {
      const { id } = request.params;
      return service.getById(id);
    },
  );

  fastify.post(
    '/',
    {
      schema: {
        tags: ['Users'],
        body: createUserSchema,
        response: { 201: userSchema },
      },
    },
    async (request, reply) => {
      const user = await service.create(request.body);
      return reply.status(201).send(user);
    },
  );

  fastify.post(
    '/:id/subscription/activate',
    {
      schema: {
        tags: ['Users'],
        params: userParamsSchema,
        response: { 200: userSchema },
      },
    },
    async (request) => {
      const { id } = request.params;
      return service.activateSubscription(id);
    },
  );
};

export default usersRoutes;
