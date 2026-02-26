import type { FastifyInstance } from 'fastify';

export async function echoHandler(fastify: FastifyInstance) {
  fastify.get('/echo', { websocket: true }, (socket) => {
    socket.on('message', (message: Buffer) => {
      socket.send(message.toString());
    });
  });
}
