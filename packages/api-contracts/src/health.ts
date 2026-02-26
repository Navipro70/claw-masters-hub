import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  db: z.enum(['ok', 'error']),
  redis: z.enum(['ok', 'error']),
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
