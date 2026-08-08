import {
  HubConnectionBuilder,
  HubConnectionState,
  type HubConnection,
} from "@microsoft/signalr";
import Cookies from "js-cookie";
import { env } from "@/config/env";

// Hub is mounted at ROOT (no /api prefix). Auth via the access_token query param —
// accessTokenFactory re-reads the cookie on every (re)connect so the latest token is always used.
const HUB_BASE = env.VITE_WS_URL ?? env.VITE_API_BASE_URL;
const TICKET_CHAT_HUB_URL = `${HUB_BASE}/hubs/ticket-chats`;
const NOTIFICATION_HUB_URL = `${HUB_BASE}/hubs/notifications`;

export function createTicketCommentConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(TICKET_CHAT_HUB_URL, {
      accessTokenFactory: () => Cookies.get("accessToken") ?? "",
    })
    .withAutomaticReconnect()
    .build();
}

// Hub for the in-app notification feed (BE: NotificationHub, mapped at /hubs/notifications).
// Unlike ticket-chat, there's NO "room" to join: the BE reads the UserId from the JWT claim
// and joins the `user:{id}` group itself in OnConnectedAsync → the client just needs to
// start(), no further invoke needed. That's also why userId is never sent up (the BE
// deliberately doesn't accept it).
export function createNotificationConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(NOTIFICATION_HUB_URL, {
      accessTokenFactory: () => Cookies.get("accessToken") ?? "",
    })
    .withAutomaticReconnect()
    .build();
}

export { HubConnectionState };
export type { HubConnection };
