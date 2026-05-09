import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().min(1, 'VITE_API_BASE_URL is required'),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  console.error('Missing environment variables:', parsed.error.format())
  throw new Error('Invalid environment configuration')
}

export const env = parsed.data
