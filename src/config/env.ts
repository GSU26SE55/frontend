import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().min(1),
  VITE_GOOGLE_CLIENT_ID: z.string().min(1),
  // SignalR hub origin (e.g. http://localhost:5xxx). signalr.ts appends the path
  // /hubs/ticket-chats. SEPARATE var; optional → when unset, signalr.ts falls
  // back to VITE_API_BASE_URL (set VITE_WS_URL when the hub is on a different origin than the API).
  VITE_WS_URL: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  throw new Error(
    `[env] Missing required environment variables:\n${JSON.stringify(parsed.error.format(), null, 2)}`,
  );
}

export const env = parsed.data;
