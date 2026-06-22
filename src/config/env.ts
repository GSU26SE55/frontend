import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().min(1),
  VITE_GOOGLE_CLIENT_ID: z.string().min(1),
  // Origin của SignalR hub (vd http://localhost:5xxx). signalr.ts ghép path
  // /hubs/ticket-comments. Biến RIÊNG; optional → khi không set, signalr.ts
  // fallback về VITE_API_BASE_URL (đặt VITE_WS_URL khi hub khác origin API).
  VITE_WS_URL: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  throw new Error(
    `[env] Missing required environment variables:\n${JSON.stringify(parsed.error.format(), null, 2)}`,
  );
}

export const env = parsed.data;
