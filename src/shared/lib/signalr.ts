import Cookies from "js-cookie";
import { env } from "@/config/env";
import type { HubConnection } from "@microsoft/signalr";

// Hub is mounted at ROOT (no /api prefix). Auth via the access_token query param —
// accessTokenFactory re-reads the cookie on every (re)connect so the latest token is always used.
const HUB_BASE = env.VITE_WS_URL ?? env.VITE_API_BASE_URL;
const TICKET_CHAT_HUB_URL = `${HUB_BASE}/hubs/ticket-chats`;
const NOTIFICATION_HUB_URL = `${HUB_BASE}/hubs/notifications`;

// @microsoft/signalr is ~54 kB of JavaScript that only matters once a hub connection is
// actually opened. The import below is dynamic so it is fetched at that moment rather than
// being bundled into the chunk of every page that merely *might* open a connection — the
// notification bell sits in the app layout, so a static import put it in front of the first
// render of every authenticated page. The `import type` above is erased at compile time and
// costs nothing at runtime.
async function buildConnection(url: string): Promise<HubConnection> {
  const { HubConnectionBuilder, LogLevel } = await import("@microsoft/signalr");
  return new HubConnectionBuilder()
    .withUrl(url, {
      accessTokenFactory: () => Cookies.get("accessToken") ?? "",
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}

export function createTicketCommentConnection(): Promise<HubConnection> {
  return buildConnection(TICKET_CHAT_HUB_URL);
}

// Hub for the in-app notification feed (BE: NotificationHub, mapped at /hubs/notifications).
// Unlike ticket-chat, there's NO "room" to join: the BE reads the UserId from the JWT claim
// and joins the `user:{id}` group itself in OnConnectedAsync → the client just needs to
// start(), no further invoke needed. That's also why userId is never sent up (the BE
// deliberately doesn't accept it).
export function createNotificationConnection(): Promise<HubConnection> {
  return buildConnection(NOTIFICATION_HUB_URL);
}

// State predicates, replacing the re-exported HubConnectionState enum. That enum was a VALUE
// import, so every caller that read `conn.state` pulled all of @microsoft/signalr back into
// its own chunk and cancelled out the dynamic import above. HubConnectionState is a string
// enum, so comparing against its literal values is equivalent. Widening to `string` first is
// required — TypeScript refuses to compare a string enum against a string literal.
export function isConnected(conn: HubConnection): boolean {
  const state: string = conn.state;
  return state === "Connected";
}

export function isLive(conn: HubConnection): boolean {
  const state: string = conn.state;
  return state === "Connected" || state === "Connecting";
}

export type { HubConnection };
