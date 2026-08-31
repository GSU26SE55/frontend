import { z } from "zod";

const envSchema = z.object({
  // Empty string is VALID and is the dev default: axios/SSE then build relative
  // URLs (/api/...) so requests go to whatever origin the page was opened on —
  // localhost:5173 or the ngrok tunnel — and Vite's proxy forwards them to the
  // gateway. Hardcoding http://localhost:5173 here breaks the tunnel: the browser
  // blocks an HTTPS page from calling a loopback address (Private Network Access).
  VITE_API_BASE_URL: z.string(),
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
