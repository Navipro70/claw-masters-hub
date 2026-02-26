import 'dotenv/config';

import { envSchema } from './env.schema';

function loadEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    console.error('Invalid environment variables:', formatted);
    process.exit(1);
  }

  return result.data;
}

export const env = loadEnv();
