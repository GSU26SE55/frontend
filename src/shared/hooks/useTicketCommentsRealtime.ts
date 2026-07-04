import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import {
  createTicketCommentConnection,
  HubConnectionState,
  type HubConnection,
} from "@/shared/lib/signalr";

// SignalR realtime cho comment panel: join phòng ticket, nhận CommentAdded
// (invalidate query comment) + UserTyping. Lỗi connect được nuốt → UI không crash,
// query vẫn dùng được (chỉ mất push realtime).
//
// extraInvalidateKeys: các query key BỔ SUNG cần invalidate khi có CommentAdded.
// Manager render comment từ QUERY_KEY.tickets.chats (default), nhưng staff/admin
// render comment NHÚNG trong ticket detail (key khác) → truyền key detail tương ứng
// để comment mới hiện realtime mà không phải reload.
export function useTicketCommentsRealtime(
  ticketId: string,
  extraInvalidateKeys: readonly (readonly unknown[])[] = [],
) {
  const qc = useQueryClient();
  const connRef = useRef<HubConnection | null>(null);
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const [typingNames, setTypingNames] = useState<string[]>([]);

  // extraInvalidateKeys giữ trong ref — caller truyền inline array MỚI mỗi render.
  // Nếu để trong deps, connection bị rebuild liên tục → race teardown → nhận event
  // trùng. Ref cho phép handler đọc keys mới nhất mà KHÔNG tái tạo connection.
  // Cập nhật trong effect (không phải trong render) để không vi phạm react-hooks/refs.
  const extraKeysRef = useRef(extraInvalidateKeys);
  useEffect(() => {
    extraKeysRef.current = extraInvalidateKeys;
  });

  useEffect(() => {
    if (!ticketId) return;
    const conn = createTicketCommentConnection();
    connRef.current = conn;
    let cancelled = false;
    const timers = typingTimers.current;

    // Tên event PHẢI khớp BE (SignalRTicketChatNotifier): "ChatAdded"/"ChatEdited"/
    // "ChatDeleted"/"ReactionChanged" — KHÔNG phải "CommentAdded".
    const invalidateChatList = () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
      for (const key of extraKeysRef.current) {
        qc.invalidateQueries({ queryKey: key });
      }
    };

    conn.on("ChatAdded", invalidateChatList);
    conn.on("ChatEdited", invalidateChatList);
    conn.on("ChatDeleted", invalidateChatList);

    // ReactionChanged payload: { chatId, reactions } → refetch reactions của đúng chat.
    conn.on("ReactionChanged", (payload: { chatId: string }) => {
      if (payload?.chatId) {
        qc.invalidateQueries({
          queryKey: QUERY_KEY.tickets.chatReactions(ticketId, payload.chatId),
        });
      }
    });

    conn.on(
      "UserTyping",
      (_ticketId: string, userId: string, displayName: string) => {
        setTypingNames((prev) =>
          prev.includes(displayName) ? prev : [...prev, displayName],
        );
        clearTimeout(timers[userId]);
        timers[userId] = setTimeout(() => {
          setTypingNames((prev) => prev.filter((n) => n !== displayName));
        }, 3000);
      },
    );

    // Giữ promise start() để cleanup CHỜ nó settle trước khi stop(). Gọi stop() khi
    // start() còn pending → SignalR ném "Failed to start the HttpConnection before
    // stop() was called" (lỗi thấy khi StrictMode mount kép / remount nhanh).
    const startPromise = conn
      .start()
      .then(() => {
        if (!cancelled) return conn.invoke("JoinTicket", ticketId);
      })
      .catch(() => {
        // realtime không khả dụng → bỏ qua, query vẫn hoạt động bình thường
      });

    return () => {
      cancelled = true;
      Object.values(timers).forEach(clearTimeout);
      // Gỡ handler TRƯỚC khi stop — chống event treo bắn vào connection đang teardown
      // (StrictMode mount kép / rebuild) gây invalidate trùng.
      conn.off("ChatAdded");
      conn.off("ChatEdited");
      conn.off("ChatDeleted");
      conn.off("ReactionChanged");
      conn.off("UserTyping");
      // CHỜ start() xong rồi mới leave + stop — tránh stop-trước-start.
      void startPromise.finally(() => {
        if (conn.state === HubConnectionState.Connected) {
          conn
            .invoke("LeaveTicket", ticketId)
            .catch(() => {})
            .finally(() => {
              conn.stop().catch(() => {});
            });
        } else {
          conn.stop().catch(() => {});
        }
      });
      connRef.current = null;
    };
    // Chỉ rebuild connection theo ticketId — extraInvalidateKeys đọc qua ref.
  }, [ticketId, qc]);

  const sendTyping = useCallback(() => {
    const conn = connRef.current;
    if (conn && conn.state === HubConnectionState.Connected) {
      conn.invoke("Typing", ticketId).catch(() => {});
    }
  }, [ticketId]);

  return { typingNames, sendTyping };
}
