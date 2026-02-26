import websocket from '@fastify/websocket';
import fp from 'fastify-plugin';

export default fp(
  async (fastify) => {
    await fastify.register(websocket);
  },
  { name: 'websocket' },
);
