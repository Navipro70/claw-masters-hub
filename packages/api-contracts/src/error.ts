import { z } from 'zod';

export const backendErrorPayloadSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string(),
  issues: z.unknown().optional(),
});

export type BackendErrorPayload = z.infer<typeof backendErrorPayloadSchema>;
