import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import {
  createNotificationConnection,
  HubConnectionState,
} from "@/shared/lib/signalr";

// SignalR realtime cho feed thông báo in-app. Thay cho polling 30s ở useUnreadCount.
//
// Tên event PHẢI khớp BE (SignalRNotificationNotifier):
//   - "NotificationCreated"  → InAppChannel, khi ghi 1 noti in-app mới
//   - "NotificationReceived" → SignalRPushChannel, kênh push (có thêm isCritical)
//   - "UnreadCountChanged"   → payload là SỐ NGUYÊN trần, không bọc object
//
// Hook này chỉ nên mount MỘT lần toàn app (NotificationBell ở layout) — mỗi lần
// mount là một WebSocket riêng, mount ở nhiều nơi sẽ nhân đôi connection lẫn event.
export function useNotificationsRealtime(enabled = true) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const conn = createNotificationConnection();

    // Noti mới: list/hộp thư có phân trang + filter theo params nên không patch tay được
    // → invalidate để BE trả lại danh sách đúng.
    //
    // CHỪA unread-count ra: badge đã được "UnreadCountChanged" ghi thẳng số chính xác. Nếu
    // invalidate cả nhánh thì mỗi noti mới lại kéo theo một request unread-count — đúng thứ
    // vừa bỏ polling để tránh. Predicate lọc theo key[1] nên bao cả list, infinite và detail.
    const invalidateFeed = () => {
      qc.invalidateQueries({
        predicate: (q) =>
          q.queryKey[0] === KEY.notifications &&
          q.queryKey[1] !== "unread-count",
      });
    };

    conn.on("NotificationCreated", invalidateFeed);
    conn.on("NotificationReceived", invalidateFeed);

    // Badge: BE gửi thẳng số chưa đọc → ghi vào cache, KHÔNG refetch.
    // Đây chính là request mà polling 30s trước đây bắn liên tục.
    conn.on("UnreadCountChanged", (unreadCount: number) => {
      if (typeof unreadCount !== "number") return;
      qc.setQueryData(QUERY_KEY.notifications.unreadCount(), unreadCount);
    });

    // Mất kết nối rồi nối lại → có thể đã lỡ event trong lúc rớt mạng. Ở đây invalidate
    // CẢ unread-count (khác các handler trên): badge lúc này thực sự có thể sai vì event
    // "UnreadCountChanged" phát trong lúc rớt mạng không được gửi lại.
    conn.onreconnected(() => {
      qc.invalidateQueries({ queryKey: [KEY.notifications] });
    });

    // Giữ promise start() để cleanup CHỜ nó settle trước khi stop(). Gọi stop() khi
    // start() còn pending → SignalR ném "Failed to start the HttpConnection before
    // stop() was called" (lỗi thấy khi StrictMode mount kép / remount nhanh).
    const startPromise = conn.start().catch(() => {
      // Realtime không khả dụng → im lặng. REST vẫn phục vụ đủ dữ liệu
      // (BE cũng coi realtime là lớp tăng tốc, không phải nguồn dữ liệu).
    });

    return () => {
      // Gỡ handler TRƯỚC khi stop — chống event treo bắn vào connection đang teardown.
      conn.off("NotificationCreated");
      conn.off("NotificationReceived");
      conn.off("UnreadCountChanged");
      void startPromise.finally(() => {
        if (
          conn.state === HubConnectionState.Connected ||
          conn.state === HubConnectionState.Connecting
        ) {
          conn.stop().catch(() => {});
        }
      });
    };
  }, [qc, enabled]);
}
