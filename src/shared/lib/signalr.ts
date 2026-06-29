import {
  HubConnectionBuilder,
  HubConnectionState,
  type HubConnection,
} from "@microsoft/signalr";
import Cookies from "js-cookie";
import { env } from "@/config/env";

// Hub gắn ở ROOT (không có prefix /api). Auth qua query access_token —
// accessTokenFactory đọc lại cookie mỗi lần (re)connect nên token mới luôn được dùng.
const HUB_BASE = env.VITE_WS_URL ?? env.VITE_API_BASE_URL;
const HUB_URL = `${HUB_BASE}/hubs/ticket-chats`;

export function createTicketCommentConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => Cookies.get("accessToken") ?? "",
    })
    .withAutomaticReconnect()
    .build();
}

export { HubConnectionState };
export type { HubConnection };
