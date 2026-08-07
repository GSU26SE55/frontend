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

// Hub feed thông báo in-app (BE: NotificationHub, map ở /hubs/notifications).
// Khác ticket-chat ở chỗ KHÔNG có "phòng" để join: BE đọc UserId từ claim JWT và
// tự ghép group `user:{id}` trong OnConnectedAsync → client chỉ cần start(), không
// invoke gì thêm. Cũng vì thế không được truyền userId lên (BE cố tình không nhận).
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
