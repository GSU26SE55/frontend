import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import {
  createTicketCommentConnection,
  isConnected,
  type HubConnection,
} from "@/shared/lib/signalr";

// SignalR realtime for the comment panel: joins the ticket room, receives ChatAdded
// (invalidates the comment query) + UserTyping. Connection errors are swallowed → UI doesn't
// crash, the query still works (only realtime push is lost).
//
// extraInvalidateKeys: ADDITIONAL query keys to invalidate on ChatAdded.
// Manager renders comments from QUERY_KEY.tickets.chats (default), but staff/admin render
// comments EMBEDDED in the ticket detail (a different key) → pass the corresponding detail key
// so new comments show up realtime without a reload.
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

  // extraInvalidateKeys is kept in a ref — the caller passes a NEW inline array every render.
  // If it were in the deps, the connection would rebuild constantly → teardown races → duplicate
  // events received. The ref lets the handler read the latest keys WITHOUT recreating the connection.
  // Updated in an effect (not during render) to avoid violating react-hooks/refs.
  const extraKeysRef = useRef(extraInvalidateKeys);
  useEffect(() => {
    extraKeysRef.current = extraInvalidateKeys;
  });

  useEffect(() => {
    if (!ticketId) return;
    let cancelled = false;
    const timers = typingTimers.current;

    // Event names MUST match BE (SignalRTicketChatNotifier): "ChatAdded"/"ChatEdited"/
    // "ChatDeleted"/"ReactionChanged" — NOT "CommentAdded".
    const invalidateChatList = () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
      // The "unread" badge on the Comments tab must jump immediately on a new message /
      // deleted message — in step with the list, no waiting for the user to reload.
      qc.invalidateQueries({
        queryKey: QUERY_KEY.tickets.chatUnreadCount(ticketId),
      });
      for (const key of extraKeysRef.current) {
        qc.invalidateQueries({ queryKey: key });
      }
    };

    // The hub client is loaded on demand (see shared/lib/signalr.ts), so the connection is
    // created asynchronously. Cleanup waits on `ready`, which also preserves the original
    // invariant: never call stop() while start() is still pending, or SignalR throws
    // "Failed to start the HttpConnection before stop() was called" (StrictMode double mount).
    let conn: HubConnection | null = null;

    const ready = createTicketCommentConnection()
      .then((c) => {
        // A fast unmount can settle this after cleanup has already run — don't connect then.
        if (cancelled) return;
        conn = c;
        connRef.current = c;

        c.on("ChatAdded", invalidateChatList);
        c.on("ChatEdited", invalidateChatList);
        c.on("ChatDeleted", invalidateChatList);

        // ReactionChanged payload: { chatId, reactions } — BE sends the full aggregate along with it.
        // Write straight into the cache (no refetch) → other clients update instantly, zero extra requests.
        c.on(
          "ReactionChanged",
          (payload: { chatId: string; reactions?: unknown }) => {
            if (!payload?.chatId) return;
            const key = QUERY_KEY.tickets.chatReactions(
              ticketId,
              payload.chatId,
            );
            if (payload.reactions) {
              qc.setQueryData(key, payload.reactions);
            } else {
              qc.invalidateQueries({ queryKey: key });
            }
          },
        );

        c.on(
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

        return c.start().then(() => {
          if (!cancelled) return c.invoke("JoinTicket", ticketId);
        });
      })
      .catch(() => {
        // realtime unavailable → ignore, the query still works normally
      });

    return () => {
      cancelled = true;
      Object.values(timers).forEach(clearTimeout);
      // WAIT for start() to finish before leave + stop — avoids stop-before-start.
      void ready.finally(() => {
        const c = conn;
        if (!c) return;
        // Remove handlers BEFORE stopping — guards against a stray event firing into a connection
        // mid-teardown (StrictMode double mount / rebuild) causing a duplicate invalidate.
        c.off("ChatAdded");
        c.off("ChatEdited");
        c.off("ChatDeleted");
        c.off("ReactionChanged");
        c.off("UserTyping");
        if (isConnected(c)) {
          c.invoke("LeaveTicket", ticketId)
            .catch(() => {})
            .finally(() => {
              c.stop().catch(() => {});
            });
        } else {
          c.stop().catch(() => {});
        }
      });
      connRef.current = null;
    };
    // Only rebuild the connection on ticketId — extraInvalidateKeys is read via ref.
  }, [ticketId, qc]);

  const sendTyping = useCallback(() => {
    const conn = connRef.current;
    // Null while the hub module is still downloading — the typing ping is dropped, the same
    // no-op that already happened whenever the connection was merely "Connecting".
    if (conn && isConnected(conn)) {
      conn.invoke("Typing", ticketId).catch(() => {});
    }
  }, [ticketId]);

  return { typingNames, sendTyping };
}
