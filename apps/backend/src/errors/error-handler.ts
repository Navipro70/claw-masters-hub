import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from 'fastify-type-provider-zod';

import { AppError } from './app-error';

function isFastifyError(error: unknown): error is FastifyError {
  return typeof error === 'object' && error !== null && 'message' in error;
}

export function errorHandler(error: unknown, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: error.code ?? error.name,
      message: error.message,
    });
  }

  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'VALIDATION_ERROR',
      message: 'Validation failed',
      issues: error.validation,
      method: request.method,
      path: request.url,
    });
  }

  if (isResponseSerializationError(error)) {
    request.log.error({ error }, 'Response serialization failed');
    return reply.status(500).send({
      statusCode: 500,
      error: 'RESPONSE_SERIALIZATION_ERROR',
      message: 'Response serialization failed',
      issues: error.cause.issues,
    });
  }

  if (isFastifyError(error) && error.statusCode) {
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: error.code ?? error.name,
      message: error.message,
    });
  }

  request.log.error({ error }, 'Unhandled error');
  return reply.status(500).send({
    statusCode: 500,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
  });
}
