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
export function useTicketCommentsRealtime(ticketId: string) {
  const qc = useQueryClient();
  const connRef = useRef<HubConnection | null>(null);
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const [typingNames, setTypingNames] = useState<string[]>([]);

  useEffect(() => {
    if (!ticketId) return;
    const conn = createTicketCommentConnection();
    connRef.current = conn;
    let cancelled = false;
    const timers = typingTimers.current;

    conn.on("CommentAdded", () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.tickets.comments(ticketId) });
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

    conn
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
      if (conn.state === HubConnectionState.Connected) {
        conn.invoke("LeaveTicket", ticketId).catch(() => {});
      }
      conn.stop().catch(() => {});
      connRef.current = null;
    };
  }, [ticketId, qc]);

  const sendTyping = useCallback(() => {
    const conn = connRef.current;
    if (conn && conn.state === HubConnectionState.Connected) {
      conn.invoke("Typing", ticketId).catch(() => {});
    }
  }, [ticketId]);

  return { typingNames, sendTyping };
}
