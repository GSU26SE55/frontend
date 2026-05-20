import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL:      z.string().min(1),
  VITE_GOOGLE_CLIENT_ID:  z.string().min(1),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  throw new Error(
    `[env] Missing required environment variables:\n${JSON.stringify(parsed.error.format(), null, 2)}`
  );
}

export const env = parsed.data;
